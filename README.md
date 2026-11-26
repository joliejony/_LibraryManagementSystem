# Library Management System

A clickable website prototype for a public library, made for CPSC 481 (Human-Computer Interaction). It shows how library members find books, check where a copy is available, place holds, manage their account and find events.

It is a front-end prototype only. There is no server or database, so logins, holds, renewals and event registrations are simulated in the browser and nothing is sent anywhere.

## Viewing the prototype

No install or build step is needed. Use VS Code Live Server to keep browser storage working consistently across pages.

1. Open the project folder in VS Code.
2. Start Live Server from `index.html` (right-click → **Open with Live Server**).

All pages link to each other from the navigation bar. If you use VS Code, the **Live Server** extension (right-click `index.html` → **Open with Live Server**) refreshes the page as you edit.

## Pages

| Page | File | What it shows |
| --- | --- | --- |
| Home | `index.html` | Search, browse by audience (kids, teens, adults, eBooks), staff picks and upcoming events |
| Browse | `Browse.html` | Search and filter the 11 sample catalogue titles by age group, format and availability; sort results |
| Book details | `BookDetails.html?book=...` | Details for the selected title, with rating, saving and format choice |
| Book availability | `BookAvailability.html?book=...` | Sample location or online availability for the selected title |
| Place a hold | `PlaceHold.html` | Choosing a format and pickup branch and confirming a hold (sign-in required) |
| My Account | `MyAccount.html` | Borrowed items and renewals, holds, My events, Saved Books, recently read (sign-in required) |
| Events | `Events.html` | Event list with filters, key-fact tags and registration |
| Help & FAQ | `Help.html` | Answers about holds, renewals, pickup deadlines and events |
| Log in | `Login.html` | Member sign-in screen, including the failed-login message |

## Interactive features

All behaviour lives in `prototype.js`:

- **Browse and book details:** Home and Browse search use the catalogue. All 11 sample titles open their own details and availability pages. Borrow/Place hold opens the title’s detail page and format selector. Filters cover age group (Kids 0–7, Middle grade 8–12, Teens 13–17, Adults 18+), format and availability, with title/rating sorting, result count, and a no-results message. Home audience links open pre-filtered results.
- **Saved Books:** the heart button on any book adds or removes it, and the list on My Account updates to match. A saved book shows "Saved" instead of offering to save it again.
- **Preferred branch:** the branch chosen on My Account is pre-selected as the pickup branch when placing a hold.
- **Renewals:** renew single items or use **Renew all**. Items with another reader's hold can't be renewed.
- **Holds:** a format must be chosen first, and Place a Hold shows it with a **Change** link. eBook and Audiobook holds don't ask for a pickup branch. Placing a hold shows a confirmation with its queue position, **View my holds**, and **Back to book**. The hold appears under Items on hold with a “Waiting” status and can be cancelled. Duplicate holds are recognized.
- **Ratings:** a single row of five stars with an "N out of 5" label. After rating, the book page shows "Your rating", and **Edit rating** lets members change or remove it.
- **Events:** each card shows tags for whether registration is needed and how many spots are left. Registering asks for confirmation (event, date, time, location), then the card shows "Registered", the spots count drops, and the event appears under **My Account → My events**, where it can be cancelled.
- **Accounts:** sign in with the sample account `maria@example.com` (or card number `3456`) and password `library`, or create a demo account with your own email and password. My Account and Place a Hold ask you to sign in, then return you to the page you were using. Forgot Password changes the password for an existing demo account in this browser; it does not send email. Log out clears the simulated sign-in state.
- **Help & FAQ:** linked from every footer and from the Account menu.

Demo accounts and passwords, Saved Books, preferred branch, holds, event registrations, ratings, renewals and sign-in state are stored in this browser's `localStorage`. This is only a local class prototype: account data is not secure, and there is no real account service, email, inventory, or database. Clearing this site's data removes created demo accounts and restores the sample account (`maria@example.com` / `library`).

## Video walkthrough suggestion

Start at Log in and sign in with `maria@example.com` (or card number `3456`) and password `library`. Search for `kill`, open a title, add it to Saved Books, then choose the Book format and place a hold at Central Library. Visit My Account to show the saved title and hold. Return to Browse, use the Teens and eBook filters, open a title, and submit a rating. Open Events, register for the Newcomer Welcome Session, confirm the details, then show it under My Account → My events and cancel it. Finally, log out, return to Log in, show the wrong-password message, use **Forgot password?** for `maria@example.com` to set a new demo password, and sign in again with it.


