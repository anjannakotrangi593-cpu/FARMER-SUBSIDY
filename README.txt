TELANGANA SUBSIDY SCHEMES FOR FARMING - Website
================================================

HOW TO RUN
  1. Unzip the folder.
  2. Double-click index.html (opens in Chrome, Edge or Firefox).
     Or run:  python -m http.server 8000   and open http://localhost:8000

HOW IT WORKS
  - Register : name, mobile number, land area (acres), password, confirm password.
  - Login    : mobile number + password.
  - Dashboard: "Eligible for you" (schemes matching your land area) and "All schemes".
  - Scheme page: description, benefit, documents needed and the official Apply link.

LANGUAGES (English / Telugu)
  - The button at the top switches the whole site. js/lang.js holds the Telugu text:
    UI words, scheme names, benefits, categories and document names.
    The 'about' and 'also check' notes of each scheme are still English only.

FORGOT PASSWORD
  - forgot.html: the farmer enters mobile number, name and land area as given at
    registration, then sets a new password. This is only a prototype check. A real
    system must verify the farmer with an OTP sent to the registered mobile number.

HOW TO APPLY
  - Every scheme has a mode in js/data.js: office, bank or portal. The scheme page
    shows matching steps. Direct form links (formLink) exist only for KCC and micro
    irrigation. Add more with formLabel and formLink when you find verified links.

SCHEME CATEGORIES
  - Each scheme in js/data.js has a category (for example "Drip irrigation and power").
    The dashboard groups schemes by category. A new category appears automatically when
    you use a new category name in data.js.

COMPLAINT BOX
  - complaint.html: a farmer who applied but did not get the subsidy money in the
    expected time can raise a complaint (scheme, problem type, date applied, application
    number, details). A complaint ID is given and the farmer can see all own complaints.
  - The prototype saves complaints in the browser only; they are not sent to any
    government office. For real use, store them in the complaints table (schema.sql)
    on a server and let the department update the status.

PICTURES
  - images/field.svg (login pages) and images/banner.svg (dashboard top) are drawn
    illustrations. Replace them with your own photos by using the same file names or
    by changing the url(...) in css/style.css. Category icons are emoji set in js/app.js.

FILES
  complaint.html     - raise and view complaints
  index.html, register.html, login.html, dashboard.html, scheme.html
  css/style.css      - design
  js/lang.js         - Telugu text and language button
  js/data.js         - ALL SCHEME DATA (edit here to add/change schemes, land limits,
                       documents and official links)
  js/app.js          - registration, login, dashboard, eligibility logic
  database/schema.sql- MySQL tables for the server version (users, schemes, documents)

ELIGIBILITY RULE
  A scheme is eligible when  minLand <= farmer's land <= maxLand  (set in js/data.js).

IMPORTANT NOTES
  - PMFBY (central crop insurance) is NOT included: news reports (July 2026) say
    Telangana has not implemented it. Add it back in js/data.js if that changes.
  - Landless farm workers can register with 0 acres and will see schemes that need no land.
  - The Telangana sheep distribution scheme is not included: it is limited to specific
    communities and no new phase is confirmed. Add it in js/data.js if needed.
  - This is a working prototype. Accounts are saved in the browser (localStorage), so
    they exist only on that device. For real use, move registration/login to a server
    with the MySQL tables in database/schema.sql and store only hashed passwords.
  - Scheme details are sample data. Verify every scheme, land limit, document list and
    link on the official website before using the site with real farmers.
