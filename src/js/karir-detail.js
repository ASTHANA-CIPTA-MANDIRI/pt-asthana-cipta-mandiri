import { API_BASE_URL } from "./config.js";
import { t, LOKAL, jalur } from "./bahasa.js";

// State
let currentJob = null;

// DOM Elements
const elements = {
  headerLoading: document.getElementById("headerLoading"),
  headerContent: document.getElementById("headerContent"),
  contentLoading: document.getElementById("contentLoading"),
  detailContent: document.getElementById("detailContent"),
  errorState: document.getElementById("errorState"),
  jobTitle: document.getElementById("jobTitle"),
  postedDate: document.getElementById("postedDate"),
  descriptions: document.getElementById("descriptions"),
  requirements: document.getElementById("requirements"),
  descriptionsSection: document.getElementById("descriptionsSection"),
  requirementsSection: document.getElementById("requirementsSection"),
  applyBtn: document.getElementById("applyBtn"),
  alertContainer: document.getElementById("alertContainer"),
};

// Initialize
async function init() {
  const slug = getSlugFromUrl();

  if (!slug) {
    showError();
    return;
  }

  await loadJobDetail(slug);
  setupEventListeners();
}

// Get slug from URL
function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
}

// menghapus tag html data hasil rich text editor
function htmlToText(html) {
  const div = document.createElement("div");
  div.innerHTML = html;

  function traverse(node) {
    let text = "";

    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        // Text node
        text += child.textContent;
      } else if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase();

        switch (tag) {
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            text += "\n\n" + child.textContent.toUpperCase() + "\n";
            break;

          case "strong":
          case "b":
            text += "**" + child.textContent + "**";
            break;

          case "em":
          case "i":
            text += "_" + child.textContent + "_";
            break;

          case "p":
            text += "\n\n" + traverse(child).trim() + "\n";
            break;

          case "br":
            text += "\n";
            break;

          case "ul":
            child.querySelectorAll(":scope > li").forEach((li) => {
              text += `• ${traverse(li).trim()}\n`;
            });
            text += "\n";
            break;

          case "ol":
            let number = 1;
            child.querySelectorAll(":scope > li").forEach((li) => {
              text += `${number}. ${traverse(li).trim()}\n`;
              number++;
            });
            text += "\n";
            break;

          case "li":
            text += traverse(child) + "\n";
            break;

          default:
            text += traverse(child);
            break;
        }
      }
    });

    return text;
  }

  return traverse(div)
    .replace(/\n{3,}/g, "\n\n") // fix too many newlines
    .trim();
}

// Load job detail from API
async function loadJobDetail(slug) {
  try {
    showLoading(true);

    const response = await fetch(`${API_BASE_URL}/jobs/${slug}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Job not found");
      }
      throw new Error("Failed to load job detail");
    }

    const result = await response.json();
    currentJob = result.data;

    showLoading(false);
    renderJobDetail(currentJob);
  } catch (error) {
    console.error("Error loading job detail:", error);
    showLoading(false);
    showError();
    showAlert(t("Gagal memuat detail lowongan.", "Could not load the job details."), "danger");
  }
}

// Render job detail
function renderJobDetail(job) {
  // Update page title
  document.title = `${job.title} | ${t("Karir", "Careers")} PT. Asthana Cipta Mandiri`;

  // Header
  elements.jobTitle.textContent = job.title;

  if (job.posted_at) {
    elements.postedDate.innerHTML = `
      <i class="bi bi-calendar-event me-2"></i>
      ${t("Diposting", "Posted")}: ${formatDate(job.posted_at)}
    `;
  }

  // Descriptions
  if (job.descriptions && job.descriptions.trim()) {
    elements.descriptions.textContent = htmlToText(job.descriptions);
    elements.descriptionsSection.style.display = "block";
  } else {
    elements.descriptionsSection.style.display = "none";
  }

  // Requirements
  if (job.requirements && job.requirements.trim()) {
    elements.requirements.textContent = htmlToText(job.requirements);
    elements.requirementsSection.style.display = "block";
  } else {
    elements.requirementsSection.style.display = "none";
  }

  // Show content
  elements.headerContent.style.display = "block";
  elements.detailContent.style.display = "block";
}

// Setup event listeners
function setupEventListeners() {
  elements.applyBtn.addEventListener("click", goToApplicationForm);
}

// Navigate to application form
function goToApplicationForm() {
  if (!currentJob) return;

  // Pass job info via URL params
  const params = new URLSearchParams({
    job_id: currentJob.id,
    job_slug: currentJob.slug,
    job_title: currentJob.title,
  });

  window.location.href = `${jalur.karirFormulir}?${params.toString()}`;
}

// Show/hide loading state
function showLoading(show) {
  elements.headerLoading.style.display = show ? "block" : "none";
  elements.headerContent.style.display = show ? "none" : "block";
  elements.contentLoading.style.display = show ? "block" : "none";
  elements.detailContent.style.display = show ? "none" : "block";
  elements.errorState.style.display = "none";
}

// Show error state
function showError() {
  elements.headerLoading.style.display = "none";
  elements.headerContent.style.display = "none";
  elements.contentLoading.style.display = "none";
  elements.detailContent.style.display = "none";
  elements.errorState.style.display = "block";
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
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

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
