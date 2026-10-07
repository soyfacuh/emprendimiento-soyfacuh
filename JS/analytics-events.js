/*
  SoyFacuh GA4 event layer.
  Tracks behaviour and conversions without sending form text, names, emails or other PII.
  Events are queued through gtag and work with the lazy Analytics loader.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var path = location.pathname || '/';
  var lang = (root.lang || 'es').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
  var sentSections = new Set();
  var sentScroll = new Set();
  var startedForms = new WeakSet();
  var lastLeadAt = 0;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function cleanText(value, max) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max || 100);
  }

  function pageGroup() {
    var p = path.toLowerCase();
    if (p === '/' || p === '/index.html' || p === '/en/' || p === '/en/index.html') return 'home';
    if (p.indexOf('/informatica/') !== -1) return 'informatica';
    if (p.indexOf('/marketing/') !== -1) return 'marketing';
    if (p.indexOf('/planes/') !== -1) return 'planes';
    if (p.indexOf('/faq/') !== -1) return 'faq';
    if (p.indexOf('/recursos/') !== -1) return 'recursos';
    if (p.indexOf('/sobre-mi/') !== -1 || p.indexOf('/en/about/') !== -1) return 'sobre_mi';
    return 'other';
  }

  function deviceGroup() {
    var w = window.innerWidth || document.documentElement.clientWidth || 0;
    if (w <= 820) return 'mobile';
    if (w <= 1100) return 'tablet';
    return 'desktop';
  }

  function storageGet(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) {}
  }

  function getAttribution() {
    var key = 'soyfacuh-attribution-v1';
    var cached = storageGet(key);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }

    var q = new URLSearchParams(location.search || '');
    var source = cleanText(q.get('utm_source'), 60);
    var medium = cleanText(q.get('utm_medium'), 60);
    var campaign = cleanText(q.get('utm_campaign'), 100);
    var content = cleanText(q.get('utm_content'), 100);
    var term = cleanText(q.get('utm_term'), 100);

    if (!source) {
      try {
        var ref = document.referrer ? new URL(document.referrer) : null;
        source = ref && ref.hostname && ref.hostname !== location.hostname ? ref.hostname.replace(/^www\./, '') : 'direct';
        medium = source === 'direct' ? 'none' : 'referral';
      } catch (e) {
        source = 'direct'; medium = 'none';
      }
    }

    var data = {
      sf_source: source || 'direct',
      sf_medium: medium || 'none',
      sf_campaign: campaign || '(not set)',
      sf_content: content || '(not set)',
      sf_term: term || '(not set)',
      landing_page: path
    };
    storageSet(key, JSON.stringify(data));
    return data;
  }

  var attribution = getAttribution();

  function baseParams(extra) {
    var base = {
      page_group: pageGroup(),
      site_language: lang,
      device_group: deviceGroup(),
      page_path_clean: path,
      sf_source: attribution.sf_source,
      sf_medium: attribution.sf_medium,
      sf_campaign: attribution.sf_campaign,
      landing_page: attribution.landing_page
    };
    if (extra) Object.keys(extra).forEach(function (k) {
      if (extra[k] !== undefined && extra[k] !== null && extra[k] !== '') base[k] = extra[k];
    });
    return base;
  }

  function track(name, params, important) {
    if (window.SoyfacuhAnalyticsDisabled) return;
    if (important && window.SoyfacuhAnalyticsLoad) window.SoyfacuhAnalyticsLoad();
    window.gtag('event', name, baseParams(params));
  }

  window.SoyfacuhTrack = track;

  function linkLocation(el) {
    if (el.closest('nav')) return 'header';
    if (el.closest('.mobile-menu')) return 'mobile_menu';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.project-contact')) return 'contact';
    if (el.closest('.hero, header')) return 'hero';
    if (el.closest('.plan-card')) return 'plan_card';
    if (el.closest('.work-card')) return 'portfolio';
    if (el.closest('.resource-article, .quick-grid')) return 'resources';
    return 'content';
  }

  function itemName(el) {
    var card = el.closest('.work-card, .marketing-case, .plan-card, .resource-article, article');
    if (!card) return '';
    var h = card.querySelector('h1,h2,h3,h4,strong');
    return cleanText(h && h.textContent, 90);
  }

  function targetPath(a) {
    try {
      var u = new URL(a.href, location.href);
      return u.hostname === location.hostname ? u.pathname + u.hash : u.hostname;
    } catch (e) { return ''; }
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('a,button') : null;
    if (!target) return;

    var label = cleanText(target.getAttribute('aria-label') || target.textContent, 100);
    var locationName = linkLocation(target);

    if (target.matches('.settings-toggle')) {
      track('settings_open', { click_location: locationName });
      return;
    }
    if (target.matches('.menu-toggle')) {
      if (target.getAttribute('aria-expanded') !== 'true') track('mobile_menu_open', { click_location: 'header' });
      return;
    }

    var theme = target.getAttribute('data-theme-option') || target.getAttribute('data-welcome-theme');
    if (theme) {
      track('theme_change', { theme: theme, click_location: target.hasAttribute('data-welcome-theme') ? 'welcome' : 'settings' });
      return;
    }

    var language = target.getAttribute('data-lang-option') || target.getAttribute('data-welcome-lang');
    if (language) {
      track('language_change', { language_selected: language, click_location: target.hasAttribute('data-welcome-lang') ? 'welcome' : 'settings' }, true);
      return;
    }

    if (target.matches('.nav-cta, .mobile-menu-cta') || (target.tagName === 'A' && /#(contacto|contact)$/.test(target.getAttribute('href') || '') && /empezar|start|proyecto|project|consulta|contact/i.test(label))) {
      track('cta_start_click', { cta_label: label, click_location: locationName, target_path: targetPath(target) });
    }

    if (target.tagName !== 'A') return;
    var href = target.getAttribute('href') || '';

    if (/wa\.me|api\.whatsapp\.com/i.test(href)) {
      track('whatsapp_click', {
        click_location: target.classList.contains('wa-float') ? 'floating_button' : locationName,
        item_name: itemName(target),
        link_label: label
      }, true);
      return;
    }

    if (/^mailto:/i.test(href)) {
      track('email_click', { click_location: locationName }, true);
      return;
    }

    if (target.closest('.work-card, .marketing-case') && /^https?:/i.test(href)) {
      track('project_click', {
        project_name: itemName(target) || label,
        click_location: locationName,
        destination_host: (function () { try { return new URL(target.href).hostname; } catch (e) { return ''; } })()
      });
      return;
    }

    var social = '';
    if (/instagram\.com/i.test(href)) social = 'instagram';
    else if (/linkedin\.com/i.test(href)) social = 'linkedin';
    else if (/github\.com/i.test(href) && !/soyfacuh\.github\.io/i.test(href)) social = 'github';
    if (social) {
      track('social_click', { social_network: social, click_location: locationName, item_name: itemName(target) });
      return;
    }

    if (pageGroup() === 'recursos' && (href.charAt(0) === '#' || target.closest('.quick-grid, .resource-article'))) {
      track('resource_interaction', { resource_name: itemName(target) || label, target_path: targetPath(target) });
    }

    try {
      var internalUrl = new URL(target.href, location.href);
      if (internalUrl.hostname === location.hostname && (target.closest('nav') || target.closest('.mobile-menu') || target.closest('footer'))) {
        track('navigation_click', { click_location: locationName, link_label: label, target_path: internalUrl.pathname + internalUrl.hash });
      }
    } catch (e) {}

    try {
      var u = new URL(target.href, location.href);
      if (/^https?:$/.test(u.protocol) && u.hostname !== location.hostname) {
        track('outbound_click', { destination_host: u.hostname.replace(/^www\./, ''), link_label: label, click_location: locationName });
      }
    } catch (e) {}
  }, true);

  document.addEventListener('focusin', function (event) {
    var form = event.target && event.target.closest ? event.target.closest('.project-form') : null;
    if (!form || startedForms.has(form)) return;
    if (!event.target.matches('input,select,textarea')) return;
    startedForms.add(form);
    track('lead_form_start', { form_location: pageGroup() });
  }, true);

  document.addEventListener('change', function (event) {
    var select = event.target;
    if (!select || !select.matches('.project-form select[name="service"]')) return;
    track('lead_service_select', { service_type: cleanText(select.value, 80), form_location: pageGroup() });
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || !form.matches || !form.matches('.project-form')) return;
    if (!form.checkValidity()) return;

    var now = Date.now();
    if (now - lastLeadAt < 1500) return;
    lastLeadAt = now;

    var service = form.querySelector('select[name="service"]');
    var serviceType = cleanText(service && service.value, 80) || 'not_selected';
    var data = { service_type: serviceType, form_location: pageGroup(), contact_method: 'whatsapp' };

    track('lead_form_submit', data, true);
    track('generate_lead', data, true);
    track('whatsapp_click', { click_location: 'form_submit', item_name: serviceType }, true);
  }, true);

  document.addEventListener('toggle', function (event) {
    var details = event.target;
    if (!details || details.tagName !== 'DETAILS' || !details.open || !details.classList.contains('faq-item')) return;
    var summary = details.querySelector('summary');
    track('faq_open', { faq_question: cleanText(summary && summary.textContent, 120) });
  }, true);

  function initScrollDepth() {
    function onScroll() {
      var doc = document.documentElement;
      var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      var pct = Math.round((window.scrollY / max) * 100);
      [25, 50, 75, 90].forEach(function (threshold) {
        if (pct >= threshold && !sentScroll.has(threshold)) {
          sentScroll.add(threshold);
          track('scroll_depth', { percent_scrolled: threshold });
        }
      });
      if (sentScroll.size === 4) window.removeEventListener('scroll', onScroll);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initSectionViews() {
    if (!('IntersectionObserver' in window)) return;
    var candidates = document.querySelectorAll('main section[id], main header[id], .project-contact[id], section#servicios, section#services, section#proceso, section#process');
    if (!candidates.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var id = el.id || 'unnamed';
        if (sentSections.has(id)) return;
        sentSections.add(id);
        var heading = el.querySelector('h1,h2,h3');
        track('section_view', { section_id: cleanText(id, 60), section_name: cleanText(heading && heading.textContent, 100) });
        observer.unobserve(el);
      });
    }, { threshold: 0.35 });
    candidates.forEach(function (el) { observer.observe(el); });
  }

  function initEngagementTimer() {
    window.setTimeout(function () {
      if (document.visibilityState === 'visible') track('engaged_30s', { engagement_seconds: 30 });
    }, 30000);
  }

  function init() {
    initScrollDepth();
    initSectionViews();
    initEngagementTimer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
