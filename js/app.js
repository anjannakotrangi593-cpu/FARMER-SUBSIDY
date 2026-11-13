const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---- storage (browser prototype; see README for the server version) ----
const getUsers = () => JSON.parse(localStorage.getItem("users") || "{}");
const saveUsers = (u) => localStorage.setItem("users", JSON.stringify(u));
const currentUser = () => {
  const m = sessionStorage.getItem("currentUser");
  return m ? getUsers()[m] : null;
};
async function hash(text) {
  if (!window.crypto || !crypto.subtle) return text;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---- helpers ----
const isEligible = (s, land) => land >= s.minLand && land <= s.maxLand;
const ICON = {
  "Income support and loan waiver": "\u{1F4B0}", "Insurance and loans": "\u{1F6E1}\uFE0F",
  "Drip irrigation and power": "\u{1F4A7}", "Seeds, soil and fertiliser": "\u{1F331}",
  "Farm machinery": "\u{1F69C}", "Horticulture and oil palm": "\u{1F34E}",
  "Livestock, dairy, fisheries and bees": "\u{1F404}", "Organic farming and training": "\u{1F33F}",
  "Markets and storage": "\u{1F9FA}" };
const icon = (c) => ICON[c] || "\u{1F33E}";
const BANDS = [["Marginal", "up to 2.5"], ["Small", "2.5 to 5"], ["Semi-medium", "5 to 10"],
               ["Medium", "10 to 25"], ["Large", "above 25"]];
function category(land) {
  if (land === 0) return "Landless";
  if (land <= 2.5) return "Marginal";
  if (land <= 5) return "Small";
  if (land <= 10) return "Semi-medium";
  if (land <= 25) return "Medium";
  return "Large";
}
function say(text, ok) {
  const m = $("#msg");
  m.textContent = text;
  m.className = ok ? "msg ok" : "msg err";
}

const page = document.body.dataset.page;
const user = currentUser();
if ($("#count")) $("#count").textContent = SCHEMES.length;

if (["dashboard", "scheme", "complaint"].includes(page) && !user) location.replace("login.html");
if (["login", "register", "forgot"].includes(page) && user) location.replace("dashboard.html");

const logout = $("#logout");
if (logout) logout.addEventListener("click", () => {
  sessionStorage.removeItem("currentUser");
  location.href = "login.html";
});

// ---- register ----
if (page === "register") {
  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#name").value.trim();
    const mobile = $("#mobile").value.trim();
    const land = parseFloat($("#land").value);
    const pass = $("#pass").value;
    const confirm = $("#confirm").value;

    if (!name) return say(T("Enter your name."));
    if (!/^[6-9]\d{9}$/.test(mobile)) return say(T("Enter a 10-digit mobile number starting with 6, 7, 8 or 9."));
    if (isNaN(land) || land < 0) return say(T("Enter your land area in acres. Enter 0 if you have no land."));
    if (pass.length < 6) return say(T("Password must have at least 6 characters."));
    if (pass !== confirm) return say(T("Password and confirm password do not match."));

    const users = getUsers();
    if (users[mobile]) return say(T("This mobile number is already registered. Please log in."));
    users[mobile] = { name, mobile, land, pass: await hash(pass) };
    saveUsers(users);
    say(T("Account created. Taking you to login..."), true);
    setTimeout(() => (location.href = "login.html"), 900);
  });
}

// ---- login ----
if (page === "login") {
  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const mobile = $("#mobile").value.trim();
    const u = getUsers()[mobile];
    if (!u || u.pass !== (await hash($("#pass").value)))
      return say(T("Mobile number or password is wrong. Check and try again."));
    sessionStorage.setItem("currentUser", mobile);
    location.href = "dashboard.html";
  });
}

