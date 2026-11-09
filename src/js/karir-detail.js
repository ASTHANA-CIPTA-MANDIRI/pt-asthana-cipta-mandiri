// Halaman detail lowongan: isi dari penyunting lemon (HTML, dibersihkan),
// fakta posisi, tombol bagikan, lowongan lain, dan data terstruktur
// JobPosting untuk Google for Jobs.
import { API_BASE_URL, PHOENIX_URL } from "./config.js";
import { t, jalur } from "./bahasa.js";
import { esc, htmlAman, munculkan } from "./situs.js";
import {
  unitDari,
  labelJenis,
  labelPola,
  lencanaBatas,
  tanggalPanjang,
  kartuLowongan,
} from "./lowongan.js";

const $ = (id) => document.getElementById(id);
let lowongan = null;

async function init() {
  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) return tampilkanGalat();

  try {
    const res = await fetch(`${API_BASE_URL}/jobs/${encodeURIComponent(slug)}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    lowongan = (await res.json()).data;
  } catch (e) {
    console.error("Gagal memuat lowongan:", e);
    return tampilkanGalat();
  }

  gambar(lowongan);
  pasangBagikan(lowongan);
  pasangJobPosting(lowongan);
  muatLowonganLain(lowongan);
  $("applyBtn").addEventListener("click", keFormulir);
  pasangBilahLamar(lowongan);
}

function gambar(job) {
  const unit = unitDari(job);
  document.title = `${job.title} — ${unit.nama} | ${t("Karir", "Careers")}`;

  $("unitKepala").innerHTML = `<img src="${unit.ikon}" alt="" width="28" height="28" />${esc(unit.nama)}`;
  $("lencanaKepala").innerHTML = lencanaBatas(job);
  $("jobTitle").textContent = job.title;

  const meta = [
    labelJenis(job.jenis) && ["bi-briefcase", labelJenis(job.jenis)],
    labelPola(job.pola_kerja) && ["bi-house-gear", labelPola(job.pola_kerja)],
    job.lokasi && ["bi-geo-alt", job.lokasi],
    job.posted_at && ["bi-calendar-event", `${t("Diposting", "Posted")} ${tanggalPanjang(job.posted_at)}`],
  ].filter(Boolean);
  $("metaKepala").innerHTML = meta.map(([i, x]) => `<span><i class="bi ${i}"></i>${esc(x)}</span>`).join("");

  isiBagian("descriptions", job.descriptions);
  isiBagian("requirements", job.requirements);

  const fakta = [
    ["bi-building", t("Perusahaan", "Company"), unit.nama],
    ["bi-briefcase", t("Jenis", "Type"), labelJenis(job.jenis)],
    ["bi-house-gear", t("Pola kerja", "Work mode"), labelPola(job.pola_kerja)],
    ["bi-geo-alt", t("Lokasi", "Location"), job.lokasi],
    ["bi-people", t("Dibutuhkan", "Openings"), job.jumlah_posisi && t(`${job.jumlah_posisi} orang`, `${job.jumlah_posisi}`)],
    ["bi-cash-stack", t("Kisaran gaji", "Salary range"), job.gaji],
    ["bi-hourglass-split", t("Batas lamaran", "Apply by"), job.batas_lamaran && tanggalPanjang(job.batas_lamaran)],
  ].filter(([, , nilai]) => nilai);
  $("faktaLowongan").innerHTML = fakta
    .map(([i, label, nilai]) => `<li><span><i class="bi ${i}"></i>${label}</span><strong>${esc(nilai)}</strong></li>`)
    .join("");

  $("headerLoading").style.display = "none";
  $("contentLoading").style.display = "none";
  $("headerContent").style.display = "block";
  $("detailContent").style.display = "block";
}

/**
 * Quill 2 menyimpan daftar butir sebagai <ol><li data-list="bullet">.
 * htmlAman membuang atribut data-*, jadi tanpa ini daftar butir tampil
 * bernomor. Daftar campuran dipecah per jenis berurutan.
 */
function rapikanDaftarQuill(html) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  doc.querySelectorAll("ol").forEach((ol) => {
    const butir = [...ol.children];
    if (!butir.some((li) => li.dataset.list)) return;
    const pengganti = [];
    butir.forEach((li) => {
      const tag = li.dataset.list === "bullet" ? "ul" : "ol";
      let wadah = pengganti[pengganti.length - 1];
      if (!wadah || wadah.tagName.toLowerCase() !== tag) {
        wadah = doc.createElement(tag);
        pengganti.push(wadah);
      }
      li.querySelectorAll(".ql-ui").forEach((x) => x.remove());
      wadah.appendChild(li);
    });
    ol.replaceWith(...pengganti);
  });
  return doc.body.firstElementChild.innerHTML;
}

function isiBagian(id, html) {
  const bersih = htmlAman(rapikanDaftarQuill(html || "")).trim();
  const kosong = !bersih || !new DOMParser().parseFromString(bersih, "text/html").body.textContent.trim();
  $(`${id}Section`).hidden = kosong;
  if (!kosong) $(id).innerHTML = bersih;
}

function pasangBagikan(job) {
  // Tautan lewat lemon: perayap WhatsApp/LinkedIn mendapat judul & ringkasan
  // posisi ini (halaman situs dirakit di peramban, jadi perayap hanya melihat
  // "Karir"); manusia langsung dialihkan kembali ke halaman ini.
  const url = `${PHOENIX_URL}/lowongan/${encodeURIComponent(job.slug)}`;
  const teks = t(`Lowongan ${job.title} di ${unitDari(job).nama}`, `${job.title} opening at ${unitDari(job).nama}`);
  $("bagikanWa").href = `https://wa.me/?text=${encodeURIComponent(`${teks}\n${url}`)}`;
  $("bagikanLi").href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const tombol = $("salinTautan");
  tombol.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Peramban tanpa izin papan klip: pilih lewat prompt sebagai cadangan.
      window.prompt(t("Salin tautan ini:", "Copy this link:"), url);
      return;
    }
    tombol.classList.add("tersalin");
    tombol.innerHTML = '<i class="bi bi-check2"></i>';
    tombol.title = t("Tautan tersalin", "Link copied");
    setTimeout(() => {
      tombol.classList.remove("tersalin");
      tombol.innerHTML = '<i class="bi bi-link-45deg"></i>';
      tombol.title = t("Salin tautan", "Copy link");
    }, 2000);
  });
}

