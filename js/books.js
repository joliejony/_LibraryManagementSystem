/* Saved Books, book pages, availability, and ratings. */
document.addEventListener("DOMContentLoaded", () => {
    const app = window.CPLPrototype;
    if (app.blocked) return;
    const { savedKey, ratingsKey, getStorage, readJSON, writeJSON, make, catalogue, descriptions, formatLabels, params, slugify, pageBook } = app;
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
});