// ---- forgot password ----
// Prototype check: mobile number + name + land area must match the account.
// A real system must send an OTP to the registered mobile number instead.
if (page === "forgot") {
  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const mobile = $("#mobile").value.trim();
    const name = $("#name").value.trim().toLowerCase();
    const land = parseFloat($("#land").value);
    const pass = $("#pass").value;
    const users = getUsers();
    const u = users[mobile];

    if (!u || u.name.toLowerCase() !== name || u.land !== land)
      return say(T("These details do not match any account."));
    if (pass.length < 6) return say(T("Password must have at least 6 characters."));
    if (pass !== $("#confirm").value) return say(T("Password and confirm password do not match."));

    u.pass = await hash(pass);
    saveUsers(users);
    say(T("Password changed. Taking you to login..."), true);
    setTimeout(() => (location.href = "login.html"), 900);
  });
}

// ---- dashboard ----
if (page === "dashboard") {
  const total = SCHEMES.length;
  const mine = SCHEMES.filter((s) => isEligible(s, user.land));
  let mode = "mine";
  $("#who").textContent = user.name;
  $("#summary").textContent = user.land === 0
    ? T("You have no land. Schemes that need no land are marked for you.")
    : F("{land} acres. {n} of {total} schemes match your land.", { land: user.land, n: mine.length, total });
  $("#scale").innerHTML = BANDS.map((b) =>
    '<li class="' + (b[0] === category(user.land) ? "on" : "") + '"><b>' + T(b[0]) + "</b><span>" +
    T(b[1]) + " " + T("ac") + "</span></li>").join("");
  $("#t-mine").textContent = T("For my land") + " (" + mine.length + ")";
  $("#t-all").textContent = T("All schemes") + " (" + total + ")";

  const row = (s, ok) =>
    '<a class="scheme' + (ok ? "" : " off") + '" href="scheme.html?id=' + s.id + '">' +
    '<span class="name">' + nm(s) + '<small class="tag">' + T(s.level) + "</small></span>" +
    '<span class="benefit">' + ben(s) + "</span>" +
    (ok ? "" : '<span class="why">' + T("Not matching your land area") + "</span>") + "</a>";

  function render() {
    const cats = [...new Set(SCHEMES.map((s) => s.category))];
    let html = "", chips = "";
    cats.forEach((c, i) => {
      const all = SCHEMES.filter((s) => s.category === c);
      const list = mode === "mine" ? all.filter((s) => isEligible(s, user.land)) : all;
      if (!list.length) return;
      chips += '<a href="#cat' + i + '">' + icon(c) + " " + T(c) + " (" + list.length + ")</a>";
      html += '<details class="cat" id="cat' + i + '" open><summary><span><i class="ico">' + icon(c) + '</i>' + T(c) + "</span><small>" + list.length +
        "</small></summary>" + list.map((s) => row(s, isEligible(s, user.land))).join("") + "</details>";
    });
    $("#chips").innerHTML = chips;
    $("#groups").innerHTML = html ||
      '<p class="empty">' + T("No scheme matches your land area. Open All schemes to see every scheme.") + "</p>";
  }
  render();

  document.querySelectorAll(".tab").forEach((btn) =>
    btn.addEventListener("click", () => {
      mode = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b === btn));
      render();
    }));
}

