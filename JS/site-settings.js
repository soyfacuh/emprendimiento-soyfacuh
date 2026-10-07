/* Site preferences, first-visit helper and WhatsApp project form. */
(function () {
  var THEME_KEY = 'soyfacuh-theme';
  var LANG_KEY = 'soyfacuh-lang';
  var WELCOME_KEY = 'soyfacuh-preferences-seen';
  var root = document.documentElement;

  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

  function getPreferredTheme() {
    var saved = safeGet(THEME_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    theme = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    safeSet(THEME_KEY, theme);
    document.querySelectorAll('[data-theme-option], [data-welcome-theme]').forEach(function (button) {
      var value = button.getAttribute('data-theme-option') || button.getAttribute('data-welcome-theme');
      var active = value === theme;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#171411' : '#fbf6ee');
  }

  function initSettings() {
    setTheme(getPreferredTheme());

    var holder = document.querySelector('.site-settings');
    var toggle = document.querySelector('.settings-toggle');
    var panel = document.querySelector('.settings-panel');
    if (holder && toggle && panel) {
      function setOpen(open) {
        holder.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        panel.setAttribute('aria-hidden', String(!open));
      }
      toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        setOpen(!holder.classList.contains('is-open'));
      });
      document.addEventListener('click', function (event) {
        if (!holder.contains(event.target)) setOpen(false);
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && holder.classList.contains('is-open')) {
          setOpen(false); toggle.focus();
        }
      });
    }

    document.querySelectorAll('[data-theme-option]').forEach(function (button) {
      button.addEventListener('click', function () { setTheme(button.getAttribute('data-theme-option')); });
    });

    var currentLang = root.lang && root.lang.toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
    safeSet(LANG_KEY, currentLang);
    document.querySelectorAll('[data-lang-option]').forEach(function (link) {
      var active = link.getAttribute('data-lang-option') === currentLang;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      link.addEventListener('click', function () {
        safeSet(LANG_KEY, link.getAttribute('data-lang-option'));
        safeSet(WELCOME_KEY, '1');
      });
    });
  }

  function initNameValidation(form) {
    var input = form.querySelector('[data-name-input]');
    if (!input) return;
    var lang = (root.lang || 'es').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
    var message = lang === 'en'
      ? 'Please use letters, spaces, apostrophes, periods or hyphens only.'
      : 'Usá solo letras, espacios, apóstrofes, puntos o guiones.';

    input.addEventListener('input', function () {
      // Names should never accept digits. Keep international letters and normal name punctuation.
      input.value = input.value.replace(/[^\p{L}\p{M}' .-]/gu, '');
      input.setCustomValidity('');
    });
    input.addEventListener('invalid', function () {
      if (input.validity.patternMismatch) input.setCustomValidity(message);
    });
  }

  function initWhatsAppForms() {
    document.querySelectorAll('.project-form').forEach(function (form) {
      initNameValidation(form);
      var status = form.querySelector('.form-status');
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;
        var data = new FormData(form);
        var lang = (root.lang || 'es').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
        var name = (data.get('name') || '').toString().trim();
        var service = (data.get('service') || '').toString().trim();
        var message = (data.get('message') || '').toString().trim();
        var lines = lang === 'en' ? [
          'Hi Facu! I am contacting you from soyfacuh.com.', '',
          'Name: ' + name,
          'I need: ' + service,
          'Project: ' + message
        ] : [
          '¡Hola Facu! Te contacto desde soyfacuh.com.', '',
          'Nombre: ' + name,
          'Necesito: ' + service,
          'Proyecto: ' + message
        ];
        var url = 'https://wa.me/541158570938?text=' + encodeURIComponent(lines.join('\n'));
        if (status) status.textContent = lang === 'en' ? 'Opening WhatsApp with your message…' : 'Abriendo WhatsApp con tu mensaje…';
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    });
  }

  function initWelcome() {
    if (safeGet(WELCOME_KEY) === '1') return;
    var lang = (root.lang || 'es').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
    var esLink = document.querySelector('[data-lang-option="es"]');
    var enLink = document.querySelector('[data-lang-option="en"]');
    if (!esLink || !enLink) return;

    var box = document.createElement('aside');
    box.className = 'preference-welcome';
    box.setAttribute('aria-label', lang === 'en' ? 'Language and appearance preferences' : 'Preferencias de idioma y apariencia');
    box.innerHTML = lang === 'en'
      ? '<button class="welcome-close" type="button" aria-label="Close">×</button><strong>Make the site yours.</strong><p>Choose the language and appearance that feel most comfortable.</p><div class="welcome-row"><span>Language</span><div><a data-welcome-lang="es">Español</a><a data-welcome-lang="en">English</a></div></div><div class="welcome-row"><span>Appearance</span><div><button data-welcome-theme="light" type="button">☀ Light</button><button data-welcome-theme="dark" type="button">◐ Dark</button></div></div><button class="welcome-done" type="button">Continue</button>'
      : '<button class="welcome-close" type="button" aria-label="Cerrar">×</button><strong>Hacé la web más cómoda para vos.</strong><p>Elegí el idioma y la apariencia que preferís.</p><div class="welcome-row"><span>Idioma</span><div><a data-welcome-lang="es">Español</a><a data-welcome-lang="en">English</a></div></div><div class="welcome-row"><span>Apariencia</span><div><button data-welcome-theme="light" type="button">☀ Claro</button><button data-welcome-theme="dark" type="button">◐ Oscuro</button></div></div><button class="welcome-done" type="button">Continuar</button>';

    box.querySelector('[data-welcome-lang="es"]').setAttribute('href', esLink.getAttribute('href'));
    box.querySelector('[data-welcome-lang="en"]').setAttribute('href', enLink.getAttribute('href'));
    box.querySelector('[data-welcome-lang="' + lang + '"]').classList.add('active');

    function closeWelcome() {
      safeSet(WELCOME_KEY, '1');
      box.classList.add('is-leaving');
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 180);
    }
    box.querySelector('.welcome-close').addEventListener('click', closeWelcome);
    box.querySelector('.welcome-done').addEventListener('click', closeWelcome);
    box.querySelectorAll('[data-welcome-lang]').forEach(function (a) {
      a.addEventListener('click', function () { safeSet(WELCOME_KEY, '1'); });
    });
    box.querySelectorAll('[data-welcome-theme]').forEach(function (button) {
      button.addEventListener('click', function () { setTheme(button.getAttribute('data-welcome-theme')); });
    });
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('is-visible'); setTheme(getPreferredTheme()); });
  }

  function start() {
    initSettings();
    initWhatsAppForms();
    window.setTimeout(initWelcome, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
