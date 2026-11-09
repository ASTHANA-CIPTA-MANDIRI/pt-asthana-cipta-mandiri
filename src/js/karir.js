// Halaman daftar lowongan: muat dari lemon, saring (cari, unit, jenis), dan
// tampilkan jumlah posisi terbuka.
import { API_BASE_URL } from "./config.js";
import { t } from "./bahasa.js";
import { munculkan, esc, urlAman, inisial, warnaKe } from "./situs.js";
import { UNIT, JENIS, kartuLowongan } from "./lowongan.js";

const el = {
  memuat: document.getElementById("loadingState"),
  daftar: document.getElementById("jobsList"),
  kosong: document.getElementById("emptyState"),
  tidakCocok: document.getElementById("noMatchState"),
  saringan: document.getElementById("saringanLowongan"),
  cari: document.getElementById("cariLowongan"),
  chipUnit: document.getElementById("chipUnit"),
  pilihJenis: document.getElementById("pilihJenis"),
  jumlah: document.querySelectorAll("[data-jumlah-lowongan]"),
  angka: document.querySelector("[data-jumlah-angka]"),
  ringkasJumlah: document.getElementById("ringkasJumlah"),
  galat: document.getElementById("alertContainer"),
};

const saring = { kata: "", unit: "", jenis: "" };
let semua = [];

