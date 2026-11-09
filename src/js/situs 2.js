// Alat bersama untuk isi situs yang diambil dari lemon (/api/situs/*).
import { API_BASE_URL } from "./config.js";
import { t, LOKAL, jalur, labelKategori } from "./bahasa.js";

export async function ambil(jalur) {
  const res = await fetch(`${API_BASE_URL}${jalur}`, { headers: { Accept: "application/json" } });
  if (res.status === 404) return { tidakAda: true };
  if (!res.ok) throw new Error(`API ${jalur}: ${res.status}`);
  return res.json();
}

export function esc(teks) {
  return String(teks ?? "").replace(
    /[&<>"']/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m]
  );
}

/** Hanya http(s) — tautan dari basis data tidak boleh menjadi javascript:. */
export function urlAman(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}

export function tanggal(iso, panjang = true) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(LOKAL, {
    day: "numeric",
    month: panjang ? "long" : "short",
    year: "numeric",
  });
}

export function inisial(nama) {
  return String(nama || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Isi artikel ditulis admin lewat penyunting teks. Tetap dibersihkan sebelum
 * dipasang: buang skrip, bingkai, gaya, atribut on*, dan tautan javascript:.
 */
const TAG_BOLEH = new Set([
  "P", "BR", "STRONG", "B", "EM", "I", "U", "S", "A", "UL", "OL", "LI", "H2", "H3", "H4",
  "BLOCKQUOTE", "IMG", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "SPAN", "PRE", "CODE", "HR",
]);
export function htmlAman(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
  const akar = doc.body.firstElementChild;
  const jalan = (el) => {
    [...el.children].forEach((anak) => {
      if (!TAG_BOLEH.has(anak.tagName)) {
        // Elemen berbahaya dibuang beserta isinya; yang sekadar tak dikenal
        // (div, section) dibuka bungkusnya supaya teksnya tetap tampil.
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "FORM", "INPUT"].includes(anak.tagName)) {
          anak.remove();
          return;
        }
        jalan(anak);
        anak.replaceWith(...anak.childNodes);
        return;
      }
      [...anak.attributes].forEach((a) => {
        const n = a.name.toLowerCase();
        const boleh = ["href", "src", "alt", "title", "colspan", "rowspan"].includes(n);
        if (!boleh) anak.removeAttribute(a.name);
        if ((n === "href" || n === "src") && !urlAman(a.value)) anak.removeAttribute(a.name);
      });
      if (anak.tagName === "A") {
        anak.setAttribute("target", "_blank");
        anak.setAttribute("rel", "noopener");
      }
      if (anak.tagName === "IMG") anak.setAttribute("loading", "lazy");
      jalan(anak);
    });
  };
  jalan(akar);
  return akar.innerHTML;
}

const WARNA = ["biru", "ungu", "laut", "hijau", "oranye", "jambu"];
export const warnaKe = (i) => WARNA[i % WARNA.length];

export function kartuPortofolio(p, i = 0) {
  // Laut = tanda Pariwisata di seluruh situs; teknologi bergilir di warna lain.
  const warna = p.kategori === "pariwisata" ? "laut" : ["biru", "ungu", "hijau", "jambu"][i % 4];
  const sampul = urlAman(p.sampul_url);
  return `
    <a class="kartu-karya warna-${warna}" href="${jalur.portofolioDetail}?slug=${encodeURIComponent(p.slug)}">
      <div class="sampul">
        ${sampul ? `<img src="${esc(sampul)}" alt="" loading="lazy" />` : `<span class="tanpa-gambar"><i class="bi ${p.kategori === "pariwisata" ? "bi-airplane" : "bi-cpu"}"></i></span>`}
        <span class="lencana"><i class="bi ${p.kategori === "pariwisata" ? "bi-airplane" : "bi-cpu"}"></i> ${esc(labelKategori(p.kategori, p.kategori_label))}</span>
      </div>
      <div class="isi">
        <h3>${esc(p.judul)}</h3>
        ${p.ringkasan ? `<p>${esc(p.ringkasan)}</p>` : ""}
        <div class="meta">
          <span>${esc([p.klien, p.tahun].filter(Boolean).join(" · "))}</span>
          <span class="tautan-panah">${t("Lihat", "View")} <i class="bi bi-arrow-right"></i></span>
        </div>
      </div>
    </a>`;
}

export function kartuBerita(b, i = 0) {
  const sampul = urlAman(b.sampul_url);
  return `
    <a class="kartu-karya warna-${warnaKe(i + 2)}" href="${jalur.beritaBaca}?slug=${encodeURIComponent(b.slug)}">
      <div class="sampul">
        ${sampul ? `<img src="${esc(sampul)}" alt="" loading="lazy" />` : `<span class="tanpa-gambar"><i class="bi bi-newspaper"></i></span>`}
        ${b.kategori ? `<span class="lencana">${esc(b.kategori)}</span>` : ""}
      </div>
      <div class="isi">
        <h3>${esc(b.judul)}</h3>
        ${b.ringkasan ? `<p>${esc(b.ringkasan)}</p>` : ""}
        <div class="meta">
          <span><i class="bi bi-calendar3 me-1"></i>${tanggal(b.terbit_at, false)}</span>
          <span class="tautan-panah">${t("Baca", "Read")} <i class="bi bi-arrow-right"></i></span>
        </div>
      </div>
    </a>`;
}

/** Elemen baru di halaman yang sudah tampil: aktifkan animasi muncul. */
export function munculkan(akar) {
  akar.querySelectorAll("[data-muncul]").forEach((el) => el.classList.add("tampak"));
}

export function kerangkaKartu(n = 3) {
  return Array.from({ length: n }, () => `
    <div class="col-md-6 col-lg-4">
      <div class="kartu-karya">
        <div class="sampul kerangka"></div>
        <div class="isi">
          <div class="kerangka kerangka-baris" style="width:80%;height:18px"></div>
          <div class="kerangka kerangka-baris"></div>
          <div class="kerangka kerangka-baris" style="width:60%"></div>
        </div>
      </div>
    </div>`).join("");
}
