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
| Browse | `Browse.html` | Catalogue search results with format labels, ratings, availability, Borrow and Save |
| Book details | `BookDetails.html` | Full details for a title (*To Kill a Mockingbird*), with rating and saving |
| Book availability | `BookAvailability.html` | Which branches have a copy |
| Place a hold | `PlaceHold.html` | Choosing a pickup branch and confirming a hold |
| My Account | `MyAccount.html` | Borrowed items and renewals, holds, Saved Books, recently read |
| Events | `Events.html` | Event list with filters and registration details |
| Log in | `Login.html` | Member sign-in screen |

## Interactive features

All behaviour lives in `prototype.js`:

- **Saved Books:** the heart button on any book adds or removes it, and the list on My Account updates to match.
- **Preferred branch:** the branch chosen on My Account is pre-selected as the pickup branch when placing a hold.
- **Renewals:** renew single items or use **Renew all**. Items with another reader's hold can't be renewed.
- **Holds:** confirming a hold shows which branch it will be ready at.
- **Ratings:** on the book details page, a dialog lets members rate the book.
- **Event filters:** filter the event list and reset the filters; **Register** opens the event's requirements.

Saved Books and the preferred branch are stored in the browser's `localStorage`, so they stay between pages and visits on the same browser. If the browser blocks storage (some do for files opened directly from disk), they're kept only until the page is closed. To reset them, clear the site data in your browser.

## Project structure

```
index.html            Home page
Browse.html           Catalogue search results
BookDetails.html      Single book details
BookAvailability.html Branch availability
PlaceHold.html        Place a hold
MyAccount.html        Member account
Events.html           Events listing
Login.html            Sign-in screen
style.css             Styles for every page
prototype.js          Shared interactions
images/               Book covers, photos, backgrounds and logo
```

## Images

- Book cover images are named after the book (for example `images/kill-joy.jpg`). To use a different cover, save it under the same filename and it replaces the old one without code changes.
- `images/cover-placeholder.jpg` is shown when a saved book has no cover.
- File names are case-sensitive on most web hosts, including GitHub Pages, so the name in the HTML must match the file exactly (`LittleWomen.jpg` is not `littlewomen.jpg`).
- Only use photos you are allowed to use, such as free photos from Unsplash or Pexels. Don't use stock photos that carry a watermark.
