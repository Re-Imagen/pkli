# RuangAkar

Situs edukasi untuk menjelajahi kearifan lokal Indonesia (IPS) dan memahami Teknologi Informasi dan Komunikasi (TIK). Dibangun sebagai situs statis tanpa framework atau dependensi runtime.

## Halaman

| Berkas | Isi |
| --- | --- |
| `index.html` | Beranda RuangAkar: gagasan, empat cerita, jembatan, dan aksi pelestarian. |
| `content.html` | Halaman **Konten** dengan dua bagian: **IPS** (menuju RuangAkar) dan **TIK** (menuju ruang belajar teknologi). |
| `about.html` | Halaman **Tentang**: foto pembuat berbentuk bulat, cerita di balik situs, dan ikon sosial media. |
| `tik.html` | Ruang **TIK**: 12 bab, 4 proyek praktik, kuis 10 soal, glosarium 24 istilah, dan bacaan lanjutan. |

## Menjalankan secara lokal

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Lalu buka `http://localhost:4173`. Ruang TIK berada di `http://localhost:4173/tik.html`, atau pilih **Konten → TIK**. Dalam pratinjau jarak jauh, gunakan alamat pratinjau yang disediakan platform, bukan localhost browser.

## Mengubah tautan sosial media (untuk pemula)

Semua tautan ikon sosial media di halaman **Tentang** diatur di satu berkas: **`tautan.js`**.

1. Buka berkas `tautan.js` dengan editor teks apa pun (Notepad, VS Code, atau editor di GitHub).
2. Cari baris aplikasi yang ingin diganti, misalnya:

   ```js
   instagram: "https://www.instagram.com/",
   ```

3. Ganti alamat di antara tanda kutip dengan alamat profilmu, misalnya:

   ```js
   instagram: "https://www.instagram.com/namakamu",
   ```

4. Jangan hapus tanda kutip, titik dua, dan koma di akhir baris.
5. Simpan berkas. Ikon Instagram di halaman Tentang otomatis membuka alamat baru.

Nilai bawaan saat ini adalah tautan **placeholder** (halaman utama masing-masing aplikasi), jadi situs tetap berfungsi sebelum tautan asli dipasang. Jika JavaScript dimatikan, tautan cadangan di `about.html` tetap bisa dipakai, tetapi untuk menggantinya disarankan tetap melalui `tautan.js`.

## Navigasi RuangAkar

Tautan bagian **Gagasan**, **Cerita**, dan **Jembatan** tidak ditampilkan pada navigasi utama secara default. Ketiganya hanya muncul ketika RuangAkar dibuka lewat kartu **IPS** di halaman **Konten**, yaitu melalui alamat:

```text
index.html?dari=ips
```

Parameter `dari=ips` dibaca oleh skrip kecil di `<head>` `index.html` (tidak peka huruf besar/kecil) dan menambahkan kelas `dari-ips` pada elemen `<html>`. Tanpa parameter itu — misalnya saat membuka `index.html` langsung, lewat logo, atau setelah berpindah dari halaman lain — navigasi hanya menampilkan **Konten** dan **Tentang**.

Agar tidak mudah rusak, wadah tautan memakai atribut `hidden` di HTML:

- Bila berkas CSS gagal dimuat atau browser masih memakai `styles.css` versi lama (tanpa aturan penyembunyi), tautan tetap tidak muncul karena `hidden` adalah perilaku bawaan browser.
- Skrip hanya melepas `hidden` ketika parameter `dari=ips` benar-benar ada, sehingga tidak ada kedipan menu.
- Berkas CSS dan JavaScript memakai penanda versi: `styles.css`/`tautan.js` memakai `?v=2`, `pages.css`/`script.js` memakai `?v=3`, dan `tik.css`/`tik.js` memakai `?v=1`. Saat berkas berubah lagi, naikkan versinya pada seluruh halaman yang menggunakannya agar browser mengambil berkas terbaru.

Catatan: bila JavaScript dimatikan sepenuhnya, tautan bagian tidak ditampilkan sama sekali — termasuk saat masuk lewat IPS — karena kondisi `dari=ips` hanya bisa dibaca lewat JavaScript pada situs statis ini.

## Ruang belajar TIK

Materi pengantar disusun dalam 12 bab, bukan klaim cakupan seluruh ilmu TIK atau pengganti kurikulum sekolah:

1. Mengenal TIK, data, informasi, dan perkembangan teknologi.
2. Sistem komputer, perangkat keras/lunak, satuan data, serta berkas.
3. Jaringan, internet, DNS, protokol, bandwidth, dan latensi.
4. Pencarian informasi, cek fakta, surel, dan kolaborasi.
5. Dokumen, spreadsheet, rumus, dan presentasi.
6. Analisis data dan dasar basis data relasional/SQL.
7. Berpikir komputasional, algoritma, dan pseudocode.
8. Pemrograman, Python, HTML, CSS, dan JavaScript.
9. Keamanan akun, phishing, privasi, dan cadangan.
10. Etika, hak cipta, aksesibilitas, dan keseimbangan digital.
11. AI, cloud, dan Internet of Things.
12. Penerapan TIK, dampak sosial, dan jalur karier.

### Mengubah materi dan interaksi

