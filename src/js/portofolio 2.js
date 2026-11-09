import { ambil, kartuPortofolio, kerangkaKartu } from "./situs.js";

const daftar = document.getElementById("daftarPortofolio");
const kosong = document.getElementById("kosongPortofolio");
const tombol = [...document.querySelectorAll("#saringPortofolio button")];
let semua = [];

function gambar(kategori) {
  tombol.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.kategori === kategori)));
  const tampil = kategori ? semua.filter((p) => p.kategori === kategori) : semua;
  daftar.innerHTML = tampil.map((p, i) => `<div class="col-md-6 col-lg-4">${kartuPortofolio(p, i)}</div>`).join("");
  kosong.hidden = tampil.length !== 0;
}

daftar.innerHTML = kerangkaKartu(3);

// Sekali ambil, disaring di peramban: daftarnya pendek, dan menyaring tanpa
// permintaan baru terasa instan.
ambil("/situs/portofolio")
  .then(({ data }) => {
    semua = data || [];
    const awal = new URLSearchParams(location.search).get("kategori") || "";
    gambar(["teknologi", "pariwisata"].includes(awal) ? awal : "");
    if (!semua.length) document.getElementById("saringPortofolio").hidden = true;
  })
  .catch(() => {
    daftar.innerHTML = "";
    document.getElementById("saringPortofolio").hidden = true;
    kosong.hidden = false;
  });

tombol.forEach((t) =>
  t.addEventListener("click", () => {
    const k = t.dataset.kategori;
    history.replaceState(null, "", k ? `?kategori=${k}` : location.pathname);
    gambar(k);
  })
);
