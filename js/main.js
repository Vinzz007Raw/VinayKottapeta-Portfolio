(function () {
  'use strict';

  const nav = document.getElementById('nav');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const progressBar = document.getElementById('progress-bar');
  const processModal = document.getElementById('process-modal');
  const processModalContent = document.getElementById('process-modal-content');
  const openingBackdrop = document.querySelector('.opening-backdrop');

  const processData = {
    discover: {
      num: 'Step 01',
      title: 'Discover',
      body: 'Every product story starts with listening. I run stakeholder interviews, map competitive landscapes, and define the real problem before a single wireframe exists.',
      items: [
        'Stakeholder interviews & requirement gathering',
        'Competitive analysis & market research',
        'Problem definition & user research synthesis',
        'Business requirements documentation'
      ],
      jump: { label: 'See it in RiVirtual →', target: '#chapter-rivirtual' }
    },
    architect: {
      num: 'Step 02',
      title: 'Architect',
      body: 'Once the problem is clear, I build the blueprint. PRDs, information architecture, user flows, and journey maps become the storyboard for everything that follows.',
      items: [
        'PRD creation & feature planning',
        'Information architecture & sitemap design',
        'User flows & journey mapping',
        'Product architecture & workflow design'
      ],
      jump: { label: 'See it in Loop →', target: '#chapter-loop' }
    },
    design: {
      num: 'Step 03',
      title: 'Design',
      body: 'Wireframes evolve into design systems. Systems become screens. Screens become experiences — responsive, accessible, and ready for development handoff.',
      items: [
        'Wireframing & lo-fi prototyping',
        'Design systems & component libraries',
        'Hi-fi UI across web & mobile breakpoints',
        'Interaction design & visual polish'
      ],
      jump: { label: 'See it in GoodReviews →', target: '#chapter-goodreviews' }
    },
    validate: {
      num: 'Step 04',
      title: 'Validate',
      body: 'Design isn\'t finished until it survives production. I test, break, fix, and sign off — because quality isn\'t a phase, it\'s the whole story.',
      items: [
        'Usability testing & design iteration',
        'Functional, regression & UAT testing',
        'Test case design & bug reporting',
        'Release validation & production sign-off'
      ],
      jump: { label: 'See it in iTester →', target: '#chapter-itester' }
    }
  };

  function initNav() {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0) + '%';
    }, { passive: true });

    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('active');
      mobileMenu.classList.toggle('open', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  function closeMobileMenu() {
    navToggle.classList.remove('active');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
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
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  function initMockupThumbs() {
    document.querySelectorAll('.mockup-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const targetId = thumb.dataset.target;
        const hero = document.getElementById(targetId);
        if (!hero || !thumb.dataset.src) return;

        hero.style.opacity = '0';
        setTimeout(() => {
          hero.src = thumb.dataset.src;
          hero.style.opacity = '1';
        }, 150);

        thumb.closest('.mockup-thumbs')?.querySelectorAll('.mockup-thumb').forEach((t) => {
          t.classList.toggle('is-active', t === thumb);
        });
      });
    });
  }

  function openProcessModal(key) {
    const data = processData[key];
    if (!data) return;

    processModalContent.innerHTML = `
      <span class="process-num">${data.num}</span>
      <h3 id="process-modal-title">${data.title}</h3>
      <p>${data.body}</p>
      <ul>${data.items.map((i) => `<li>${i}</li>`).join('')}</ul>
      <a href="${data.jump.target}" class="process-modal-jump">${data.jump.label}</a>
    `;

    processModalContent.querySelector('.process-modal-jump').addEventListener('click', (e) => {
      e.preventDefault();
      closeProcessModal();
      scrollToSection(data.jump.target);
    });

    processModal.classList.add('open');
    processModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProcessModal() {
    processModal.classList.remove('open');
    processModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initProcessModal() {
    document.querySelectorAll('.craft-item[data-craft]').forEach((card) => {
      card.addEventListener('click', () => openProcessModal(card.dataset.craft));
    });

    processModal.querySelector('.process-modal-close').addEventListener('click', closeProcessModal);
    processModal.querySelector('.process-modal-backdrop').addEventListener('click', closeProcessModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && processModal.classList.contains('open')) closeProcessModal();
    });
  }

  function getScrollOffset() {
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 64;
    const letterbox = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--letterbox-h'), 10) || 24;
    return navH + letterbox;
  }

  function scrollToSection(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href');
        if (id === '#' || !document.querySelector(id)) return;
        e.preventDefault();
        closeMobileMenu();
        scrollToSection(id);
      });
    });
  }

  function initParallax() {
    if (!openingBackdrop || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    window.addEventListener('scroll', () => {
      const scroll = window.scrollY;
      const opening = document.getElementById('opening');
      if (!opening) return;
      const rect = opening.getBoundingClientRect();
      if (rect.bottom > 0) {
        openingBackdrop.style.transform = `translateY(${scroll * 0.15}px)`;
        openingBackdrop.style.opacity = 1 - Math.min(scroll / 600, 0.4);
      }
    }, { passive: true });
  }

  function initActiveChapter() {
    const chapters = document.querySelectorAll('.nav-chapters a');
    const sections = [];

    chapters.forEach((link) => {
      const section = document.querySelector(link.getAttribute('href'));
      if (section) sections.push({ link, section });
    });

    window.addEventListener('scroll', () => {
      const offset = window.innerHeight * 0.35;
      let current = sections[0];

      sections.forEach((item) => {
        if (item.section.getBoundingClientRect().top <= offset) current = item;
      });

      chapters.forEach((link) => {
        link.style.color = '';
        link.style.fontWeight = '';
      });

      if (current) {
        current.link.style.color = 'var(--accent-deep)';
        current.link.style.fontWeight = '600';
      }
    }, { passive: true });
  }

  initNav();
  initReveal();
  initMockupThumbs();
  initProcessModal();
  initSmoothScroll();
  initParallax();
  initActiveChapter();
})();