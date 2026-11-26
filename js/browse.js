/* Catalogue search, filters, sorting, and book links. */
document.addEventListener("DOMContentLoaded", () => {
    const app = window.CPLPrototype;
    if (app.blocked) return;
    const { catalogue, params, slugify, make } = app;
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
});
