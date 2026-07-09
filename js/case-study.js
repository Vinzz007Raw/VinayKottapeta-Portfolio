(function () {
  'use strict';

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  let lightboxReturnFocus = null;

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const smoothScrollOptions = (top) => (
    prefersReducedMotion() ? { top } : { top, behavior: 'smooth' }
  );

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

  function getLightboxFocusables() {
    if (!lightbox) return [];
    return [...lightbox.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')];
  }

  function trapLightboxFocus(e) {
    if (!lightbox?.classList.contains('open') || e.key !== 'Tab') return;
    const focusables = getLightboxFocusables();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openLightbox(src, alt, caption) {
    if (!lightbox) return;
    lightboxReturnFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => lightboxClose?.focus());
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.removeAttribute('src');
    if (lightboxReturnFocus && typeof lightboxReturnFocus.focus === 'function') {
      lightboxReturnFocus.focus();
    }
    lightboxReturnFocus = null;
  }

  function activateEnlargeable(frame) {
    const img = frame.matches('img') ? frame : frame.querySelector('img');
    if (!img) return;
    const caption = frame.querySelector('figcaption, .frame-label');
    const label = frame.getAttribute('data-caption') || frame.getAttribute('aria-label');
    const captionText = caption ? caption.textContent.trim() : (label || img.alt || 'Enlarged image');
    openLightbox(img.currentSrc || img.src, img.alt, captionText);
  }

  function initClickableFrames(selector) {
    document.querySelectorAll(selector).forEach((frame) => {
      if (frame.dataset.enlargeableBound === 'true') return;
      frame.dataset.enlargeableBound = 'true';
      frame.classList.add('cs-enlargeable');
      if (!frame.hasAttribute('tabindex')) frame.setAttribute('tabindex', '0');
      if (!frame.getAttribute('role')) frame.setAttribute('role', 'button');

      const img = frame.matches('img') ? frame : frame.querySelector('img');
      const caption = frame.querySelector('figcaption, .frame-label');
      const label = frame.getAttribute('data-caption') || frame.getAttribute('aria-label');
      const captionText = caption ? caption.textContent.trim() : (label || (img ? img.alt : '') || 'View enlarged image');
      if (!frame.getAttribute('aria-label')) {
        frame.setAttribute('aria-label', `View enlarged image: ${captionText}`);
      }

      frame.addEventListener('click', () => activateEnlargeable(frame));
      frame.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateEnlargeable(frame);
        }
      });
    });
  }

  function initGalleryReel(reel) {
    const track = reel.querySelector('.ui-reel-track, .h-gallery__track');
    if (!track) return;

    const prevBtn = reel.querySelector('.reel-edge--prev');
    const nextBtn = reel.querySelector('.reel-edge--next');
    const scrollAmount = () => Math.min(track.clientWidth * 0.8, 520);

    initDragScroll(track);

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    reel.querySelectorAll('.ui-frame, .h-gallery-card').forEach((frame) => {
      if (frame.classList.contains('ui-frame--mac-scroll') || frame.classList.contains('ui-frame--phone-scroll')) return;
      frame.addEventListener('click', () => {
        if (typeof track.hasDragged === 'function' && track.hasDragged()) return;
        const img = frame.querySelector('img');
        if (!img) return;
        const label = frame.querySelector('.frame-label, figcaption');
        openLightbox(img.currentSrc || img.src, img.alt, label ? label.textContent.trim() : '');
      });
    });
  }

  function initMacScrollScreens() {
    document.querySelectorAll('[data-mac-scroll]').forEach((screen) => {
      const scrollport = screen.querySelector('.device-screen__scrollport');
      if (!scrollport) return;

      const markScrollState = () => {
        screen.classList.add('is-scrolling');
      };

      const checkFit = () => {
        if (scrollport.scrollHeight <= scrollport.clientHeight + 2) {
          screen.classList.add('is-fit');
        } else {
          screen.classList.remove('is-fit');
        }
      };

      const img = scrollport.querySelector('img');
      if (img) {
        if (img.complete) checkFit();
        else img.addEventListener('load', checkFit);
      }

      scrollport.addEventListener('scroll', markScrollState, { passive: true });
      screen.addEventListener('mousedown', (e) => e.stopPropagation());
      scrollport.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });

      screen.addEventListener('wheel', (e) => {
        const maxScroll = scrollport.scrollHeight - scrollport.clientHeight;
        if (maxScroll <= 0) return;

        const atTop = scrollport.scrollTop <= 0;
        const atBottom = scrollport.scrollTop >= maxScroll - 1;
        const scrollingDown = e.deltaY > 0;
        const scrollingUp = e.deltaY < 0;

        if ((scrollingDown && !atBottom) || (scrollingUp && !atTop)) {
          e.preventDefault();
          e.stopPropagation();
          scrollport.scrollTop += e.deltaY;
          markScrollState();
        }
      }, { passive: false });
    });
  }

  function initReels() {
    document.querySelectorAll('.ui-reel, .h-gallery').forEach(initGalleryReel);
  }

  function initLightbox() {
    if (!lightbox) return;
    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
      trapLightboxFocus(e);
    });
  }

  function initCaseStudyAccessibility() {
    const main = document.querySelector('.case-study-main');
    if (!main) return;

    if (!main.id) main.id = 'main-content';

    if (!document.querySelector('.skip-link')) {
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = `#${main.id}`;
      skip.textContent = 'Skip to case study content';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    document.querySelectorAll('.ui-frame').forEach((frame) => {
      if (frame.classList.contains('ui-frame--mac-scroll') || frame.classList.contains('ui-frame--phone-scroll')) return;
      if (frame.dataset.enlargeableBound === 'true') return;
      frame.classList.add('cs-enlargeable');
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('role', 'button');
      const label = frame.querySelector('.frame-label');
      const img = frame.querySelector('img');
      const name = label?.textContent.trim() || img?.alt || 'screen';
      frame.setAttribute('aria-label', `View enlarged image: ${name}`);
      frame.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (typeof frame.click === 'function') frame.click();
        }
      });
    });

    document.querySelectorAll('.reel-edge').forEach((btn) => {
      if (!btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', btn.classList.contains('reel-edge--prev') ? 'Previous screens' : 'Next screens');
      }
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

  function isStickyNavRail() {
    return window.matchMedia('(min-width: 1400px)').matches;
  }

  function getStickyNavOffset() {
    const letterbox = document.querySelector('.letterbox--top');
    const header = document.querySelector('.nav');
    const stickyNav = document.getElementById('cs-section-nav');
    const letterboxH = letterbox ? letterbox.offsetHeight : 0;
    const headerH = header ? header.offsetHeight : 64;
    const navH = (!isStickyNavRail() && stickyNav) ? stickyNav.offsetHeight : 0;
    return letterboxH + headerH + navH + 12;
  }

  function updateStickyNavLayout(nav) {
    const rail = isStickyNavRail();
    nav.classList.toggle('cs-sticky-nav--rail', rail);
    document.documentElement.style.setProperty(
      '--cs-sticky-nav-height',
      rail ? '0px' : `${nav.offsetHeight}px`
    );
  }

  function formatSectionLabel(section) {
    const inner = section.querySelector(':scope > .cs-section-inner');
    if (!inner) {
      return section.id.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }

    const labelEl = inner.querySelector(':scope > .cs-section-label, :scope > .bc-hero-copy .cs-section-label, :scope > .bc-hero-layout .cs-section-label');
    if (labelEl) {
      return labelEl.textContent.trim().replace(/^\d+\s*·\s*/, '');
    }

    const titleEl = inner.querySelector(':scope > .cs-section-title, :scope > .bc-hero-copy .cs-section-title, :scope > .bc-hero-layout .cs-section-title');
    if (titleEl) {
      const text = titleEl.textContent.trim();
      if (text.length <= 32) return text;
      const shortened = text.split('—')[0].trim();
      return shortened.length <= 32 ? shortened : `${shortened.slice(0, 29)}…`;
    }

    return section.id
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function initStickySectionNav() {
    const main = document.querySelector('.case-study-main');
    if (!main) return;

    const sections = [...main.querySelectorAll(':scope > section[id].cs-section')];
    if (sections.length < 2) return;

    const hero = main.querySelector(':scope > .cs-hero');
    const nav = document.createElement('nav');
    nav.className = 'cs-sticky-nav';
    nav.id = 'cs-section-nav';
    nav.setAttribute('aria-label', 'Case study sections');

    const label = document.createElement('span');
    label.className = 'cs-sticky-nav__label';
    label.textContent = 'On this page';

    const inner = document.createElement('div');
    inner.className = 'cs-sticky-nav__inner';

    const list = document.createElement('ul');
    list.className = 'cs-sticky-nav__list';
    list.setAttribute('role', 'list');

    const links = sections.map((section) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${section.id}`;
      link.textContent = formatSectionLabel(section);
      link.dataset.section = section.id;
      item.appendChild(link);
      list.appendChild(item);
      return link;
    });

    inner.appendChild(list);
    nav.appendChild(label);
    nav.appendChild(inner);

    if (hero && hero.nextElementSibling) {
      hero.parentNode.insertBefore(nav, hero.nextElementSibling);
    } else {
      main.insertBefore(nav, main.firstElementChild);
    }

    updateStickyNavLayout(nav);

    let scrollTicking = false;
    let activeId = '';

    const setActive = (id) => {
      if (!id || id === activeId) return;
      activeId = id;
      links.forEach((link) => {
        const isActive = link.dataset.section === id;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });

      const activeLink = links.find((link) => link.dataset.section === id);
      if (!activeLink) return;

      if (isStickyNavRail() && inner.scrollHeight > inner.clientHeight) {
        activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }

      if (inner.scrollWidth > inner.clientWidth) {
        const linkLeft = activeLink.offsetLeft;
        const linkRight = linkLeft + activeLink.offsetWidth;
        const viewLeft = inner.scrollLeft;
        const viewRight = viewLeft + inner.clientWidth;
        if (linkLeft < viewLeft + 24) {
          inner.scrollTo({ left: Math.max(0, linkLeft - 24), behavior: 'smooth' });
        } else if (linkRight > viewRight - 24) {
          inner.scrollTo({ left: linkRight - inner.clientWidth + 24, behavior: 'smooth' });
        }
      }
    };

    const resolveActiveSection = () => {
      const offset = getStickyNavOffset();
      let current = sections[0];

      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= offset) current = section;
      });

      setActive(current.id);
    };

    const scrollToSection = (section, updateHash = true) => {
      const top = section.getBoundingClientRect().top + window.scrollY - getStickyNavOffset();
      window.scrollTo(smoothScrollOptions(Math.max(0, top)));
      setActive(section.id);
      if (updateHash) history.replaceState(null, '', `#${section.id}`);
    };

    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = document.getElementById(link.dataset.section);
        if (section) scrollToSection(section);
      });
    });

    const updateNavVisibility = () => {
      if (!hero) {
        nav.classList.add('is-visible');
        return;
      }
      const headerBottom = (document.querySelector('.nav')?.getBoundingClientRect().bottom || 0);
      nav.classList.toggle('is-visible', hero.getBoundingClientRect().bottom <= headerBottom + 8);
    };

    const onScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        updateNavVisibility();
        resolveActiveSection();
        scrollTicking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      updateStickyNavLayout(nav);
      updateNavVisibility();
      resolveActiveSection();
    });

    updateNavVisibility();

    const initialHash = window.location.hash.slice(1);
    const initialSection = initialHash ? document.getElementById(initialHash) : null;
    if (initialSection && sections.includes(initialSection)) {
      window.setTimeout(() => scrollToSection(initialSection, false), 120);
    } else {
      resolveActiveSection();
    }
  }

  const CHAPTER_CHAIN = [
    {
      file: 'rivirtual.html',
      title: 'RiVirtual',
      tagline: 'Reimagining property across an intelligent PropTech ecosystem.',
      cover: '../assets/images/covers/rivirtual-cover.png',
      indexAnchor: 'chapter-rivirtual',
    },
    {
      file: 'loop.html',
      title: 'Loop Community',
      tagline: 'Smart living — visitors, NFC access, and security in one mobile app.',
      cover: '../assets/images/covers/loop-cover.png',
      indexAnchor: 'chapter-loop',
    },
    {
      file: 'itester.html',
      title: 'iTester',
      tagline: 'A QA talent marketplace built around trust and verification.',
      cover: '../assets/images/covers/itester-cover.png',
      indexAnchor: 'chapter-itester',
    },
    {
      file: 'goodreviews.html',
      title: 'GoodReviews',
      tagline: 'Reputation management scaled across 24 industry verticals.',
      cover: '../assets/images/covers/goodreviews-cover.png',
      indexAnchor: 'chapter-goodreviews',
    },
    {
      file: 'brochures.html',
      title: 'Brand Collateral',
      tagline: 'Print stories you can hold — four campaigns, three brands.',
      cover: '../assets/images/covers/brochures-cover.png',
      indexAnchor: 'chapter-brochures',
    },
  ];

  function initNextChapter() {
    const currentFile = window.location.pathname.split('/').pop() || 'rivirtual.html';
    const index = CHAPTER_CHAIN.findIndex((chapter) => chapter.file === currentFile);
    if (index === -1) return;

    const footer = document.querySelector('.case-study-footer');
    if (!footer) return;

    const section = document.createElement('section');
    section.className = 'cs-next-chapter reveal';
    section.setAttribute('aria-label', 'Next case study');

    const inner = document.createElement('div');
    inner.className = 'cs-next-chapter__inner';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'cs-next-chapter__eyebrow';
    eyebrow.textContent = 'Up next';

    const title = document.createElement('h2');
    title.className = 'cs-next-chapter__title';
    title.textContent = 'Continue the story';

    const current = CHAPTER_CHAIN[index];
    const back = document.createElement('a');
    back.className = 'cs-next-chapter__back';
    back.href = `../index.html#${current.indexAnchor}`;
    back.textContent = '← Back to the story';

    inner.appendChild(eyebrow);
    inner.appendChild(title);

    const next = CHAPTER_CHAIN[index + 1];
    if (next) {
      const desc = document.createElement('p');
      desc.className = 'cs-next-chapter__desc';
      desc.textContent = 'Another chapter in the portfolio — same craft, new product challenge.';

      const card = document.createElement('a');
      card.className = 'cs-next-chapter__card';
      card.href = next.file;
      card.innerHTML = `
        <div class="cs-next-chapter__thumb">
          <img src="${next.cover}" alt="" loading="lazy">
        </div>
        <div class="cs-next-chapter__copy">
          <strong>${next.title}</strong>
          <span>${next.tagline}</span>
        </div>
        <span class="cs-next-chapter__cta">Read case study
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </span>
      `;

      inner.appendChild(desc);
      inner.appendChild(card);
    } else {
      const desc = document.createElement('p');
      desc.className = 'cs-next-chapter__desc';
      desc.textContent = 'You have reached the final chapter. Return to the epilogue to get in touch.';

      const card = document.createElement('a');
      card.className = 'cs-next-chapter__card';
      card.href = '../index.html#epilogue';
      card.innerHTML = `
        <div class="cs-next-chapter__copy" style="grid-column: 1 / -1;">
          <strong>Epilogue</strong>
          <span>Your story could be the next chapter — open to freelance and full-time opportunities.</span>
        </div>
        <span class="cs-next-chapter__cta">Get in touch
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </span>
      `;

      inner.appendChild(desc);
      inner.appendChild(card);
    }

    inner.appendChild(back);
    section.appendChild(inner);
    footer.parentNode.insertBefore(section, footer);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(section);
  }

  function setBaSliderPosition(slider, percent) {
    const clip = slider.querySelector('.ba-slider__after-clip');
    const handle = slider.querySelector('.ba-slider__handle');
    if (!clip || !handle) return;
    const value = Math.max(4, Math.min(96, percent));
    clip.style.width = `${value}%`;
    handle.style.left = `${value}%`;
    handle.setAttribute('aria-valuenow', String(Math.round(value)));
  }

  function syncBaSliderImageWidth(slider) {
    const viewport = slider.querySelector('.ba-slider__viewport');
    const afterImg = slider.querySelector('.ba-slider__img--after');
    if (!viewport || !afterImg) return;
    afterImg.style.width = `${viewport.offsetWidth}px`;
  }

  function initBaSliders() {
    document.querySelectorAll('[data-ba-slider]').forEach((slider) => {
      const viewport = slider.querySelector('.ba-slider__viewport');
      const handle = slider.querySelector('.ba-slider__handle');
      if (!viewport || !handle) return;

      let dragging = false;

      const positionFromClientX = (clientX) => {
        const rect = viewport.getBoundingClientRect();
        const percent = ((clientX - rect.left) / rect.width) * 100;
        setBaSliderPosition(slider, percent);
      };

      const startDrag = () => { dragging = true; };

      const endDrag = () => { dragging = false; };

      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        startDrag();
      });

      handle.addEventListener('pointerup', endDrag);
      handle.addEventListener('pointercancel', endDrag);

      handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        positionFromClientX(e.clientX);
      });

      viewport.addEventListener('pointerdown', (e) => {
        if (e.target === handle || handle.contains(e.target)) return;
        positionFromClientX(e.clientX);
      });

      handle.addEventListener('keydown', (e) => {
        const current = Number(handle.getAttribute('aria-valuenow') || 50);
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setBaSliderPosition(slider, current - 5);
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setBaSliderPosition(slider, current + 5);
        }
      });

      const resize = () => syncBaSliderImageWidth(slider);
      window.addEventListener('resize', resize);
      const beforeImg = slider.querySelector('.ba-slider__img--before');
      if (beforeImg?.complete) resize();
      else beforeImg?.addEventListener('load', resize);

      setBaSliderPosition(slider, 50);
    });
  }

  function parseMetricValue(text) {
    const value = text.trim();
    const percentMatch = value.match(/^(\d+(?:\.\d+)?)%$/);
    if (percentMatch) return { end: Number(percentMatch[1]), suffix: '%', decimals: 0 };

    const plusMatch = value.match(/^(\d+(?:\.\d+)?)\+$/);
    if (plusMatch) return { end: Number(plusMatch[1]), suffix: '+', decimals: 0 };

    const plainNumber = value.match(/^(\d+(?:\.\d+)?)$/);
    if (plainNumber) return { end: Number(plainNumber[1]), suffix: '', decimals: 0 };

    return null;
  }

  function animateMetric(el, config, duration) {
    const startTime = performance.now();
    const start = 0;
    const { end, suffix, decimals } = config;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      const formatted = decimals > 0 ? current.toFixed(decimals) : String(Math.round(current));
      el.textContent = `${formatted}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  function initImpactMetrics() {
    document.querySelectorAll('.cs-outcomes-grid--impact').forEach((grid) => {
      if (grid.dataset.metricsBound === 'true') return;
      grid.dataset.metricsBound = 'true';

      const run = () => {
        grid.classList.add('is-animated');
        grid.querySelectorAll('.cs-outcome-card strong').forEach((el) => {
          const original = el.textContent.trim();
          const metric = parseMetricValue(original);
          if (!metric) return;
          if (prefersReducedMotion()) {
            el.textContent = original;
            return;
          }
          el.textContent = metric.suffix === '%' ? `0%` : metric.suffix === '+' ? '0+' : '0';
          animateMetric(el, metric, 1400);
        });
      };

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              run();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.35 }
      );
      observer.observe(grid);
    });
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
  initCaseStudyAccessibility();
  initStickySectionNav();
  initBaSliders();
  initImpactMetrics();
  initNextChapter();
  initReels();
  initMacScrollScreens();
  initPrototypeStage();
  initClickableFrames('.flow-frame');
  initClickableFrames('.mockup-frame');
  initClickableFrames('.ba-panel');
  initClickableFrames('.cs-feature-mockup');
  initClickableFrames('.wireframe-card');
  initClickableFrames('.flow-stack__item');
  initClickableFrames('.cs-blend-figure');
  initClickableFrames('.design-cs-visual__panel');
  initClickableFrames('.design-cs-visual__single');
  initClickableFrames('.design-process-progression__item');
  initClickableFrames('.device-showcase-card');

  initClickableFrames('.bc-showcase-card');
  initClickableFrames('.bc-hero-mockup');
  initClickableFrames('.bc-works__diagram');
  initClickableFrames('.bc-design-card');
  initLightbox();
})();