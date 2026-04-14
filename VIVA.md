# Invoice App — Viva Preparation Guide

## 1. Project Overview

This is a full-stack Invoice Management Web Application. It allows users to create, view, edit, delete, and manage invoices with statuses like draft, pending, and paid.

The project is divided into two parts:
- **Frontend** — HTML, CSS, Vanilla JavaScript
- **Backend** — Node.js with Express and SQLite

---

## 2. Tech Stack

| Layer      | Technology         | Purpose                          |
|------------|--------------------|----------------------------------|
| Frontend   | HTML5              | Page structure                   |
| Frontend   | CSS3               | Styling, dark/light theme        |
| Frontend   | Vanilla JavaScript | UI logic, API calls              |
| Backend    | Node.js            | Server runtime                   |
| Backend    | Express.js         | REST API framework               |
| Backend    | better-sqlite3     | SQLite database driver           |
| Database   | SQLite             | Persistent data storage          |
| Font       | League Spartan     | Google Fonts typography          |

---

## 3. Project Folder Structure

```
invoice-app/
├── backend/
│   ├── server.js          → Entry point, Express app setup
│   ├── db.js              → Database connection + seeding
│   ├── routes/
│   │   └── invoices.js    → All API route handlers
│   ├── invoices.db        → SQLite database file (auto-created)
│   └── package.json       → Node dependencies
│
├── frontend/
│   ├── index.html         → Single HTML page (SPA structure)
│   ├── style.css          → All styling including dark/light theme
│   ├── app.js             → All frontend logic and API calls
│   └── assets/            → Icons, images, SVGs
│
└── starter-code/
    └── data.json          → Original seed data (7 invoices)
```

---

## 4. How to Run the Project

1. Open terminal and go to the backend folder:
   ```
   cd invoice-app/backend
   ```
2. Install dependencies (first time only):
   ```
   npm install
   ```
3. Start the server:
   ```
   node server.js
   ```
4. Open browser and go to:
   ```
   http://localhost:3001
   ```

The backend also serves the frontend, so one command runs everything.

---

## 5. Backend — Detailed Explanation

### server.js
- Creates an Express app on port `3001`
- Uses `cors` middleware so the frontend can talk to the API
- Uses `express.json()` to parse incoming JSON request bodies
- Serves the `frontend/` folder as static files
- Mounts all invoice routes at `/api/invoices`
- Has a fallback route that always returns `index.html` (SPA support)

### db.js
- Connects to `invoices.db` using `better-sqlite3`
- Creates the `invoices` table if it doesn't exist:
  ```sql
  CREATE TABLE IF NOT EXISTS invoices (
    id   TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
  ```
- The entire invoice object is stored as a JSON string in the `data` column
- On first run, if the table is empty, it reads `data.json` and seeds 7 invoices automatically

### routes/invoices.js — REST API Endpoints

| Method | Endpoint                  | What it does                        |
|--------|---------------------------|-------------------------------------|
| GET    | `/api/invoices`           | Returns all invoices                |
| GET    | `/api/invoices/:id`       | Returns one invoice by ID           |
| POST   | `/api/invoices`           | Creates a new invoice               |
| PUT    | `/api/invoices/:id`       | Updates a full invoice              |
| PATCH  | `/api/invoices/:id/status`| Updates only the status field       |
| DELETE | `/api/invoices/:id`       | Deletes an invoice                  |

Each invoice is stored as a JSON string and parsed when returned. HTTP status codes used:
- `200` — success
- `201` — created
- `400` — bad request (missing fields)
- `404` — invoice not found
- `409` — conflict (duplicate ID)

---

## 6. Frontend — Detailed Explanation

### index.html
- Single page with multiple views toggled by JavaScript (no page reloads)
- Three main sections:
  - **List View** — shows all invoices
  - **Detail View** — shows one invoice's full details
  - **Form Panel** — slide-in panel for creating or editing invoices
- Also contains a **Delete Confirmation Modal**

### style.css
- Uses CSS custom properties (variables) for theming:
  ```css
  :root { --bg: #141625; --purple: #7c5dfa; ... }
  [data-theme="light"] { --bg: #f8f8fb; ... }
  ```
- Dark mode is default, light mode toggled by adding `data-theme="light"` to `<html>`
- Layout uses CSS Grid and Flexbox
- Responsive breakpoint at `600px` for mobile

### app.js — Key Functions

