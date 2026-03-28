(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const toastEl = document.querySelector('[data-toast]');
  let toastTimer = null;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.hidden = true;
    }, 2800);
  };

  // Year
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  // Sticky header elevation
  const header = document.querySelector('[data-elevate]');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-elevated', window.scrollY > 6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMenu = document.querySelector('[data-nav-menu]');
  if (navToggle && navMenu) {
    const close = () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    $$('a.nav__link', navMenu).forEach((a) => a.addEventListener('click', close));

    document.addEventListener('click', (e) => {
      if (!navMenu.classList.contains('is-open')) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  // Theme
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const themeIcon = document.querySelector('[data-theme-icon]');
  const getStoredTheme = () => {
    try {
      return localStorage.getItem('theme');
    } catch {
      return null;
    }
  };
  const setStoredTheme = (t) => {
    try {
      localStorage.setItem('theme', t);
    } catch {
      // ignore
    }
  };

  const systemPrefersLight = () => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    } catch {
      return false;
    }
  };

  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    if (themeIcon) {
      // Simple icon: sun/moon
      themeIcon.style.borderRadius = '999px';
      themeIcon.style.boxSizing = 'border-box';
      themeIcon.style.border = '2px solid currentColor';
      themeIcon.style.position = 'relative';
      themeIcon.innerHTML = '';
      if (t === 'light') {
        themeIcon.style.background = 'transparent';
        themeIcon.style.boxShadow = 'inset -4px -4px 0 0 currentColor';
      } else {
        themeIcon.style.background = 'currentColor';
        themeIcon.style.boxShadow = 'none';
      }
    }
  };

  const initTheme = () => {
    const stored = getStoredTheme();
    const initial = stored || (systemPrefersLight() ? 'light' : 'dark');
    applyTheme(initial);
  };

  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      setStoredTheme(next);
    });
  }

  // Reveal on scroll
  const revealEls = $$('[data-reveal]');
  if (!prefersReduced && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            ent.target.classList.add('is-in');
            io.unobserve(ent.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  // Counters
  const counterEls = $$('[data-counter]');
  const animateCounter = (el) => {
    const to = Number(el.getAttribute('data-to') || '0');
    const valueEl = el.querySelector('[data-counter-value]');
    if (!valueEl) return;

    const isFloat = String(to).includes('.');
    const duration = 900;
    const start = performance.now();

    const step = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = to * eased;
      valueEl.textContent = isFloat ? v.toFixed(1) : Math.round(v).toLocaleString('fr-FR');
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  if (counterEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (!ent.isIntersecting) return;
          animateCounter(ent.target);
          io.unobserve(ent.target);
        });
      },
      { threshold: 0.35 }
    );
    counterEls.forEach((el) => io.observe(el));
  }

  // Meter + next slot
  const meterFill = document.querySelector('[data-meter-fill]');
  const meterHint = document.querySelector('[data-meter-hint]');
  const nextSlot = document.querySelector('[data-next-slot]');
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const setWorkload = () => {
    const percent = rnd(35, 88);
    if (meterFill) meterFill.style.width = percent + '%';
    if (meterHint) {
      const txt = percent < 50 ? 'Faible: créneaux rapides' : percent < 75 ? 'Moyenne: RDV conseillé' : 'Forte: anticipe ton RDV';
      meterHint.textContent = txt + ` (${percent}%)`;
    }

    if (nextSlot) {
      const d = new Date();
      const addHours = percent < 60 ? 2 : percent < 80 ? 6 : 24;
      d.setHours(d.getHours() + addHours);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      nextSlot.textContent = `${hh}:${mm}`;
    }
  };
  setWorkload();

  // Tabs
  const tabsRoot = document.querySelector('[data-tabs]');
  if (tabsRoot) {
    const tabs = $$('[data-tab]', tabsRoot);
    const panes = $$('[data-pane]', tabsRoot);

    const setTab = (name) => {
      tabs.forEach((t) => {
        const active = t.getAttribute('data-tab') === name;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panes.forEach((p) => p.classList.toggle('is-active', p.getAttribute('data-pane') === name));
    };

    tabs.forEach((t) =>
      t.addEventListener('click', () => {
        setTab(t.getAttribute('data-tab'));
      })
    );
  }

  // Service click => prefill form
  const rdvForm = document.querySelector('[data-rdv-form]');
  const serviceSel = document.querySelector('#service');
  const typeSel = document.querySelector('#type');
  const estimateEl = document.querySelector('[data-estimate]');

  const updateEstimate = () => {
    if (!estimateEl || !serviceSel) return;
    const opt = serviceSel.value;
    const map = {
      'Entretien': 'Durée estimée: ~1h',
      'Freinage': 'Durée estimée: ~1h30',
      'Pneus': 'Durée estimée: ~1h',
      'Révision moto': 'Durée estimée: ~1h',
      'Pneus moto': 'Durée estimée: ~45 min',
      'Freinage moto': 'Durée estimée: ~1h',
      'Diagnostic': 'Durée estimée: ~45 min',
      'Batterie & alternateur': 'Durée estimée: ~45 min',
      'Éclairage': 'Durée estimée: ~30 min',
      'Autre': ''
    };
    estimateEl.textContent = map[opt] || '';
  };

  if (serviceSel) serviceSel.addEventListener('change', updateEstimate);

  $$('[data-service]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = btn.getAttribute('data-service') || '';

      if (serviceSel) {
        const exists = $$('option', serviceSel).some((o) => o.value === s);
        if (exists) {
          serviceSel.value = s;
        } else {
          serviceSel.value = 'Autre';
        }
      }

      if (typeSel) {
        const t = s.toLowerCase().includes('moto') ? 'Moto' : 'Auto';
        const exists = $$('option', typeSel).some((o) => o.value === t);
        if (exists) typeSel.value = t;
      }

      updateEstimate();
      toast('Service ajouté au RDV');

      const rdvSection = document.querySelector('#rdv');
      if (rdvSection) rdvSection.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Gallery filter + modal
  const filterBtns = $$('[data-filter]');
  const shots = $$('[data-gallery] .shot');
  const modal = document.querySelector('[data-modal]');
  const modalImg = document.querySelector('[data-modal-img]');

  const setFilter = (kind) => {
    filterBtns.forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-filter') === kind));
    shots.forEach((s) => {
      const k = s.getAttribute('data-kind');
      const show = kind === 'all' || kind === k;
      s.classList.toggle('is-hidden', !show);
    });
  };

  filterBtns.forEach((b) => b.addEventListener('click', () => setFilter(b.getAttribute('data-filter'))));

  const openModal = (src, alt) => {
    if (!modal || !modalImg) return;
    modalImg.src = src;
    modalImg.alt = alt || '';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (modalImg) modalImg.src = '';
  };

  shots.forEach((s) =>
    s.addEventListener('click', () => {
      const img = s.querySelector('img');
      openModal(s.getAttribute('data-full') || (img ? img.src : ''), img ? img.alt : '');
    })
  );

  if (modal) {
    $$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
    window.addEventListener('keydown', (e) => {
      if (!modal.hidden && e.key === 'Escape') closeModal();
    });
  }

  // Carousel
  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const track = carousel.querySelector('[data-track]');
    const viewport = carousel.querySelector('[data-viewport]');
    const prev = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    if (track && viewport && prev && next) {
      let index = 0;

      const items = () => $$('.review', track);
      const itemWidth = () => {
        const it = items()[0];
        if (!it) return 0;
        const rect = it.getBoundingClientRect();
        const gap = 12;
        return rect.width + gap;
      };

      const maxIndex = () => Math.max(0, items().length - 1);

      const apply = () => {
        const w = itemWidth();
        track.style.transform = `translateX(${-index * w}px)`;
      };

      const go = (dir) => {
        index = clamp(index + dir, 0, maxIndex());
        apply();
      };

      prev.addEventListener('click', () => go(-1));
      next.addEventListener('click', () => go(1));

      // Drag/swipe
      let down = false;
      let startX = 0;
      let startIndex = 0;

      const pointerDown = (x) => {
        down = true;
        startX = x;
        startIndex = index;
        track.style.transition = 'none';
      };
      const pointerMove = (x) => {
        if (!down) return;
        const dx = x - startX;
        const w = itemWidth() || 1;
        const raw = startIndex - dx / w;
        const clamped = clamp(raw, 0, maxIndex());
        track.style.transform = `translateX(${-clamped * w}px)`;
      };
      const pointerUp = (x) => {
        if (!down) return;
        down = false;
        track.style.transition = '';
        const dx = x - startX;
        const w = itemWidth() || 1;
        if (Math.abs(dx) > w * 0.2) {
          index = clamp(startIndex + (dx < 0 ? 1 : -1), 0, maxIndex());
        }
        apply();
      };

      viewport.addEventListener('pointerdown', (e) => {
        viewport.setPointerCapture(e.pointerId);
        pointerDown(e.clientX);
      });
      viewport.addEventListener('pointermove', (e) => pointerMove(e.clientX));
      viewport.addEventListener('pointerup', (e) => pointerUp(e.clientX));
      viewport.addEventListener('pointercancel', (e) => pointerUp(e.clientX));

      window.addEventListener('resize', () => {
        apply();
      });

      apply();
    }
  }

  // FAQ accordion
  const faqRoot = document.querySelector('[data-faq]');
  if (faqRoot) {
    const qs = $$('.faq__q', faqRoot);
    qs.forEach((q) => {
      q.addEventListener('click', () => {
        const expanded = q.getAttribute('aria-expanded') === 'true';
        // Close others
        qs.forEach((o) => o.setAttribute('aria-expanded', 'false'));
        q.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
    });
  }

  // Form validation + fake submit
  const errorFor = (name) => document.querySelector(`[data-error-for="${name}"]`);
  const setError = (name, msg) => {
    const el = errorFor(name);
    if (el) el.textContent = msg || '';
  };

  const normalizePhone = (s) => (s || '').replace(/[\s().-]/g, '');
  const isValidPhone = (s) => {
    const v = normalizePhone(s);
    return /^\+?\d{8,15}$/.test(v);
  };

  const setDefaultDateTime = () => {
    const dateEl = document.querySelector('#date');
    const timeEl = document.querySelector('#heure');
    if (!dateEl || !timeEl) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;

    // Set time to next half hour between 09:00 and 18:00
    const t = new Date(now);
    t.setMinutes(t.getMinutes() + 90);
    const minutes = t.getMinutes();
    t.setMinutes(minutes < 30 ? 30 : 0);
    if (minutes >= 30) t.setHours(t.getHours() + 1);

    const hh = clamp(t.getHours(), 9, 18);
    timeEl.value = `${String(hh).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  };
  setDefaultDateTime();

  if (rdvForm) {
    rdvForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fd = new FormData(rdvForm);
      const nom = String(fd.get('nom') || '').trim();
      const tel = String(fd.get('tel') || '').trim();
      const type = String(fd.get('type') || '');
      const service = String(fd.get('service') || '');
      const date = String(fd.get('date') || '');
      const heure = String(fd.get('heure') || '');

      let ok = true;

      setError('nom', '');
      setError('tel', '');
      setError('type', '');
      setError('service', '');
      setError('date', '');
      setError('heure', '');

      if (nom.length < 2) {
        setError('nom', 'Veuillez entrer un nom valide.');
        ok = false;
      }
      if (!isValidPhone(tel)) {
        setError('tel', 'Numéro invalide (ex: +33612345678).');
        ok = false;
      }
      if (!type) {
        setError('type', 'Choisissez Auto ou Moto.');
        ok = false;
      }
      if (!service) {
        setError('service', 'Choisissez un service.');
        ok = false;
      }
      if (!date) {
        setError('date', 'Choisissez une date.');
        ok = false;
      }
      if (!heure) {
        setError('heure', 'Choisissez une heure.');
        ok = false;
      }

      if (!ok) {
        toast('Vérifie le formulaire');
        return;
      }

      // Simulate success
      toast(`Demande envoyée — ${service} (${type}) le ${date} à ${heure}`);
      rdvForm.reset();
      setDefaultDateTime();
      updateEstimate();
    });
  }

  // WhatsApp link
  const phoneForWa = '+22670337657';
  const makeWa = (phone) => `https://wa.me/${encodeURIComponent(phone.replace(/\D/g, ''))}?text=${encodeURIComponent('Bonjour DENIS AUTO, je souhaite prendre un RDV (auto/moto).')}`;
  const waUrl = makeWa(phoneForWa);

  const waA = document.querySelector('[data-wa]');
  const waBtn = document.querySelector('[data-wa-btn]');
  if (waA) waA.setAttribute('href', waUrl);
  if (waBtn) waBtn.setAttribute('href', waUrl);
})();
