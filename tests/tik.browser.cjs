// Jalankan terhadap server statis; petunjuk pemasangan alat uji ada di README.md.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const axePath = require.resolve('axe-core/axe.min.js');
const baseURL = process.env.SITE_URL || 'http://127.0.0.1:4173';
let browser;

before(async () => {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
  });
});
after(async () => { await browser?.close(); });

async function visit(t, { path = '/tik.html', init, ...options } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', ...options,
  });
  t.after(() => context.close());
  // Pengujian tidak bergantung pada layanan font atau koneksi eksternal.
  await context.route('https://fonts.googleapis.com/**', (route) => route.abort());
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, [], 'Tidak boleh ada kesalahan JavaScript'));
  const response = await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  return page;
}

const visibleChapters = (page) => page.locator('.tik-module:not([hidden])');
const renderFrame = (page) => page.evaluate(() => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(resolve));
}));

test('materi, metadata, kuis, dan tautan lokal lengkap', async (t) => {
  const page = await visit(t);
  assert.match(await page.title(), /Teknologi Informasi dan Komunikasi/);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('.tik-module').count(), 12);
  assert.equal(await page.locator('.tik-project').count(), 4);
  assert.equal(await page.locator('.tik-glossary > div').count(), 24);
  assert.equal(await page.locator('#tik-quiz-form fieldset').count(), 10);
  assert.doesNotMatch(await page.locator('body').innerText(), /placeholder/i);

  const structure = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((item) => item.id);
    const missingAnchors = [...document.querySelectorAll('a[href^="#"]')]
      .map((link) => link.hash.slice(1)).filter((id) => !document.getElementById(id));
    const references = [...document.querySelectorAll('[aria-controls], [aria-labelledby]')]
      .flatMap((item) => `${item.getAttribute('aria-controls') || ''} ${item.getAttribute('aria-labelledby') || ''}`.trim().split(/\s+/))
      .filter((id) => !document.getElementById(id));
    return { duplicates: ids.filter((id, i) => ids.indexOf(id) !== i), missingAnchors, references };
  });
  assert.deepEqual(structure, { duplicates: [], missingAnchors: [], references: [] });
  for (const file of ['tik.css?v=1', 'tik.js?v=1', 'pages.css?v=3', 'script.js?v=3', 'content.html', 'about.html', 'index.html']) {
    assert.equal((await page.request.get(`${baseURL}/${file}`)).status(), 200, file);
  }
  await page.goto(`${baseURL}/content.html`);
  assert.doesNotMatch(await page.locator('main').innerText(), /placeholder/i);
  await page.locator('.subject-tik').click();
  assert.match(page.url(), /\/tik.html$/);
});

test('pencarian seluruh isi, filter gabungan, kondisi kosong, dan pemulihan accordion', async (t) => {
  const page = await visit(t);
  await page.locator('#tik-search').fill('RANSOMWARE');
  assert.deepEqual(await visibleChapters(page).evaluateAll((items) => items.map((item) => item.id)), ['bab-09']);
  assert.equal(await page.locator('#bab-09').getAttribute('open'), '');
  await page.locator('[data-tik-filter="fondasi"]').click();
  assert.equal(await visibleChapters(page).count(), 0);
  assert.equal(await page.locator('#tik-material-empty').isVisible(), true);
  await page.locator('#tik-reset-filter').click();
  assert.equal(await visibleChapters(page).count(), 12);
  assert.equal(await page.locator('#bab-09').getAttribute('open'), null);
  assert.equal(await page.locator('#bab-01').getAttribute('open'), '');
  await page.locator('[data-tik-filter="karya"]').click();
  assert.equal(await visibleChapters(page).count(), 4);
  await page.locator('#tik-search').fill('rumus');
  assert.deepEqual(await visibleChapters(page).evaluateAll((items) => items.map((item) => item.id)), ['bab-05']);
  await page.locator('#tik-reset-filter').click();
  await page.locator('#tik-search').fill('AI');
  assert.equal(await page.locator('#bab-11').isVisible(), true);
  assert.equal(await page.locator('#bab-05').isVisible(), false, 'AI tidak boleh cocok hanya karena kata nilai');
  await page.locator('#tik-search').fill('<img src=x onerror=alert(1)>');
  assert.equal(await visibleChapters(page).count(), 0);
  assert.equal(await page.locator('.tik-modules img').count(), 0);
});

