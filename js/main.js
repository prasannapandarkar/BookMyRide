// RideEasy - static version (no backend). Data lives in the browser's localStorage.

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------
const VEHICLES = [{
        id: 1,
        specs: ["Petrol","Automatic","2 seats","~50 km/l"],
        image: "Honda_Activa_6G.jpg",
        name: "Honda Activa 6G",
        type: "Bike",
        price: 250,
        icon: "🛵",
        available: true,
        desc: "Fuel-efficient scooter, perfect for city rides. Automatic gear, comfy seat."
    },
    {
        id: 2,
        specs: ["Petrol","5-speed","2 seats","~35 km/l"],
        image: "Royal_Enfield_Classic_350_(2017_Model_Year).jpg",
        name: "Royal Enfield Classic 350",
        type: "Bike",
        price: 650,
        icon: "🏍️",
        available: true,
        desc: "Iconic cruiser bike with a thumping engine sound. Great for highway trips."
    },
    {
        id: 3,
        specs: ["Petrol","Automatic","2 seats","~50 km/l"],
        image: "TVS_Jupiter.jpg",
        name: "TVS Jupiter",
        type: "Bike",
        price: 200,
        icon: "🛵",
        available: false,
        desc: "Lightweight and easy to ride scooter, ideal for daily commuting."
    },
    {
        id: 4,
        specs: ["Petrol","6-speed","2 seats","~35 km/l"],
        image: "KTM_DUKE_200.jpg",
        name: "KTM Duke 200",
        type: "Bike",
        price: 800,
        icon: "🏍️",
        available: true,
        desc: "Sporty naked bike for riders who love speed and style."
    },
    {
        id: 5,
        specs: ["Petrol","Manual","5 seats","~22 km/l"],
        image: "Maruti_Suzuki_Swift_LXi.jpg",
        name: "Maruti Suzuki Swift",
        type: "Car",
        price: 1200,
        icon: "🚗",
        available: true,
        desc: "Compact hatchback with great mileage, ideal for city driving."
    },
    {
        id: 6,
        specs: ["Petrol","Manual","5 seats","~22 km/l"],
        image: "2022_Maruti_Suzuki_Baleno_Alpha_(India)_front_view.jpg",
        name: "Maruti Suzuki Baleno",
        type: "Car",
        price: 1400,
        icon: "🚗",
        available: true,
        desc: "Spacious premium hatchback with modern features and AC comfort."
    },
    {
        id: 7,
        specs: ["Petrol","Manual","5 seats","~16 km/l"],
        image: "2021_Hyundai_Creta_SX(O)_CRDi_(India)_front_view.jpg",
        name: "Hyundai Creta",
        type: "Car",
        price: 2200,
        icon: "🚙",
        available: false,
        desc: "SUV with a commanding driving position, perfect for family trips."
    },
    {
        id: 8,
        specs: ["Diesel","Manual","7 seats","~14 km/l"],
        image: "Toyota_Innova_Crysta.jpg",
        name: "Toyota Innova Crysta",
        type: "Car",
        price: 2800,
        icon: "🚐",
        available: true,
        desc: "Spacious 7-seater MPV, great for long family or group journeys."
    },
];

// Real vehicle photos from Wikimedia Commons (emoji icon is the fallback if one fails to load).
const vehicleImgUrl = (v, w) => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(v.image) + "?width=" + (w || 640);
function vehiclePhoto(v, w) {
    return `<img class="vehicle-photo" src="${vehicleImgUrl(v, w)}" alt="${esc(v.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'vehicle-emoji',textContent:'${v.icon}'}))">`;
}

// ---------------------------------------------------------------------------
// STORAGE HELPERS (localStorage wrapped in try/catch)
// ---------------------------------------------------------------------------
function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}

function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
async function hashPassword(pw) {
    try {
        if (window.crypto && crypto.subtle) {
            const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("rideeasy:" + pw));
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
        }
    } catch (e) { /* fall through */ }
    let h = 5381; // simple fallback if SubtleCrypto is unavailable
    for (const c of "rideeasy:" + pw) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
    return "f" + h.toString(16);
}
const getUsers = () => load("re_users", []);

function currentUser() {
    const email = load("re_session", null);
    return getUsers().find(u => u.email === email) || null;
}

function logout() {
    try { localStorage.removeItem("re_session"); } catch (e) {}
    flashNext("You have been logged out.", "success");
    location.href = "index.html";
}
// Pages that need login call this first. Returns the user, or redirects.
function requireLogin() {
    const u = currentUser();
    if (!u) {
        flashNext("Please log in to continue.", "error");
        const here = location.pathname.split("/").pop() || "index.html";
        location.href = "login.html?next=" + encodeURIComponent(here + location.search);
    }
    return u;
}

function safeNext(n) {
    return n && /^[A-Za-z0-9_\-]+\.html(\?[A-Za-z0-9_=&\-]*)?$/.test(n) ? n : "index.html";
}

