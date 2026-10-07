/* Load Google Analytics / Google Ads after the critical page render.
   Config is queued immediately so custom events can safely queue before the library loads. */
(function () {
  var loaded = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // Queue configuration before any behavioural events. No network request happens here.
  var search = location.search || '';
  var debugMode = /(?:^|[?&])debug_analytics=1(?:&|$)/.test(search);
  try {
    if (/(?:^|[?&])analytics_internal=1(?:&|$)/.test(search)) localStorage.setItem('soyfacuh-analytics-internal', '1');
    if (/(?:^|[?&])analytics_internal=0(?:&|$)/.test(search)) localStorage.removeItem('soyfacuh-analytics-internal');
  } catch (e) {}
  var internalDisabled = false;
  try { internalDisabled = localStorage.getItem('soyfacuh-analytics-internal') === '1' && !debugMode; } catch (e) {}
  window.SoyfacuhAnalyticsDisabled = internalDisabled;

  window.gtag('js', new Date());
  window.gtag('config', 'G-WH0SJJ476L', debugMode ? { debug_mode: true } : {});
  window.gtag('config', 'AW-11279363840');

  function loadGoogleTag() {
    if (loaded || internalDisabled) return;
    loaded = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-WH0SJJ476L';
    document.head.appendChild(script);
  }

  // Expose a safe loader for high-intent events such as leads and WhatsApp clicks.
  window.SoyfacuhAnalyticsLoad = loadGoogleTag;

  ['pointerdown', 'touchstart', 'keydown'].forEach(function (eventName) {
    window.addEventListener(eventName, loadGoogleTag, { once: true, passive: eventName !== 'keydown' });
  });

  window.addEventListener('load', function () {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadGoogleTag, { timeout: 2500 });
    } else {
      setTimeout(loadGoogleTag, 2200);
    }
  }, { once: true });
})();