async function init() {
  try {
    const res = await fetch(`${API_BASE_URL}/jobs`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    semua = (await res.json()).data || [];
  } catch (e) {
    console.error("Gagal memuat lowongan:", e);
    tampilkanGalat(t("Gagal memuat daftar lowongan. Silakan muat ulang halaman.", "Could not load job openings. Please refresh the page."));
    semua = [];
  }

  el.memuat.hidden = true;
  tulisJumlah(semua.length);

  if (!semua.length) {
    el.kosong.hidden = false;
    return;
  }

  bangunSaringan();
  gambar();
}

function tulisJumlah(n) {
  if (el.angka) el.angka.textContent = n;
  el.jumlah.forEach((x) => {
    x.textContent = n ? t(`${n} posisi terbuka`, `${n} open position${n > 1 ? "s" : ""}`) : t("Belum ada posisi terbuka", "No open positions yet");
    x.hidden = false;
  });
}

/** Saringan hanya menampilkan pilihan yang memang ada datanya. */
function bangunSaringan() {
  const unitAda = [...new Set(semua.map((j) => j.unit || "asthana"))];
  const jenisAda = [...new Set(semua.map((j) => j.jenis).filter(Boolean))];

  // Chip unit baru berguna bila lowongannya tersebar di lebih dari satu unit.
  if (unitAda.length > 1) {
    const chip = (kunci, label, jumlah, ikon = "") =>
      `<button type="button" class="chip-saring" data-unit="${kunci}" aria-pressed="${kunci === saring.unit}">
        ${ikon ? `<img src="${ikon}" alt="" width="20" height="20" />` : ""}${label}<span>${jumlah}</span>
      </button>`;
    el.chipUnit.innerHTML =
      chip("", t("Semua", "All"), semua.length) +
      Object.entries(UNIT)
        .filter(([k]) => unitAda.includes(k))
        .map(([k, u]) => chip(k, u.pendek, semua.filter((j) => (j.unit || "asthana") === k).length, u.ikon))
        .join("");
    el.chipUnit.addEventListener("click", (e) => {
      const tombol = e.target.closest("[data-unit]");
      if (!tombol) return;
      saring.unit = tombol.dataset.unit;
      el.chipUnit.querySelectorAll("[data-unit]").forEach((b) => b.setAttribute("aria-pressed", b === tombol));
      gambar();
    });
  } else {
    el.chipUnit.remove();
  }

  if (jenisAda.length > 1) {
    el.pilihJenis.innerHTML =
      `<option value="">${t("Semua jenis", "All types")}</option>` +
      Object.entries(JENIS)
        .filter(([k]) => jenisAda.includes(k))
        .map(([k, label]) => `<option value="${k}">${label()}</option>`)
        .join("");
    el.pilihJenis.addEventListener("change", () => {
      saring.jenis = el.pilihJenis.value;
      gambar();
    });
  } else {
    el.pilihJenis.closest(".kotak-pilih")?.remove();
  }

  el.cari.addEventListener("input", () => {
    saring.kata = el.cari.value.trim().toLowerCase();
    gambar();
  });

  // Pencarian tetap berguna mulai 4 lowongan; di bawah itu saringan disembunyikan.
  el.saringan.hidden = semua.length < 4 && unitAda.length < 2 && jenisAda.length < 2;
}

function cocok(job) {
  if (saring.unit && (job.unit || "asthana") !== saring.unit) return false;
  if (saring.jenis && job.jenis !== saring.jenis) return false;
  if (saring.kata) {
    const teks = [job.title, job.ringkasan, job.lokasi, UNIT[job.unit]?.nama].filter(Boolean).join(" ").toLowerCase();
    if (!teks.includes(saring.kata)) return false;
  }
  return true;
}

function gambar() {
  const hasil = semua.filter(cocok);
  el.daftar.innerHTML = hasil
    .map((job, i) => `<div class="col-md-6 col-lg-4" data-muncul style="--tunda:${(i % 3) * 0.06}s">${kartuLowongan(job)}</div>`)
    .join("");
  el.daftar.hidden = !hasil.length;
  el.tidakCocok.hidden = !!hasil.length;
  if (el.ringkasJumlah) {
    el.ringkasJumlah.textContent =
      hasil.length === semua.length
        ? t(`Menampilkan ${semua.length} posisi`, `Showing ${semua.length} position${semua.length > 1 ? "s" : ""}`)
        : t(`${hasil.length} dari ${semua.length} posisi`, `${hasil.length} of ${semua.length} positions`);
  }
  munculkan(el.daftar);
}

document.getElementById("hapusSaringan")?.addEventListener("click", () => {
  saring.kata = saring.unit = saring.jenis = "";
  el.cari.value = "";
  if (el.pilihJenis.isConnected) el.pilihJenis.value = "";
  el.chipUnit.querySelectorAll?.("[data-unit]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.unit === ""));
  gambar();
});

function tampilkanGalat(pesan) {
  const a = document.createElement("div");
  a.className = "alert alert-danger alert-dismissible fade show";
  a.setAttribute("role", "alert");
  a.innerHTML = `${pesan}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  el.galat.appendChild(a);
  setTimeout(() => a.remove(), 6000);
}

/** Kutipan karyawan dari lemon; bagiannya tetap tersembunyi bila kosong. */
async function muatSuara() {
  try {
    const res = await fetch(`${API_BASE_URL}/situs/karir`, { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    const daftar = (await res.json()).data?.suara_karyawan || [];
    if (!daftar.length) return;
    const wadah = document.getElementById("daftarSuara");
    wadah.innerHTML = daftar
      .map((s, i) => {
        const foto = urlAman(s.foto_url);
        return `
        <div class="col-md-6 col-lg-4" data-muncul style="--tunda:${(i % 3) * 0.06}s">
          <figure class="kartu-suara warna-${warnaKe(i)}">
            <blockquote>${esc(s.isi)}</blockquote>
            <figcaption>
              ${foto ? `<img class="foto-suara" src="${esc(foto)}" alt="" loading="lazy" />` : `<span class="inisial-suara">${esc(inisial(s.nama))}</span>`}
              <span><strong>${esc(s.nama)}</strong><small>${esc([s.jabatan, s.perusahaan].filter(Boolean).join(" · "))}</small></span>
            </figcaption>
          </figure>
        </div>`;
      })
      .join("");
    document.getElementById("bagianSuara").hidden = false;
    munculkan(wadah);
  } catch {
    // Bagian tambahan: diam saja bila gagal.
  }
}

init();
muatSuara();
