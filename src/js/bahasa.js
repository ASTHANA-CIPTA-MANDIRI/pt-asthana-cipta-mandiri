// Bahasa halaman (dari <html lang>). Halaman berbahasa Inggris tinggal di /en/.
export const EN = document.documentElement.lang === "en";

/** t("Teks Indonesia", "English text") */
export const t = (id, en) => (EN ? en : id);

export const LOKAL = EN ? "en-GB" : "id-ID";

/** Alamat halaman sesuai bahasa. */
export const jalur = EN
  ? {
      portofolioDetail: "/en/portfolio/detail.html",
      beritaBaca: "/en/news/read.html",
      karir: "/en/careers/",
      karirDetail: "/en/careers/detail.html",
      karirFormulir: "/en/careers/apply.html",
    }
  : {
      portofolioDetail: "/portofolio/detail.html",
      beritaBaca: "/berita/baca.html",
      karir: "/karir/",
      karirDetail: "/karir/detail.html",
      karirFormulir: "/karir/formulir.html",
    };

/** Label kategori portofolio — API mengirim label Indonesia. */
export const labelKategori = (kunci, label) =>
  EN ? { teknologi: "Technology", pariwisata: "Tourism" }[kunci] || label : label;
