import { ambil, kartuBerita, kerangkaKartu } from "./situs.js";

const daftar = document.getElementById("daftarBerita");
const nomor = document.getElementById("nomorHalaman");
const kosong = document.getElementById("kosongBerita");

async function muat(halaman) {
  daftar.innerHTML = kerangkaKartu(3);
  try {
    const { data, meta } = await ambil(`/situs/berita?halaman=${halaman}`);
    daftar.innerHTML = data.map((b, i) => `<div class="col-md-6 col-lg-4">${kartuBerita(b, i)}</div>`).join("");
    kosong.hidden = data.length !== 0;
    nomorHalaman(meta.halaman, meta.halaman_terakhir);
  } catch {
    daftar.innerHTML = "";
    kosong.hidden = false;
    nomor.hidden = true;
  }
}

function nomorHalaman(kini, akhir) {
  nomor.hidden = akhir <= 1;
  if (akhir <= 1) return;
  const tombol = (label, ke, aktif = false, mati = false) =>
    `<button type="button" data-ke="${ke}" ${aktif ? 'aria-current="page"' : ""} ${mati ? "disabled" : ""}>${label}</button>`;
  let isi = tombol('<i class="bi bi-chevron-left"></i>', kini - 1, false, kini === 1);
  for (let n = 1; n <= akhir; n++) {
    if (n === 1 || n === akhir || Math.abs(n - kini) <= 1) isi += tombol(n, n, n === kini);
    else if (Math.abs(n - kini) === 2) isi += "<span class='align-self-center px-1'>…</span>";
  }
  nomor.innerHTML = isi + tombol('<i class="bi bi-chevron-right"></i>', kini + 1, false, kini === akhir);
}

nomor.addEventListener("click", (e) => {
  const t = e.target.closest("button[data-ke]");
  if (!t || t.disabled) return;
  const ke = Number(t.dataset.ke);
  history.replaceState(null, "", ke > 1 ? `?halaman=${ke}` : location.pathname);
  muat(ke);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

muat(Math.max(1, Number(new URLSearchParams(location.search).get("halaman")) || 1));
