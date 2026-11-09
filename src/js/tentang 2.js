// Tim manajemen dari lemon. Tanpa data, bagiannya tetap tersembunyi.
import { ambil, esc, urlAman, inisial, warnaKe, munculkan } from "./situs.js";

ambil("/situs/tim")
  .then(({ data }) => {
    if (!data?.length) return;
    document.getElementById("daftarTim").innerHTML = data
      .map((t, i) => {
        const foto = urlAman(t.foto_url);
        const li = urlAman(t.linkedin);
        return `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="kartu-tim warna-${warnaKe(i)}">
            <div class="foto">
              ${foto ? `<img src="${esc(foto)}" alt="${esc(t.nama)}" loading="lazy" />` : `<span class="inisial">${esc(inisial(t.nama))}</span>`}
            </div>
            <h3>${esc(t.nama)}</h3>
            <p>${esc(t.jabatan)}</p>
            ${li ? `<a class="tautan-li" href="${esc(li)}" target="_blank" rel="noopener" aria-label="LinkedIn ${esc(t.nama)}"><i class="bi bi-linkedin"></i></a>` : ""}
          </div>
        </div>`;
      })
      .join("");
    const bagian = document.getElementById("bagianTim");
    bagian.hidden = false;
    munculkan(bagian);
  })
  .catch((e) => console.warn("Tim tidak termuat:", e));
