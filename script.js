(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const themeButton = document.querySelector('.theme-toggle');
  const themeLabel = document.querySelector('.theme-label');
  const menuButton = document.querySelector('.mobile-menu-toggle');
  const navigation = document.querySelector('.primary-nav');
  const toast = document.querySelector('.toast');
  let toastTimer;

  const safeRead = (key) => {
    try { return window.localStorage.getItem(key); } catch { return null; }
  };
  const safeWrite = (key, value) => {
    try { window.localStorage.setItem(key, value); } catch { /* Private browsing can disable storage. */ }
  };

  const applyTheme = (theme) => {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    if (themeButton) {
      const nextLabel = nextTheme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';
      themeButton.setAttribute('aria-label', nextLabel);
      themeButton.setAttribute('title', nextLabel);
      if (themeLabel) themeLabel.textContent = nextTheme === 'dark' ? 'Mode terang' : 'Mode gelap';
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', nextTheme === 'dark' ? '#101411' : '#f4f4ed');
  };

  applyTheme(safeRead('ruangakar-theme'));
  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    safeWrite('ruangakar-theme', next);
  });

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Buka menu');
    navigation.classList.remove('is-open');
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Buka menu' : 'Tutup menu');
    navigation?.classList.toggle('is-open', !isOpen);
  });

  navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('click', (event) => {
    if (!navigation?.classList.contains('is-open')) return;
    if (!navigation.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const filterButtons = document.querySelectorAll('.filter-button');
  const storyCards = document.querySelectorAll('.story-card');
  const filterCount = document.querySelector('.filter-count');
  const noResults = document.querySelector('.no-results');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.filter || 'all';
      let visibleCount = 0;
      filterButtons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle('is-active', active);
        candidate.setAttribute('aria-pressed', String(active));
      });
      storyCards.forEach((card) => {
        const visible = selected === 'all' || card.dataset.category === selected;
        card.classList.toggle('is-hidden', !visible);
        card.setAttribute('aria-hidden', String(!visible));
        if (visible) visibleCount += 1;
      });
      if (filterCount) filterCount.textContent = `${visibleCount} cerita`;
      if (noResults) noResults.hidden = visibleCount !== 0;
    });
  });

  const taskInputs = [...document.querySelectorAll('.check-item input[type="checkbox"]')];
  const progressNumber = document.querySelector('.progress-number');
  const progressPercent = document.querySelector('.progress-percent');
  const progressMessage = document.querySelector('.progress-message');
  const progressBar = document.querySelector('.progress-bar');
  const progressBarFill = document.querySelector('.progress-bar span');
  const progressValue = document.querySelector('.progress-value');
  const progressRing = document.querySelector('.progress-ring');
  const progressCircleLength = 2 * Math.PI * 23;
  const taskStorageKey = 'ruangakar-checklist-v1';
  let tasks = {};

  try { tasks = JSON.parse(safeRead(taskStorageKey) || '{}') || {}; } catch { tasks = {}; }
  taskInputs.forEach((input) => {
    input.checked = tasks[input.dataset.task] === true;
  });

  const updateChecklist = (showToast = false) => {
    const complete = taskInputs.filter((input) => input.checked).length;
    const total = taskInputs.length;
    const percent = total ? Math.round((complete / total) * 100) : 0;
    if (progressNumber) progressNumber.textContent = `${complete}/${total}`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressBarFill) progressBarFill.style.width = `${percent}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(complete));
    if (progressValue) progressValue.style.strokeDashoffset = String(progressCircleLength * (1 - (total ? complete / total : 0)));
    if (progressRing) progressRing.setAttribute('aria-label', `${complete} dari ${total} langkah selesai`);
    if (progressMessage) {
      progressMessage.textContent = complete === total && total > 0
        ? 'Semua langkah sudah kamu tandai. Terima kasih sudah ikut menjaga.'
        : complete > 0
          ? 'Kamu sudah mulai. Lanjutkan saat siap.'
          : 'Setiap langkah kecil berarti.';
    }
    tasks = Object.fromEntries(taskInputs.map((input) => [input.dataset.task, input.checked]));
    safeWrite(taskStorageKey, JSON.stringify(tasks));
    if (showToast && complete === total && total > 0) showMessage('Keren—empat langkah sudah kamu tandai. Pilih satu untuk benar-benar dilakukan.');
  };

  taskInputs.forEach((input) => input.addEventListener('change', () => updateChecklist(true)));
  // Jangan menimpa progres IPS dari halaman yang tidak memiliki checklist.
  if (taskInputs.length) updateChecklist();

  function showMessage(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4000);
  }

  const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.story-card, .tension-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;
        const y = (event.clientY - box.top) / box.height;
        const tiltY = (x - 0.5) * 3.2;
        const tiltX = (0.5 - y) * 2.8;
        card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  // Tautan sosial media diatur di file tautan.js agar mudah diganti.
  const socialLinks = window.TAUTAN_SITUS || {};
  document.querySelectorAll('[data-tautan]').forEach((link) => {
    const url = socialLinks[link.dataset.tautan];
    if (typeof url !== 'string' || !url.trim()) return;
    const cleanUrl = url.trim();
    link.href = cleanUrl;
    if (!cleanUrl.startsWith('mailto:')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });

  const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window && navSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
        link.classList.toggle('is-current', active);
      });
    }, { rootMargin: '-22% 0px -62% 0px', threshold: [0, .2, .5, .8] });
    navSections.forEach((section) => sectionObserver.observe(section));
  }
})();
