// Struktur organisasi dari lemon (Tim + atasan langsung). Tanpa data,
// bagiannya tetap tersembunyi.
import { ambil, esc, urlAman, inisial, munculkan } from "./situs.js";

// Warna per tingkat bagan: puncak biru, lalu toska, hijau, oranye.
const WARNA_TINGKAT = ["biru", "laut", "hijau", "oranye"];

function simpul(t, tingkat) {
  const foto = urlAman(t.foto_url);
  const li = urlAman(t.linkedin);
  return `
    <div class="simpul warna-${WARNA_TINGKAT[Math.min(tingkat, WARNA_TINGKAT.length - 1)]}">
      <span class="foto">${foto ? `<img src="${esc(foto)}" alt="${esc(t.nama)}" loading="lazy" />` : `<span class="inisial">${esc(inisial(t.nama))}</span>`}</span>
      <span class="teks">
        <strong>${esc(t.nama)}</strong>
        <small>${esc(t.jabatan)}</small>
      </span>
      ${li ? `<a class="tautan-li" href="${esc(li)}" target="_blank" rel="noopener" aria-label="LinkedIn ${esc(t.nama)}"><i class="bi bi-linkedin"></i></a>` : ""}
    </div>`;
}

function cabang(induk, anak, tingkat) {
  const daftar = anak.get(induk) || [];
  if (!daftar.length) return "";
  return `<ul>${daftar
    .map((t) => `<li>${simpul(t, tingkat)}${cabang(t.id, anak, tingkat + 1)}</li>`)
    .join("")}</ul>`;
}

ambil("/situs/tim")
  .then(({ data }) => {
    if (!data?.length) return;

    // Atasan yang disembunyikan/terhapus → orangnya dianggap di puncak.
    const ada = new Set(data.map((t) => t.id));
    const anak = new Map();
    data.forEach((t) => {
      const induk = t.atasan_id && ada.has(t.atasan_id) ? t.atasan_id : null;
      if (!anak.has(induk)) anak.set(induk, []);
      anak.get(induk).push(t); // urutan dari lemon dipertahankan
    });

    const wadah = document.getElementById("daftarTim");
    wadah.innerHTML = cabang(null, anak, 0);
    const bagian = document.getElementById("bagianTim");
    bagian.hidden = false;
    munculkan(bagian);
  })
  .catch((e) => console.warn("Tim tidak termuat:", e));
