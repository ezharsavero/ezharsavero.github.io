(function () {
  'use strict';

  var CONTACT_EMAIL = 'ezhar.savero6@gmail.com';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- Theme ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var navLinks = document.getElementById('nav-links');
  function closeMenu() {
    navLinks.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
  }
  menuBtn.addEventListener('click', function () {
    var open = navLinks.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  navLinks.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Scroll state: nav border, back-to-top, current section ---------- */
  var nav = document.querySelector('.nav');
  var toTop = document.getElementById('to-top');
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 8);
    toTop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var linkMap = {};
  navLinks.querySelectorAll('a').forEach(function (a) { linkMap[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(linkMap).forEach(function (k) { linkMap[k].classList.remove('is-current'); });
        if (linkMap[en.target.id]) linkMap[en.target.id].classList.add('is-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Typing role ---------- */
  var typedEl = document.getElementById('typed');
  var words = ['Red Hat OpenShift', 'Red Hat Enterprise Linux', 'Zimbra', 'Dell Server and Storage', 'Omnissa'];
  if (!reduceMotion && typedEl) {
    var wi = 0, ci = words[0].length, deleting = true;
    function tick() {
      var w = words[wi];
      if (deleting) {
        ci--;
        typedEl.textContent = w.slice(0, ci);
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; return setTimeout(tick, 300); }
        return setTimeout(tick, 35);
      }
      w = words[wi];
      ci++;
      typedEl.textContent = w.slice(0, ci);
      if (ci === w.length) { deleting = true; return setTimeout(tick, 2200); }
      setTimeout(tick, 70);
    }
    setTimeout(tick, 2400); // first word stays a moment before the loop starts
  }

  /* ---------- Rack boot sequence: the one orchestrated moment ---------- */
  var units = Array.prototype.slice.call(document.querySelectorAll('#rack .ru'));
  if (reduceMotion) {
    units.forEach(function (u) { u.classList.add('is-on'); });
  } else {
    units.forEach(function (u, i) {
      setTimeout(function () { u.classList.add('is-busy'); }, 400 + i * 140);
      setTimeout(function () { u.classList.remove('is-busy'); u.classList.add('is-on'); }, 400 + i * 140 + 260);
    });
    // after boot, one unit flickers amber now and then, like disk activity
    setTimeout(function idle() {
      var u = units[Math.floor(Math.random() * units.length)];
      u.classList.add('is-busy');
      setTimeout(function () { u.classList.remove('is-busy'); }, 180 + Math.random() * 220);
      setTimeout(idle, 900 + Math.random() * 1600);
    }, 400 + units.length * 140 + 800);
  }

  /* ---------- Project filter ---------- */
  var filters = document.querySelectorAll('.filter');
  var projects = document.querySelectorAll('.project');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      projects.forEach(function (p) {
        p.classList.toggle('is-hidden', f !== 'all' && p.getAttribute('data-vendor') !== f);
      });
    });
  });

  /* ---------- Contact form → email (FormSubmit) ---------- */
  var form = document.getElementById('contact-form');
  var statusEl = document.getElementById('form-status');
  var submitBtn = document.getElementById('f-submit');

  function setError(field, msg) {
    var wrap = field.closest('.field');
    var old = wrap.querySelector('.field-error');
    if (old) old.remove();
    wrap.classList.toggle('has-error', !!msg);
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) {
      var p = document.createElement('p');
      p.className = 'field-error';
      p.id = field.id + '-err';
      p.textContent = msg;
      wrap.appendChild(p);
      field.setAttribute('aria-describedby', p.id);
    } else {
      field.removeAttribute('aria-describedby');
    }
  }

  function validate() {
    var ok = true;
    var name = form.elements.name, email = form.elements.email, msg = form.elements.message;
    if (!name.value.trim()) { setError(name, 'Enter your name.'); ok = false; } else setError(name, '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError(email, 'Enter an email address like name@example.com.'); ok = false; } else setError(email, '');
    if (msg.value.trim().length < 5) { setError(msg, 'Write a short message so I know how to help.'); ok = false; } else setError(msg, '');
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.className = 'form-status';
    statusEl.textContent = '';
    if (!validate()) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }
    if (form.elements._honey.value) return; // bot

    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim() || '-',
      message: form.elements.message.value.trim(),
      _subject: 'Portfolio message from ' + form.elements.name.value.trim(),
      _replyto: form.elements.email.value.trim(),
      _template: 'table',
      _captcha: 'false'
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch('https://formsubmit.co/ajax/' + CONTACT_EMAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok || String(res.body.success) === 'false') throw new Error(res.body.message || 'Send failed');
        form.reset();
        statusEl.className = 'form-status ok';
        statusEl.textContent = 'Message sent. I usually reply within a day or two.';
      })
      .catch(function () {
        statusEl.className = 'form-status err';
        statusEl.innerHTML = 'The message didn’t go through. Try again, or email me directly at <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>.';
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send message';
      });
  });

  /* ---------- Small touches ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var baseTitle = document.title;
  document.addEventListener('visibilitychange', function () {
    document.title = document.hidden ? 'Still here when you’re back' : baseTitle;
  });
})();