test('tautan bab membuka accordion tersembunyi dan menghapus filter', async (t) => {
  const page = await visit(t, { path: '/tik.html#bab-08' });
  assert.equal(await page.locator('#bab-08').getAttribute('open'), '');
  await page.locator('[data-tik-filter="aman"]').click();
  assert.equal(await page.locator('#bab-08').isVisible(), false);
  await page.locator('.tik-project').nth(2).locator('summary').click();
  await page.locator('.tik-project-body a[href="#bab-08"]').click();
  assert.equal(await visibleChapters(page).count(), 12);
  assert.equal(await page.locator('#bab-08').getAttribute('open'), '');
  assert.equal(await page.locator('[data-tik-filter="all"]').getAttribute('aria-pressed'), 'true');
  await page.waitForFunction(() => document.activeElement === document.querySelector('#bab-08 > summary'));
});

test('progres bertahan setelah muat ulang dan tidak menghapus checklist IPS', async (t) => {
  const page = await visit(t, { init: () => {
    if (!localStorage.getItem('ruangakar-checklist-v1')) {
      localStorage.setItem('ruangakar-checklist-v1', JSON.stringify({ kenali: true, belajar: false, dukung: false, ceritakan: false }));
    }
  } });
  await page.locator('[data-tik-complete="bab-01"]').check();
  assert.equal(await page.locator('#tik-progress').getAttribute('value'), '1');
  assert.equal(await page.locator('#tik-continue').getAttribute('href'), '#bab-02');
  await page.reload();
  assert.equal(await page.locator('[data-tik-complete="bab-01"]').isChecked(), true);
  assert.equal(await page.locator('#tik-progress').getAttribute('value'), '1');
  for (const file of ['content.html', 'about.html', 'index.html?dari=ips']) {
    await page.goto(`${baseURL}/${file}`);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('ruangakar-checklist-v1')).kenali), true);
  }
  assert.equal(await page.locator('[data-task="kenali"]').isChecked(), true);
  await page.goto(`${baseURL}/tik.html`);
  await page.evaluate(() => document.querySelectorAll('.tik-module').forEach((item) => { item.open = true; }));
  for (const input of await page.locator('[data-tik-complete]').all()) await input.check();
  assert.equal(await page.locator('#tik-progress').getAttribute('value'), '12');
  assert.equal(await page.locator('#tik-continue').getAttribute('href'), '#kuis');
  await page.locator('[data-tik-complete="bab-01"]').uncheck();
  assert.equal(await page.locator('#tik-progress').getAttribute('value'), '11');
});

test('penyimpanan rusak atau diblokir tidak merusak materi dan progres sementara', async (t) => {
  for (const value of ['{invalid', 'null', 'true', '[]', '"text"', '{"bab-01":"true"}']) {
    const page = await visit(t, { init: `localStorage.setItem('ruangakar-tik-progress-v1', ${JSON.stringify(value)})` });
    assert.equal(await page.locator('#tik-progress').getAttribute('value'), '0');
    assert.equal(await page.locator('#tik-search').isVisible(), true);
  }
  const page = await visit(t, { init: () => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  } });
  await page.locator('[data-tik-complete="bab-01"]').check();
  assert.equal(await page.locator('#tik-progress').getAttribute('value'), '1');
  assert.match(await page.locator('#tik-storage-note').innerText(), /tidak tersedia/);
});

test('kuis memvalidasi kelengkapan, menilai tepat, menjelaskan, dan dapat diulang', async (t) => {
  const page = await visit(t);
  await page.locator('#tik-quiz-panel > summary').click();
  await page.locator('#tik-quiz-form button[type="submit"]').click();
  assert.equal(await page.locator('#tik-quiz-result').isVisible(), false);
  for (const question of await page.locator('#tik-quiz-form fieldset').all()) {
    const answer = await question.getAttribute('data-answer');
    await question.locator(`input[value="${answer}"]`).check();
  }
  await page.locator('#tik-quiz-form button[type="submit"]').click();
  assert.match(await page.locator('#tik-quiz-result').innerText(), /10 dari 10 benar/);
  assert.equal(await page.locator('fieldset[data-result="correct"]').count(), 10);
  assert.equal(await page.locator('.tik-quiz-feedback:not([hidden])').count(), 10);
  await page.locator('input[name="q1"][value="a"]').check();
  assert.equal(await page.locator('#tik-quiz-result').isVisible(), false, 'Skor lama dihapus saat jawaban berubah');
  await page.locator('#tik-quiz-form button[type="submit"]').click();
  assert.match(await page.locator('#tik-quiz-result').innerText(), /9 dari 10 benar/);
  assert.match(await page.locator('fieldset[data-result="incorrect"] .tik-quiz-feedback').innerText(), /Rata-rata suhu/);
  await page.locator('#tik-quiz-form button[type="reset"]').click();
  assert.equal(await page.locator('#tik-quiz-form input:checked').count(), 0);
  assert.equal(await page.locator('#tik-quiz-result').isVisible(), false);
  for (const question of await page.locator('#tik-quiz-form fieldset').all()) {
    const answer = await question.getAttribute('data-answer');
    await question.locator(`input:not([value="${answer}"])`).first().check();
  }
  await page.locator('#tik-quiz-form button[type="submit"]').click();
  assert.match(await page.locator('#tik-quiz-result').innerText(), /0 dari 10 benar/);
});