| Function | What it does |
|---|---|
| `loadInvoices()` | Fetches all invoices from the API on page load |
| `renderInvoices()` | Renders invoice cards in the list view |
| `getFiltered()` | Returns invoices filtered by selected statuses |
| `showDetail(id)` | Switches to detail view and renders invoice data |
| `showList()` | Goes back to the list view |
| `openForm()` | Opens the slide-in form for a new invoice |
| `openEditForm()` | Opens the form pre-filled with existing invoice data |
| `saveInvoice(status)` | Sends POST or PUT to the API to save the invoice |
| `markCurrentPaid()` | Sends PATCH request to update status to "paid" |
| `deleteCurrentInvoice()` | Opens the delete confirmation modal |
| `confirmDelete()` | Sends DELETE request and removes invoice from UI |
| `addItem(prefill)` | Adds a new item row in the form with live total calculation |
| `collectItems()` | Reads all item rows and returns an array of item objects |
| `generateId()` | Generates a random ID like `AB1234` (2 letters + 4 numbers) |
| `toggleTheme()` | Switches between dark and light mode |
| `formatDate(str)` | Formats a date string to `DD Mon YYYY` format |
| `calcDue(date, days)` | Calculates payment due date by adding days to invoice date |

---

## 7. Data Flow — How it all connects

```
User clicks "New Invoice"
        ↓
openForm() runs in app.js
        ↓
User fills form and clicks "Save & Send"
        ↓
saveInvoice('pending') runs
        ↓
fetch POST → http://localhost:3001/api/invoices
        ↓
Express receives request in routes/invoices.js
        ↓
db.prepare('INSERT INTO invoices...').run()
        ↓
SQLite stores the invoice in invoices.db
        ↓
API returns the created invoice as JSON
        ↓
Frontend adds it to the invoices array
        ↓
renderInvoices() updates the UI
```

---

## 8. Invoice Data Structure

Each invoice object looks like this:

```json
{
  "id": "XM9141",
  "createdAt": "2021-08-21",
  "paymentDue": "2021-09-20",
  "description": "Graphic Design",
  "paymentTerms": 30,
  "clientName": "Alex Grim",
  "clientEmail": "alexgrim@mail.com",
  "status": "pending",
  "senderAddress": {
    "street": "19 Union Terrace",
    "city": "London",
    "postCode": "E1 3EZ",
    "country": "United Kingdom"
  },
  "clientAddress": {
    "street": "84 Church Way",
    "city": "Bradford",
    "postCode": "BD1 9PB",
    "country": "United Kingdom"
  },
  "items": [
    { "name": "Banner Design", "quantity": 1, "price": 156.00, "total": 156.00 },
    { "name": "Email Design",  "quantity": 2, "price": 200.00, "total": 400.00 }
  ],
  "total": 556.00
}
```

Invoice statuses: `draft`, `pending`, `paid`

---

## 9. Key Concepts to Know for Viva

**What is a REST API?**
A set of HTTP endpoints that allow the frontend to communicate with the backend using standard methods: GET, POST, PUT, PATCH, DELETE.

**What is Express.js?**
A minimal Node.js web framework used to define routes and handle HTTP requests and responses.

**What is SQLite?**
A lightweight file-based relational database. No separate database server needed — the entire database is stored in a single `.db` file.

**What is better-sqlite3?**
A Node.js library to interact with SQLite. It is synchronous (unlike most Node.js libraries) which makes it simple to use.

**What is CORS?**
Cross-Origin Resource Sharing. It allows the frontend (running on one origin) to make requests to the backend (on another port). The `cors` middleware enables this.

**Why store invoice as JSON string in SQLite?**
The invoice has a complex nested structure (addresses, items array). Instead of creating multiple tables with foreign keys, the entire object is serialized as a JSON string in one column — simpler for this scale of project.

**What is a SPA (Single Page Application)?**
A web app that loads one HTML page and dynamically updates the content using JavaScript without full page reloads. This app switches between list, detail, and form views entirely in JavaScript.

**How does dark/light mode work?**
The `data-theme` attribute on the `<html>` element is toggled between `"dark"` and `"light"`. CSS variables change their values based on this attribute, updating all colors instantly.

**How is the invoice total calculated?**
`total = sum of (quantity × price)` for each item. This is calculated in `collectItems()` and also updated live in the form as the user types.

**How is the payment due date calculated?**
```js
function calcDue(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
```
It adds the payment terms (1, 7, 14, or 30 days) to the invoice creation date.

---

## 10. Possible Viva Questions

- What is the difference between PUT and PATCH?
  - PUT replaces the entire resource. PATCH updates only specific fields (here, just the status).

- Why did you use SQLite instead of MongoDB or MySQL?
  - SQLite is file-based, requires no setup, and is perfect for small projects and local development.

- How does the frontend know which invoice to edit?
  - `currentInvoiceId` is a global variable that stores the ID of the currently viewed invoice.

- What happens if the backend is not running?
  - The `loadInvoices()` function has a try/catch block that shows an error message on screen.

- How do you prevent duplicate invoice IDs?
  - The `id` column in SQLite is a `PRIMARY KEY`, so inserting a duplicate throws an error. The API catches this and returns a `409 Conflict` response.

- What is the purpose of `express.static()`?
  - It serves all files in the `frontend/` folder directly, so the browser can load `index.html`, `style.css`, and `app.js` without separate routes.
