import { t } from "./bahasa.js";
import { ambil, esc, urlAman, htmlAman, tanggal, kartuBerita, munculkan } from "./situs.js";

const $ = (id) => document.getElementById(id);
const slug = new URLSearchParams(location.search).get("slug");

function galat() {
  $("kepalaMemuat").hidden = true;
  $("galatBerita").hidden = false;
  document.title = t("Berita tidak ditemukan", "Article not found") + " | PT. Asthana Cipta Mandiri";
}

if (!slug) galat();
else
  ambil(`/situs/berita/${encodeURIComponent(slug)}`)
    .then((r) => {
      if (r.tidakAda) return galat();
      const b = r.data;
      document.title = `${b.judul} | PT. Asthana Cipta Mandiri`;
      document.querySelector('meta[name="description"]')?.setAttribute("content", b.ringkasan || b.judul);

      if (b.kategori) Object.assign($("lencanaBerita"), { textContent: b.kategori, hidden: false });
      $("judulBerita").textContent = b.judul;
      $("tanggalBerita").innerHTML = `<i class="bi bi-calendar3 me-2"></i>${esc(tanggal(b.terbit_at))}`;

      const sampul = urlAman(b.sampul_url);
      if (sampul) Object.assign($("sampulBerita"), { src: sampul, hidden: false, alt: b.judul });
      $("prosaBerita").innerHTML = b.isi ? htmlAman(b.isi) : `<p>${esc(b.ringkasan || "")}</p>`;

      const url = encodeURIComponent(location.href);
      $("bagiWa").href = `https://wa.me/?text=${encodeURIComponent(b.judul + " — ")}${url}`;
      $("bagiLi").href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      $("salinTautan").addEventListener("click", async (e) => {
        // Diambil sebelum await: sesudahnya currentTarget sudah null.
        const tombol = e.currentTarget;
        try {
          await navigator.clipboard.writeText(location.href);
          tombol.innerHTML = `<i class="bi bi-check2 me-1"></i>${t("Tersalin", "Copied")}`;
        } catch {
          prompt(t("Salin tautan ini:", "Copy this link:"), location.href);
        }
      });

      $("kepalaMemuat").hidden = true;
      $("kepalaIsi").hidden = false;
      $("isiBerita").hidden = false;

      if (b.lainnya?.length) {
        $("daftarLainnya").innerHTML = b.lainnya.map((x, i) => `<div class="col-md-6 col-lg-4">${kartuBerita(x, i)}</div>`).join("");
        $("bagianLainnya").hidden = false;
        munculkan($("bagianLainnya"));
      }
    })
    .catch(galat);