// Flash messages that survive one page navigation
function flashNext(msg, cat) { try { sessionStorage.setItem("re_flash", JSON.stringify({ msg, cat })); } catch (e) {} }

function showFlash(msg, cat) {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "toast-wrap";
        wrap.setAttribute("aria-live", "polite");
        document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    el.className = "toast toast-" + (cat || "success");
    el.innerHTML = `<span class="toast-ico">${cat === "error" ? "!" : "✓"}</span><span></span>`;
    el.lastChild.textContent = msg;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add("in"));
    setTimeout(() => { el.classList.remove("in"); setTimeout(() => el.remove(), 300); }, 4200);
}

// ---------------------------------------------------------------------------
// SHARED LAYOUT (header + footer injected into every page)
// ---------------------------------------------------------------------------
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

const TABS = [
    ["index.html", "home", "Home", '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
    ["vehicles.html", "vehicles", "Vehicles", '<path d="M5 16l1.6-5.2A2 2 0 0 1 8.5 9.4h7a2 2 0 0 1 1.9 1.4L19 16v3h-2.5v-1.5h-9V19H5zM7.5 14.5h9"/><circle cx="8" cy="15" r=".6"/><circle cx="16" cy="15" r=".6"/>'],
    ["booking.html", "booking", "Book", '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 15h6"/>'],
    ["trips.html", "trips", "Trips", '<path d="M7 4h10a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1zM9 9h6M9 13h6"/>'],
    ["profile.html", "profile", "Profile", '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>'],
];

function renderLayout() {
    const page = document.body.dataset.page;
    const user = currentUser();
    const a = (href, label, key, cls = "") =>
        `<a href="${href}" class="${cls} ${page === key ? "active" : ""}">${label}</a>`;

    const authLinks = user ?
        `${a("profile.html", `<span class="nav-avatar">${esc(user.name.trim()[0] || "U").toUpperCase()}</span>${esc(user.name.split(" ")[0])}`, "profile", "nav-user")}` :
        `${a("login.html", "Login", "login")}<a href="login.html?tab=register" class="nav-signup">Sign Up</a>`;

    document.body.insertAdjacentHTML("afterbegin", `
<a class="skip-link" href="#main">Skip to content</a>
<div class="offline-bar hidden" id="offlineBar">You're offline — showing saved data.</div>
<header class="site-header">
  <div class="nav-wrap">
    <a href="index.html" class="logo"><span class="logo-mark">R</span><span class="logo-text">RideEasy</span></a>
    <nav class="main-nav" id="mainNav" aria-label="Main">
      ${a("index.html", "Home", "home")}
      ${a("vehicles.html", "Vehicles", "vehicles")}
      ${a("booking.html", "Book", "booking")}
      ${a("trips.html", "My Trips", "trips")}
      ${a("documents.html", "Documents", "documents")}
      ${authLinks}
    </nav>
    <a href="${user ? "profile.html" : "login.html"}" class="header-avatar" aria-label="${user ? "Profile" : "Login"}">${user ? esc(user.name.trim()[0] || "U").toUpperCase() : "→"}</a>
  </div>
  <div class="road-line" aria-hidden="true"></div>
</header>`);
    document.querySelector("main").id = "main";

    document.querySelector("main").insertAdjacentHTML("afterend", `
<footer class="site-footer">
  <div class="footer-wrap">
    <div class="footer-brand">
      <span class="logo-mark">R</span><span class="logo-text">RideEasy</span>
      <p>Rent your ride, your way. A college project demo — not a real commercial service.</p>
    </div>
    <div class="footer-links">
      <h4>Explore</h4>
      <a href="vehicles.html">Vehicles</a><a href="booking.html">Booking</a><a href="trips.html">My Trips</a>
      <a href="documents.html">Documents</a><a href="admin.html">Admin Dashboard</a>
    </div>
    <div class="footer-note">
      <h4>Project Note</h4>
      <p>Built with HTML, CSS &amp; JavaScript for a Computer Engineering mini project.</p>
    </div>
  </div>
  <div class="footer-bottom">© 2026 RideEasy Demo Project. All sample data is fictional.</div>
</footer>
<nav class="tab-bar" aria-label="Primary">
  ${TABS.map(([href, key, label, icon]) => `<a href="${href}" class="tab ${page === key ? "active" : ""}" ${page === key ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg><span>${label}</span></a>`).join("")}
</nav>`);

    try {
        const f = JSON.parse(sessionStorage.getItem("re_flash") || "null");
        if (f) {
            sessionStorage.removeItem("re_flash");
            showFlash(f.msg, f.cat);
        }
    } catch (e) {}
}

// Saved (favourite) vehicles, per browser
const getSaved = () => load("re_saved", []);
function toggleSaved(id) {
    const s = getSaved(), i = s.indexOf(id);
    if (i >= 0) s.splice(i, 1); else s.push(id);
    save("re_saved", s);
    return i < 0;
}

// PWA: service worker, install prompt, offline indicator
let deferredInstall = null;
function initPwa() {
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
        navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    window.addEventListener("beforeinstallprompt", e => {
        e.preventDefault();
        deferredInstall = e;
        const b = document.getElementById("installBtn");
        if (b) b.hidden = false;
    });
    const bar = document.getElementById("offlineBar");
    const sync = () => bar && bar.classList.toggle("hidden", navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    sync();
}

// ---------------------------------------------------------------------------
// VEHICLE CARD
// ---------------------------------------------------------------------------
function vehicleCard(v, withDetails) {
    const badge = v.available ? "badge-available" : "badge-unavailable";
    const saved = getSaved().includes(v.id);
    const book = v.available ?
        `<a href="booking.html?vehicle=${v.id}" class="btn btn-small btn-primary">Book Now</a>` :
        `<button class="btn btn-small btn-disabled" disabled>Unavailable</button>`;
    return `
<div class="vehicle-card" data-type="${v.type}" data-id="${v.id}">
  <div class="vehicle-image">${vehiclePhoto(v)}
    <span class="badge ${badge}">${v.available ? "Available" : "Unavailable"}</span>
    <button class="fav-btn ${saved ? "on" : ""}" data-fav="${v.id}" aria-label="${saved ? "Remove from saved" : "Save vehicle"}" aria-pressed="${saved}">${saved ? "♥" : "♡"}</button></div>
  <div class="vehicle-info">
    <span class="vehicle-type">${v.type}</span>
    <h3>${esc(v.name)}</h3>
    <div class="spec-chips">${v.specs.slice(1, 4).map(s => `<span>${esc(s)}</span>`).join("")}</div>
    ${withDetails ? `<p class="vehicle-desc">${esc(v.desc)}</p>` : ""}
    <p class="vehicle-price">₹${v.price} <span>/ day</span></p>
    <div class="vehicle-actions">
      ${withDetails
        ? `<button class="btn btn-small btn-outline js-view-details" data-id="${v.id}">Details</button>`
        : `<a href="vehicles.html" class="btn btn-small btn-outline">Details</a>`}
      ${book}
    </div>
  </div>
</div>`;
}

// Heart buttons work on any page that lists vehicle cards.
document.addEventListener("click", e => {
    const b = e.target.closest("[data-fav]");
    if (!b) return;
    e.preventDefault();
    const on = toggleSaved(+b.dataset.fav);
    b.classList.toggle("on", on);
    b.textContent = on ? "♥" : "♡";
    b.setAttribute("aria-pressed", on);
    showFlash(on ? "Saved to your favourites" : "Removed from favourites", "success");
    document.dispatchEvent(new CustomEvent("saved-changed"));
});

// ---------------------------------------------------------------------------
// PAGE LOGIC
// ---------------------------------------------------------------------------
const pages = {};

pages.home = () => {
  document.getElementById("featuredGrid").innerHTML = VEHICLES.filter(v => v.available).slice(0, 4).map(v => vehicleCard(v, false)).join("");
  const hv = document.getElementById("heroPhotos");
  hv.innerHTML = [[2, "hp-1"], [5, "hp-2"], [1, "hp-3"]].map(([id, cls]) => {
    const v = VEHICLES.find(x => x.id === id);
    return `<div class="hero-photo ${cls}">${vehiclePhoto(v, 600)}<span>${esc(v.name)}</span></div>`;
  }).join("");
  document.getElementById("quickBook").addEventListener("submit", e => {
    e.preventDefault();
    const loc = document.getElementById("quickLoc").value.trim();
    location.href = "booking.html" + (loc ? "?loc=" + encodeURIComponent(loc) : "");
  });
};

pages.vehicles = () => {
  const grid = document.getElementById("vehicleGrid");
  const q = document.getElementById("vSearch"), sort = document.getElementById("vSort");
  const count = document.getElementById("resultCount"), empty = document.getElementById("vEmpty");
  const btns = [...document.querySelectorAll("#vFilters .filter-btn")];
  const params = new URLSearchParams(location.search);
  let filter = params.get("saved") ? "Saved" : (["Bike", "Car"].includes(params.get("type")) ? params.get("type") : "All");

  const render = () => {
    btns.forEach(b => b.classList.toggle("active", b.dataset.filter === filter));
    const term = q.value.trim().toLowerCase();
    const saved = getSaved();
    let list = VEHICLES.filter(v =>
      (filter === "All" || v.type === filter || (filter === "Available" && v.available) || (filter === "Saved" && saved.includes(v.id))) &&
      (!term || (v.name + " " + v.type + " " + v.desc + " " + v.specs.join(" ")).toLowerCase().includes(term)));
    if (sort.value === "low") list.sort((a, b) => a.price - b.price);
    if (sort.value === "high") list.sort((a, b) => b.price - a.price);
    grid.innerHTML = list.map(v => vehicleCard(v, true)).join("");
    empty.classList.toggle("hidden", list.length > 0);
    count.textContent = list.length + (list.length === 1 ? " vehicle" : " vehicles");
  };
  btns.forEach(b => b.addEventListener("click", () => { filter = b.dataset.filter; render(); }));
  q.addEventListener("input", render);
  sort.addEventListener("change", render);
  document.getElementById("vReset").addEventListener("click", () => { q.value = ""; sort.value = "featured"; filter = "All"; render(); });
  document.addEventListener("saved-changed", () => { if (filter === "Saved") render(); });
  render();

  const modal = document.getElementById("detailsModal");
  const close = () => modal.classList.remove("open");
  grid.addEventListener("click", e => {
    const b = e.target.closest(".js-view-details");
    if (!b) return;
    const v = VEHICLES.find(x => x.id === +b.dataset.id);
    document.getElementById("modalIcon").innerHTML = vehiclePhoto(v, 900);
    document.getElementById("modalType").textContent = v.type;
    document.getElementById("modalName").textContent = v.name;
    document.getElementById("modalDesc").textContent = v.desc;
    document.getElementById("modalSpecs").innerHTML = v.specs.map(s => `<span>${esc(s)}</span>`).join("");
    document.getElementById("modalPrice").innerHTML = "₹" + v.price + " <span>/ day</span>";
    const bk = document.getElementById("modalBook");
    bk.href = v.available ? "booking.html?vehicle=" + v.id : "#";
    bk.textContent = v.available ? "Book Now" : "Unavailable";
    bk.classList.toggle("btn-disabled", !v.available);
    modal.classList.add("open");
  });
  document.getElementById("modalClose").addEventListener("click", close);
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
};

pages.login = () => {
  const params = new URLSearchParams(location.search);
  const next = safeNext(params.get("next"));
  if (currentUser()) { location.href = next; return; }

  const tabs = document.querySelectorAll(".auth-tab");
  const forms = { login: document.getElementById("loginForm"), register: document.getElementById("registerForm") };
  const show = name => {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
    forms.login.classList.toggle("hidden", name !== "login");
    forms.register.classList.toggle("hidden", name !== "register");
  };
  tabs.forEach(t => t.addEventListener("click", () => show(t.dataset.tab)));
  show(params.get("tab") === "register" ? "register" : "login");

  forms.login.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const hash = await hashPassword(document.getElementById("login-password").value);
    const user = getUsers().find(u => u.email === email && u.passwordHash === hash);
    if (!user) return showFlash("Invalid email or password.", "error");
    save("re_session", user.email);
    flashNext("Welcome back, " + user.name + "!", "success");
    location.href = next;
  });

  forms.register.addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const mobile = document.getElementById("reg-mobile").value.trim();
    const pw = document.getElementById("reg-password").value;
    const confirm = document.getElementById("reg-confirm").value;
    const errors = [];
    if (!name) errors.push("Full name is required.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push("Enter a valid email address.");
    if (!/^\d{10}$/.test(mobile)) errors.push("Enter a valid 10-digit mobile number.");
    if (pw.length < 6) errors.push("Password must be at least 6 characters.");
    if (pw !== confirm) errors.push("Passwords do not match.");
    const users = getUsers();
    if (users.some(u => u.email === email)) errors.push("An account with this email already exists. Please log in.");
    if (errors.length) return errors.forEach(m => showFlash(m, "error"));
    users.push({ name, email, mobile, passwordHash: await hashPassword(pw) });
    save("re_users", users);
    save("re_session", email);
    flashNext("Welcome to RideEasy, " + name + "! Your account has been created.", "success");
    location.href = next;
  });
};

