(function () {
  'use strict';
  document.documentElement.classList.add('js');

  // ---- Mobile navigation ----
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  }

  // ---- Reveal on scroll ----
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }


  // ---- Specials (rendered from assets/js/specials-data.js) ----
  var data = window.SPECIALS;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var photo = function (id, w, h) { return 'https://images.unsplash.com/photo-' + encodeURIComponent(id) + '?auto=format&fit=crop&fm=jpg&q=70&w=' + w + '&h=' + h; };
  var cardHtml = function (s) {
    return '<article class="card" data-category="' + esc(s.category) + '">' +
      '<div class="card__media"><img src="' + photo(s.image, 800, 600) + '" srcset="' + photo(s.image, 400, 300) + ' 400w, ' + photo(s.image, 800, 600) + ' 800w" sizes="(min-width: 900px) 400px, 100vw" alt="' + esc(s.alt) + '" width="800" height="600" loading="lazy" decoding="async" data-fallback><span class="tag">' + esc(s.category) + '</span></div>' +
      '<div class="card__body"><div class="card__head"><h3>' + esc(s.name) + '</h3><span class="price" title="Sample price">' + esc(data.currency) + esc(s.price) + '</span></div>' +
      '<p>' + esc(s.description) + '</p><p class="card__avail">' + esc(s.availability) + '</p></div></article>';
  };
  document.querySelectorAll('[data-specials]').forEach(function (grid) {
    if (!data || !data.items) { grid.innerHTML = '<p class="empty">Specials are unavailable right now.</p>'; return; }
    var list = grid.getAttribute('data-specials') === 'featured'
      ? data.items.filter(function (i) { return (data.featured || []).indexOf(i.name) !== -1; })
      : data.items;
    grid.innerHTML = list.map(cardHtml).join('');
  });
  var chipBox = document.querySelector('.chips');
  if (chipBox && data && data.items) {
    var cats = ['All'];
    data.items.forEach(function (i) { if (cats.indexOf(i.category) === -1) cats.push(i.category); });
    chipBox.innerHTML = cats.map(function (c, i) { return '<button type="button" class="chip' + (i === 0 ? ' is-on' : '') + '" data-filter="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' + esc(c) + '</button>'; }).join('');
  }

  // ---- Image fallback ----
  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    var fail = function () {
      img.removeAttribute('srcset');
      img.style.visibility = 'hidden';
      if (img.parentElement) img.parentElement.style.background = 'linear-gradient(135deg,#3f4a2c,#b8934a)';
    };
    img.addEventListener('error', fail, { once: true });
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
  });

  // ---- Specials filter ----
  var chips = document.querySelectorAll('.chip[data-filter]');
  if (chips.length) {
    var cards = document.querySelectorAll('#specials-grid .card');
    var empty = document.getElementById('specials-empty');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { var on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
        var shown = 0;
        cards.forEach(function (card) {
          var show = f === 'All' || card.getAttribute('data-category') === f;
          card.hidden = !show;
          if (show) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  }

  // ---- Forms ----
  var cfg = window.SITE_CONFIG || { forms: {} };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^\+?[0-9][0-9\s().-]{5,18}$/;

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var todayStr = function () { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };

  function validate(form) {
    var type = form.getAttribute('data-form');
    var errors = {};
    var v = function (n) { return (form.elements[n].value || '').trim(); };
    if (!v('name')) errors.name = 'Please enter your name.';
    if (!v('email')) errors.email = 'Please enter your email address.';
    else if (!EMAIL_RE.test(v('email'))) errors.email = 'Please enter a valid email address.';
    if (type === 'contact') {
      if (!v('subject')) errors.subject = 'Please enter a subject.';
      if (!v('message')) errors.message = 'Please enter a message.';
      else if (v('message').length < 10) errors.message = 'Please write at least 10 characters.';
    } else {
      if (!v('phone')) errors.phone = 'Please enter a phone number.';
      else if (!PHONE_RE.test(v('phone'))) errors.phone = 'Please enter a valid phone number.';
      if (!v('date')) errors.date = 'Please choose a date.';
      else if (v('date') < todayStr()) errors.date = 'Please choose today or a future date.';
      if (!v('time')) errors.time = 'Please choose a time.';
      else if (v('date') === todayStr()) {
        var n = new Date();
        if (v('time') <= pad(n.getHours()) + ':' + pad(n.getMinutes())) errors.time = 'Please choose a time later today.';
      }
      if (!v('guests')) errors.guests = 'Please select the number of guests.';
    }
    return errors;
  }

  function showErrors(form, errors) {
    var first = null;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      var msg = form.querySelector('#' + el.id + '-err');
      if (!msg) return;
      var bad = Object.prototype.hasOwnProperty.call(errors, el.name);
      msg.textContent = bad ? errors[el.name] : '';
      if (bad) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', msg.id); if (!first) first = el; }
      else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
    });
    return first;
  }

  function status(form, kind, html) {
    var box = form.querySelector('.status');
    box.className = 'status is-shown status--' + kind;
    box.innerHTML = html;
    box.focus();
  }
  var escapeHtml = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function mailtoFor(form, data) {
    var type = form.getAttribute('data-form');
    var lines = type === 'contact'
      ? [data.message, '', 'From: ' + data.name + ' <' + data.email + '>']
      : ['Reservation request', '', 'Name: ' + data.name, 'Email: ' + data.email, 'Phone: ' + data.phone, 'Date: ' + data.date, 'Time: ' + data.time, 'Guests: ' + data.guests, 'Requests: ' + (data.notes || 'None')];
    var subject = type === 'contact' ? data.subject : 'Reservation request - ' + data.date + ' (' + data.guests + ' guests)';
    return 'mailto:' + encodeURIComponent(cfg.fallbackEmail || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var type = form.getAttribute('data-form');
    var dateInput = form.elements.date;
    if (dateInput) dateInput.min = todayStr();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errors = validate(form);
      var first = showErrors(form, errors);
      if (first) {
        status(form, 'err', 'Please fix the highlighted fields and try again.');
        first.focus();
        return;
      }
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) { if (el.name) data[el.name] = el.value.trim(); });
      var endpoint = cfg.forms && cfg.forms[type] && cfg.forms[type].endpoint;

      if (endpoint) {
        var btn = form.querySelector('button[type=submit]');
        btn.disabled = true;
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            form.reset();
            status(form, 'ok', type === 'contact'
              ? 'Thank you. Your message has been submitted.'
              : 'Thank you. Your reservation request has been submitted. <strong>It is not a confirmed booking</strong> until the restaurant contacts you.');
          })
          .catch(function () {
            status(form, 'err', 'Sorry, we could not send this right now. <a href="' + mailtoFor(form, data) + '">Send it by email instead</a>.');
          })
          .then(function () { btn.disabled = false; });
        return;
      }

      // Email fallback: nothing is sent until the visitor sends it from their email app.
      var href = mailtoFor(form, data);
      status(form, 'info', 'Almost done. Your email app should open with your ' + (type === 'contact' ? 'message' : 'reservation request') +
        ' ready to send. <strong>It has not been sent yet</strong>, so please press Send there. ' +
        (type === 'reservation' ? 'Your table is not confirmed until the restaurant replies. ' : '') +
        'If nothing opens, <a href="' + href + '">click here</a> or email ' + escapeHtml(cfg.fallbackEmail || '') + ' directly.');
      window.location.href = href;
    });
  });
})();
