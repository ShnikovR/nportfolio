/**
 * Lógica principal do portfólio
 * Navbar, menu, filtros, formulário WhatsApp, i18n
 */

(function () {
  'use strict';

  const WHATSAPP_URL =
    'https://api.whatsapp.com/send/?phone=5517988028286&text=Olá!%20Gostaria%20de%20conversar%20sobre%20um%20projeto.&type=phone_number&app_absent=0';

  let translations = {};
  let currentLang = localStorage.getItem('portfolio-lang') || 'pt';

  function setYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function initNavbar() {
    const header = document.getElementById('header');
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      const openLabel = getNested(translations, 'nav.openMenu') || 'Abrir menu';
      const closeLabel = getNested(translations, 'nav.closeMenu') || 'Fechar menu';
      toggle.setAttribute('aria-label', isOpen ? closeLabel : openLabel);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    menu.querySelectorAll('.nav-link, .nav-cta').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }

  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    function updateActive() {
      const scrollY = window.scrollY + 120;
      sections.forEach((section) => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) {
          navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + id) link.classList.add('active');
          });
        }
      });
    }
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  function initProjectFilter() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.projeto-card');
    if (!buttons.length || !cards.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        buttons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        cards.forEach((card) => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) card.classList.remove('hidden');
          else card.classList.add('hidden');
        });
      });
    });
  }

  function getNested(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
  }

  function applyTranslations(dict) {
    translations = dict;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = getNested(dict, key);
      if (val !== null && val !== undefined) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = getNested(dict, key);
      if (val) el.setAttribute('placeholder', val);
    });
    document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : currentLang;
  }

  function loadLang(lang) {
    const all = window.PORTFOLIO_I18N || {};
    const dict = all[lang] || all.pt;
    if (!dict) {
      console.warn('i18n: no dictionary for', lang);
      return;
    }
    currentLang = lang;
    localStorage.setItem('portfolio-lang', lang);
    applyTranslations(dict);
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    if (window.__reinitTerminal) window.__reinitTerminal(dict.terminal || {});
  }

  function initI18n() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        if (lang) loadLang(lang);
      });
    });
    loadLang(currentLang);
  }

  function initResumeDownload() {
    function downloadBoth(e) {
      e.preventDefault();
      const files = [
        { href: 'assets/docs/Curriculo_Filipe_Breciani_pt.pdf', name: 'Filipe-Breciani-Curriculo-PT.pdf' },
        { href: 'assets/docs/Resume_Filipe_Breciani_en.pdf', name: 'Filipe-Breciani-Resume-EN.pdf' },
      ];
      files.forEach((f, i) => {
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = f.href;
          a.download = f.name;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }, i * 300);
      });
    }
    document.querySelectorAll('[data-download-resume]').forEach((el) => {
      el.addEventListener('click', downloadBoth);
    });
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const fields = {
      name: {
        el: document.getElementById('name'),
        error: document.getElementById('name-error'),
        validate: (v) =>
          v.trim().length >= 2 ? '' : getNested(translations, 'contact.err_name') || 'Nome inválido',
      },
      email: {
        el: document.getElementById('email'),
        error: document.getElementById('email-error'),
        validate: (v) => {
          const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return re.test(v.trim())
            ? ''
            : getNested(translations, 'contact.err_email') || 'Email inválido';
        },
      },
      subject: {
        el: document.getElementById('subject'),
        error: document.getElementById('subject-error'),
        validate: (v) =>
          v.trim().length >= 3
            ? ''
            : getNested(translations, 'contact.err_subject') || 'Assunto inválido',
      },
      message: {
        el: document.getElementById('message'),
        error: document.getElementById('message-error'),
        validate: (v) =>
          v.trim().length >= 10
            ? ''
            : getNested(translations, 'contact.err_message') || 'Mensagem curta',
      },
    };

    const status = document.getElementById('form-status');

    function clearErrors() {
      Object.values(fields).forEach((f) => {
        if (f.error) f.error.textContent = '';
        if (f.el) f.el.style.borderColor = '';
      });
      if (status) {
        status.textContent = '';
        status.className = 'form-status';
      }
    }

    function validateAll() {
      let valid = true;
      Object.values(fields).forEach((f) => {
        if (!f.el) return;
        const msg = f.validate(f.el.value);
        if (f.error) f.error.textContent = msg;
        if (msg) {
          f.el.style.borderColor = '#ff6b6b';
          valid = false;
        }
      });
      return valid;
    }

    Object.values(fields).forEach((f) => {
      if (!f.el) return;
      f.el.addEventListener('blur', () => {
        const msg = f.validate(f.el.value);
        if (f.error) f.error.textContent = msg;
        f.el.style.borderColor = msg ? '#ff6b6b' : '';
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();
      if (!validateAll()) {
        if (status) {
          status.textContent =
            getNested(translations, 'contact.error_fix') || 'Corrija os campos.';
          status.className = 'form-status error';
        }
        return;
      }

      const name = fields.name.el.value.trim();
      const subject = fields.subject.el.value.trim();
      const message = fields.message.el.value.trim();
      const text = encodeURIComponent(
        'Olá! Meu nome é ' + name + '.\nAssunto: ' + subject + '\n\n' + message
      );
      const url =
        'https://api.whatsapp.com/send/?phone=5517988028286&text=' +
        text +
        '&type=phone_number&app_absent=0';

      if (status) {
        status.textContent =
          getNested(translations, 'contact.success') || 'Redirecionando...';
        status.className = 'form-status success';
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        e.stopPropagation();

        // Remove any focus that could paint a light outline
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }

        const headerHeight = document.getElementById('header')?.offsetHeight || 72;
        const top = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 4);

        // Instant jump first frame avoids some browser hash flashes, then smooth if supported
        window.scrollTo({ top: top, behavior: 'smooth' });

        if (history.pushState) {
          history.pushState(null, '', targetId);
        } else {
          // fallback without triggering native jump
          try { history.replaceState(null, '', targetId); } catch (_) {}
        }
      }, true);
    });
  }

  /* Cursor glow companion — system cursor stays visible */
  function initCursorGlow() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;

    let x = 0,
      y = 0,
      gx = 0,
      gy = 0;

    document.addEventListener(
      'mousemove',
      (e) => {
        x = e.clientX;
        y = e.clientY;
        glow.classList.add('visible');
      },
      { passive: true }
    );

    document.addEventListener('mouseleave', () => glow.classList.remove('visible'));

    function animate() {
      gx += (x - gx) * 0.18;
      gy += (y - gy) * 0.18;
      glow.style.left = gx + 'px';
      glow.style.top = gy + 'px';
      requestAnimationFrame(animate);
    }
    animate();

    const hoverSel =
      'a, button, .skill-card, .projeto-card, .filter-btn, .contact-card, .lang-btn, input, textarea';
    document.querySelectorAll(hoverSel).forEach((el) => {
      el.addEventListener('mouseenter', () => glow.classList.add('expanded'));
      el.addEventListener('mouseleave', () => glow.classList.remove('expanded'));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setYear();
    initNavbar();
    initMobileMenu();
    initActiveNav();
    initProjectFilter();
    initContactForm();
    initSmoothScroll();
    initCursorGlow();
    initI18n();
    initResumeDownload();
  });
})();
