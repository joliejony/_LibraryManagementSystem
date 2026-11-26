/* Shared data and browser helpers for the Calgary Public Library prototype. */
(() => {
    const sessionKey = "cpl-demo-signed-in";
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
    const app = {
        sessionKey, savedKey, branchKey, holdsKey, eventsKey, ratingsKey,
        getStorage, setStorage, readJSON, writeJSON, make,
        catalogue, descriptions, formatLabels, params, slugify, bookById, pageBook,
        blocked: false, isSignedIn: false
    };
    window.CPLPrototype = app;

    document.addEventListener("DOMContentLoaded", () => {
        const currentPage = location.pathname.split("/").pop();
        try { app.isSignedIn = localStorage.getItem(sessionKey) === "true"; } catch {}
        if (["MyAccount.html", "PlaceHold.html"].includes(currentPage) && !app.isSignedIn) {
            app.blocked = true;
            const returnTo = `${currentPage}${location.search}${location.hash}`;
            location.replace(`Login.html?next=${encodeURIComponent(returnTo)}`);
        }
    });
})();
