// Form integration settings. Edit this file to connect a real service.
//
// Option A (default): leave endpoint empty. Submitting opens the visitor's email
//   app with the message pre-filled, addressed to `fallbackEmail`.
//   Nothing is sent until the visitor presses Send in their email app.
//
// Option B: set `endpoint` to a form service URL (e.g. Formspree, Netlify Forms,
//   Getform, a booking provider's webhook). Forms are POSTed as JSON and the
//   success message is shown only if the service answers with a 2xx status.
window.SITE_CONFIG = {
  fallbackEmail: 'hello@example.com', // PLACEHOLDER - replace with the real address
  forms: {
    contact: { endpoint: '' },
    reservation: { endpoint: '' },
  },
};
