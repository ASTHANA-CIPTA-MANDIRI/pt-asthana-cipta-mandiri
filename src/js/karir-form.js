import { API_BASE_URL } from "./config.js";
import { t, jalur } from "./bahasa.js";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
// Nilai pilihan "Lamaran umum" di formulir; dikirim ke lemon TANPA job_id.
const UMUM = "umum";

// State management
const state = {
  jobs: [],
  isSubmitting: false,
  preselectedJob: null,
};

// DOM Elements
const elements = {
  form: document.getElementById("applicationForm"),
  jobSelect: document.getElementById("jobId"),
  jobSelectWrapper: document.getElementById("jobSelectWrapper"),
  jobInfoBadge: document.getElementById("jobInfoBadge"),
  jobTitleDisplay: document.getElementById("jobTitleDisplay"),
  backLink: document.getElementById("backLink"),
  cvInput: document.getElementById("cv"),
  clInput: document.getElementById("coverLetter"),
  submitBtn: document.getElementById("submitBtn"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  alertContainer: document.getElementById("alertContainer"),
};

// Initialize application
async function init() {
  checkPreselectedJob();
  await loadJobs();
  setupEventListeners();
  setupFileUpload(
    "cv",
    "cvUploadWrapper",
    "cvFileInfo",
    "cvFileName",
    "cvFileSize"
  );
  setupFileUpload(
    "coverLetter",
    "clUploadWrapper",
    "clFileInfo",
    "clFileName",
    "clFileSize"
  );
  // Berkas pendukung (opsional)
  setupFileUpload("lampiran", "lpUploadWrapper", "lpFileInfo", "lpFileName", "lpFileSize");
}

// Check if job is preselected from URL
function checkPreselectedJob() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("job_id");
  const jobSlug = params.get("job_slug");
  const jobTitle = params.get("job_title");

  // Lamaran umum (talent pool): datang dari tombol "Kirim Lamaran Umum".
  if (params.get("umum")) {
    state.preselectedJob = { id: UMUM, slug: null, title: t("Lamaran umum", "General application") };
    elements.jobInfoBadge.style.display = "flex";
    elements.jobTitleDisplay.textContent = t("Lamaran umum", "General application");
    const keterangan = elements.jobInfoBadge.querySelector("small");
    if (keterangan) keterangan.textContent = t("CV Anda kami simpan untuk posisi yang cocok", "We keep your CV for a matching role");
    elements.jobSelectWrapper.style.display = "none";
    return;
  }

  if (jobId && jobTitle) {
    state.preselectedJob = {
      id: jobId,
      slug: jobSlug,
      title: jobTitle,
    };

    // Show job info badge
    elements.jobInfoBadge.style.display = "flex";
    elements.jobTitleDisplay.textContent = jobTitle;

    // Hide job select dropdown
    elements.jobSelectWrapper.style.display = "none";
  }
}

