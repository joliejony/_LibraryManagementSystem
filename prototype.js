/* Small browser-only interactions for the CPSC 481 prototype. */
document.addEventListener("DOMContentLoaded", () => {
    const savedKey = "cpl-saved-books";
    const branchKey = "cpl-preferred-branch";
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
    const readSaved = () => {
        try { return JSON.parse(getStorage(savedKey) || "[]"); }
        catch { return []; }
    };
    const writeSaved = (items) => setStorage(savedKey, JSON.stringify(items));

    function getBookTitle(button) {
        const label = button.getAttribute("aria-label") || "";
        const fromLabel = label.match(/(?:Add|Remove) (.+?) (?:to|from) Saved Books/i);
        if (fromLabel) return fromLabel[1];
        const heading = button.closest("article")?.querySelector("h1, h2, h3");
        return heading?.textContent.trim() || document.querySelector(".book-detail-info h1, .hold-book-info h2")?.textContent.trim() || "Saved book";
    }

    function getBookImage(button) {
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
                button.lastChild.textContent = isSaved ? " Saved Books" : " Add to Saved Books";
            } else {
                button.textContent = isSaved ? "♥" : "♡";
            }
            button.setAttribute("aria-label", `${isSaved ? "Remove" : "Add"} ${title} ${isSaved ? "from" : "to"} Saved Books`);
        });
    }

    document.querySelectorAll("[data-save-book]").forEach((button) => {
        button.addEventListener("click", () => {
            const title = getBookTitle(button);
            const saved = readSaved();
            const index = saved.findIndex((book) => book.title === title);
            if (index >= 0) saved.splice(index, 1);
            else saved.push({ title, image: getBookImage(button) });
            writeSaved(saved);
            syncSaveButtons();
            renderSavedBooks();
        });
    });

    function renderSavedBooks() {
        const grid = document.querySelector("#saved-title")?.closest(".account-section")?.querySelector(".account-small-grid");
        if (!grid) return;
        const saved = readSaved();
        grid.innerHTML = "";
        if (!saved.length) {
            grid.innerHTML = '<p class="saved-empty-state">You have no Saved Books yet. Browse the catalogue to save a title for later.</p>';
            return;
        }
        saved.forEach((book) => {
            const card = document.createElement("article");
            card.className = "saved-book-card";
            const image = document.createElement("img");
            image.src = book.title === "The Midnight Library" ? "images/themidnightlib.jpg" : book.image;
            image.alt = `Cover image for ${book.title}`;
            const info = document.createElement("div");
            const title = document.createElement("h3");
            title.textContent = book.title;
            const author = document.createElement("p");
            author.textContent = book.title === "To Kill a Mockingbird" ? "Harper Lee" : "Library collection";
            info.append(title, author);
            const remove = document.createElement("button");
            remove.className = "remove-saved-button";
            remove.type = "button";
            remove.textContent = "Remove from Saved Books";
            remove.addEventListener("click", () => {
                writeSaved(readSaved().filter((entry) => entry.title !== book.title));
                renderSavedBooks();
                syncSaveButtons();
            });
            card.append(image, info, remove);
            grid.append(card);
        });
    }

    // Keep the existing example books as the account's initial sample saved list.
    const savedGrid = document.querySelector("#saved-title")?.closest(".account-section")?.querySelector(".account-small-grid");
    if (savedGrid && !getStorage(savedKey)) {
        const initial = [...savedGrid.querySelectorAll(".saved-book-card")].map((card) => ({
            title: card.querySelector("h3")?.textContent.trim(),
            image: card.querySelector("img")?.getAttribute("src") || "images/cover-placeholder.jpg"
        })).filter((book) => book.title);
        writeSaved(initial);
    }
    renderSavedBooks();
    syncSaveButtons();

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

    const ratingDialog = document.querySelector("#rating-dialog");
    document.querySelector("[data-open-rating]")?.addEventListener("click", () => ratingDialog?.showModal());
    document.querySelector("#rating-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const rating = new FormData(event.currentTarget).get("rating");
        const feedback = document.querySelector("#rating-feedback");
        if (feedback) feedback.textContent = `Your rating was submitted. Your ${rating}-star selection is included in the public average.`;
        event.currentTarget.querySelectorAll("input").forEach((input) => input.checked = input.value === rating);
    });

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

    document.querySelector("[data-confirm-hold]")?.addEventListener("click", () => {
        const selected = pickupBranch?.selectedOptions[0]?.textContent.trim() || "your selected branch";
        const feedback = document.querySelector("[data-hold-feedback]");
        if (feedback) feedback.textContent = `Hold request ready for pickup at ${selected}. This is a prototype; the request has not been sent to a library account.`;
    });

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
    document.querySelectorAll("[data-register-event]").forEach((button) => button.addEventListener("click", () => {
        const card = button.closest(".event");
        const requirements = card?.querySelector(".event-requirements");
        if (requirements) requirements.open = true;
        const feedback = document.querySelector("[data-event-feedback]");
        if (feedback) feedback.textContent = "Review the availability and registration details above. Registration is a prototype only.";
        requirements?.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
});
