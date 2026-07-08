(function () {
  'use strict';

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');

  function initDragScroll(track) {
    if (!track || window.matchMedia('(max-width: 768px)').matches) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let velX = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumId = null;
    let hasDragged = false;

    const stopMomentum = () => {
      if (momentumId) cancelAnimationFrame(momentumId);
      momentumId = null;
    };

    const endDrag = () => {
      isDown = false;
      track.classList.remove('is-dragging');
      setTimeout(() => { hasDragged = false; }, 80);
    };

    const momentum = () => {
      if (Math.abs(velX) < 0.5) {
        endDrag();
        return;
      }
      track.scrollLeft -= velX;
      velX *= 0.92;
      momentumId = requestAnimationFrame(momentum);
    };

    track.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      stopMomentum();
      track.classList.add('is-dragging');
      startX = e.pageX;
      scrollLeft = track.scrollLeft;
      lastX = e.pageX;
      lastTime = Date.now();
      velX = 0;
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      if (Math.abs(velX) > 1) momentum();
      else endDrag();
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX;
      if (Math.abs(x - startX) > 8) hasDragged = true;
      track.scrollLeft = scrollLeft - (x - startX);
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) velX = ((x - lastX) / dt) * 16;
      lastX = x;
      lastTime = now;
    });

    track.hasDragged = () => hasDragged;
  }

  function openLightbox(src, alt, caption) {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.removeAttribute('src');
  }

  function initClickableFrames(selector) {
    document.querySelectorAll(selector).forEach((frame) => {
      frame.addEventListener('click', () => {
        const img = frame.querySelector('img');
        if (!img) return;
        const caption = frame.querySelector('figcaption');
        openLightbox(
          img.currentSrc || img.src,
          img.alt,
          caption ? caption.textContent.trim() : ''
        );
      });
    });
  }

  function initReels() {
    document.querySelectorAll('.ui-reel').forEach((reel) => {
      const track = reel.querySelector('.ui-reel-track');
      const prevBtn = reel.querySelector('.reel-edge--prev');
      const nextBtn = reel.querySelector('.reel-edge--next');
      const scrollAmount = () => Math.min(track.clientWidth * 0.75, 420);

      initDragScroll(track);

      prevBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
      });

      nextBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
      });

      reel.querySelectorAll('.ui-frame').forEach((frame) => {
        frame.addEventListener('click', () => {
          if (typeof track.hasDragged === 'function' && track.hasDragged()) return;
          const img = frame.querySelector('img');
          if (!img) return;
          const label = frame.querySelector('.frame-label');
          openLightbox(img.currentSrc || img.src, img.alt, label ? label.textContent.trim() : '');
        });
      });
    });
  }

  function initLightbox() {
    if (!lightbox) return;
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }

  function initReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  function initPrototypeStage() {
    const stage = document.querySelector('[data-prototype-stage]');
    if (!stage) return;

    const dataEl = document.getElementById('itester-prototype-data');
    if (!dataEl) return;

    let screens;
    try {
      screens = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }

    let index = 0;
    const device = stage.querySelector('[data-prototype-device]');
    const img = stage.querySelector('[data-prototype-img]');
    const label = stage.querySelector('[data-prototype-label]');
    const counter = stage.querySelector('[data-prototype-counter]');
    const prevBtn = stage.querySelector('[data-prototype-prev]');
    const nextBtn = stage.querySelector('[data-prototype-next]');
    const thumbs = stage.querySelectorAll('[data-prototype-nav] [data-index]');

    const updateControls = () => {
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === screens.length - 1;
      if (counter) counter.textContent = `${index + 1} / ${screens.length}`;
      thumbs.forEach((thumb) => {
        thumb.classList.toggle('is-active', Number(thumb.dataset.index) === index);
      });
    };

    const showScreen = (nextIndex) => {
      if (nextIndex < 0 || nextIndex >= screens.length || nextIndex === index) return;
      index = nextIndex;
      const screen = screens[index];

      if (!device || !img || !label) return;

      device.classList.add('is-transitioning');

      window.setTimeout(() => {
        img.src = screen.src;
        img.alt = screen.alt;
        label.textContent = screen.label;
        updateControls();
        device.classList.remove('is-transitioning');
      }, 180);
    };

    prevBtn?.addEventListener('click', () => showScreen(index - 1));
    nextBtn?.addEventListener('click', () => showScreen(index + 1));

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => showScreen(Number(thumb.dataset.index)));
    });

    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') showScreen(index - 1);
      if (e.key === 'ArrowRight') showScreen(index + 1);
    });

    updateControls();
  }

  initReveal();
  initReels();
  initPrototypeStage();
  initClickableFrames('.flow-frame');
  initClickableFrames('.mockup-frame');
  initLightbox();
})();