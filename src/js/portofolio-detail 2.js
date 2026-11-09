import { t, labelKategori } from "./bahasa.js";
import { ambil, esc, urlAman, htmlAman, kartuPortofolio, munculkan } from "./situs.js";

const $ = (id) => document.getElementById(id);
const slug = new URLSearchParams(location.search).get("slug");

function galat() {
  $("kepalaMemuat").hidden = true;
  $("galatKarya").hidden = false;
  document.title = t("Portofolio tidak ditemukan", "Project not found") + " | PT. Asthana Cipta Mandiri";
}

if (!slug) galat();
else
  ambil(`/situs/portofolio/${encodeURIComponent(slug)}`)
    .then((r) => {
      if (r.tidakAda) return galat();
      const p = r.data;
      document.title = `${p.judul} | ${t("Portofolio", "Portfolio")} PT. Asthana Cipta Mandiri`;
      const kategori = labelKategori(p.kategori, p.kategori_label);
      document.querySelector('meta[name="description"]')?.setAttribute("content", p.ringkasan || p.judul);

      const pariwisata = p.kategori === "pariwisata";
      $("lencanaKategori").innerHTML = `<i class="bi ${pariwisata ? "bi-airplane" : "bi-cpu"}"></i> ${esc(kategori)}`;
      $("lencanaKategori").classList.add(pariwisata ? "warna-laut" : "warna-biru");
      $("judulKarya").textContent = p.judul;
      $("ringkasKarya").textContent = p.ringkasan || "";

      const sampul = urlAman(p.sampul_url);
      if (sampul) Object.assign($("sampulKarya"), { src: sampul, hidden: false, alt: p.judul });
      $("prosaKarya").innerHTML = p.isi ? htmlAman(p.isi) : `<p>${esc(p.ringkasan || "")}</p>`;

      const galeri = (p.galeri || []).map(urlAman).filter(Boolean);
      if (galeri.length) {
        $("galeriKarya").innerHTML = galeri
          .map((g) => `<a href="${esc(g)}" target="_blank" rel="noopener"><img src="${esc(g)}" alt="" loading="lazy" /></a>`)
          .join("");
        $("bagianGaleri").hidden = false;
      }

      const tautan = urlAman(p.tautan);
      const baris = [
        [t("Kategori", "Category"), esc(kategori)],
        p.klien && [t("Klien", "Client"), esc(p.klien)],
        p.tahun && [t("Tahun", "Year"), esc(p.tahun)],
        tautan && [t("Tautan", "Link"), `<a href="${esc(tautan)}" target="_blank" rel="noopener" class="text-white">${esc(new URL(tautan).hostname)} <i class="bi bi-box-arrow-up-right"></i></a>`],
      ].filter(Boolean);
      $("ringkasProyek").innerHTML = baris
        .map(([k, v]) => `<div style="background:rgba(255,255,255,.08)"><small>${k}</small><strong class="text-white">${v}</strong></div>`)
        .join("");

      $("kepalaMemuat").hidden = true;
      $("kepalaIsi").hidden = false;
      $("isiKarya").hidden = false;

      if (p.lainnya?.length) {
        $("daftarLainnya").innerHTML = p.lainnya.map((x, i) => `<div class="col-md-6 col-lg-4">${kartuPortofolio(x, i)}</div>`).join("");
        $("bagianLainnya").hidden = false;
        munculkan($("bagianLainnya"));
      }
    })
    .catch(galat);
