import { t } from "./bahasa.js";
import { PHOENIX_URL } from "./config.js";
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

      // Artikel dari blog Orcha Journey: sebut sumbernya + tautan ke aslinya.
      const asli = b.sumber === "orcha" ? urlAman(b.tautan_asli) : "";
      if (asli) {
        $("prosaBerita").insertAdjacentHTML(
          "beforeend",
          `<p class="sumber-berita"><i class="bi bi-airplane me-1"></i>${t("Artikel ini dari blog", "This article is from the")} <a href="${esc(asli)}" target="_blank" rel="noopener">Orcha Journey</a>${t(", anak perusahaan kami.", " blog, our subsidiary.")}</p>`
        );
      }

      // Lewat lemon: pratinjau WhatsApp/LinkedIn berisi judul & sampul berita ini.
      const tautanBagi = `${PHOENIX_URL}/situs/berita/${encodeURIComponent(slug)}`;
      const url = encodeURIComponent(tautanBagi);
      $("bagiWa").href = `https://wa.me/?text=${encodeURIComponent(b.judul + " — ")}${url}`;
      $("bagiLi").href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      $("salinTautan").addEventListener("click", async (e) => {
        // Diambil sebelum await: sesudahnya currentTarget sudah null.
        const tombol = e.currentTarget;
        try {
          await navigator.clipboard.writeText(tautanBagi);
          tombol.innerHTML = `<i class="bi bi-check2 me-1"></i>${t("Tersalin", "Copied")}`;
        } catch {
          prompt(t("Salin tautan ini:", "Copy this link:"), tautanBagi);
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
