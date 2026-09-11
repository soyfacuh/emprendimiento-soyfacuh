/* ============================================================
   mobile-navigation.js — ÚNICO script de navegación del sitio.
   Se usa en index.html, planes.html y faq.html.
   Incluye: link activo por página, scroll-spy, links de sección
   que apuntan a index.html cuando la sección no existe,
   scroll suave, y el menú hamburguesa mobile.
   No duplicar esta lógica dentro del HTML.
   ============================================================ */
(function () {
  function init() {
    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var currentPage = path.indexOf('planes') === 0 ? 'planes' : path.indexOf('faq') === 0 ? 'faq' : 'index';
    var navLinks = document.querySelectorAll('.nav-links a, .nav-cta, .mobile-menu a');

    navLinks.forEach(function (a) {
      var page = a.getAttribute('data-nav-page');
      if (page) a.classList.toggle('active', page === currentPage);
    });

    var sectionLinks = [];
    navLinks.forEach(function (a) {
      var sec = a.getAttribute('data-nav');
      if (!sec) return;
      var el = document.getElementById(sec);
      if (el) {
        a.setAttribute('href', '#' + sec);
        sectionLinks.push({ link: a, section: el });
      } else {
        a.setAttribute('href', 'index.html#' + sec);
      }
    });

    if (sectionLinks.length && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          sectionLinks.forEach(function (s) { s.link.classList.remove('active'); });
          sectionLinks.forEach(function (s) {
            if (s.section === entry.target) s.link.classList.add('active');
          });
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      sectionLinks.forEach(function (s) { observer.observe(s.section); });
    }

    /* ---- menú hamburguesa ---- */
    var menuButton = document.querySelector('.menu-toggle');
    var mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
      var setMenu = function (open) {
        menuButton.classList.toggle('is-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        mobileMenu.classList.toggle('is-open', open);
        mobileMenu.setAttribute('aria-hidden', String(!open));
        document.body.classList.toggle('menu-open', open);
      };
      var isOpen = function () { return mobileMenu.classList.contains('is-open'); };

      setMenu(false);

      menuButton.addEventListener('click', function (e) {
        e.stopPropagation();
        setMenu(!isOpen());
      });

      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { setMenu(false); });
      });

      document.addEventListener('click', function (e) {
        if (!isOpen()) return;
        if (mobileMenu.contains(e.target) || menuButton.contains(e.target)) return;
        setMenu(false);
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) { setMenu(false); menuButton.focus(); }
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth > 820 && isOpen()) setMenu(false);
      });
    }

    /* ---- scroll suave para anchors internos ---- */
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });

    /* ---- FAQ: abrir la pregunta que viene en el #hash ---- */
    function openFromHash() {
      var id = location.hash.slice(1);
      if (!id) return;
      var el = document.getElementById(id);
      if (el && el.tagName === 'DETAILS') el.open = true;
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