pages.booking = () => {
  const user = requireLogin();
  if (!user) return;

  const form = document.getElementById("bookingForm");
  const vehicleSelect = document.getElementById("vehicle_id");
  const pickup = document.getElementById("pickup_date");
  const ret = document.getElementById("return_date");
  const mobile = document.getElementById("mobile");
  const mobileHint = document.getElementById("mobileHint");

  document.getElementById("name").value = user.name;
  mobile.value = user.mobile;

  vehicleSelect.innerHTML = '<option value="">-- Choose a vehicle --</option>' + VEHICLES.map(v =>
    `<option value="${v.id}" ${v.available ? "" : "disabled"}>${esc(v.name)} (${v.type}) - ₹${v.price}/day${v.available ? "" : " - Unavailable"}</option>`).join("");
  const pre = new URLSearchParams(location.search).get("vehicle");
  if (pre) vehicleSelect.value = pre;

  const today = new Date().toISOString().slice(0, 10);
  pickup.min = today; ret.min = today;

  const daysBetween = () => {
    if (!pickup.value || !ret.value || ret.value < pickup.value) return 0;
    return Math.max(Math.round((new Date(ret.value) - new Date(pickup.value)) / 86400000), 1);
  };
  const update = () => {
    const v = VEHICLES.find(x => x.id === +vehicleSelect.value);
    const days = daysBetween();
    document.getElementById("durationOut").textContent = days ? days + " day(s)" : "-- day(s)";
    const total = v ? days * v.price : 0;
    document.getElementById("costOut").textContent = "₹" + total;
    const sv = document.getElementById("selectedVehicle");
    sv.classList.toggle("hidden", !v);
    if (v) sv.innerHTML = `<div class="sv-photo">${vehiclePhoto(v, 400)}</div>
      <div class="sv-info"><span class="vehicle-type">${v.type}</span><h3>${esc(v.name)}</h3>
      <div class="spec-chips">${v.specs.map(s => `<span>${esc(s)}</span>`).join("")}</div>
      <p class="sv-price">${days ? `₹${v.price} × ${days} day${days > 1 ? "s" : ""} = <strong>₹${total}</strong>` : `₹${v.price} <span>/ day</span>`}</p></div>`;
    const paymentTotal = document.getElementById("paymentTotal");
    if (paymentTotal) paymentTotal.textContent = "₹" + total;
  };
  [vehicleSelect, pickup, ret].forEach(el => el.addEventListener("change", update));
  pickup.addEventListener("change", () => {
    ret.min = pickup.value || today;
    if (ret.value && ret.value < pickup.value) { ret.value = pickup.value; update(); }
  });
  const paymentRadios = [...document.querySelectorAll('input[name="paymentMethod"]')];
  const updatePaymentMethod = () => {
    const method = paymentRadios.find(el => el.checked)?.value || "UPI";
    document.getElementById("upiDetails").classList.toggle("hidden", method !== "UPI");
    document.getElementById("cardDetails").classList.toggle("hidden", method !== "Card");
    document.getElementById("pickupDetails").classList.toggle("hidden", method !== "Pay on pickup");
    document.querySelectorAll(".payment-option").forEach(el => el.classList.toggle("selected", el.querySelector("input").checked));
  };
  paymentRadios.forEach(el => el.addEventListener("change", updatePaymentMethod));
  updatePaymentMethod();
  update();

  // No fixed UPI ID: the user types it in every time.
  const upiInput = document.getElementById("upiIdInput");
  const upiError = document.getElementById("upiIdError");
  const UPI_RE = /^[A-Za-z0-9.\-_]{2,256}@[A-Za-z]{2,64}$/;
  const getUpiId = () => upiInput ? upiInput.value.trim() : "";
  const validUpi = () => UPI_RE.test(getUpiId());
  const MERCHANT_NAME = "RideEasy";
  const buildUpiParams = amount => {
    const p = { pa: getUpiId(), pn: MERCHANT_NAME, cu: "INR", tn: "RideEasy vehicle rental" };
    if (amount > 0) p.am = amount.toFixed(2);
    return new URLSearchParams(p);
  };

  // QR code (shown to desktop/PC users) — regenerated whenever the amount changes.
  const qrHost = document.getElementById("upiQr");
  const renderUpiQr = () => {
    if (!qrHost || !window.QRCode) return;
    const hint = document.getElementById("upiQrHint");
    if (!validUpi()) {
      qrHost.innerHTML = "";
      qrHost.classList.add("hidden");
      if (hint) hint.textContent = "Enter a valid UPI ID above (e.g. name@bank) to generate the payment QR code.";
      return;
    }
    qrHost.classList.remove("hidden");
    const v = VEHICLES.find(x => x.id === +vehicleSelect.value);
    const days = daysBetween();
    const amount = v && days ? days * v.price : 0;
    const qr = new window.QRCode(-1, 0);
    qr.addData("upi://pay?" + buildUpiParams(amount).toString());
    qr.make();
    const n = qr.getModuleCount(), size = 4;
    let rects = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) rects += `<rect x="${c + size}" y="${r + size}" width="1" height="1"/>`;
    const dim = n + size * 2;
    qrHost.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="img"><rect width="${dim}" height="${dim}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
    if (hint) hint.textContent = amount
      ? `Scan with any UPI app to pay ₹${amount} to ${getUpiId()}.`
      : "Scan with any UPI app (Google Pay, PhonePe, Paytm). Select a vehicle and dates to include the amount.";
  };
  [vehicleSelect, pickup, ret].forEach(el => el.addEventListener("change", renderUpiQr));
  if (upiInput) upiInput.addEventListener("input", () => {
    upiError.textContent = (getUpiId() && !validUpi()) ? "Enter a valid UPI ID like name@bank" : "";
    renderUpiQr();
  });
  renderUpiQr();

  const copyBtn = document.getElementById("copyUpiBtn");
  if (copyBtn) copyBtn.addEventListener("click", () => {
    if (!validUpi()) { showFlash("Enter a valid UPI ID first.", "error"); return; }
    const done = () => { copyBtn.textContent = "Copied!"; setTimeout(() => copyBtn.textContent = "Copy", 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(getUpiId()).then(done, done); else done();
  });

  // Open the selected UPI app with the booking amount prefilled (mobile).
  document.querySelectorAll("[data-upi-app]").forEach(button => {
    button.addEventListener("click", () => {
            const vehicle = VEHICLES.find(x => x.id === +vehicleSelect.value);
      const amount = vehicle ? daysBetween() * vehicle.price : 0;
      if (!paymentRadios.find(el => el.checked && el.value === "UPI")) {
        showFlash("Select UPI as your payment method first.", "error");
        return;
      }
      if (!validUpi()) {
        showFlash("Enter a valid UPI ID (e.g. name@bank) first.", "error");
        return;
      }
      if (!amount || !pickup.value || !ret.value || ret.value < pickup.value) {
        showFlash("Select a vehicle and valid rental dates to calculate the amount.", "error");
        return;
      }
      const params = buildUpiParams(amount);
      const upiUrl = "upi://pay?" + params.toString();
      const app = button.dataset.upiApp;
      const androidPackages = {
        gpay: "com.google.android.apps.nbu.paisa.user",
        phonepe: "com.phonepe.app",
        paytm: "net.one97.paytm"
      };
      // Android intent opens the chosen app; generic UPI URI lets the device choose an app.
      if (app !== "upi" && androidPackages[app]) {
        const query = params.toString();
        window.location.href = "intent://pay?" + query + "#Intent;scheme=upi;package=" + androidPackages[app] + ";end";
      } else {
        window.location.href = upiUrl;
      }
    });
  });

  // Google Maps: live preview of the pickup location (keyless embed + share links).
  const locInput = document.getElementById("location");
  const mapBox = document.getElementById("mapBox");
  const mapFrame = document.getElementById("mapFrame");
  const mapOpen = document.getElementById("mapOpenLink");
  const mapDir = document.getElementById("mapDirLink");
  let mapTimer;
  const showMap = () => {
    const q = locInput.value.trim();
    const on = q.length >= 3;
    [mapBox, mapOpen, mapDir].forEach(el => el.classList.toggle("hidden", !on));
    if (!on) { mapFrame.removeAttribute("src"); return; }
    const enc = encodeURIComponent(q);
    mapFrame.src = "https://www.google.com/maps?q=" + enc + "&output=embed";
    mapOpen.href = "https://www.google.com/maps/search/?api=1&query=" + enc;
    mapDir.href = "https://www.google.com/maps/dir/?api=1&destination=" + enc;
  };
  const preLoc = new URLSearchParams(location.search).get("loc");
  if (preLoc) { locInput.value = preLoc; showMap(); }
  locInput.addEventListener("input", () => { clearTimeout(mapTimer); mapTimer = setTimeout(showMap, 600); });
  document.getElementById("useMyLocation").addEventListener("click", () => {
    if (!navigator.geolocation) { showFlash("Location is not supported on this device.", "error"); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      locInput.value = pos.coords.latitude.toFixed(6) + "," + pos.coords.longitude.toFixed(6);
      showMap();
    }, () => showFlash("Couldn't get your location. Please type it instead.", "error"), { timeout: 10000 });
  });

  mobile.addEventListener("input", () => {
    mobile.value = mobile.value.replace(/\D/g, "").slice(0, 10);
    const ok = mobile.value.length === 10;
    mobileHint.textContent = ok ? "" : "Enter a 10-digit number";
    mobileHint.style.color = ok ? "" : "#c0392b";
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const v = VEHICLES.find(x => x.id === +vehicleSelect.value);
    const location_ = document.getElementById("location").value.trim();
    const name = document.getElementById("name").value.trim();
    const errors = [];
    if (!name) errors.push("Full name is required.");
    if (!/^\d{10}$/.test(mobile.value)) errors.push("Enter a valid 10-digit mobile number.");
    if (!v) errors.push("Please select a vehicle.");
    if (!pickup.value || !ret.value) errors.push("Pickup and return dates are required.");
    else if (ret.value < pickup.value) errors.push("Return date cannot be before pickup date.");
    if (!location_) errors.push("Pickup location is required.");
    if (paymentRadios.find(el => el.checked)?.value === "UPI" && !validUpi()) errors.push("Enter a valid UPI ID (e.g. name@bank).");
    if (errors.length) return errors.forEach(m => showFlash(m, "error"));

    const bookings = load("re_bookings", []);
    const days = daysBetween();
    const b = {
      id: bookings.length ? Math.max(...bookings.map(x => x.id)) + 1 : 1,
      userEmail: user.email, name, mobile: mobile.value, vehicle: v.name, vehicleId: v.id,
      createdAt: new Date().toISOString(),
      pickupDate: pickup.value, returnDate: ret.value, location: location_,
      days, totalCost: days * v.price, status: "Pending",
      paymentMethod: paymentRadios.find(el => el.checked)?.value || "UPI",
      paymentStatus: (paymentRadios.find(el => el.checked)?.value === "Pay on pickup") ? "Pay on pickup" : "Not processed (demo)",
    };
    bookings.push(b);
    save("re_bookings", bookings);

    document.getElementById("confirmationBox").innerHTML = `
      <div class="confirmation-icon">✅</div>
      <h2>Booking Received!</h2>
      <p>Thanks, ${esc(b.name)} — your booking request has been submitted.</p>
      <div class="confirmation-details">
        <div><span>Booking ID</span><strong>#${b.id}</strong></div>
        <div><span>Vehicle</span><strong>${esc(b.vehicle)}</strong></div>
        <div><span>Pickup Date</span><strong>${b.pickupDate}</strong></div>
        <div><span>Return Date</span><strong>${b.returnDate}</strong></div>
        <div><span>Duration</span><strong>${b.days} day(s)</strong></div>
        <div><span>Location</span><strong>${esc(b.location)}</strong></div>
        <div><span>Total Estimated Cost</span><strong>₹${b.totalCost}</strong></div>
        <div><span>Payment Method</span><strong>${esc(b.paymentMethod)}</strong></div>
        <div><span>Payment Status</span><strong>${esc(b.paymentStatus)}</strong></div>
        <div><span>Status</span><strong class="status-pending">${b.status}</strong></div>
      </div>
      <p class="payment-disclaimer">Demo checkout: no money was charged. Live payments require a payment gateway and server-side verification.</p>
      <div class="confirm-actions"><a href="trips.html" class="btn btn-primary">View My Trips</a><a href="booking.html" class="btn btn-outline">Make Another Booking</a></div>`;
    document.getElementById("confirmationBox").classList.remove("hidden");
    form.closest("section").classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

pages.documents = () => {
  const user = requireLogin();
  if (!user) return;
  const allowed = ["pdf", "jpg", "jpeg", "png"], maxMB = 5;
  const key = "re_docs_" + user.email;
  const docs = load(key, {});

  const setStatus = (type, text, cls) => {
    const el = document.getElementById(type + "-status");
    el.textContent = text; el.className = "status-tag " + cls;
  };
  // Restore earlier uploads
  Object.entries(docs).forEach(([type, d]) => {
    const fn = document.getElementById(type + "-filename");
    if (fn) { fn.textContent = d.filename; setStatus(type, "Pending Verification", "status-pending"); }
  });

  document.querySelectorAll(".doc-input").forEach(input => {
    input.addEventListener("change", () => {
      const type = input.dataset.type;
      const fn = document.getElementById(type + "-filename");
      const err = document.getElementById(type + "-error");
      const file = input.files[0];
      err.textContent = "";
      if (!file) return;
      const ext = file.name.split(".").pop().toLowerCase();
      const mb = file.size / 1048576;
      if (!allowed.includes(ext)) { err.textContent = "Invalid file type. Please upload PDF, JPG or PNG."; input.value = ""; return; }
      if (mb > maxMB) { err.textContent = `File too large (${mb.toFixed(1)}MB). Max ${maxMB}MB allowed.`; input.value = ""; return; }
      // Static demo: only the file name is remembered, the file itself is not uploaded anywhere.
      docs[type] = { filename: file.name, status: "Pending" };
      save(key, docs);
      fn.textContent = file.name;
      setStatus(type, "Pending Verification", "status-pending");
    });
  });
};

pages.admin = () => {
  if (!requireLogin()) return;
  const render = () => {
    const bookings = load("re_bookings", []);
    let pendingDocs = 0;
    getUsers().forEach(u => { pendingDocs += Object.keys(load("re_docs_" + u.email, {})).length; });
    document.getElementById("totalVehicles").textContent = VEHICLES.length;
    document.getElementById("totalBookings").textContent = bookings.length;
    document.getElementById("pendingDocs").textContent = pendingDocs;

    document.getElementById("vehicleRows").innerHTML = VEHICLES.map(v => `
      <tr><td><img class="vehicle-thumb" src="${vehicleImgUrl(v, 120)}" alt="" loading="lazy"></td><td>${esc(v.name)}</td><td>${v.type}</td><td>₹${v.price}</td>
      <td><span class="status-tag ${v.available ? "status-confirmed" : "status-unavailable"}">${v.available ? "Available" : "Unavailable"}</span></td></tr>`).join("");

    document.getElementById("bookingRows").innerHTML = bookings.length ? bookings.map(b => `
      <tr><td>#${b.id}</td>
      <td>${esc(b.name)}<br><small>${esc(b.mobile)}</small></td>
      <td>${esc(b.vehicle)}</td><td>${b.pickupDate} → ${b.returnDate}</td><td>₹${b.totalCost}</td>
      <td><span class="status-tag status-${b.status.toLowerCase()}">${b.status}</span></td>
      <td><button class="btn btn-small btn-outline js-status" data-id="${b.id}">Update Status</button></td></tr>`).join("")
      : '<tr><td colspan="7" class="empty-row">No bookings yet — submit one from the Booking page.</td></tr>';
  };
  document.getElementById("bookingRows").addEventListener("click", e => {
    const btn = e.target.closest(".js-status");
    if (!btn) return;
    const flow = { Pending: "Confirmed", Confirmed: "Completed", Completed: "Pending", Cancelled: "Pending" };
    const bookings = load("re_bookings", []);
    const b = bookings.find(x => x.id === +btn.dataset.id);
    if (b) { b.status = flow[b.status] || "Pending"; save("re_bookings", bookings); render(); }
  });
  render();
};

const fmtDate = s => new Date(s + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const todayStr = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

pages.trips = () => {
  const user = requireLogin();
  if (!user) return;
  const list = document.getElementById("tripList");
  const tabs = [...document.querySelectorAll("#tripTabs .filter-btn")];
  let tab = "upcoming";
  const mine = () => load("re_bookings", []).filter(b => b.userEmail === user.email).sort((a, b) => b.id - a.id);
  const vehicleOf = b => VEHICLES.find(v => v.id === b.vehicleId) || VEHICLES.find(v => v.name === b.vehicle);
  const bucket = b => b.status === "Cancelled" ? "cancelled" : (b.status === "Completed" || b.returnDate < todayStr()) ? "past" : "upcoming";

  const render = () => {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    const all = mine();
    tabs.forEach(t => { const n = all.filter(b => bucket(b) === t.dataset.tab).length; t.dataset.count = n; });
    const items = all.filter(b => bucket(b) === tab);
    if (!items.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">🧾</div><h3>No ${tab} trips</h3>
        <p>${tab === "upcoming" ? "Book a bike or car and it will show up here." : "Nothing to show yet."}</p>
        <a href="vehicles.html" class="btn btn-primary btn-small">Browse vehicles</a></div>`;
      return;
    }
    list.innerHTML = items.map(b => {
      const v = vehicleOf(b);
      const q = encodeURIComponent(b.location);
      const cancellable = tab === "upcoming";
      return `<article class="trip-card">
        <div class="trip-photo">${v ? vehiclePhoto(v, 400) : ""}</div>
        <div class="trip-body">
          <div class="trip-top"><h3>${esc(b.vehicle)}</h3><span class="status-tag status-${b.status.toLowerCase()}">${b.status}</span></div>
          <p class="trip-dates">${fmtDate(b.pickupDate)} → ${fmtDate(b.returnDate)} · ${b.days} day${b.days > 1 ? "s" : ""}</p>
          <p class="trip-loc">📍 ${esc(b.location)}</p>
          <p class="trip-meta">Booking #${b.id} · ${esc(b.paymentMethod)} · <strong>₹${b.totalCost}</strong></p>
          <div class="trip-actions">
            <a class="btn btn-small btn-outline" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${q}">Directions</a>
            ${v && tab !== "upcoming" ? `<a class="btn btn-small btn-primary" href="booking.html?vehicle=${v.id}">Book again</a>` : ""}
            ${cancellable ? `<button class="btn btn-small btn-danger js-cancel" data-id="${b.id}">Cancel</button>` : ""}
          </div>
        </div></article>`;
    }).join("");
  };
  tabs.forEach(t => t.addEventListener("click", () => { tab = t.dataset.tab; render(); }));
  list.addEventListener("click", e => {
    const btn = e.target.closest(".js-cancel");
    if (!btn) return;
    if (!confirm("Cancel this booking?")) return;
    const all = load("re_bookings", []);
    const b = all.find(x => x.id === +btn.dataset.id && x.userEmail === user.email);
    if (b) { b.status = "Cancelled"; save("re_bookings", all); showFlash("Booking #" + b.id + " cancelled.", "success"); render(); }
  });
  render();
};

pages.profile = () => {
  const user = requireLogin();
  if (!user) return;
  const bookings = load("re_bookings", []).filter(b => b.userEmail === user.email);
  document.getElementById("profileAvatar").textContent = (user.name.trim()[0] || "U").toUpperCase();
  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("statTrips").textContent = bookings.filter(b => b.status !== "Cancelled").length;
  document.getElementById("statUpcoming").textContent = bookings.filter(b => b.status !== "Cancelled" && b.status !== "Completed" && b.returnDate >= todayStr()).length;
  document.getElementById("statSaved").textContent = getSaved().length;
  const n = document.getElementById("pName"), m = document.getElementById("pMobile");
  n.value = user.name; m.value = user.mobile || "";
  m.addEventListener("input", () => { m.value = m.value.replace(/\D/g, "").slice(0, 10); });
  document.getElementById("profileForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!n.value.trim()) return showFlash("Name is required.", "error");
    if (!/^\d{10}$/.test(m.value)) return showFlash("Enter a valid 10-digit mobile number.", "error");
    const users = getUsers();
    const u = users.find(x => x.email === user.email);
    u.name = n.value.trim(); u.mobile = m.value;
    save("re_users", users);
    document.getElementById("profileName").textContent = u.name;
    document.getElementById("profileAvatar").textContent = u.name[0].toUpperCase();
    showFlash("Profile updated.", "success");
  });
  document.getElementById("profileLogout").addEventListener("click", logout);
  const ib = document.getElementById("installBtn");
  if (deferredInstall) ib.hidden = false;
  ib.addEventListener("click", async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null; ib.hidden = true;
  });
};

document.addEventListener("DOMContentLoaded", () => {
  renderLayout();
  initPwa();
  const init = pages[document.body.dataset.page];
  if (init) init();
});