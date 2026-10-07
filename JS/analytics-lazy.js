/* Load Google Analytics / Google Ads after the critical page render.
   Early user interaction triggers it immediately; otherwise it waits until the page is loaded and idle. */
(function () {
  var loaded = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function loadGoogleTag() {
    if (loaded) return;
    loaded = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-WH0SJJ476L';
    script.onload = function () {
      window.gtag('js', new Date());
      window.gtag('config', 'G-WH0SJJ476L');
      window.gtag('config', 'AW-11279363840');
    };
    document.head.appendChild(script);
  }

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
