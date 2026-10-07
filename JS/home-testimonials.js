/* Deferred + lazy homepage testimonial carousel. */
(function () {
  var carousel = document.querySelector('.testimonials-carousel');
  if (!carousel) return;
  var started = false;

  function initCarousel() {
    if (started) return;
    started = true;

    var track = document.getElementById('testi-track');
    var dotsWrap = document.getElementById('testi-dots');
    var prev = document.getElementById('testi-prev');
    var next = document.getElementById('testi-next');
    if (!track || !dotsWrap || !prev || !next) return;
    var items = Array.prototype.slice.call(track.children);
    if (!items.length) return;

    var index = 0;
    var autoplay = null;
    var visible = false;
    var hovering = false;
    var stepSize = 0;
    var AUTOPLAY_MS = 5500;

    function perView() {
      var w = window.innerWidth;
      if (w <= 700) return 1;
      if (w <= 1024) return 2;
      return 3;
    }
    function maxIndex() { return Math.max(0, items.length - perView()); }

    function measure() {
      var cs = window.getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
      stepSize = items[0].getBoundingClientRect().width + gap;
    }

    function syncDots() {
      var children = dotsWrap.children;
      for (var i = 0; i < children.length; i++) children[i].classList.toggle('active', i === index);
    }

    function apply() {
      track.style.transform = 'translate3d(' + (-index * stepSize) + 'px, 0, 0)';
      syncDots();
    }

    function goTo(i) {
      var m = maxIndex();
      if (i < 0) i = m;
      if (i > m) i = 0;
      index = i;
      apply();
    }

    function buildDots() {
      dotsWrap.innerHTML = '';
      var count = maxIndex() + 1;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < count; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'carousel-dot';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Ir a la reseña ' + (i + 1));
        b.dataset.index = String(i);
        frag.appendChild(b);
      }
      dotsWrap.appendChild(frag);
      syncDots();
    }

    function stopAuto() { if (autoplay) { clearInterval(autoplay); autoplay = null; } }
    function startAuto() {
      stopAuto();
      if (!visible || hovering) return;
      autoplay = setInterval(function () { goTo(index + 1); }, AUTOPLAY_MS);
    }
    function restartAuto() { stopAuto(); startAuto(); }

    dotsWrap.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.carousel-dot') : null;
      if (!b) return;
      goTo(parseInt(b.dataset.index, 10));
      restartAuto();
    });
    prev.addEventListener('click', function () { goTo(index - 1); restartAuto(); });
    next.addEventListener('click', function () { goTo(index + 1); restartAuto(); });

    var sx = 0, dx = 0, dragging = false;
    track.addEventListener('touchstart', function (e) {
      dragging = true; sx = e.touches[0].clientX; dx = 0; stopAuto();
    }, { passive: true });
    track.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      dx = e.touches[0].clientX - sx;
    }, { passive: true });
    track.addEventListener('touchend', function () {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
      startAuto();
    }, { passive: true });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        measure();
        if (index > maxIndex()) index = maxIndex();
        buildDots();
        apply();
      }, 150);
    }, { passive: true });

    carousel.addEventListener('mouseenter', function () { hovering = true; stopAuto(); });
    carousel.addEventListener('mouseleave', function () { hovering = false; startAuto(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) startAuto(); else stopAuto();
      }, { threshold: 0.15 }).observe(carousel);
    } else {
      visible = true;
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAuto(); else startAuto();
    });

    measure();
    buildDots();
    apply();
    startAuto();
  }

  /* Testimonials are well below the fold, so avoid layout reads during first paint. */
  if ('IntersectionObserver' in window) {
    var starter = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      starter.disconnect();
      initCarousel();
    }, { rootMargin: '500px 0px', threshold: 0 });
    starter.observe(carousel);
  } else {
    window.addEventListener('load', initCarousel, { once: true });
  }
})();
