# PT. Asthana Cipta Mandiri — Situs Profil Perusahaan

Situs multi-halaman dua bahasa (Vite + Bootstrap 5). Isi dinamis — lowongan,
lamaran, pesan, portofolio, berita, klien, testimoni, tim, dan angka — diambil
dari API **Phoenix** dan dikelola admin lewat lemon (menu **Situs Asthana**
dan **Karyawan & Karir**).

## Halaman

| Indonesia | English | Isi |
| --- | --- | --- |
| `/` | `/en/` | Beranda (+ angka, portofolio unggulan, klien, testimoni, berita dari lemon) |
| `/tentang/` | `/en/about/` | Profil, visi-misi, tim manajemen (lemon), nilai |
| `/layanan/` | `/en/services/` | Layanan teknologi & pariwisata, alur kerja |
| `/anak-perusahaan/` | `/en/subsidiaries/` | Orcha Journey & Reka Teknologi |
| `/portofolio/` (+ `detail.html?slug=`) | `/en/portfolio/` | Portofolio (lemon) |
| `/berita/` (+ `baca.html?slug=`) | `/en/news/` (+ `read.html`) | Berita (lemon) |
| `/kontak/` | `/en/contact/` | Formulir pesan → lemon "Pesan Masuk", peta |
| `/karir/` (+ `detail.html`, `formulir.html`) | `/en/careers/` (+ `apply.html`) | Lowongan & lamaran → lemon |
| `/kebijakan-privasi/` | `/en/privacy/` | Kebijakan privasi |
| `/404.html` | | Halaman tidak ditemukan |

Setiap berkas `.html` di luar `src/ public/ partials/ data/ alat/` otomatis
ikut di-build — tidak perlu didaftarkan.

Isi dari API (judul portofolio, berita, dll.) tampil dalam bahasa aslinya di
kedua versi; yang diterjemahkan hanya teks halaman.

## Data perusahaan — satu tempat

Alamat, WhatsApp, email, jam kerja, dan tautan media sosial ada di
**`data/perusahaan.json`**. Dipakai di semua halaman lewat `{{p.kunci}}`.
Tautan media sosial yang kosong otomatis disembunyikan (`data-jika="kunci"`).
Setelah mengubahnya, buat ulang PDF company profile (lihat di bawah).

## Potongan bersama

```html
<!-- @include head padanan="/en/about/" judul="Tentang Kami" deskripsi="..." -->
<!-- @include header padanan="/en/about/" aktif="tentang" -->   (EN: header-en)
<!-- @include footer -->                                         (EN: footer-en)
```

`padanan` = halaman yang sama di bahasa lain (tombol ID/EN & hreflang).
`aktif` cocok dengan `data-nav` di header.

## Gaya & skrip

- `src/css/site.css` — seluruh sistem desain. Warna komponen lewat kelas
  `warna-biru|laut|oranye|hijau|ungu|jambu`.
- `src/js/situs.js` — ambil API, pembersih HTML isi artikel, kartu.
- `src/js/bahasa.js` — `t("teks id", "english text")` & alamat per bahasa.

## Konfigurasi (`.env`, lihat `.env.example`)

| Kunci | Guna |
| --- | --- |
| `VITE_API_URL` | Alamat API Phoenix, mis. `https://phoenixdigitalwarehouse.com/api` |
| `VITE_SITE_URL` | Alamat situs ini. Wajib untuk `sitemap.xml`, URL kanonik, hreflang, dan gambar pratinjau tautan |
| `VITE_GA_ID` | ID Google Analytics (opsional) |

## Perintah

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
npm run build          # hasil di dist/ (+ sitemap.xml, robots.txt)
npm run profil:pdf     # buat ulang public/company-profile-asthana.pdf (butuh Google Chrome)
```

`alat/og-image.html` adalah sumber `public/og-image.png` (gambar pratinjau
saat tautan dibagikan). `public/.htaccess` memasang halaman 404 di hosting
Apache.
