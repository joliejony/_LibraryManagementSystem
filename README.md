# Library Management System

A clickable website prototype for a public library, made for CPSC 481 (Human-Computer Interaction). It shows how library members find books, check where a copy is available, place holds, manage their account and find events.

It is a front-end prototype only. There is no server or database, so logins, holds, renewals and event registrations are simulated in the browser and nothing is sent anywhere.

## Viewing the prototype

No installs or build step are needed.

1. Download the repo: green **Code** button → **Download ZIP**, then unzip it.
2. Open `index.html` in a web browser.

All pages link to each other from the navigation bar. If you use VS Code, the **Live Server** extension (right-click `index.html` → **Open with Live Server**) refreshes the page as you edit.

## Pages

| Page | File | What it shows |
| --- | --- | --- |
| Home | `index.html` | Search, browse by audience (kids, teens, adults, eBooks), staff picks and upcoming events |
| Browse | `Browse.html` | Catalogue search with age-group, format and availability filters, sorting, ratings, Borrow and Save |
| Book details | `BookDetails.html` | Full details for a title (*To Kill a Mockingbird*), with rating and saving |
| Book availability | `BookAvailability.html` | Which branches have a copy |
| Place a hold | `PlaceHold.html` | Choosing a pickup branch and confirming a hold |
| My Account | `MyAccount.html` | Borrowed items and renewals, holds, My events, Saved Books, recently read |
| Events | `Events.html` | Event list with filters, key-fact tags and registration |
| Help & FAQ | `Help.html` | Answers about holds, renewals, pickup deadlines and events |
| Log in | `Login.html` | Member sign-in screen, including the failed-login message |

## Interactive features

All behaviour lives in `prototype.js`:

- **Browse filters:** dropdowns for age group (Kids 0–7, Middle grade 8–12, Teens 13–17, Adults 18+), format and availability, plus sorting and a text search. The result count updates, and a message appears when nothing matches. The Kids/Teens/Adults/eBooks links on Home open Browse already filtered (e.g. `Browse.html?age=kids`).
- **Saved Books:** the heart button on any book adds or removes it, and the list on My Account updates to match. A saved book shows "Saved" instead of offering to save it again.
- **Preferred branch:** the branch chosen on My Account is pre-selected as the pickup branch when placing a hold.
- **Renewals:** renew single items or use **Renew all**. Items with another reader's hold can't be renewed.
- **Holds:** a format must be chosen first, and Place a Hold shows it with a **Change** link. eBook and Audiobook holds don't ask for a pickup branch. Placing a hold shows a confirmation (your place in line, with **View my holds** and **Back to book**), and the hold appears under Items on hold with a "Waiting" status. Holds can be cancelled.
- **Ratings:** a single row of five stars with an "N out of 5" label. After rating, the book page shows "Your rating", and **Edit rating** lets members change or remove it.
- **Events:** each card shows tags for whether registration is needed and how many spots are left. Registering asks for confirmation (event, date, time, location), then the card shows "Registered", the spots count drops, and the event appears under **My Account → My events**, where it can be cancelled.
- **Log in:** the password `library` signs in. Any other password shows an error message and points to **Forgot password?**.
- **Help & FAQ:** linked from every footer and from the Account menu.

Saved Books, the preferred branch, holds, event registrations and ratings are stored in the browser's `localStorage`, so they stay between pages and visits on the same browser. If the browser blocks storage (some do for files opened directly from disk), they're kept only until the page is closed. To reset them, clear the site data in your browser.


