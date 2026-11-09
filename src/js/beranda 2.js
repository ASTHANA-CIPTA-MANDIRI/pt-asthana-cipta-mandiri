// Bagian beranda yang isinya dikelola dari lemon. Satu permintaan untuk
// semuanya (rute publiknya dibatasi per menit). Bagian tanpa isi tetap
// tersembunyi — situs tidak pernah menampilkan judul tanpa isi.
import { ambil, esc, urlAman, inisial, warnaKe, kartuPortofolio, kartuBerita, munculkan } from "./situs.js";

const tampilkan = (id) => {
  const el = document.getElementById(id);
  el.hidden = false;
  return el;
};

function angka(daftar) {
  if (!daftar.length) return;
  const kolom = daftar.length >= 4 ? "col-6 col-md" : "col-md";
  document.getElementById("daftarAngka").innerHTML = daftar
    .map(
      (a, i) => `
      <div class="${kolom}">
        <div class="angka warna-${warnaKe(i)}">
          ${a.ikon ? `<i class="bi ${esc(a.ikon)} fs-4" style="color:var(--c)"></i>` : ""}
          <span class="nilai" data-hitung="${Number(a.nilai) || 0}" data-akhiran="${esc(a.akhiran || "")}">0${esc(a.akhiran || "")}</span>
          <span class="label">${esc(a.label)}</span>
        </div>
      </div>`
    )
    .join("");
  munculkan(tampilkan("pitaAngka"));
  hitungNaik();
}

// Angka berjalan naik saat pitanya terlihat.
function hitungNaik() {
  const diam = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = document.querySelectorAll("[data-hitung]");
  const jalan = (n) => {
    const target = Number(n.dataset.hitung);
    const akhiran = n.dataset.akhiran;
    const format = (x) => Math.round(x).toLocaleString("id-ID") + akhiran;
    if (diam) return (n.textContent = format(target));
    const mulai = performance.now();
    const langkah = (t) => {
      const p = Math.min(1, (t - mulai) / 1400);
      n.textContent = format(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(langkah);
    };
    requestAnimationFrame(langkah);
  };
  const io = new IntersectionObserver((e) => e.forEach((x) => x.isIntersecting && (jalan(x.target), io.unobserve(x.target))));
  el.forEach((n) => io.observe(n));
}

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
    angka(data.angka || []);
    grid("daftarPortofolio", "bagianPortofolio", data.portofolio || [], kartuPortofolio);
    klien(data.klien || []);
    testimoni(data.testimoni || []);
    grid("daftarBerita", "bagianBerita", data.berita || [], kartuBerita);
  })
  // Gagal memuat = beranda tetap utuh tanpa bagian dinamis; tidak perlu
  // mengganggu pengunjung dengan pesan galat.
  .catch((e) => console.warn("Isi beranda dari lemon tidak termuat:", e));
