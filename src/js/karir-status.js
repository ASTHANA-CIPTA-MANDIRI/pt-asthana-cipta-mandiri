// Cek status lamaran: nomor lamaran + email → tahap seleksi dari lemon.
import { API_BASE_URL } from "./config.js";
import { t, jalur } from "./bahasa.js";
import { esc } from "./situs.js";
import { UNIT, tanggalPanjang } from "./lowongan.js";

const form = document.getElementById("formStatus");
const nomor = document.getElementById("nomor");
const email = document.getElementById("emailStatus");
const tombol = document.getElementById("tombolCek");
const hasil = document.getElementById("hasilStatus");

// Tahap berurutan; "ditolak" menggantikan langkah terakhir.
const TAHAP = [
  ["baru", "bi-inbox", () => t("Diterima sistem", "Received")],
  ["diseleksi", "bi-file-earmark-check", () => t("Seleksi berkas", "Screening")],
  ["wawancara", "bi-chat-square-text", () => t("Wawancara", "Interview")],
  ["diterima", "bi-trophy", () => t("Diterima", "Hired")],
];

const LABEL_EN = { baru: "Received", diseleksi: "Screening", wawancara: "Interview", diterima: "Hired", ditolak: "Not selected" };

// Keterangan untuk pelamar (versi Inggris; versi Indonesia dari lemon).
const KETERANGAN_EN = {
  baru: "We have received your application and it is waiting to be reviewed.",
  diseleksi: "Our team is reviewing your CV and documents.",
  wawancara: "You passed screening. Our team will contact you to schedule an interview.",
  diterima: "Congratulations! You have been hired. Our team will contact you about next steps.",
  ditolak: "Thank you for your interest. For now your profile is not the right fit for this role.",
};

const params = new URLSearchParams(location.search);
if (params.get("nomor")) nomor.value = params.get("nomor").toUpperCase();
(nomor.value ? email : nomor).focus();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const n = nomor.value.trim().toUpperCase();
  const m = email.value.trim();
  tandai(nomor, !!n, t("Nomor lamaran wajib diisi", "Application number is required"));
  tandai(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m), t("Masukkan email yang valid", "Enter a valid email"));
  if (!n || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) return;

  tombol.disabled = true;
  tombol.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
  try {
    const res = await fetch(`${API_BASE_URL}/applications/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ nomor: n, email: m }),
    });
    if (res.status === 429) {
      return tampilkanPesan("bi-hourglass-split", t("Terlalu banyak percobaan", "Too many attempts"), t("Coba lagi dalam beberapa menit.", "Please try again in a few minutes."));
    }
    const data = await res.json();
    if (!res.ok) {
      return tampilkanPesan("bi-search", t("Lamaran tidak ditemukan", "Application not found"),
        t("Periksa kembali nomor lamaran dan email yang Anda pakai saat melamar.", "Please check the application number and the email you applied with."));
    }
    gambarHasil(data.data);
  } catch {
    tampilkanPesan("bi-wifi-off", t("Gagal terhubung", "Connection failed"), t("Periksa koneksi Anda lalu coba lagi.", "Check your connection and try again."));
  } finally {
    tombol.disabled = false;
    tombol.innerHTML = `<i class="bi bi-search me-1"></i>${t("Cek", "Check")}`;
  }
});

function tandai(input, valid, pesan) {
  input.classList.toggle("is-invalid", !valid);
  const fb = input.closest(".medan").querySelector(".invalid-feedback");
  fb.textContent = valid ? "" : pesan;
  fb.style.display = valid ? "" : "block";
}

function tampilkanPesan(ikon, judul, isi) {
  hasil.hidden = false;
  hasil.innerHTML = `
    <div class="hasil-kosong">
      <span class="ikon-petak warna-oranye"><i class="bi ${ikon}"></i></span>
      <div><strong>${judul}</strong><p class="mb-0">${isi}</p></div>
    </div>`;
}

function gambarHasil(d) {
  const ditolak = d.status === "ditolak";
  const posisiKini = ditolak ? 1 : Math.max(0, TAHAP.findIndex(([k]) => k === d.status));
  const unit = UNIT[d.unit] ?? UNIT.asthana;
  const keterangan = t(d.keterangan, KETERANGAN_EN[d.status] ?? "");

  const langkah = TAHAP.map(([kunci, ikon, label], i) => {
    let kelas = i < posisiKini ? "selesai" : i === posisiKini ? "kini" : "";
    let teks = label();
    let ik = i < posisiKini ? "bi-check-lg" : ikon;
    if (ditolak && i === TAHAP.length - 1) {
      kelas = "berhenti";
      teks = t("Belum sesuai", "Not selected");
      ik = "bi-x-lg";
    }
    if (ditolak && i > posisiKini && i < TAHAP.length - 1) kelas = "lewat";
    return `<li class="${kelas}"><span class="titik-tahap"><i class="bi ${ik}"></i></span><span>${teks}</span></li>`;
  }).join("");

  hasil.hidden = false;
  hasil.innerHTML = `
    <div class="kepala-hasil">
      <span class="unit-lowongan"><img src="${unit.ikon}" alt="" width="28" height="28" />${esc(unit.nama)}</span>
      <span class="nomor-hasil">${esc(d.nomor)}</span>
    </div>
    <h2 class="h4 mb-1">${esc(d.posisi ?? t("Lamaran umum", "General application"))}</h2>
    <p class="text-secondary mb-4">${esc(d.nama)} · ${t("dikirim", "sent")} ${tanggalPanjang(d.dikirim_at)}</p>
    <ol class="garis-tahap ${ditolak ? "is-ditolak" : ""}">${langkah}</ol>
    <div class="keterangan-tahap ${ditolak ? "is-ditolak" : d.status === "diterima" ? "is-diterima" : ""}">
      <strong>${esc(t(d.status_label, LABEL_EN[d.status] ?? d.status_label))}</strong>
      <p class="mb-0">${esc(keterangan)}</p>
      ${d.diubah_at ? `<small>${t("Diperbarui", "Updated")} ${tanggalPanjang(d.diubah_at)}</small>` : ""}
    </div>
    ${ditolak ? `<a class="btn btn-garis mt-4" href="${jalur.karir}#lowongan">${t("Lihat lowongan lain", "See other openings")}</a>` : ""}`;
}
