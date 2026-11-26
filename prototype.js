/* Small browser-only interactions for the CPSC 481 prototype. */
document.addEventListener("DOMContentLoaded", () => {
    const sessionKey = "cpl-demo-signed-in";
    const currentPage = location.pathname.split("/").pop();
    let isSignedIn = false;
    try { isSignedIn = localStorage.getItem(sessionKey) === "true"; } catch {}
    if (["MyAccount.html", "PlaceHold.html"].includes(currentPage) && !isSignedIn) {
        const returnTo = `${currentPage}${location.search}${location.hash}`;
        location.replace(`Login.html?next=${encodeURIComponent(returnTo)}`);
        return;
    }

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
        "To Kill a Mockingbird": { author: "Harper Lee", image: "images/To%20kill%20a%20mockingbird.jpg", rating: "4.26", format: "book", availability: "available" },
        "The Midnight Library": { author: "Matt Haig", image: "images/themidnightlib.jpg", rating: "4.2", format: "book", availability: "waitlist" },
        "Atomic Habits": { author: "James Clear", image: "images/atomic%20habbit.jpg", rating: "4.4", format: "audiobook", availability: "available" },
        "The Thursday Murder Club": { author: "Richard Osman", image: "images/thursday_murder.jpg", rating: "4.1", format: "book", availability: "available" },
        "Killers of the Flower Moon": { author: "David Grann", image: "images/killers-of-the-flower-moon.jpg", rating: "4.6", format: "book", availability: "available" },
        "Kill Joy": { author: "Holly Jackson", image: "images/kill-joy.jpg", rating: "4.7", format: "ebook", availability: "available" },
        "Little Women": { author: "Louisa May Alcott", image: "images/LittleWomen.jpg", rating: "4.3", format: "book", availability: "waitlist" },
        "Romeo and Juliet": { author: "William Shakespeare", image: "images/romeo%26juliet.jpg", rating: "4.0", format: "ebook", availability: "available" },
        "Charlotte’s Web": { author: "E. B. White", image: "images/cover-placeholder.jpg", rating: "4.5", format: "book", availability: "available" },
        "Where the Wild Things Are": { author: "Maurice Sendak", image: "images/cover-placeholder.jpg", rating: "4.5", format: "book", availability: "available" },
        "The Very Hungry Caterpillar": { author: "Eric Carle", image: "images/cover-placeholder.jpg", rating: "4.5", format: "book", availability: "available" }
    };
    const descriptions = {
        "To Kill a Mockingbird": "Scout Finch looks back on a childhood shaped by family, friendship, and a difficult case in her Alabama town. The story explores fairness, empathy, and standing up for what is right.",
        "The Midnight Library": "Between life and death, Nora Seed visits a library filled with versions of the life she might have lived, and considers what makes a life meaningful.",
        "Atomic Habits": "James Clear explains how small, repeatable changes can help people build lasting habits and make progress toward their goals.",
        "The Thursday Murder Club": "Four friends in a retirement community meet to investigate old cases, until a new murder brings a mystery close to home.",
        "Killers of the Flower Moon": "David Grann investigates the murders of members of the Osage Nation in 1920s Oklahoma and the early history of the FBI.",
        "Kill Joy": "Pip joins a murder mystery game and imagines herself investigating a case, in this prequel to A Good Girl’s Guide to Murder.",
        "Little Women": "The March sisters grow up through family changes, friendship, work, and the hopes each has for her future.",
        "Romeo and Juliet": "Shakespeare’s tragedy follows two young people whose love is caught between their families’ long-standing conflict.",
        "Charlotte’s Web": "A young girl and a clever spider form a friendship as Charlotte finds a way to help save Wilbur the pig.",
        "Where the Wild Things Are": "Max sails to an island of wild creatures, becomes their king, and eventually finds his way home.",
        "The Very Hungry Caterpillar": "A caterpillar eats its way through a week of food before changing into a butterfly."
    };
    const formatLabels = { book: "Book", ebook: "eBook", audiobook: "Audiobook" };
    const params = new URLSearchParams(location.search);
    const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const bookById = (id) => {
        const title = Object.keys(catalogue).find((name) => slugify(name) === id);
        if (!title) return { title: "To Kill a Mockingbird", ...catalogue["To Kill a Mockingbird"], id: "to-kill-a-mockingbird", description: descriptions["To Kill a Mockingbird"] };
        return { id: slugify(title), title, ...catalogue[title], description: descriptions[title] };
    };
    const pageBook = bookById(params.get("book") || "to-kill-a-mockingbird");

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
            const titleLink = make("a", "", book.title);
            titleLink.href = `BookDetails.html?book=${encodeURIComponent(slugify(book.title))}`;
            const heading = make("h3"); heading.append(titleLink);
            info.append(heading, make("p", "", author));
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

    /* ---------- Browse: search, age group, format and availability filters ---------- */
    const catalogueList = document.querySelector("#catalogue-results");
    if (catalogueList) {
        const cards = [...catalogueList.querySelectorAll(".catalogue-card")];
        const filters = [...document.querySelectorAll("[data-catalogue-filter]")];
        const sort = document.querySelector("[data-catalogue-sort]");
        const query = document.querySelector("#catalogue-query");
        const count = document.querySelector("[data-catalogue-count]");
        const empty = document.querySelector("[data-catalogue-empty]");

        // Every sample result opens the same reusable book-detail and availability screens.
        cards.forEach((card) => {
            const heading = card.querySelector("h3");
            const title = heading?.textContent.trim();
            if (!title || !catalogue[title]) return;
            const id = slugify(title), detailsUrl = `BookDetails.html?book=${encodeURIComponent(id)}`;
            card.dataset.bookId = id;
            let titleLink = heading.querySelector("a");
            if (!titleLink) { titleLink = make("a", "", title); heading.replaceChildren(titleLink); }
            titleLink.href = detailsUrl;
            titleLink.setAttribute("aria-label", `View ${title} details`);
            const cover = card.querySelector(".catalogue-cover");
            if (cover) {
                if (cover.tagName === "A") cover.href = detailsUrl;
                else {
                    const link = document.createElement("a"); link.className = cover.className; link.href = detailsUrl;
                    link.setAttribute("aria-label", `View ${title} details`);
                    cover.replaceWith(link); link.append(...cover.childNodes);
                }
            }
            const save = card.querySelector("[data-save-book]");
            if (save) { save.dataset.bookTitle = title; save.dataset.bookAuthor = catalogue[title].author; }
            const availability = card.querySelector(".location-indicator");
            if (availability) {
                const link = availability.tagName === "A" ? availability : Object.assign(document.createElement("a"), { className: availability.className, innerHTML: availability.innerHTML });
                link.href = `BookAvailability.html?book=${encodeURIComponent(id)}`;
                if (availability !== link) availability.replaceWith(link);
            }
            card.querySelector(".borrow-button")?.addEventListener("click", () => { location.href = `${detailsUrl}#format-title`; });
        });

        // Pre-set filters from the URL, e.g. Browse.html?age=kids or ?format=ebook&q=mystery
        filters.forEach((filter) => {
            const value = params.get(filter.dataset.catalogueFilter);
            if (value && [...filter.options].some((option) => option.value === value)) filter.value = value;
        });
        if (query && params.get("q")) query.value = params.get("q");

        const applyCatalogueFilters = () => {
            const words = (query?.value || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
            let shown = 0;
            cards.forEach((card) => {
                const matchesFilters = filters.every((filter) => filter.value === "all" || card.dataset[filter.dataset.catalogueFilter] === filter.value);
                const searchable = `${card.dataset.keywords || ""} ${card.querySelector("h3")?.textContent || ""} ${card.querySelector(".catalogue-author")?.textContent || ""}`.toLowerCase();
                const matchesSearch = words.every((word) => searchable.includes(word));
                card.hidden = !(matchesFilters && matchesSearch);
                if (!card.hidden) shown++;
            });
            filters.forEach((filter) => filter.classList.toggle("is-active", filter.value !== "all"));

            const order = sort?.value || "relevance";
            [...cards].sort((a, b) => {
                if (order === "rating") return Number(b.dataset.rating) - Number(a.dataset.rating);
                if (order === "title") return a.querySelector("h3").textContent.localeCompare(b.querySelector("h3").textContent);
                return Number(a.dataset.order) - Number(b.dataset.order);
            }).forEach((card) => catalogueList.append(card));

            if (count) count.innerHTML = `<strong>${shown}</strong> ${shown === 1 ? "result" : "results"}`;
            if (empty) empty.hidden = shown > 0;
        };

        filters.forEach((filter) => filter.addEventListener("change", applyCatalogueFilters));
        sort?.addEventListener("change", applyCatalogueFilters);
        query?.addEventListener("input", applyCatalogueFilters);
        query?.closest("form")?.addEventListener("submit", (event) => { event.preventDefault(); applyCatalogueFilters(); });
        document.querySelectorAll("[data-reset-catalogue]").forEach((button) => button.addEventListener("click", () => {
            filters.forEach((filter) => filter.value = "all");
            if (sort) sort.value = "relevance";
            if (query) query.value = "";
            history.replaceState(null, "", location.pathname);
            applyCatalogueFilters();
        }));
        applyCatalogueFilters();
    }

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

    /* ---------- Reusable book details and availability screens ---------- */
    const detailsMain = document.querySelector(".book-details-main");
    if (detailsMain) {
        const title = detailsMain.querySelector(".book-detail-info h1");
        const author = detailsMain.querySelector(".book-detail-author");
        const cover = detailsMain.querySelector(".book-detail-cover img");
        const description = detailsMain.querySelector(".book-description > p");
        if (title) title.textContent = pageBook.title;
        if (author) author.textContent = pageBook.author;
        if (cover) { cover.src = pageBook.image; cover.alt = `Cover of ${pageBook.title} by ${pageBook.author}`; }
        if (description) description.textContent = pageBook.description;
        const save = detailsMain.querySelector("[data-save-book]");
        if (save) { save.dataset.bookTitle = pageBook.title; save.dataset.bookAuthor = pageBook.author; }
        const average = detailsMain.querySelector(".book-detail-rating strong");
        const ratingValue = catalogue[pageBook.title]?.rating;
        if (average && ratingValue) average.textContent = ratingValue;
        const stars = detailsMain.querySelector(".book-detail-rating .detail-stars");
        if (stars && ratingValue) stars.setAttribute("aria-label", `${ratingValue} out of 5 stars`);
        const form = detailsMain.querySelector(".hold-controls");
        if (form) {
            let bookInput = form.querySelector('[name="book"]');
            if (!bookInput) { bookInput = document.createElement("input"); bookInput.type = "hidden"; bookInput.name = "book"; form.append(bookInput); }
            bookInput.value = pageBook.id;
        }
        const availabilityLink = detailsMain.querySelector(".availability-action");
        if (availabilityLink) availabilityLink.href = `BookAvailability.html?book=${encodeURIComponent(pageBook.id)}`;
        const changeLink = document.querySelector("[data-change-format]");
        if (changeLink) changeLink.href = `${location.pathname}?book=${encodeURIComponent(pageBook.id)}#format-title`;
    }

    const availabilityMain = document.querySelector(".availability-main");
    if (availabilityMain) {
        const title = availabilityMain.querySelector(".availability-book-info h2");
        const author = availabilityMain.querySelector(".availability-book-info > p:not(.catalogue-rating)");
        const cover = availabilityMain.querySelector(".availability-book-card img");
        if (title) title.textContent = pageBook.title;
        if (author) author.textContent = pageBook.author;
        if (cover) { cover.src = pageBook.image; cover.alt = `Cover of ${pageBook.title} by ${pageBook.author}`; }
        const rating = availabilityMain.querySelector(".catalogue-rating");
        if (rating && catalogue[pageBook.title]?.rating) {
            rating.setAttribute("aria-label", `Rated ${catalogue[pageBook.title].rating} out of 5 stars`);
            const value = rating.childNodes[rating.childNodes.length - 1];
            if (value) value.textContent = ` ${catalogue[pageBook.title].rating}`;
        }
        const back = availabilityMain.querySelector(".back-to-results");
        if (back) back.href = `BookDetails.html?book=${encodeURIComponent(pageBook.id)}`;
        const summary = availabilityMain.querySelector(".availability-summary");
        if (summary) {
            const status = summary.querySelector("strong"), note = summary.querySelector("small");
            const digital = catalogue[pageBook.title]?.format === "ebook" || catalogue[pageBook.title]?.format === "audiobook";
            if (digital) {
                if (status) status.textContent = "Available online";
                if (note) note.textContent = "Digital collection";
            } else if (catalogue[pageBook.title]?.availability === "waitlist") {
                if (status) status.textContent = "Waitlist";
                if (note) note.textContent = "All copies are currently on loan";
            }
            const rows = [...availabilityMain.querySelectorAll(".availability-table tbody tr")];
            if (digital) {
                rows.forEach((row, index) => { row.hidden = index > 0; });
                if (rows[0]) {
                    const cells = rows[0].querySelectorAll("td");
                    if (rows[0].querySelector("th")) rows[0].querySelector("th").textContent = "Online collection";
                    if (cells[0]) cells[0].textContent = "Digital collection";
                    if (cells[1]) cells[1].textContent = "Online";
                    const state = cells[2]?.querySelector(".copy-status");
                    if (state) { state.className = "copy-status is-available"; state.textContent = "Available now"; }
                }
            } else if (catalogue[pageBook.title]?.availability === "waitlist") {
                rows.forEach((row) => {
                    const state = row.querySelector(".copy-status");
                    if (state) { state.className = "copy-status is-on-hold"; state.textContent = "On loan · place a hold"; }
                    row.querySelector(".status-note")?.remove();
                });
            } else rows.forEach((row) => { row.hidden = false; });
        }
        const collection = pageBook.title === "To Kill a Mockingbird" ? "Adult Fiction" : "Library collection";
        const callNumber = pageBook.title === "To Kill a Mockingbird" ? "FIC LEE" : "Sample record";
        availabilityMain.querySelectorAll(".availability-table tbody tr").forEach((row) => {
            const cells = row.querySelectorAll("td");
            const digital = catalogue[pageBook.title]?.format === "ebook" || catalogue[pageBook.title]?.format === "audiobook";
            if (digital) return;
            if (cells[0]) cells[0].textContent = collection;
            if (cells[1]) cells[1].textContent = callNumber;
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
        const feedback = document.querySelector("#rating-feedback");
        if (feedback) feedback.textContent = `Your rating was submitted: ${rating} out of 5.`;
    });
    removeRating?.addEventListener("click", () => {
        const ratings = readJSON(ratingsKey, {});
        delete ratings[ratedTitle];
        writeJSON(ratingsKey, ratings);
        showYourRating();
        ratingDialog?.close();
    });
    showYourRating();
    if (location.hash === "#rating" && rateButton) rateButton.click();

    document.querySelectorAll(".rate-now-button").forEach((button) => button.addEventListener("click", () => {
        const title = button.closest("article")?.querySelector("h3")?.textContent.trim();
        if (title) location.href = `BookDetails.html?book=${encodeURIComponent(slugify(title))}#rating`;
    }));

    /* ---------- My Account: renewals ---------- */
    const renewDialog = document.querySelector("#renew-dialog");
    const renewalsKey = "cpl-renewed-items";
    const renewedItems = readJSON(renewalsKey, []);
    document.querySelectorAll("[data-renew-item]").forEach((item) => {
        const title = item.querySelector("h3")?.textContent.trim();
        if (item.dataset.eligible === "true" && renewedItems.includes(title)) {
            const dueDate = item.querySelector(".item-due-date");
            if (dueDate) dueDate.textContent = "Renewed · new due date in 3 weeks";
            const button = item.querySelector(".renew-item-button");
            if (button) { button.textContent = "Renewed"; button.disabled = true; }
        }
    });
    document.querySelector("[data-open-renew]")?.addEventListener("click", () => renewDialog?.showModal());
    renewDialog?.addEventListener("close", () => {
        if (renewDialog.returnValue !== "confirm") return;
        document.querySelectorAll('[data-renew-item][data-eligible="true"] .item-due-date').forEach((dueDate) => {
            dueDate.textContent = "Renewed · new due date in 3 weeks";
        });
        writeJSON(renewalsKey, [...new Set([...renewedItems, ...[...document.querySelectorAll('[data-renew-item][data-eligible="true"] h3')].map((heading) => heading.textContent.trim())])]);
        document.querySelectorAll('[data-renew-item][data-eligible="true"] .renew-item-button').forEach((button) => { button.textContent = "Renewed"; button.disabled = true; });
        const feedback = document.querySelector("#renew-feedback");
        if (feedback) feedback.textContent = "Eligible items renewed in this prototype. Items with another reader’s hold were skipped.";
    });
    document.querySelectorAll(".renew-item-button:not(:disabled)").forEach((button) => {
        button.addEventListener("click", () => {
            const dueDate = button.closest(".account-item-card")?.querySelector(".item-due-date");
            if (dueDate) dueDate.textContent = "Renewed · new due date in 3 weeks";
            const title = button.closest("[data-renew-item]")?.querySelector("h3")?.textContent.trim();
            if (title) writeJSON(renewalsKey, [...new Set([...readJSON(renewalsKey, []), title])]);
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
        const titleElement = document.querySelector(".hold-book-info h2");
        const authorElement = document.querySelector(".hold-book-author");
        const coverElement = document.querySelector(".hold-book-summary img");
        const saveButton = document.querySelector(".hold-book-summary [data-save-book]");
        if (titleElement) titleElement.textContent = pageBook.title;
        if (authorElement) authorElement.textContent = pageBook.author;
        if (coverElement) { coverElement.src = pageBook.image; coverElement.alt = `Cover of ${pageBook.title} by ${pageBook.author}`; }
        if (saveButton) { saveButton.dataset.bookTitle = pageBook.title; saveButton.dataset.bookAuthor = pageBook.author; }
        const title = pageBook.title;
        const format = formatLabels[params.get("format")] ? params.get("format") : "";
        const isDigital = format === "ebook" || format === "audiobook";
        const confirmButton = document.querySelector("[data-confirm-hold]");
        const success = document.querySelector("[data-hold-success]");
        const successMessage = document.querySelector("[data-hold-success-message]");
        const formatText = document.querySelector("[data-hold-format]");
        const changeFormat = document.querySelector("[data-change-format]");

        if (formatText) formatText.textContent = format ? formatLabels[format] : "Not chosen yet";
        if (changeFormat) {
            const returnParams = new URLSearchParams({ book: pageBook.id });
            if (format) returnParams.set("format", format);
            changeFormat.href = `BookDetails.html?${returnParams.toString()}#format-title`;
            changeFormat.textContent = format ? "Change" : "Choose a format";
        }
        success?.querySelectorAll('a[href="BookDetails.html"]').forEach((link) => { link.href = `BookDetails.html?book=${encodeURIComponent(pageBook.id)}`; });
        document.querySelectorAll('.place-hold-main a[href="BookDetails.html"]').forEach((link) => { link.href = `BookDetails.html?book=${encodeURIComponent(pageBook.id)}`; });
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
            if (alreadyPlaced && hold.status === "ready") {
                successMessage.innerHTML = `Your <strong>${hold.title}</strong> (${formatLabels[hold.format]}) is already ready for pickup at <strong>${hold.branch}</strong>. Pick it up by ${hold.pickupBy}.`;
            } else {
                const ready = hold.branch
                    ? `ready for pickup at <strong>${hold.branch}</strong>`
                    : `ready to ${hold.format === "ebook" ? "read" : "listen to"} online`;
                successMessage.innerHTML = `${alreadyPlaced ? "You already have a hold on" : ""} <strong>${hold.title}</strong> (${formatLabels[hold.format]})${alreadyPlaced ? "." : " is on hold."} You’re <strong>#${hold.position || 1} in line</strong>. We’ll email you when it’s ${ready}.`;
            }
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
    const defaultLoginError = loginError?.innerHTML || "";
    const resetDialog = document.querySelector("#password-reset-dialog");
    const resetForm = document.querySelector("#password-reset-form");
    const resetFeedback = document.querySelector("[data-reset-feedback]");
    const createDialog = document.querySelector("#create-account-dialog");
    const createForm = document.querySelector("#create-account-form");
    const createFeedback = document.querySelector("[data-create-feedback]");
    const resetPasswordVisibility = (form) => form.querySelectorAll("[data-toggle-password]").forEach((button) => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (input) input.type = "password";
        button.textContent = "Show";
        button.setAttribute("aria-label", "Show password");
        button.setAttribute("aria-pressed", "false");
    });
    document.querySelectorAll(".login-form").forEach((form) => form.addEventListener("reset", () => resetPasswordVisibility(form)));
    document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("close", () => {
        dialog.querySelectorAll(".login-form").forEach(resetPasswordVisibility);
    }));
    document.querySelectorAll("[data-toggle-password]").forEach((button) => button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (!input) return;
        const visible = input.type === "password";
        input.type = visible ? "text" : "password";
        button.textContent = visible ? "Hide" : "Show";
        button.setAttribute("aria-label", `${visible ? "Hide" : "Show"} password`);
        button.setAttribute("aria-pressed", String(visible));
        input.focus({ preventScroll: true });
    }));
    const accountsKey = "cpl-demo-accounts";
    const currentUserKey = "cpl-demo-current-user";
    const oldPasswordKey = "cpl-demo-password";
    let accounts = readJSON(accountsKey, null);
    if (Array.isArray(accounts)) accounts = accounts.filter((account) => account && typeof account.name === "string" && typeof account.email === "string" && typeof account.cardNumber === "string" && typeof account.password === "string");
    if (!Array.isArray(accounts) || !accounts.length) {
        let oldPassword = "library";
        try { oldPassword = localStorage.getItem(oldPasswordKey) || "library"; } catch {}
        accounts = [{ name: "Maria", email: "maria@example.com", cardNumber: "3456", password: oldPassword }];
        writeJSON(accountsKey, accounts);
    }

    const activeEmail = getStorage(currentUserKey);
    const activeAccount = accounts.find((account) => account.email === activeEmail);
    if (activeAccount) {
        const accountTitle = document.querySelector("#account-title");
        const cardNumber = document.querySelector(".library-card-number strong");
        if (accountTitle) accountTitle.textContent = `Hello, ${activeAccount.name}`;
        if (cardNumber) cardNumber.textContent = activeAccount.cardNumber.slice(-4);
    }

    document.querySelectorAll(".account-menu a").forEach((link) => {
        if (link.textContent.trim().toLowerCase() === "log out") {
            link.textContent = isSignedIn ? "Log out" : "Sign in";
            link.href = isSignedIn ? "Login.html?logout=1" : "Login.html";
        }
    });
    if (params.get("logout") === "1") {
        try {
            localStorage.removeItem(sessionKey);
            localStorage.removeItem(currentUserKey);
        } catch {
            setStorage(sessionKey, "");
            setStorage(currentUserKey, "");
        }
        if (loginError) {
            loginError.classList.add("is-info");
            loginError.innerHTML = "<strong>You’re signed out.</strong><span>Your saved books, holds, and event registrations remain in this browser.</span>";
            loginError.hidden = false;
        }
    }
    if (loginForm && loginError) {
        const idInput = loginForm.querySelector("#library-id");
        const passwordInput = loginForm.querySelector("#login-password");
        const next = params.get("next");
        if (next && params.get("logout") !== "1") {
            const nextPage = next.split(/[?#]/, 1)[0].split("/").pop();
            const message = nextPage === "PlaceHold.html"
                ? "Sign in to place your hold. Your selected book and format will be waiting."
                : nextPage === "MyAccount.html" ? "Sign in to view your library account." : "Sign in to continue.";
            loginError.classList.add("is-info");
            loginError.innerHTML = `<strong>${message}</strong><span>Use your demo email or card number and password to continue.</span>`;
            loginError.hidden = false;
        }
        const openReset = () => { if (resetFeedback) resetFeedback.textContent = ""; resetDialog?.showModal(); resetDialog?.querySelector("#reset-email")?.focus(); };
        document.addEventListener("click", (event) => {
            if (!event.target.closest("[data-forgot-password]")) return;
            event.preventDefault(); openReset();
        });
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            loginError.classList.remove("is-info");
            if (!idInput.value.trim() || !passwordInput.value) {
                loginError.innerHTML = "<strong>Please fill in both fields.</strong><span>Enter your email or library card number and your password.</span>";
                loginError.hidden = false;
                (idInput.value.trim() ? passwordInput : idInput).focus();
                return;
            }
            const identifier = idInput.value.trim().toLowerCase();
            const member = accounts.find((account) => account.email.toLowerCase() === identifier || account.cardNumber === idInput.value.trim());
            if (!member || passwordInput.value !== member.password) {
                loginError.innerHTML = defaultLoginError;
                loginError.hidden = false;
                idInput.setAttribute("aria-invalid", "true");
                passwordInput.setAttribute("aria-invalid", "true");
                passwordInput.value = "";
                passwordInput.focus();
                return;
            }
            setStorage(sessionKey, "true");
            setStorage(currentUserKey, member.email);
            let destination = "MyAccount.html";
            if (next) {
                try {
                    const candidate = new URL(next, location.href);
                    const allowedPages = ["MyAccount.html", "PlaceHold.html", "BookDetails.html", "Browse.html", "Events.html"];
                    if (candidate.origin === location.origin && allowedPages.includes(candidate.pathname.split("/").pop())) destination = `${candidate.pathname.split("/").pop()}${candidate.search}${candidate.hash}`;
                } catch { /* Invalid return path: use the account page. */ }
            }
            location.href = destination;
        });
        [idInput, passwordInput].forEach((input) => input.addEventListener("input", () => input.removeAttribute("aria-invalid")));
    }
    resetForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = resetForm.querySelector("#reset-email").value.trim().toLowerCase();
        const nextPassword = resetForm.querySelector("#new-password").value;
        const confirmPassword = resetForm.querySelector("#confirm-password").value;
        const memberIndex = accounts.findIndex((account) => account.email.toLowerCase() === email);
        if (memberIndex < 0) { resetFeedback.textContent = "No demo account uses that email. Create an account first, or check the address."; return; }
        if (nextPassword !== confirmPassword) { resetFeedback.textContent = "The passwords do not match. Please enter them again."; resetForm.querySelector("#confirm-password").focus(); return; }
        accounts[memberIndex].password = nextPassword;
        writeJSON(accountsKey, accounts);
        resetFeedback.textContent = "Your demo password was changed. Sign in with this email and your new password. No email was sent.";
        resetForm.reset();
    });
    document.querySelector("[data-create-account]")?.addEventListener("click", () => {
        if (createFeedback) createFeedback.textContent = "";
        createForm?.reset();
        createDialog?.showModal();
        createDialog?.querySelector("#new-member-name")?.focus();
    });
    createForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = createForm.querySelector("#new-member-name").value.trim();
        const email = createForm.querySelector("#new-member-email").value.trim().toLowerCase();
        const password = createForm.querySelector("#new-member-password").value;
        const confirmation = createForm.querySelector("#new-member-password-confirm").value;
        if (!name) {
            createFeedback.textContent = "Enter your name to create the demo account.";
            createForm.querySelector("#new-member-name").focus();
            return;
        }
        if (password !== confirmation) {
            createFeedback.textContent = "The passwords do not match. Please enter them again.";
            createForm.querySelector("#new-member-password-confirm").focus();
            return;
        }
        if (accounts.some((account) => account.email.toLowerCase() === email)) {
            createFeedback.textContent = "An account already uses this email. Sign in or use Forgot password?";
            createForm.querySelector("#new-member-email").focus();
            return;
        }
        const cardNumber = String(100000 + accounts.length);
        accounts.push({ name, email, cardNumber, password });
        writeJSON(accountsKey, accounts);
        createDialog.close();
        createForm.reset();
        const idInput = loginForm?.querySelector("#library-id");
        if (idInput) idInput.value = email;
        if (loginError) {
            loginError.classList.add("is-info");
            loginError.innerHTML = "<strong>Your demo account is ready.</strong><span></span>";
            loginError.querySelector("span").textContent = `Sign in with ${email} or card ${cardNumber}, and the password you chose.`;
            loginError.hidden = false;
        }
    });
});
