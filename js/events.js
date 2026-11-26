/* Event filters, registration, and My Events. */
document.addEventListener("DOMContentLoaded", () => {
    const app = window.CPLPrototype;
    if (app.blocked) return;
    const { eventsKey, readJSON, writeJSON, make } = app;
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
});
