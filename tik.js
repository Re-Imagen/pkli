(() => {
  'use strict';

  const page = document.querySelector('.tik-page');
  if (!page) return;

  const modules = [...page.querySelectorAll('.tik-module')];
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const search = document.getElementById('tik-search');
  const filters = [...page.querySelectorAll('[data-tik-filter]')];
  const resetFilter = document.getElementById('tik-reset-filter');
  const materialCount = document.getElementById('tik-material-count');
  const materialEmpty = document.getElementById('tik-material-empty');
  let selectedCategory = 'all';
  let beforeSearch = null;

  const normalize = (text) => text.toLocaleLowerCase('id').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').trim();
  const makeIndex = (text) => {
    const normalized = normalize(text);
    return { text: normalized, words: new Set(normalized.split(/[^a-z0-9]+/)) };
  };
  const queryWords = (text) => normalize(text).split(/\s+/).filter(Boolean);
  const matches = (index, words) => words.every((word) => (
    // Singkatan seperti AI/IP harus berupa kata, bukan potongan "nilai".
    word.length <= 2 ? index.words.has(word) : index.text.includes(word)
  ));
  const materialIndex = new Map(modules.map((module) => [
    module.id, makeIndex(`${module.textContent} ${module.dataset.keywords || ''}`),
  ]));

  function filterMaterials() {
    const words = queryWords(search.value);
    if (words.length && !beforeSearch) {
      beforeSearch = new Map(modules.map((module) => [module.id, module.open]));
    } else if (!words.length && beforeSearch) {
      modules.forEach((module) => { module.open = beforeSearch.get(module.id); });
      beforeSearch = null;
    }

    let count = 0;
    modules.forEach((module) => {
      const inCategory = selectedCategory === 'all' || module.dataset.category === selectedCategory;
      const visible = inCategory && matches(materialIndex.get(module.id), words);
      module.hidden = !visible;
      // Hasil yang cocok dibuka agar teks dalam isi bab langsung terbaca.
      if (visible && words.length) module.open = true;
      if (visible) count += 1;
    });
    filters.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.tikFilter === selectedCategory));
    });
    materialCount.textContent = `${count} dari ${modules.length} bab${words.length ? ' cocok' : ''}`;
    materialEmpty.hidden = count !== 0;
    resetFilter.hidden = !words.length && selectedCategory === 'all';
  }

  function clearMaterialFilters() {
    search.value = '';
    selectedCategory = 'all';
    filterMaterials();
  }

  search.addEventListener('input', filterMaterials);
  filters.forEach((button) => button.addEventListener('click', () => {
    selectedCategory = button.dataset.tikFilter;
    filterMaterials();
  }));
  resetFilter.addEventListener('click', () => {
    clearMaterialFilters();
    search.focus();
  });

  // Progres TIK terpisah dari checklist IPS dan tidak pernah dikirim ke server.
  const storageKey = 'ruangakar-tik-progress-v1';
  const completionInputs = [...page.querySelectorAll('[data-tik-complete]')];
  const progress = document.getElementById('tik-progress');
  const progressCount = document.getElementById('tik-progress-count');
  const continueLink = document.getElementById('tik-continue');
  const storageNote = document.getElementById('tik-storage-note');
  let savedProgress = {};
  let rawProgress = null;
  let storageAvailable = true;
  try {
    rawProgress = window.localStorage.getItem(storageKey);
  } catch {
    storageAvailable = false;
  }
  try {
    const parsed = JSON.parse(rawProgress || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) savedProgress = parsed;
  } catch { /* Progres yang rusak diabaikan; materi tetap dapat digunakan. */ }

  completionInputs.forEach((input) => {
    input.checked = savedProgress[input.dataset.tikComplete] === true;
  });

  function renderProgress() {
    const completed = completionInputs.filter((input) => input.checked).length;
    progress.max = completionInputs.length;
    progress.value = completed;
    progress.textContent = `${completed} dari ${completionInputs.length} bab`;
    progress.setAttribute('aria-valuetext', `${completed} dari ${completionInputs.length} bab dipahami`);
    const number = document.createElement('strong');
    number.textContent = String(completed);
    progressCount.replaceChildren(number, ` / ${completionInputs.length} bab dipahami`);
    completionInputs.forEach((input) => {
      moduleById.get(input.dataset.tikComplete)?.classList.toggle('is-complete', input.checked);
    });
    const next = completionInputs.find((input) => !input.checked);
    continueLink.href = next ? `#${next.dataset.tikComplete}` : '#kuis';
    continueLink.firstChild.textContent = next
      ? `${completed ? 'Lanjut ke' : 'Mulai dari'} bab ${next.dataset.tikComplete.slice(-2)} `
      : 'Semua dipahami. Coba kuis ';
    storageNote.textContent = storageAvailable
      ? 'Tandai bab yang sudah dipahami. Progres tersimpan hanya di browser ini, bukan di akun.'
      : 'Penyimpanan browser tidak tersedia. Progres hanya berlaku selama halaman ini terbuka.';
  }

  completionInputs.forEach((input) => input.addEventListener('change', () => {
    const nextProgress = Object.fromEntries(completionInputs.map((item) => [
      item.dataset.tikComplete, item.checked,
    ]));
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextProgress));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    renderProgress();
  }));
  renderProgress();

  // Tautan bab tetap bekerja saat hasil pencarian atau kategori menyembunyikannya.
  function revealChapter(hash) {
    const module = moduleById.get(hash.slice(1));
    if (!module) return null;
    clearMaterialFilters();
    module.open = true;
    return module;
  }

  page.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#bab-"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const module = revealChapter(link.getAttribute('href'));
    // Tunggu perpindahan fokus bawaan anchor, termasuk ketika hash tidak berubah.
    window.requestAnimationFrame(() => {
      module?.querySelector('summary').focus({ preventScroll: true });
    });
  });

  function revealHash() {
    const module = revealChapter(window.location.hash);
    if (!module) return;
    window.requestAnimationFrame(() => {
      module.scrollIntoView({ block: 'start' });
      module.querySelector('summary').focus({ preventScroll: true });
    });
  }
  window.addEventListener('hashchange', revealHash);

  // Penilaian lokal; tidak ada penyimpanan jawaban atau permintaan jaringan.
  const quiz = document.getElementById('tik-quiz-form');
  const questions = [...quiz.querySelectorAll('fieldset')];
  const result = document.getElementById('tik-quiz-result');
  let graded = false;

  function clearQuizFeedback() {
    result.hidden = true;
    result.replaceChildren();
    questions.forEach((question) => {
      delete question.dataset.result;
      question.querySelector('.tik-quiz-feedback').hidden = true;
    });
    graded = false;
  }

  quiz.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!quiz.reportValidity()) return;
    let score = 0;
    questions.forEach((question) => {
      const selected = question.querySelector('input:checked');
      const correct = selected?.value === question.dataset.answer;
      if (correct) score += 1;
      question.dataset.result = correct ? 'correct' : 'incorrect';
      const feedback = question.querySelector('.tik-quiz-feedback');
      const correctInput = [...question.querySelectorAll('input')]
        .find((input) => input.value === question.dataset.answer);
      const correctText = correctInput.closest('label').querySelector('span').textContent;
      feedback.querySelector('span').textContent = correct
        ? 'Tepat!'
        : `Belum tepat. Jawaban yang benar: ${correctText}`;
      feedback.hidden = false;
    });

    const scoreHeading = document.createElement('strong');
    scoreHeading.textContent = `${score} dari ${questions.length} benar`;
    const explanation = document.createElement('p');
    explanation.textContent = score === questions.length
      ? 'Semua jawaban tepat! Teruskan dengan proyek praktik dan bacaan lanjutan. Kamu tetap bisa membaca pembahasan di bawah.'
      : 'Ini titik awal, bukan label kemampuanmu. Baca pembahasan setiap soal di bawah, buka kembali bab terkait, lalu coba lagi.';
    result.replaceChildren(scoreHeading, explanation);
    result.hidden = false;
    graded = true;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ block: 'start' });
  });
  quiz.addEventListener('change', () => {
    // Skor lama tidak boleh tetap terlihat setelah jawaban diubah.
    if (graded) clearQuizFeedback();
  });
  quiz.addEventListener('reset', () => {
    clearQuizFeedback();
    quiz.querySelector('input').focus({ preventScroll: true });
    quiz.scrollIntoView({ block: 'start' });
  });

  const glossarySearch = document.getElementById('tik-glossary-search');
  const glossaryItems = [...page.querySelectorAll('.tik-glossary > div')];
  const glossaryIndex = new Map(glossaryItems.map((item) => [item, makeIndex(item.textContent)]));
  const glossaryCount = document.getElementById('tik-glossary-count');
  const glossaryEmpty = document.getElementById('tik-glossary-empty');
  const glossaryReset = document.getElementById('tik-glossary-reset');

  function filterGlossary() {
    const words = queryWords(glossarySearch.value);
    let count = 0;
    glossaryItems.forEach((item) => {
      const visible = matches(glossaryIndex.get(item), words);
      item.hidden = !visible;
      if (visible) count += 1;
    });
    glossaryCount.textContent = `${count} dari ${glossaryItems.length} istilah`;
    glossaryEmpty.hidden = count !== 0;
    glossaryReset.hidden = !words.length;
  }
  glossarySearch.addEventListener('input', filterGlossary);
  glossaryReset.addEventListener('click', () => {
    glossarySearch.value = '';
    filterGlossary();
    glossarySearch.focus();
  });

  // Semua materi tetap ada di HTML. Kontrol baru ditampilkan sesudah siap.
  page.querySelectorAll('[data-tik-interactive]').forEach((element) => { element.hidden = false; });
  filterMaterials();
  filterGlossary();
  revealHash();

  const studyLinks = [...page.querySelectorAll('.tik-study-nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      studyLinks.forEach((link) => {
        if (link.hash === `#${visible.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-100px 0px -55% 0px', threshold: 0 });
    studyLinks.forEach((link) => {
      const section = document.getElementById(link.hash.slice(1));
      if (section) observer.observe(section);
    });
  }

  // Lembar cetak mencakup bab yang terlipat/terfilter. Pulihkan tampilan setelahnya.
  let printState = null;
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    const printable = [...modules, ...page.querySelectorAll('.tik-project'), ...glossaryItems];
    printState = printable.map((element) => ({ element, hidden: element.hidden, open: element.open }));
    printable.forEach((element) => {
      element.hidden = false;
      if (element.tagName === 'DETAILS') element.open = true;
    });
  });
  window.addEventListener('afterprint', () => {
    printState?.forEach(({ element, hidden, open }) => {
      element.hidden = hidden;
      if (element.tagName === 'DETAILS') element.open = open;
    });
    printState = null;
  });
})();
