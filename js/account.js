/* Preferred branch, renewals, and holds. */
document.addEventListener("DOMContentLoaded", () => {
    const app = window.CPLPrototype;
    if (app.blocked) return;
    const { branchKey, holdsKey, getStorage, setStorage, readJSON, writeJSON, make, catalogue, formatLabels, params, pageBook } = app;
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
});
