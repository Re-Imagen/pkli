# RuangAkar

Situs edukasi tentang pelestarian kearifan lokal Indonesia di tengah modernisasi dan globalisasi. Dibangun sebagai situs statis tanpa framework atau dependensi runtime.

## Halaman

| Berkas | Isi |
| --- | --- |
| `index.html` | Beranda RuangAkar: gagasan, empat cerita, jembatan, dan aksi pelestarian. |
| `content.html` | Halaman **Konten** dengan dua bagian: **IPS** (menuju RuangAkar) dan **TIK** (menuju halaman placeholder). |
| `about.html` | Halaman **Tentang**: foto pembuat berbentuk bulat, cerita di balik situs, dan ikon sosial media. |
| `tik.html` | Halaman placeholder untuk ruang **TIK**. |

## Menjalankan secara lokal

```bash
python3 -m http.server 4173
```

Lalu buka `http://localhost:4173`.

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
- Rujukan `styles.css`, `pages.css`, `script.js`, dan `tautan.js` memakai penanda versi (`?v=2`). Jika tampilan atau skrip diubah lagi, naikkan angka versi tersebut agar browser pengunjung mengambil berkas terbaru, bukan versi lama dari cache.

Catatan: bila JavaScript dimatikan sepenuhnya, tautan bagian tidak ditampilkan sama sekali — termasuk saat masuk lewat IPS — karena kondisi `dari=ips` hanya bisa dibaca lewat JavaScript pada situs statis ini.

## Mengganti isi halaman TIK

Halaman TIK saat ini adalah placeholder di `tik.html`. Tautan **TIK** di `content.html` sudah mengarah ke berkas itu, jadi isi halaman bisa diganti kapan saja tanpa mengubah tautan.

## Fitur

- Tampilan dark mode sebagai tema awal, dengan opsi tema terang yang tersimpan di browser.
- Layout responsif, navigasi mobile, dan dukungan reduced motion.
- Kartu cerita Subak, Noken, Angklung, dan Pantun dengan filter tema.
- Checklist aksi pelestarian yang menyimpan progres secara lokal di browser.
- Halaman Tentang dengan potret bulat dan ikon sosial media yang tersusun santai.
- Animasi reveal, elemen 3D halus, dan tautan rujukan ke UNESCO.

## Rujukan utama

- [UNESCO — Convention for the Safeguarding of the Intangible Cultural Heritage](https://ich.unesco.org/en/convention)
- [UNESCO World Heritage Centre — Cultural Landscape of Bali Province / Subak](https://whc.unesco.org/en/list/1194/)
- [UNESCO — Indonesian Angklung](https://ich.unesco.org/en/RL/indonesian-angklung-00393)
- [UNESCO — Noken](https://ich.unesco.org/en/USL/noken-multifunctional-knotted-or-woven-bag-handcraft-of-the-people-of-papua-00619)
- [UNESCO — Pantun](https://ich.unesco.org/en/RL/pantun-02274)

Visual utama dibuat khusus untuk proyek ini. Beberapa ilustrasi cerita dibuat sebagai SVG inline. Foto pada halaman Tentang berasal dari gambar yang dikirim pembuat situs.