- **`tik.html`** menyimpan seluruh materi, proyek, istilah, pertanyaan, dan pembahasan. Bab menggunakan `<details>`/`<summary>` sehingga tetap bisa dibuka tanpa JavaScript. Tautan bab tetap seperti `tik.html#bab-08`.
- **`tik.css`** mengatur tampilan khusus TIK, termasuk tema terang/gelap, responsivitas, fokus keyboard, dan gaya cetak. Gaya bersama tetap ada di `styles.css` dan `pages.css`.
- **`tik.js`** menambahkan pencarian isi bab, filter kelompok, progres, pencarian glosarium, penilaian kuis, serta pemulihan tampilan setelah mencetak. Pencarian dan filter bekerja bersama; hasil pencarian terbuka otomatis. Menghapus pencarian mengembalikan keadaan lipatan sebelumnya.
- Pada setiap `<fieldset>` kuis, `data-answer` berisi nilai jawaban benar. Pembahasan berada di `.tik-quiz-feedback`. Kuis adalah latihan lokal, bukan sistem ujian atau penilaian yang tahan manipulasi.
- Jika menambah bab atau istilah, jaga keunikan ID, pasangan `data-tik-complete`, kategori, tautan, serta jumlah yang tertulis di HTML. Perbarui pengujian jika cakupan materi sengaja berubah.

### Privasi dan progres

Progres hanya disimpan dalam `localStorage` dengan kunci **`ruangakar-tik-progress-v1`**, terpisah dari **`ruangakar-checklist-v1`** milik IPS. Hanya nilai checkbox yang disimpan; jawaban dan skor kuis tidak dikirim atau disimpan. Progres tidak tersinkron antarbrowser/perangkat, dapat hilang ketika data situs dihapus, dan tetap bisa diubah dengan mencentang atau melepas centang tiap bab. Jika penyimpanan diblokir, halaman memberi keterangan bahwa progres hanya berlaku pada sesi halaman tersebut.

Tanpa JavaScript, materi, glosarium, proyek, dan tautan bacaan tetap tersedia; kontrol yang membutuhkan skrip tidak ditampilkan. Font eksternal bersifat opsional dengan font sistem sebagai cadangan. Kode contoh ditampilkan sebagai teks dan tidak dijalankan oleh halaman.

## Fitur

- Tampilan dark mode sebagai tema awal, dengan opsi tema terang yang tersimpan di browser.
- Layout responsif, navigasi mobile, dan dukungan reduced motion.
- Kartu cerita Subak, Noken, Angklung, dan Pantun dengan filter tema.
- Checklist aksi pelestarian yang menyimpan progres secara lokal di browser.
- Ruang TIK dengan pencarian/filter materi, progres mandiri, proyek praktik, glosarium, dan kuis dengan pembahasan.
- Halaman Tentang dengan potret bulat dan ikon sosial media yang tersusun santai.
- Animasi reveal, elemen 3D halus, dan tautan rujukan ke UNESCO.

## Rujukan utama

- [UNESCO — Convention for the Safeguarding of the Intangible Cultural Heritage](https://ich.unesco.org/en/convention)
- [UNESCO World Heritage Centre — Cultural Landscape of Bali Province / Subak](https://whc.unesco.org/en/list/1194/)
- [UNESCO — Indonesian Angklung](https://ich.unesco.org/en/RL/indonesian-angklung-00393)
- [UNESCO — Noken](https://ich.unesco.org/en/USL/noken-multifunctional-knotted-or-woven-bag-handcraft-of-the-people-of-papua-00619)
- [UNESCO — Pantun](https://ich.unesco.org/en/RL/pantun-02274)

Visual utama dibuat khusus untuk proyek ini. Beberapa ilustrasi cerita dibuat sebagai SVG inline. Foto pada halaman Tentang berasal dari gambar yang dikirim pembuat situs.


## Pengujian

Situs tidak membutuhkan npm untuk dijalankan. Untuk pengujian browser opsional (Node.js 20+), pasang alat uji dalam folder cache yang diabaikan Git:

```bash
npm install --prefix .cache/tik-tests --no-audit --no-fund playwright-core axe-core
.cache/tik-tests/node_modules/.bin/playwright-core install chromium
```

Jalankan server statis seperti di atas, lalu pada terminal lain:

```bash
NODE_PATH="$PWD/.cache/tik-tests/node_modules" node --test tests/tik.browser.cjs
node --check tik.js
node --check script.js
git diff --check
```

`SITE_URL` dapat mengganti alamat server, dan `CHROMIUM_PATH` dapat menunjuk executable Chromium yang sudah terpasang. Pada Linux, dependensi sistem browser mungkin perlu dipasang sesuai petunjuk Playwright.

Pengujian mencakup struktur/tautan, pencarian dan filter, tautan langsung ke bab, progres terpisah dari IPS, penyimpanan rusak/diblokir, skor kuis 0/9/10 beserta reset, glosarium, keyboard, menu ponsel, tema, lebar 320–1440 px, materi tanpa JavaScript, keadaan cetak, dan audit aksesibilitas otomatis pada ruang TIK. Audit otomatis tidak menggantikan pemeriksaan manual dengan pembaca layar.
