/* Small browser-only interactions for the CPSC 481 prototype. */
document.addEventListener("DOMContentLoaded", () => {
    const savedKey = "cpl-saved-books";
    const branchKey = "cpl-preferred-branch";
    const holdsKey = "cpl-holds";
    const eventsKey = "cpl-registered-events";
    const ratingsKey = "cpl-ratings";
    const memoryStorage = {};
    const getStorage = (key) => {
        try { return localStorage.getItem(key) ?? memoryStorage[key] ?? null; }
        catch { return memoryStorage[key] ?? null; }
    };
    const setStorage = (key, value) => {
        memoryStorage[key] = value;
        try { localStorage.setItem(key, value); }
        catch { /* Browser privacy settings can disable storage for local files. */ }
    };
    const readJSON = (key, fallback) => {
        try { const value = getStorage(key); return value ? JSON.parse(value) : fallback; }
        catch { return fallback; }
    };
    const writeJSON = (key, value) => setStorage(key, JSON.stringify(value));
    const make = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };

    /* Catalogue facts, so saved books and holds always show the right title, author and cover. */
    const catalogue = {
        "To Kill a Mockingbird": { author: "Harper Lee", image: "images/To%20kill%20a%20mockingbird.jpg" },
        "The Midnight Library": { author: "Matt Haig", image: "images/themidnightlib.jpg" },
        "Atomic Habits": { author: "James Clear", image: "images/atomic%20habbit.jpg" },
        "The Thursday Murder Club": { author: "Richard Osman", image: "images/thursday_murder.jpg" },
        "Killers of the Flower Moon": { author: "David Grann", image: "images/killers-of-the-flower-moon.jpg" },
        "Kill Joy": { author: "Holly Jackson", image: "images/kill-joy.jpg" },
        "Little Women": { author: "Louisa May Alcott", image: "images/LittleWomen.jpg" }
    };
    const formatLabels = { book: "Book", ebook: "eBook", audiobook: "Audiobook" };
    const params = new URLSearchParams(location.search);

    /* ---------- Saved Books ---------- */
    const invalidTitles = ["Book description", "Saved book", ""];
    const readSaved = () => {
        const seen = new Set();
        return readJSON(savedKey, []).filter((book) => {
            if (!book || invalidTitles.includes(book.title) || seen.has(book.title)) return false;
            seen.add(book.title);
            return true;
        });
    };
    const writeSaved = (items) => writeJSON(savedKey, items);

    function getBookTitle(button) {
        if (button.dataset.bookTitle) return button.dataset.bookTitle;
        const label = button.getAttribute("aria-label") || "";
        const fromLabel = label.match(/(?:Add|Remove) (.+?) (?:to|from) Saved Books/i);
        if (fromLabel) return fromLabel[1];
        const pageTitle = button.closest(".book-detail-card, .hold-book-summary")?.querySelector(".book-detail-info h1, .hold-book-info h2");
        if (pageTitle) return pageTitle.textContent.trim();
        const heading = button.closest("article")?.querySelector("h3, h2, h1");
        return heading?.textContent.trim() || "Saved book";
    }

    function getBookAuthor(button, title) {
        if (button.dataset.bookAuthor) return button.dataset.bookAuthor;
        if (catalogue[title]) return catalogue[title].author;
        const author = button.closest("article")?.querySelector(".catalogue-author, .book-author");
        return author?.textContent.replace(/^by\s+/i, "").trim() || "";
    }

    function getBookImage(button, title) {
        if (catalogue[title]) return catalogue[title].image;
        const card = button.closest("article, .book-detail-card, .hold-book-summary");
        return card?.querySelector("img")?.getAttribute("src") || "images/cover-placeholder.jpg";
    }

    function syncSaveButtons() {
        const saved = readSaved();
        document.querySelectorAll("[data-save-book]").forEach((button) => {
            const title = getBookTitle(button);
            const isSaved = saved.some((book) => book.title === title);
            button.setAttribute("aria-pressed", String(isSaved));
            if (button.querySelector("span")) {
                button.querySelector("span").textContent = isSaved ? "♥" : "♡";
                button.lastChild.textContent = isSaved ? " Saved" : " Add to Saved Books";
            } else {
                button.textContent = isSaved ? "♥" : "♡";
            }
            button.setAttribute("aria-label", `${isSaved ? "Remove" : "Add"} ${title} ${isSaved ? "from" : "to"} Saved Books`);
            button.title = isSaved ? "Saved. Select to remove from Saved Books" : "Add to Saved Books";
        });
    }

    document.querySelectorAll("[data-save-book]").forEach((button) => {
        button.addEventListener("click", () => {
            const title = getBookTitle(button);
            const saved = readSaved();
            const index = saved.findIndex((book) => book.title === title);
            if (index >= 0) saved.splice(index, 1);
            else saved.push({ title, author: getBookAuthor(button, title), image: getBookImage(button, title) });
            writeSaved(saved);
            syncSaveButtons();
            renderSavedBooks();
        });
    });

    const savedGrid = document.querySelector("#saved-title")?.closest(".account-section")?.querySelector(".account-small-grid");
    function renderSavedBooks() {
        if (!savedGrid) return;
        const saved = readSaved();
        savedGrid.innerHTML = "";
        if (!saved.length) {
            savedGrid.innerHTML = '<p class="saved-empty-state">You have no Saved Books yet. Browse the catalogue to save a title for later.</p>';
            return;
        }
        saved.forEach((book) => {
            const facts = catalogue[book.title] || {};
            const author = facts.author || book.author || "";
            const card = make("article", "saved-book-card");
            const image = make("img");
            image.src = facts.image || book.image || "images/cover-placeholder.jpg";
            image.alt = `Cover of ${book.title}${author ? ` by ${author}` : ""}`;
            const info = make("div");
            info.append(make("h3", "", book.title), make("p", "", author));
            const remove = make("button", "remove-saved-button", "Remove from Saved Books");
            remove.type = "button";
            remove.addEventListener("click", () => {
                writeSaved(readSaved().filter((entry) => entry.title !== book.title));
                renderSavedBooks();
                syncSaveButtons();
            });
            card.append(image, info, remove);
            savedGrid.append(card);
        });
    }

    // Keep the existing example books as the account's initial sample saved list.
    if (savedGrid && !getStorage(savedKey)) {
        const initial = [...savedGrid.querySelectorAll(".saved-book-card")].map((card) => ({
            title: card.querySelector("h3")?.textContent.trim(),
            author: card.querySelector("p")?.textContent.trim(),
            image: card.querySelector("img")?.getAttribute("src") || "images/cover-placeholder.jpg"
        })).filter((book) => book.title);
        writeSaved(initial);
    }
    if (getStorage(savedKey)) writeSaved(readSaved()); // clean out older broken entries
    renderSavedBooks();
    syncSaveButtons();

    /* ---------- Preferred / pickup branch ---------- */
    const preferredBranch = document.querySelector("#preferred-branch");
    const pickupBranch = document.querySelector("#pickup-branch");
    const branch = getStorage(branchKey);
    const markPreferredBranch = (select, value) => {
        if (!select) return;
        [...select.options].forEach((option) => {
            const name = option.textContent.replace(" · Preferred branch", "");
            option.textContent = option.value === value ? `${name} · Preferred branch` : name;
        });
    };
    if (preferredBranch) {
        if (branch) preferredBranch.value = branch;
        markPreferredBranch(pickupBranch, preferredBranch.value);
        preferredBranch.addEventListener("change", () => {
            setStorage(branchKey, preferredBranch.value);
            markPreferredBranch(pickupBranch, preferredBranch.value);
        });
    }
    if (pickupBranch) {
        if (branch && [...pickupBranch.options].some((option) => option.value === branch)) pickupBranch.value = branch;
        markPreferredBranch(pickupBranch, preferredBranch?.value || branch || pickupBranch.value);
        pickupBranch.addEventListener("change", () => {
            const option = pickupBranch.selectedOptions[0];
            if (option) {
                setStorage(branchKey, option.value);
                if (preferredBranch) preferredBranch.value = option.value;
                markPreferredBranch(pickupBranch, option.value);
            }
        });
    }

    /* ---------- Book details: format and ratings ---------- */
    const bookFormat = document.querySelector("#book-format");
    if (bookFormat && formatLabels[params.get("format")]) bookFormat.value = params.get("format");

    const ratingDialog = document.querySelector("#rating-dialog");
    const ratingForm = document.querySelector("#rating-form");
    const rateButton = document.querySelector("[data-open-rating]");
    const yourRating = document.querySelector("[data-your-rating]");
    const removeRating = document.querySelector("[data-remove-rating]");
    const ratingLabel = document.querySelector("[data-rating-label]");
    const ratedTitle = document.querySelector(".book-detail-info h1")?.textContent.trim();
    const starLabels = ratingForm ? [...ratingForm.querySelectorAll(".rating-star-row label")] : [];
    const ratingText = (value) => value ? `${value} out of 5` : "Select a rating";
    const fillStars = (value) => {
        starLabels.forEach((label, index) => label.classList.toggle("is-filled", index < value));
        if (ratingLabel) ratingLabel.textContent = ratingText(value);
    };
    const checkedRating = () => Number(ratingForm?.querySelector("input:checked")?.value || 0);

    function showYourRating() {
        if (!ratedTitle || !rateButton) return;
        const rating = readJSON(ratingsKey, {})[ratedTitle];
        if (yourRating) {
            yourRating.hidden = !rating;
            yourRating.innerHTML = "";
            if (rating) {
                const stars = make("span", "detail-stars", "★".repeat(rating) + "☆".repeat(5 - rating));
                stars.setAttribute("aria-hidden", "true");
                yourRating.append(make("span", "", "Your rating:"), stars, make("span", "", ratingText(rating)));
            }
        }
        rateButton.textContent = rating ? "Edit rating" : "Rate this";
        if (removeRating) removeRating.hidden = !rating;
    }

    starLabels.forEach((label, index) => {
        label.addEventListener("mouseenter", () => fillStars(index + 1));
        label.querySelector("input").addEventListener("change", () => fillStars(checkedRating()));
    });
    ratingForm?.querySelector(".rating-star-row")?.addEventListener("mouseleave", () => fillStars(checkedRating()));

    rateButton?.addEventListener("click", () => {
        const current = readJSON(ratingsKey, {})[ratedTitle] || 0;
        ratingForm?.querySelectorAll("input[name='rating']").forEach((input) => input.checked = Number(input.value) === current);
        fillStars(current);
        const feedback = document.querySelector("#rating-feedback");
        if (feedback) feedback.textContent = "";
        ratingDialog?.showModal();
    });
    ratingForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const rating = Number(new FormData(ratingForm).get("rating"));
        const ratings = readJSON(ratingsKey, {});
        ratings[ratedTitle] = rating;
        writeJSON(ratingsKey, ratings);
        showYourRating();
        ratingDialog?.close();
    });
    removeRating?.addEventListener("click", () => {
        const ratings = readJSON(ratingsKey, {});
        delete ratings[ratedTitle];
        writeJSON(ratingsKey, ratings);
        showYourRating();
        ratingDialog?.close();
    });
    showYourRating();

    /* ---------- My Account: renewals ---------- */
    const renewDialog = document.querySelector("#renew-dialog");
    document.querySelector("[data-open-renew]")?.addEventListener("click", () => renewDialog?.showModal());
    renewDialog?.addEventListener("close", () => {
        if (renewDialog.returnValue !== "confirm") return;
        document.querySelectorAll('[data-renew-item][data-eligible="true"] .item-due-date').forEach((dueDate) => {
            dueDate.textContent = "Renewed · new due date Nov 30";
        });
        const feedback = document.querySelector("#renew-feedback");
        if (feedback) feedback.textContent = "Eligible items renewed in this prototype. Items with another reader’s hold were skipped.";
    });
    document.querySelectorAll(".renew-item-button:not(:disabled)").forEach((button) => {
        button.addEventListener("click", () => {
            const dueDate = button.closest(".account-item-card")?.querySelector(".item-due-date");
            if (dueDate) dueDate.textContent = "Renewed · new due date Nov 30";
            button.textContent = "Renewed";
            button.disabled = true;
        });
    });

    /* ---------- Holds ---------- */
    // The account starts with one sample hold that is ready for pickup.
    const sampleHolds = [{ title: "Little Women", format: "book", branch: "Central Library", status: "ready", pickupBy: "Nov 2" }];
    const readHolds = () => readJSON(holdsKey, sampleHolds);
    const writeHolds = (holds) => writeJSON(holdsKey, holds);
    const queuePosition = { book: 3, ebook: 2, audiobook: 4 };

    // Place a Hold page
    const holdForm = document.querySelector("[data-hold-form]");
    if (holdForm) {
        const title = document.querySelector(".hold-book-info h2")?.textContent.trim() || "this book";
        const format = formatLabels[params.get("format")] ? params.get("format") : "";
        const isDigital = format === "ebook" || format === "audiobook";
        const confirmButton = document.querySelector("[data-confirm-hold]");
        const success = document.querySelector("[data-hold-success]");
        const successMessage = document.querySelector("[data-hold-success-message]");
        const formatText = document.querySelector("[data-hold-format]");
        const changeFormat = document.querySelector("[data-change-format]");

        if (formatText) formatText.textContent = format ? formatLabels[format] : "Not chosen yet";
        if (changeFormat) {
            changeFormat.href = `BookDetails.html${format ? `?format=${format}` : ""}#format-title`;
            changeFormat.textContent = format ? "Change" : "Choose a format";
        }
        if (!format) {
            confirmButton.disabled = true;
            document.querySelector("[data-format-warning]").hidden = false;
        }
        if (isDigital) {
            const verb = format === "ebook" ? "read" : "listen to";
            document.querySelector("[data-pickup-fields]").hidden = true;
            document.querySelector("[data-pickup-eyebrow]").textContent = "HOLD DETAILS";
            document.querySelector("#pickup-title").textContent = "Confirm your hold";
            document.querySelector("[data-pickup-description]").textContent = `${formatLabels[format]}s are borrowed online, so you don’t need a pickup branch. We’ll email you when it’s ready to ${verb}.`;
            document.querySelector("[data-hold-intro]").textContent = `Confirm your ${formatLabels[format]} hold. No pickup needed.`;
        }

        const showSuccess = (hold, alreadyPlaced) => {
            const ready = hold.branch
                ? `ready for pickup at <strong>${hold.branch}</strong>`
                : `ready to ${hold.format === "ebook" ? "read" : "listen to"} online`;
            successMessage.innerHTML = `${alreadyPlaced ? "You already have a hold on" : ""} <strong>${hold.title}</strong> (${formatLabels[hold.format]})${alreadyPlaced ? "." : " is on hold."} You’re <strong>#${hold.position} in line</strong>. We’ll email you when it’s ${ready}.`;
            if (alreadyPlaced) success.querySelector(".hold-success-title").lastChild.textContent = " Already on hold";
            holdForm.hidden = true;
            success.hidden = false;
        };

        const existing = format && readHolds().find((hold) => hold.title === title && hold.format === format);
        if (existing) showSuccess(existing, true);

        confirmButton?.addEventListener("click", () => {
            if (!format || confirmButton.disabled) return;
            confirmButton.disabled = true; // prevents a double submit
            const holds = readHolds();
            let hold = holds.find((entry) => entry.title === title && entry.format === format);
            if (!hold) {
                hold = {
                    title, format,
                    branch: isDigital ? "" : (pickupBranch?.value || "Central Library"),
                    status: "waiting",
                    position: queuePosition[format]
                };
                holds.push(hold);
                writeHolds(holds);
            }
            showSuccess(hold, false);
            success.focus();
        });
    }

    // My Account: Items on hold
    const holdList = document.querySelector("[data-hold-list]");
    function renderHolds() {
        if (!holdList) return;
        const holds = readHolds();
        holdList.innerHTML = "";
        const count = document.querySelector("[data-hold-count]");
        const countLabel = document.querySelector("[data-hold-count-label]");
        if (count) count.textContent = holds.length;
        if (countLabel) countLabel.textContent = holds.length === 1 ? "Item on hold" : "Items on hold";
        if (!holds.length) {
            holdList.innerHTML = '<p class="saved-empty-state">You have no items on hold. <a href="Browse.html">Browse the catalogue</a> to place one.</p>';
            return;
        }
        holds.forEach((hold) => {
            const facts = catalogue[hold.title] || {};
            const card = make("article", "account-item-card hold-item-card");
            const cover = make("img", "account-item-cover");
            cover.src = facts.image || "images/cover-placeholder.jpg";
            cover.alt = `Cover of ${hold.title}${facts.author ? ` by ${facts.author}` : ""}`;

            const info = make("div", "account-item-info");
            const pickup = make("p", "item-pickup-info");
            if (hold.branch) { pickup.append("Pickup at "); pickup.append(make("strong", "", hold.branch)); }
            else pickup.textContent = "Borrow online · no pickup needed";
            info.append(make("span", "format-tag", (formatLabels[hold.format] || "Book").toUpperCase()), make("h3", "", hold.title), make("p", "", facts.author || ""), pickup);

            const status = make("div", "hold-status");
            if (hold.status === "ready") {
                status.append(make("span", "hold-status-label", "Ready for pickup"), make("span", "", `Pick up by ${hold.pickupBy}`));
            } else {
                status.append(make("span", "hold-status-label is-waiting", "Waiting"), make("span", "", `#${hold.position} in line · we’ll email you`));
            }

            const cancel = make("button", "secondary-action", "Cancel hold");
            cancel.type = "button";
            cancel.addEventListener("click", () => {
                writeHolds(readHolds().filter((entry) => !(entry.title === hold.title && entry.format === hold.format)));
                renderHolds();
                const feedback = document.querySelector("#hold-feedback");
                if (feedback) feedback.textContent = `Hold on ${hold.title} (${formatLabels[hold.format]}) cancelled.`;
            });
            card.append(cover, info, status, cancel);
            holdList.append(card);
        });
    }
    renderHolds();

    /* ---------- Events ---------- */
    const readRegistrations = () => readJSON(eventsKey, []);
    const writeRegistrations = (items) => writeJSON(eventsKey, items);
    const isRegistered = (id) => readRegistrations().some((entry) => entry.id === id);

    const eventCards = [...document.querySelectorAll("#event-list .event")];
    const eventFilters = [...document.querySelectorAll("[data-event-filter]")];
    const updateEvents = () => {
        let count = 0;
        eventCards.forEach((card) => {
            const visible = eventFilters.every((filter) => filter.value === "all" || card.dataset[filter.dataset.eventFilter] === filter.value);
            card.hidden = !visible;
            if (visible) count++;
        });
        const resultCount = document.querySelector("[data-event-count]");
        if (resultCount) resultCount.textContent = `${count} ${count === 1 ? "event" : "events"}`;
    };
    eventFilters.forEach((filter) => filter.addEventListener("change", updateEvents));
    document.querySelector("[data-reset-events]")?.addEventListener("click", () => {
        eventFilters.forEach((filter) => filter.value = "all");
        updateEvents();
    });

    const eventInfo = (card) => ({
        id: card.dataset.eventId,
        title: card.querySelector("h2").textContent.trim(),
        date: card.dataset.date,
        time: card.dataset.time,
        location: card.dataset.location
    });

    function renderEventCard(card, message) {
        const registered = isRegistered(card.dataset.eventId);
        const total = Number(card.dataset.spots);
        const dropIn = card.dataset.registration === "dropin";
        const left = total - (registered ? 1 : 0);
        const spots = card.querySelector("[data-spots-left]");
        if (spots && !dropIn) {
            spots.textContent = left > 0 ? `${left} ${left === 1 ? "spot" : "spots"} left` : "Full";
            spots.classList.toggle("is-full", left <= 0);
        }
        const register = card.querySelector("[data-register-event]");
        const cancel = card.querySelector("[data-cancel-event]");
        const status = card.querySelector("[data-event-status]");
        if (!register) return;
        register.classList.toggle("is-registered", registered);
        register.disabled = registered || left <= 0;
        register.innerHTML = registered ? '<span aria-hidden="true">✓</span> Registered' : 'Register for event <span aria-hidden="true">→</span>';
        if (cancel) cancel.hidden = !registered;
        if (status) {
            if (message) status.innerHTML = message;
            else status.innerHTML = registered ? `You’re registered for <strong>${eventInfo(card).title}</strong> on ${card.dataset.date} at ${card.dataset.time}.` : "";
        }
    }

    const eventDialog = document.querySelector("#event-dialog");
    let pendingCard = null;
    eventCards.forEach((card) => {
        renderEventCard(card);
        card.querySelector("[data-register-event]")?.addEventListener("click", () => {
            if (!eventDialog) return;
            pendingCard = card;
            const info = eventInfo(card);
            eventDialog.querySelectorAll("[data-confirm-field]").forEach((field) => field.textContent = info[field.dataset.confirmField]);
            eventDialog.returnValue = "";
            eventDialog.showModal();
        });
        card.querySelector("[data-cancel-event]")?.addEventListener("click", () => {
            const info = eventInfo(card);
            writeRegistrations(readRegistrations().filter((entry) => entry.id !== info.id));
            renderEventCard(card, `Registration cancelled for <strong>${info.title}</strong>. Your spot has been released.`);
            card.querySelector("[data-register-event]")?.focus();
        });
    });
    eventDialog?.addEventListener("close", () => {
        const card = pendingCard;
        pendingCard = null;
        if (!card || eventDialog.returnValue !== "confirm") return;
        const info = eventInfo(card);
        if (!isRegistered(info.id)) writeRegistrations([...readRegistrations(), info]);
        renderEventCard(card, `✓ You’re registered for <strong>${info.title}</strong> on ${info.date} at ${info.time}. Find it in <a href="MyAccount.html#events-title">My Account → My events</a>.`);
        card.querySelector("[data-cancel-event]")?.focus();
    });

    // My Account: My events
    const myEvents = document.querySelector("[data-my-events]");
    function renderMyEvents() {
        if (!myEvents) return;
        const items = readRegistrations().sort((a, b) => new Date(a.date) - new Date(b.date));
        myEvents.innerHTML = "";
        if (!items.length) {
            myEvents.innerHTML = '<p class="saved-empty-state">You haven’t registered for any events yet. <a href="Events.html">Browse upcoming events</a>.</p>';
            return;
        }
        items.forEach((item) => {
            const when = new Date(item.date);
            const card = make("article", "account-item-card");
            const badge = make("div", "event-date");
            badge.setAttribute("aria-hidden", "true");
            badge.append(make("strong", "", isNaN(when) ? "" : when.getDate()), make("span", "", isNaN(when) ? "" : when.toLocaleString("en", { month: "short" }).toUpperCase()));
            const info = make("div", "account-item-info");
            info.append(make("span", "format-tag", "EVENT"), make("h3", "", item.title), make("p", "", item.location), make("p", "item-due-date", `${item.date} · ${item.time}`));
            const status = make("div", "hold-status");
            status.append(make("span", "hold-status-label", "Registered"), make("span", "", "Your spot is saved"));
            const cancel = make("button", "secondary-action", "Cancel registration");
            cancel.type = "button";
            cancel.setAttribute("aria-label", `Cancel registration for ${item.title}`);
            cancel.addEventListener("click", () => {
                writeRegistrations(readRegistrations().filter((entry) => entry.id !== item.id));
                renderMyEvents();
                const feedback = document.querySelector("#my-events-feedback");
                if (feedback) feedback.textContent = `Registration cancelled for ${item.title}.`;
            });
            card.append(badge, info, status, cancel);
            myEvents.append(card);
        });
    }
    renderMyEvents();

    /* ---------- Log in ---------- */
    const loginForm = document.querySelector("[data-login-form]");
    const loginError = document.querySelector("[data-login-error]");
    if (loginForm && loginError) {
        const idInput = loginForm.querySelector("#library-id");
        const passwordInput = loginForm.querySelector("#login-password");
        const defaultError = loginError.innerHTML;
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            loginError.classList.remove("is-info");
            if (!idInput.value.trim() || !passwordInput.value) {
                loginError.innerHTML = "<strong>Please fill in both fields.</strong><span>Enter your email or library card number and your password.</span>";
                loginError.hidden = false;
                (idInput.value.trim() ? passwordInput : idInput).focus();
                return;
            }
            if (passwordInput.value !== "library") {
                loginError.innerHTML = defaultError;
                wireForgot();
                loginError.hidden = false;
                idInput.setAttribute("aria-invalid", "true");
                passwordInput.setAttribute("aria-invalid", "true");
                passwordInput.value = "";
                passwordInput.focus();
                return;
            }
            location.href = "MyAccount.html";
        });
        [idInput, passwordInput].forEach((input) => input.addEventListener("input", () => input.removeAttribute("aria-invalid")));
        const showReset = () => {
            loginError.classList.add("is-info");
            loginError.innerHTML = "<strong>Reset your password</strong><span>We’ll email a reset link to the address on your account. (Prototype only, no email is sent.)</span>";
            loginError.hidden = false;
        };
        const wireForgot = () => document.querySelectorAll("[data-forgot-password]").forEach((button) => button.onclick = showReset);
        wireForgot();
    }
});
