// Bagian beranda yang isinya dikelola dari lemon. Satu permintaan untuk
// semuanya (rute publiknya dibatasi per menit). Bagian tanpa isi tetap
// tersembunyi — situs tidak pernah menampilkan judul tanpa isi.
import { ambil, esc, urlAman, inisial, warnaKe, kartuPortofolio, kartuBerita, munculkan } from "./situs.js";

const tampilkan = (id) => {
  const el = document.getElementById(id);
  el.hidden = false;
  return el;
};

function klien(daftar) {
  if (!daftar.length) return;
  const logo = daftar
    .map((k) => {
      const gambar = urlAman(k.logo_url);
      const isi = gambar
        ? `<img src="${esc(gambar)}" alt="${esc(k.nama)}" title="${esc(k.nama)}" />`
        : `<span class="fw-bold text-secondary text-nowrap">${esc(k.nama)}</span>`;
      const tautan = urlAman(k.tautan);
      return tautan ? `<a href="${esc(tautan)}" target="_blank" rel="noopener">${isi}</a>` : `<span>${isi}</span>`;
    })
    .join("");
  // Diulang dua kali supaya geser -50% menyambung tanpa jeda; sedikit logo
  // diulang lebih banyak agar jalurnya cukup panjang.
  const ulang = Math.max(2, Math.ceil(12 / daftar.length) * 2);
  const jalur = document.getElementById("daftarKlien");
  jalur.innerHTML = Array(ulang).fill(logo).join("");
  [...jalur.children].forEach((el, i) => i >= daftar.length && el.setAttribute("aria-hidden", "true"));
  tampilkan("bagianKlien");
}

function testimoni(daftar) {
  if (!daftar.length) return;
  document.getElementById("daftarTestimoni").innerHTML = daftar
    .slice(0, 6)
    .map((t, i) => {
      const foto = urlAman(t.foto_url);
      const sub = [t.jabatan, t.perusahaan].filter(Boolean).join(", ");
      return `
      <div class="col-md-6 col-lg-4">
        <figure class="kartu-testimoni warna-${warnaKe(i)} m-0">
          <div class="bintang" aria-label="${t.bintang} / 5">${"★".repeat(t.bintang)}${"☆".repeat(5 - t.bintang)}</div>
          <blockquote>${esc(t.isi)}</blockquote>
          <figcaption class="orang">
            ${foto ? `<img src="${esc(foto)}" alt="" loading="lazy" />` : `<span class="inisial">${esc(inisial(t.nama))}</span>`}
            <span><strong>${esc(t.nama)}</strong>${sub ? `<small>${esc(sub)}</small>` : ""}</span>
          </figcaption>
        </figure>
      </div>`;
    })
    .join("");
  munculkan(tampilkan("bagianTestimoni"));
}

function grid(id, bagian, daftar, kartu) {
  if (!daftar.length) return;
  document.getElementById(id).innerHTML = daftar.map((x, i) => `<div class="col-md-6 col-lg-4">${kartu(x, i)}</div>`).join("");
  munculkan(tampilkan(bagian));
}

ambil("/situs/beranda")
  .then(({ data }) => {
    grid("daftarPortofolio", "bagianPortofolio", data.portofolio || [], kartuPortofolio);
    klien(data.klien || []);
    testimoni(data.testimoni || []);
    grid("daftarBerita", "bagianBerita", data.berita || [], kartuBerita);
  })
  // Gagal memuat = beranda tetap utuh tanpa bagian dinamis; tidak perlu
  // mengganggu pengunjung dengan pesan galat.
  .catch((e) => console.warn("Isi beranda dari lemon tidak termuat:", e));