/** schema.org JobPosting — supaya lowongan bisa tampil di Google for Jobs. */
function pasangJobPosting(job) {
  const unit = unitDari(job);
  const jenisSchema = { penuh_waktu: "FULL_TIME", kontrak: "CONTRACTOR", magang: "INTERN", freelance: "TEMPORARY" };
  const data = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: [job.descriptions, job.requirements].filter(Boolean).join("") || job.ringkasan || job.title,
    datePosted: job.posted_at,
    hiringOrganization: {
      "@type": "Organization",
      name: unit.nama,
      logo: new URL(unit.ikon, location.origin).href,
    },
    directApply: true,
  };
  if (job.batas_lamaran) data.validThrough = `${job.batas_lamaran}T23:59:59+07:00`;
  if (jenisSchema[job.jenis]) data.employmentType = jenisSchema[job.jenis];
  if (job.pola_kerja === "remote") {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = { "@type": "Country", name: "Indonesia" };
  }
  if (job.lokasi && job.pola_kerja !== "remote") {
    data.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.lokasi, addressCountry: "ID" },
    };
  }

  const skrip = document.createElement("script");
  skrip.type = "application/ld+json";
  skrip.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
  document.head.appendChild(skrip);
}

async function muatLowonganLain(job) {
  try {
    const res = await fetch(`${API_BASE_URL}/jobs`, { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    const semua = ((await res.json()).data || []).filter((j) => j.id !== job.id);
    // Unit yang sama lebih dulu, lalu sisanya.
    semua.sort((a, b) => (b.unit === job.unit) - (a.unit === job.unit));
    const pilihan = semua.slice(0, 3);
    if (!pilihan.length) return;
    $("daftarLain").innerHTML = pilihan
      .map((j, i) => `<div class="col-md-6 col-lg-4" data-muncul style="--tunda:${i * 0.06}s">${kartuLowongan(j)}</div>`)
      .join("");
    $("lowonganLain").hidden = false;
    munculkan($("daftarLain"));
  } catch {
    // Bagian tambahan: diam saja bila gagal.
  }
}

/**
 * Ponsel: panel lamar berada di bawah seluruh deskripsi, jadi bilah kecil
 * menempel di bawah layar — disembunyikan saat panel lamar sendiri terlihat.
 */
function pasangBilahLamar(job) {
  const bilah = $("bilahLamar");
  $("bilahJudul").textContent = job.title;
  $("bilahKet").textContent = unitDari(job).nama;
  $("bilahTombol").addEventListener("click", keFormulir);

  const ponsel = window.matchMedia("(max-width: 991.98px)");
  let panelTerlihat = false;
  const perbarui = () => {
    const tampil = ponsel.matches && !panelTerlihat;
    bilah.hidden = !tampil;
    document.body.classList.toggle("ada-bilah-lamar", tampil);
  };
  new IntersectionObserver(([e]) => {
    panelTerlihat = e.isIntersecting;
    perbarui();
  }).observe(document.querySelector(".kartu-lamar"));
  ponsel.addEventListener("change", perbarui);
  perbarui();
}

function keFormulir() {
  if (!lowongan) return;
  const params = new URLSearchParams({ job_id: lowongan.id, job_slug: lowongan.slug, job_title: lowongan.title });
  location.href = `${jalur.karirFormulir}?${params}`;
}

function tampilkanGalat() {
  $("headerLoading").style.display = "none";
  $("headerContent").style.display = "none";
  $("contentLoading").style.display = "none";
  $("detailContent").style.display = "none";
  $("errorState").style.display = "block";
}

init();
