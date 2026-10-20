# Recipe Secrets Restaurant Website

A five-page static website (Home, About, Specials, Reservation, Contact) in **pure HTML, CSS and JavaScript**.
No npm, no build step, no framework, no backend. What you see in the folder is exactly what gets deployed.

> **All business details are placeholders** (address, phone, email, hours, dishes, prices). Replace them before launch.

## Project layout

```
index.html                 Home
about/index.html           About
specials/index.html        Specials
reservation/index.html     Reservation
contact/index.html         Contact
404.html                   Not-found page
assets/css/styles.css      All styling (colours and fonts are CSS variables at the top)
assets/js/main.js          Mobile menu, scroll reveal, specials rendering, form validation
assets/js/specials-data.js Editable specials (name, price, category, availability, image)
assets/js/config.js        Form integration settings (email fallback / form service URL)
assets/img/favicon.svg     Favicon
vercel.json                Clean URLs for Vercel
robots.txt, sitemap.xml    SEO
```

## View it locally

Double-click **`index.html`** in this folder. It opens in your browser and the nav links work between pages. All links are relative, so no server, Node or Python is needed. (An internet connection is needed for the photos and Google Fonts.)

## Deploy to Vercel

1. Push this folder to GitHub (the repo root must contain `index.html`).
2. In Vercel choose **Add New > Project**, import the repo, and set **Framework Preset: Other**.
3. Leave the **Build Command** and **Output Directory** empty (there is nothing to build) and deploy.

Every `git push` to the main branch redeploys automatically. `vercel.json` enables clean URLs, so `about/index.html` is served as `/about/`.
The same folder also deploys as-is on Netlify, Cloudflare Pages and GitHub Pages (including GitHub Pages project sites, since all links are relative).

## Updating content

| To change | Edit |
|---|---|
| Specials, prices, categories, availability, photos | `assets/js/specials-data.js` (appears on Home and Specials) |
| Address, phone, email, opening hours | the text in each page's HTML, and the footer on every page (search for `[Street address]`, `hello@example.com`, `+00 0000 0000`, `[hh:mm`) |
| Map | replace the "Map coming soon" block in `contact/index.html` with a map `<iframe>` once the address is known |
| Page copy | the HTML files (look for `[Placeholder ...]`) |
| Colours and fonts | CSS variables at the top of `assets/css/styles.css` |
| Domain in canonical / Open Graph / sitemap | search for `https://example.com` and replace it |

Because the header and footer are repeated in each HTML file, change them in all five pages plus `404.html`.

## Forms (contact and reservation)

Static hosting cannot receive form submissions, so the forms are validated in the browser and then handed off in one of two ways, configured in `assets/js/config.js`:

1. **Email fallback (default):** the visitor's email app opens with the message pre-filled. The page clearly says it has **not been sent yet** and a reservation is **not confirmed**. Set `fallbackEmail` to the real address.
2. **Form service:** set `forms.contact.endpoint` / `forms.reservation.endpoint` to a Formspree, Getform or booking-provider URL. Data is POSTed as JSON, and a success message is shown only if the service returns a 2xx response; otherwise the visitor gets an error and an email link.

Past reservation dates are blocked. Table availability cannot be checked on a static site, so submissions are always described as *requests*.

## Images

Photos are loaded from [Unsplash](https://unsplash.com/license) (free to use, attribution optional) with responsive `srcset`, lazy loading and a gradient fallback if one fails to load. To self-host, download the photos into `assets/img/` and update the image URLs in the HTML and in `specials-data.js`/`main.js`.

## Accessibility and SEO

Semantic landmarks, skip link, labelled form fields with inline errors, keyboard-operable menu (Escape closes), visible focus styles, `prefers-reduced-motion` support, per-page title/description/Open Graph tags, favicon, `robots.txt` and `sitemap.xml`.
