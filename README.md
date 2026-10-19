# Recipe Secrets Restaurant Website

A five-page static website (Home, About, Specials, Reservation, Contact) in plain HTML, CSS and JavaScript.
No frameworks, no runtime dependencies, no backend. A small Node script assembles the pages.

> **All business details are placeholders** (address, phone, email, hours, dishes, prices). Replace them before launch.

## Requirements

- Node.js 18+ (only for building/testing; the output is plain static files)

## Install, develop, build

```bash
npm install          # installs puppeteer-core (tests only)
npm run dev          # build + serve dist/ at http://localhost:3000
npm run build        # writes the deployable site to dist/
npm run lint         # checks titles, meta tags, alt text, labels, internal links
npm test             # build + lint + headless-browser tests (needs Chrome or Edge)
```

`npm test` auto-detects Chrome/Edge; set `CHROME_PATH` if yours is elsewhere. Set `SHOTS=some/folder` to save screenshots of every page at mobile, tablet and desktop sizes.

## Project layout

```
src/
  pages/        one file per page (home, about, specials, reservation, contact, 404)
  partials/     layout.html (shared <head>); header/footer are built in scripts/build.js
  data/         site.json (business details), specials.json (menu specials), images.json (photos)
  assets/       css/styles.css, js/main.js, js/config.js, img/favicon.svg
scripts/        build.js, serve.js, lint.js, test.js
dist/           build output (generated; deploy this folder)
```

## Updating content

| To change | Edit |
|---|---|
| Address, phone, email, opening hours, map | `src/data/site.json` (set `mapQuery` to an address to show a Google map) |
| Specials, prices, categories, availability | `src/data/specials.json` (`image` is a key from `images.json`) |
| Photos | `src/data/images.json` (Unsplash photo id + alt text) |
| Page copy | `src/pages/*.html` (look for `[Placeholder ...]`) |
| Colours and fonts | CSS variables at the top of `src/assets/css/styles.css` |
| Domain used in canonical/Open Graph/sitemap | `url` in `src/data/site.json` |

Run `npm run build` after any change.

## Forms (contact and reservation)

Static hosting cannot receive form submissions, so the forms are validated in the browser and then handed off in one of two ways, configured in `src/assets/js/config.js`:

1. **Email fallback (default):** the visitor's email app opens with the message pre-filled. The page clearly says it has **not been sent yet** and a reservation is **not confirmed**. Set `fallbackEmail` to the real address.
2. **Form service:** set `forms.contact.endpoint` / `forms.reservation.endpoint` to a Formspree, Netlify Forms, Getform or booking-provider URL. Data is POSTed as JSON, and a success message is shown only if the service returns a 2xx response; otherwise the visitor gets an error and an email link.

Reservation dates in the past are blocked. Table availability cannot be checked on a static site, so submissions are always described as *requests*.

## Images

Photos are loaded from [Unsplash](https://unsplash.com/license) (free to use, attribution optional) with responsive `srcset`, lazy loading and a gradient fallback if one fails to load. All photo URLs were checked and are loaded without errors in the tests. To self-host, download the images into `src/assets/img/` and change `unsplash()` in `scripts/build.js`.

## Deployment (free hosting)

Deploy the contents of `dist/`.

- **Netlify:** build command `npm run build`, publish directory `dist` (or drag-and-drop the folder).
- **Cloudflare Pages:** build command `npm run build`, output directory `dist`.
- **GitHub Pages:** serve `dist/`. For a project site at `https://user.github.io/repo/`, build with the sub-path:
  `BASE_PATH=/repo npm run build` (PowerShell: `$env:BASE_PATH="/repo"; npm run build`).
  For a user/organisation site or custom domain, no `BASE_PATH` is needed.

## Accessibility and SEO

Semantic landmarks, skip link, labelled form fields with inline errors, keyboard-operable menu (Escape closes), visible focus styles, `prefers-reduced-motion` support, per-page title/description/Open Graph tags, favicon, `robots.txt` and `sitemap.xml`.
