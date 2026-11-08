import { API_BASE_URL } from "./config.js";
import { t, LOKAL, jalur } from "./bahasa.js";

// DOM Elements
const elements = {
  loadingState: document.getElementById("loadingState"),
  jobsList: document.getElementById("jobsList"),
  emptyState: document.getElementById("emptyState"),
  alertContainer: document.getElementById("alertContainer"),
};

// Initialize
async function init() {
  await loadJobs();
}

// Load jobs from API
async function loadJobs() {
  try {
    showLoading(true);

    const response = await fetch(`${API_BASE_URL}/jobs`);

    if (!response.ok) {
      throw new Error("Failed to load jobs");
    }

    const result = await response.json();
    const jobs = result.data || [];

    showLoading(false);

    if (jobs.length === 0) {
      showEmptyState();
    } else {
      renderJobs(jobs);
    }
  } catch (error) {
    console.error("Error loading jobs:", error);
    showLoading(false);
    showAlert(
      t("Gagal memuat daftar lowongan. Silakan muat ulang halaman.", "Could not load job openings. Please refresh the page."),
      "danger"
    );
    showEmptyState();
  }
}

// Render jobs list
function renderJobs(jobs) {
  elements.jobsList.innerHTML = "";
  elements.jobsList.style.display = "flex";

  jobs.forEach((job, i) => {
    elements.jobsList.appendChild(createJobCard(job, i));
  });
}

// Warna kartu bergiliran agar daftar tidak monoton
const WARNA = ["biru", "ungu", "laut", "hijau", "oranye", "jambu"];
const IKON = ["bi-code-slash", "bi-briefcase", "bi-airplane", "bi-graph-up-arrow", "bi-palette", "bi-headset"];

// Create job card element
function createJobCard(job, i = 0) {
  const col = document.createElement("div");
  col.className = "col-md-6 col-lg-4";

  const postedDate = job.created_at ? formatDate(job.created_at) : "";
  const href = `${jalur.karirDetail}?slug=${encodeURIComponent(job.slug)}`;

  col.innerHTML = `
    <a class="kartu-lowongan warna-${WARNA[i % WARNA.length]}" href="${href}">
      <div class="d-flex justify-content-between align-items-start">
        <span class="ikon-petak"><i class="bi ${IKON[i % IKON.length]}"></i></span>
        <span class="lencana-buka">${t("Dibuka", "Open")}</span>
      </div>
      <h3>${escapeHtml(job.title)}</h3>
      <div class="kaki-kartu">
        <span>${postedDate ? `<i class="bi bi-clock me-1"></i>${postedDate}` : ""}</span>
        <span class="tautan-panah">${t("Lihat detail", "View details")} <i class="bi bi-arrow-right"></i></span>
      </div>
    </a>
  `;

  return col;
}

// Show/hide loading state
function showLoading(show) {
  elements.loadingState.style.display = show ? "flex" : "none";
  elements.jobsList.style.display = show ? "none" : "flex";
  elements.emptyState.style.display = "none";
}

// Show empty state
function showEmptyState() {
  elements.loadingState.style.display = "none";
  elements.jobsList.style.display = "none";
  elements.emptyState.style.display = "block";
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("Hari ini", "Today");
  if (diffDays === 1) return t("Kemarin", "Yesterday");
  if (diffDays < 7) return t(`${diffDays} hari lalu`, `${diffDays} days ago`);
  if (diffDays < 30) return t(`${Math.floor(diffDays / 7)} minggu lalu`, `${Math.floor(diffDays / 7)} week(s) ago`);

  return date.toLocaleDateString(LOKAL, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Show alert
function showAlert(message, type = "info") {
  const alert = document.createElement("div");
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.setAttribute("role", "alert");
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  elements.alertContainer.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text ?? "").replace(/[&<>"']/g, (m) => map[m]);
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