// Load job positions
async function loadJobs() {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`);

    if (!response.ok) {
      throw new Error("Failed to load job positions");
    }

    const data = await response.json();
    state.jobs = data.data || data;

    // Populate job select
    elements.jobSelect.innerHTML =
      `<option value="" selected disabled>${t("Pilih posisi yang tersedia...", "Choose an open position...")}</option>` +
      `<option value="${UMUM}">${t("Lamaran umum (belum ada posisi yang cocok)", "General application (no matching role yet)")}</option>`;

    state.jobs.forEach((job) => {
      const option = document.createElement("option");
      option.value = job.id;
      option.textContent = job.title || job.name;

      // Preselect if coming from detail page
      if (state.preselectedJob && job.id == state.preselectedJob.id) {
        option.selected = true;
      }

      elements.jobSelect.appendChild(option);
    });

    // If preselected, set the value and mark as valid
    if (state.preselectedJob) {
      elements.jobSelect.value = state.preselectedJob.id;
      elements.jobSelect.classList.add("is-valid");
    }
  } catch (error) {
    console.error("Error loading jobs:", error);
    // Lamaran umum tetap bisa dikirim walau daftar posisi gagal dimuat.
    elements.jobSelect.innerHTML =
      `<option value="" selected disabled>${t("Pilih posisi...", "Choose a position...")}</option>` +
      `<option value="${UMUM}">${t("Lamaran umum", "General application")}</option>`;
    showAlert(t("Gagal memuat daftar posisi. Silakan muat ulang halaman.", "Could not load positions. Please refresh the page."), "danger");
  }
}

// Setup event listeners
function setupEventListeners() {
  elements.form.addEventListener("submit", handleSubmit);

  // Real-time validation
  elements.form.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) {
        validateField(input);
      }
    });
  });
}

// Setup file upload with drag & drop
function setupFileUpload(inputId, wrapperId, infoId, nameId, sizeId) {
  const input = document.getElementById(inputId);
  const wrapper = document.getElementById(wrapperId);
  const fileInfo = document.getElementById(infoId);
  const fileName = document.getElementById(nameId);
  const fileSize = document.getElementById(sizeId);

  // File change event
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file, input, fileInfo, fileName, fileSize);
    }
  });

  // Drag & drop events
  wrapper.addEventListener("dragover", (e) => {
    e.preventDefault();
    wrapper.classList.add("drag-over");
  });

  wrapper.addEventListener("dragleave", () => {
    wrapper.classList.remove("drag-over");
  });

  wrapper.addEventListener("drop", (e) => {
    e.preventDefault();
    wrapper.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      input.files = e.dataTransfer.files;
      handleFileSelect(file, input, fileInfo, fileName, fileSize);
    }
  });
}

// Handle file selection
function handleFileSelect(file, input, fileInfo, fileName, fileSize) {
  // Validate file type
  if (file.type !== "application/pdf") {
    input.value = "";
    showAlert(t("File harus berformat PDF", "The file must be a PDF"), "warning");
    return;
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    input.value = "";
    showAlert(
      t(`Ukuran file maksimal 2MB. File Anda: ${formatFileSize(file.size)}`, `Maximum file size is 2MB. Your file: ${formatFileSize(file.size)}`),
      "warning"
    );
    return;
  }

  // Display file info
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  fileInfo.classList.add("show");

  // Mark as valid
  tandaiMedan(input, true);
}

// Clear file selection
window.clearFile = function (inputId) {
  const input = document.getElementById(inputId);
  input.value = "";
  input.classList.remove("is-valid", "is-invalid");
  input.closest(".unggah")?.classList.remove("is-invalid-wrap");

  const prefix = { cv: "cv", coverLetter: "cl", lampiran: "lp" }[inputId];
  document.getElementById(`${prefix}FileInfo`).classList.remove("show");
};

// Validate single field
function validateField(input) {
  const value = input.value.trim();
  let isValid = true;
  let message = "";

  // Skip validation for hidden job select if preselected
  if (input === elements.jobSelect && state.preselectedJob) {
    return true;
  }

  // Required validation
  if (input.hasAttribute("required") && !value) {
    isValid = false;
    message = t(`${namaMedan(input)} wajib diisi`, `${namaMedan(input)} is required`);
  }

  // Email validation
  if (input.type === "email" && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      message = t("Format email tidak valid", "Invalid email address");
    }
  }

  // Phone validation
  if (input.id === "phone" && value) {
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      message = t("Format nomor telepon tidak valid", "Invalid phone number");
    }
  }

  // Tautan portofolio: hanya http(s)
  if (input.type === "url" && value && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(value)) {
    isValid = false;
    message = t("Tautan harus diawali http:// atau https://", "The link must start with http:// or https://");
  }

  // File validation
  if (input.type === "file" && input.files.length > 0) {
    const file = input.files[0];
    if (file.type !== "application/pdf") {
      isValid = false;
      message = t("File harus berformat PDF", "The file must be a PDF");
    } else if (file.size > MAX_FILE_SIZE) {
      isValid = false;
      message = t("Ukuran file maksimal 2MB", "Maximum file size is 2MB");
    }
  }

  tandaiMedan(input, isValid, message);
  return isValid;
}

// Nama medan diambil dari <label for="...">; input berkas tidak punya
// saudara label tepat di depannya, jadi jangan pakai previousElementSibling.
function namaMedan(input) {
  const label = elements.form.querySelector(`label[for="${input.id}"]`);
  return label ? label.textContent.replace("*", "").trim() : t("Kolom ini", "This field");
}

// Tandai medan valid/tidak valid dan tampilkan pesannya. Pesan dicari lewat
// pembungkus .medan karena input berkas tersembunyi di dalam kotak unggah,
// sehingga aturan Bootstrap ".is-invalid ~ .invalid-feedback" tidak berlaku.
function tandaiMedan(input, isValid, message = "") {
  input.classList.toggle("is-invalid", !isValid);
  input.classList.toggle("is-valid", isValid);
  input.closest(".unggah")?.classList.toggle("is-invalid-wrap", !isValid);

  const feedback = input.closest(".medan")?.querySelector(".invalid-feedback");
  if (feedback) {
    feedback.textContent = isValid ? "" : message;
    feedback.style.display = isValid ? "" : "block";
  }
}

// Validate entire form
function validateForm() {
  const inputs = elements.form.querySelectorAll("input, select");
  let isValid = true;

  inputs.forEach((input) => {
    // Skip hidden job select if preselected
    if (input === elements.jobSelect && state.preselectedJob) {
      return;
    }

    if (!validateField(input)) {
      isValid = false;
    }
  });

  return isValid;
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();

  // Validate form
  if (!validateForm()) {
    showAlert(t("Mohon lengkapi semua kolom yang wajib diisi", "Please complete all required fields"), "warning");
    return;
  }

  // Prevent double submission
  if (state.isSubmitting) return;
  state.isSubmitting = true;

  // Update UI
  elements.submitBtn.disabled = true;
  elements.submitBtn.innerHTML =
    `<span class="spinner-border spinner-border-sm me-2"></span>${t("Mengirim...", "Sending...")}`;
  elements.loadingOverlay.classList.add("show");

  try {
    // Prepare form data
    const formData = new FormData(elements.form);

    // If job is preselected, ensure it's in the form data
    if (state.preselectedJob) {
      formData.set("job_id", state.preselectedJob.id);
    }
    // Lamaran umum dikirim tanpa job_id; isian opsional yang kosong tidak dikirim.
    if (formData.get("job_id") === UMUM) formData.delete("job_id");
    if (!(formData.get("lampiran") instanceof File) || !formData.get("lampiran").size) formData.delete("lampiran");
    ["portofolio_url", "sumber_info"].forEach((k) => !formData.get(k) && formData.delete(k));

    // Submit to API
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw { response, data: result };
    }

    // Success
    showAlert(
      t("Lamaran Anda berhasil dikirim! Kami akan menghubungi Anda segera.", "Your application has been sent! We will contact you soon."),
      "success"
    );

    elements.form.reset();
    elements.form.querySelectorAll(".is-valid, .is-invalid").forEach((el) => {
      el.classList.remove("is-valid", "is-invalid");
    });
    document
      .querySelectorAll(".file-info")
      .forEach((el) => el.classList.remove("show"));

    // Show application number
    setTimeout(() => {
      showAlert(
        t(`Nomor Lamaran Anda: ${result.data.application_number}`, `Your application number: ${result.data.application_number}`),
        "info"
      );
    }, 2000);

    // Redirect to jobs list after 4 seconds
    setTimeout(() => {
      window.location.href = jalur.karir;
    }, 4000);
  } catch (error) {
    console.error("Submission error:", error);

    // Handle validation errors
    if (error.response?.status === 422 && error.data?.errors) {
      handleValidationErrors(error.data.errors);
      showAlert(
        t("Terdapat kesalahan pada formulir. Mohon periksa kembali.", "There are errors in the form. Please check again."),
        "danger"
      );
    } else {
      showAlert(
        error.data?.message || t("Terjadi kesalahan. Silakan coba lagi.", "Something went wrong. Please try again."),
        "danger"
      );
    }
  } finally {
    // Reset UI
    state.isSubmitting = false;
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML =
      `<i class="bi bi-send me-1"></i> ${t("Kirim Lamaran", "Submit Application")}`;
    elements.loadingOverlay.classList.remove("show");
  }
}

// Handle validation errors from server
function handleValidationErrors(errors) {
  Object.keys(errors).forEach((fieldName) => {
    const input = elements.form.querySelector(`[name="${fieldName}"]`);
    if (input) {
      tandaiMedan(
        input,
        false,
        Array.isArray(errors[fieldName]) ? errors[fieldName][0] : errors[fieldName]
      );
    }
  });
}

// Show alert notification
function showAlert(message, type = "info") {
  const alert = document.createElement("div");
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.setAttribute("role", "alert");
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  elements.alertContainer.appendChild(alert);

  // Auto remove after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
