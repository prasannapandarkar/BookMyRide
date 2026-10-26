# RideEasy – Static Version

Pure **HTML, CSS and JavaScript** — no Python, no server, no install.

## Run
Double-click `index.html` (or open it in your browser / VS Code "Live Server").

## Files
- `index.html`, `vehicles.html`, `booking.html`, `documents.html`, `login.html`, `admin.html`
- `css/style.css` – styling
- `js/main.js` – vehicle data (edit prices here), login/sign-up, booking logic, shared header/footer

## Notes
- Sign up / login work using the browser's localStorage. Passwords are hashed, but this is
  **demo-level only** — real security needs a server. Accounts and bookings stay in that browser only.
- Booking, Documents and Admin require login.
- Document upload only validates the file (type/size) and remembers its name; nothing is uploaded.
- Vehicle prices are at the top of `js/main.js` in the `VEHICLES` list.

## App features
- **Installable (PWA):** `manifest.webmanifest`, `sw.js` and `icons/`. Works offline after the first visit. Needs to be served over http(s) (e.g. GitHub Pages or `python3 -m http.server`), not opened as a file.
- **Phone-style navigation:** bottom tab bar (Home, Vehicles, Book, Trips, Profile) on phones, top bar on desktop.
- **Vehicles:** search, sort, filters, saved favourites, details sheet with specs.
- **Booking:** live price breakdown, Google Maps pickup preview, UPI ID typed by the user each time.
- **My Trips:** upcoming / past / cancelled, directions, cancel, book again.
- **Profile:** edit name and mobile, saved vehicles, install button, logout.