test('glosarium dapat dicari dan dipulihkan', async (t) => {
  const page = await visit(t);
  await page.locator('#tik-glossary-search').fill('phishing');
  assert.equal(await page.locator('.tik-glossary > div:not([hidden])').count(), 1);
  assert.match(await page.locator('#tik-glossary-count').innerText(), /1 dari 24/);
  await page.locator('#tik-glossary-search').fill('xyzxyzxyz');
  assert.equal(await page.locator('#tik-glossary-empty').isVisible(), true);
  await page.locator('#tik-glossary-reset').click();
  assert.equal(await page.locator('.tik-glossary > div:not([hidden])').count(), 24);
});

test('tema, menu ponsel, keyboard, dan tata letak 320–1440 px', async (t) => {
  const page = await visit(t);
  await page.locator('#bab-02 > summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#bab-02').getAttribute('open'), '');
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#bab-02').getAttribute('open'), null);
  await page.evaluate(() => document.querySelectorAll('main details').forEach((item) => { item.open = true; }));
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') await page.locator('.theme-toggle').click();
    for (const width of [320, 390, 650, 768, 900, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await renderFrame(page);
      const size = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, expected: innerWidth }));
      assert.equal(size.actual, size.expected, `Pas pada ${width}px, tema ${theme}`);
    }
  }
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.setViewportSize({ width: 390, height: 844 });
  await renderFrame(page);
  await page.locator('.tik-closing a[href="#atas"]').click();
  await renderFrame(page);
  assert.equal(await page.evaluate(() => scrollY), 0, 'Tautan kembali ke atas tidak menargetkan header sticky');
  await page.locator('.mobile-menu-toggle').click();
  assert.equal(await page.locator('.mobile-menu-toggle').getAttribute('aria-expanded'), 'true');
  await page.locator('.theme-toggle').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.theme-toggle').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
});

test('aksesibilitas WCAG otomatis: semua bab, proyek, kuis, dan kedua tema', async (t) => {
  for (const theme of ['dark', 'light']) {
    const page = await visit(t, { init: `localStorage.setItem('ruangakar-theme', '${theme}')` });
    await page.evaluate(() => {
      document.querySelectorAll('main details').forEach((item) => { item.open = true; });
      document.querySelectorAll('#tik-quiz-form fieldset').forEach((question, index) => {
        const input = [...question.querySelectorAll('input')]
          .find((candidate) => index === 0 ? candidate.value !== question.dataset.answer : candidate.value === question.dataset.answer);
        input.checked = true;
      });
      document.getElementById('tik-quiz-form').requestSubmit();
    });
    await renderFrame(page);
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
      const results = await axe.run(document.querySelector('.tik-page'), {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      });
      return results.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
    });
    assert.deepEqual(violations, [], `Audit tema ${theme}`);
  }
});

test('materi dan proyek dapat dibuka tanpa JavaScript', async (t) => {
  const page = await visit(t, { javaScriptEnabled: false });
  assert.equal(await page.locator('.tik-material-tools').isVisible(), false);
  assert.equal(await page.locator('.tik-progress-card').isVisible(), false);
  assert.equal(await page.locator('#bab-01 .tik-module-body').isVisible(), true);
  await page.locator('#bab-08 > summary').click();
  assert.equal(await page.locator('#bab-08 .tik-module-body').isVisible(), true);
  await page.locator('.tik-project').first().locator('summary').click();
  assert.equal(await page.locator('.tik-project-body').first().isVisible(), true);
  assert.equal(await page.locator('#materi noscript').isVisible(), true);
});

test('cetak membuka seluruh materi lalu memulihkan hasil pencarian', async (t) => {
  const page = await visit(t);
  await page.locator('#tik-search').fill('ransomware');
  assert.equal(await visibleChapters(page).count(), 1);
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.locator('.tik-module:not([hidden])[open]').count(), 12);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  assert.equal(await visibleChapters(page).count(), 1);
  assert.equal(await page.locator('#tik-search').inputValue(), 'ransomware');
});
