// Alat bersama halaman karir: label dwibahasa, ikon unit, batas lamaran, dan
// kartu lowongan. Data datang dari lemon (/api/jobs); yang dipakai di sini
// KUNCINYA (unit, jenis, pola_kerja), bukan label Indonesia dari server,
// supaya versi Inggris ikut benar.
import { t, LOKAL, jalur } from "./bahasa.js";
import { esc } from "./situs.js";
import ikonAsthana from "../assets/img/asthana-mark.png";
import ikonReka from "../assets/img/reka-mark.png";
import ikonOrcha from "../assets/img/orcha-mark.png";

export const UNIT = {
  asthana: { nama: "PT. Asthana Cipta Mandiri", pendek: "Asthana", ikon: ikonAsthana, warna: "biru" },
  reka: { nama: "Reka Technology", pendek: "Reka Technology", ikon: ikonReka, warna: "hijau" },
  orcha: { nama: "Orcha Journey", pendek: "Orcha Journey", ikon: ikonOrcha, warna: "laut" },
};

export const unitDari = (job) => UNIT[job?.unit] ?? UNIT.asthana;

export const JENIS = {
  penuh_waktu: () => t("Penuh waktu", "Full-time"),
  kontrak: () => t("Kontrak", "Contract"),
  magang: () => t("Magang", "Internship"),
  freelance: () => t("Freelance", "Freelance"),
};

export const POLA = {
  kantor: () => t("Di kantor", "On-site"),
  hybrid: () => t("Hybrid", "Hybrid"),
  remote: () => t("Remote", "Remote"),
};

export const labelJenis = (k) => JENIS[k]?.() ?? null;
export const labelPola = (k) => POLA[k]?.() ?? null;

/** Sisa hari sampai batas lamaran (0 = hari ini terakhir), null bila tanpa batas. */
export function sisaHari(batas) {
  if (!batas) return null;
  const [y, m, d] = batas.split("-").map(Number);
  const akhir = new Date(y, m - 1, d);
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  return Math.round((akhir - hariIni) / 86400000);
}

export function tanggalPanjang(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(LOKAL, { day: "numeric", month: "long", year: "numeric" });
}

/** "29 Nov" — tahun hanya disebut bila bukan tahun ini. */
export function tanggalPendek(iso) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const opsi = { day: "numeric", month: "short" };
  if (y !== new Date().getFullYear()) opsi.year = "numeric";
  return new Date(y, m - 1, d).toLocaleDateString(LOKAL, opsi);
}

/** Lencana keadaan: "Ditutup hari ini" / "Tutup 3 hari lagi" / "Dibuka". */
export function lencanaBatas(job) {
  const sisa = sisaHari(job.batas_lamaran);
  if (sisa === null) return `<span class="lencana-buka">${t("Dibuka", "Open")}</span>`;
  if (sisa <= 0) return `<span class="lencana-buka segera">${t("Ditutup hari ini", "Closes today")}</span>`;
  if (sisa <= 7) {
    return `<span class="lencana-buka segera">${t(`Tutup ${sisa} hari lagi`, `Closes in ${sisa} day${sisa > 1 ? "s" : ""}`)}</span>`;
  }
  return `<span class="lencana-buka" title="${t("Batas lamaran", "Apply by")} ${tanggalPanjang(job.batas_lamaran)}">${t(`Hingga ${tanggalPendek(job.batas_lamaran)}`, `Until ${tanggalPendek(job.batas_lamaran)}`)}</span>`;
}

/** Keping fakta singkat: jenis, pola kerja, lokasi, jumlah posisi. */
export function kepingFakta(job) {
  const keping = [];
  if (labelJenis(job.jenis)) keping.push(["bi-briefcase", labelJenis(job.jenis)]);
  if (labelPola(job.pola_kerja)) keping.push(["bi-house-gear", labelPola(job.pola_kerja)]);
  if (job.lokasi) keping.push(["bi-geo-alt", job.lokasi]);
  if (job.jumlah_posisi) keping.push(["bi-people", t(`${job.jumlah_posisi} posisi`, `${job.jumlah_posisi} opening${job.jumlah_posisi > 1 ? "s" : ""}`)]);
  return keping.map(([ikon, teks]) => `<span class="keping"><i class="bi ${ikon}"></i>${esc(teks)}</span>`).join("");
}

export function waktuRelatif(iso) {
  if (!iso) return "";
  const hari = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (hari <= 0) return t("Hari ini", "Today");
  if (hari === 1) return t("Kemarin", "Yesterday");
  if (hari < 7) return t(`${hari} hari lalu`, `${hari} days ago`);
  if (hari < 30) {
    const minggu = Math.floor(hari / 7);
    return t(`${minggu} minggu lalu`, `${minggu} week${minggu > 1 ? "s" : ""} ago`);
  }
  return tanggalPanjang(iso);
}

export function kartuLowongan(job) {
  const unit = unitDari(job);
  const href = `${jalur.karirDetail}?slug=${encodeURIComponent(job.slug)}`;
  return `
    <a class="kartu-lowongan warna-${unit.warna}" href="${href}">
      <div class="kepala-kartu">
        <span class="unit-lowongan"><img src="${unit.ikon}" alt="" width="28" height="28" />${esc(unit.pendek)}</span>
        ${lencanaBatas(job)}
      </div>
      <h3>${esc(job.title)}</h3>
      ${job.ringkasan ? `<p class="ringkasan">${esc(job.ringkasan)}</p>` : ""}
      <div class="daftar-keping">${kepingFakta(job)}</div>
      <div class="kaki-kartu">
        <span><i class="bi bi-clock me-1"></i>${waktuRelatif(job.created_at)}</span>
        <span class="tautan-panah">${t("Lihat detail", "View details")} <i class="bi bi-arrow-right"></i></span>
      </div>
    </a>`;
}