// ---- scheme details ----
const HOW = {
  office: "Take your documents to your Rythu Vedika or the Mandal / district officer of the concerned department. They will register your application.",
  bank: "Take your documents to your bank branch or PACS and ask for the loan application form.",
  portal: "Open the official website and use its farmer registration or apply option. A Common Service Centre or Mee-Seva centre can help you.",
};
if (page === "scheme") {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const s = SCHEMES.find((x) => x.id === id);
  const box = $("#detail");
  if (!s) {
    box.innerHTML = '<p class="empty">' + T("Scheme not found.") + "</p>";
  } else {
    document.title = s.name + " | Telangana Farmer Schemes";
    const ok = isEligible(s, user.land);
    box.innerHTML =
      "<h1>" + nm(s) + '<small class="tag">' + T(s.level) + "</small></h1>" +
      '<p class="status ' + (ok ? "yes" : "no") + '">' +
      F(ok ? "Matches your land area ({land} acres)." : "Does not match your land area ({land} acres).", { land: esc(user.land) }) + "</p>" +
      (LANG === "en" ? "<p>" + s.about + "</p>" : "") +
      "<h2>" + T("Benefit") + "</h2><p>" + ben(s) + "</p>" +
      "<h2>" + T("Application deadline / last date") + "</h2><p>" + T(SCHEME_DEADLINES[s.id]) + "</p>" +
      (s.note ? "<h2>" + T("Also check") + "</h2><p>" + s.note + "</p>" : "") +
      "<h2>" + T("How to apply") + "</h2><p>" + T(HOW[s.mode || "office"]) + "</p>" +
      "<h2>" + T("Documents you need") + "</h2><ul class='docs'>" + s.docs.map((d) => "<li>" + T(d) + "</li>").join("") + "</ul>" +
      '<a class="apply" href="' + s.link + '" target="_blank" rel="noopener">' + T("Apply on the official site") + "</a>" +
      (s.formLink ? '<a class="apply form" href="' + s.formLink + '" target="_blank" rel="noopener">' + T(s.formLabel) + "</a>" : "") +
      '<p class="fine">' + T("You apply on the government website. Details can change, so confirm them there or at your Rythu Vedika / Mandal agriculture office.") + "</p>" +
      '<p class="fine"><a href="complaint.html?scheme=' + s.id + '">' + T("Applied but did not get the money in time? Raise a complaint") + "</a></p>";
  }
}

// ---- complaints ----
const getComplaints = () => JSON.parse(localStorage.getItem("complaints") || "[]");
const COMPLAINT_TYPES = ["Money not received", "Less money received than promised",
  "Application status not updated", "Other"];

if (page === "complaint" && user) {
  const sel = $("#scheme");
  sel.innerHTML = '<option value="">' + T("Select scheme") + "</option>" +
    SCHEMES.map((s) => '<option value="' + s.id + '">' + nm(s) + "</option>").join("");
  const pre = new URLSearchParams(location.search).get("scheme");
  if (pre) sel.value = pre;
  $("#type").innerHTML = COMPLAINT_TYPES.map((t) => '<option value="' + t + '">' + T(t) + "</option>").join("");
  const today = new Date().toISOString().slice(0, 10);
  $("#appDate").max = today;
  const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  function showComplaints() {
    const mine = getComplaints().filter((c) => c.mobile === user.mobile).reverse();
    $("#my-list").innerHTML = mine.length
      ? mine.map((c) =>
          '<div class="complaint"><b>' + esc(c.id) + '</b><small class="tag">' + T(c.status) + "</small>" +
          "<p><strong>" + esc(c.schemeName) + "</strong> - " + T(c.type) + "</p>" +
          '<p class="fine">' + F("Applied on {date} ({n} days ago)", { date: esc(c.appDate), n: daysSince(c.appDate) }) +
          (c.appNo ? " - " + T("Application no:") + " " + esc(c.appNo) : "") + "</p>" +
          "<p>" + esc(c.details) + "</p>" +
          '<p class="fine">' + T("Raised on") + " " + new Date(c.createdOn).toLocaleDateString() + "</p></div>").join("")
      : '<p class="empty">' + T("You have not raised any complaint yet.") + "</p>";
  }
  showComplaints();

  $("#form").addEventListener("submit", (e) => {
    e.preventDefault();
    const s = SCHEMES.find((x) => x.id === Number(sel.value));
    const appDate = $("#appDate").value;
    const details = $("#details").value.trim();

    if (!s) return say(T("Select the scheme you applied for."));
    if (!appDate) return say(T("Enter the date you applied."));
    if (appDate > today) return say(T("The application date cannot be in the future."));
    if (details.length < 20) return say(T("Describe the problem in at least 20 characters."));

    const all = getComplaints();
    const id = "CMP-" + String(all.length + 1).padStart(4, "0");
    all.push({ id, mobile: user.mobile, name: user.name, schemeName: s.name,
      type: $("#type").value, appNo: $("#appNo").value.trim(), appDate, details,
      createdOn: new Date().toISOString(), status: "Submitted" });
    localStorage.setItem("complaints", JSON.stringify(all));
    $("#form").reset();
    say(F("Complaint submitted. Your complaint ID is {id}. Keep it for reference.", { id }), true);
    showComplaints();
  });
}
