// contact-form.js
import { API_BASE_URL } from "./config.js";
import { t } from "./bahasa.js";

// State management
const state = {
  isSubmitting: false,
};

// DOM Elements
const elements = {
  form: document.getElementById("contactForm"),
  nameInput: document.getElementById("name"),
  emailInput: document.getElementById("email"),
  messageInput: document.getElementById("message"),
  submitBtn: null,
  formMessage: document.getElementById("formMessage"),
  nameError: document.getElementById("nameError"),
  emailError: document.getElementById("emailError"),
  messageError: document.getElementById("messageError"),
};

// Initialize submit button after form is loaded
if (elements.form) {
  elements.submitBtn = elements.form.querySelector('button[type="submit"]');
}

// Initialize application
function init() {
  if (!elements.form) {
    console.error("Contact form not found");
    return;
  }

  // Remove any existing listeners (prevent duplicates)
  const newForm = elements.form.cloneNode(true);
  elements.form.parentNode.replaceChild(newForm, elements.form);

  // Update elements references
  elements.form = document.getElementById("contactForm");
  elements.nameInput = document.getElementById("name");
  elements.emailInput = document.getElementById("email");
  elements.messageInput = document.getElementById("message");
  elements.submitBtn = elements.form.querySelector('button[type="submit"]');
  elements.formMessage = document.getElementById("formMessage");
  elements.nameError = document.getElementById("nameError");
  elements.emailError = document.getElementById("emailError");
  elements.messageError = document.getElementById("messageError");

  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  elements.form.addEventListener("submit", handleSubmit);

  // Prevent default form behavior
  elements.form.addEventListener(
    "invalid",
    (e) => {
      e.preventDefault();
    },
    true
  );

  // Real-time validation
  elements.nameInput.addEventListener("blur", () =>
    validateField(elements.nameInput)
  );
  elements.emailInput.addEventListener("blur", () =>
    validateField(elements.emailInput)
  );
  elements.messageInput.addEventListener("blur", () =>
    validateField(elements.messageInput)
  );

  // Clear error on input if field was invalid
  elements.nameInput.addEventListener("input", () => {
    if (elements.nameInput.classList.contains("is-invalid")) {
      validateField(elements.nameInput);
    }
  });
  elements.emailInput.addEventListener("input", () => {
    if (elements.emailInput.classList.contains("is-invalid")) {
      validateField(elements.emailInput);
    }
  });
  elements.messageInput.addEventListener("input", () => {
    if (elements.messageInput.classList.contains("is-invalid")) {
      validateField(elements.messageInput);
    }
  });
}

// Clear all errors
function clearErrors() {
  elements.nameError.textContent = "";
  elements.emailError.textContent = "";
  elements.messageError.textContent = "";
  elements.formMessage.textContent = "";
  elements.formMessage.className = "pesan-borang";
}

// Show error for specific field
function showFieldError(fieldName, message) {
  const errorElement = elements[`${fieldName}Error`];
  if (errorElement) {
    errorElement.textContent = message;
  }
}

// Show form message
function showFormMessage(message, type = "success") {
  elements.formMessage.textContent = message;
  elements.formMessage.className = `pesan-borang text-${type}`;
}

// Validate single field
function validateField(input) {
  const value = input.value.trim();
  let isValid = true;
  let message = "";

  const fieldName = input.id;

  // Name validation
  if (fieldName === "name") {
    if (!value) {
      isValid = false;
      message = t("Nama wajib diisi", "Name is required");
    } else if (value.length < 3) {
      isValid = false;
      message = t("Nama minimal 3 karakter", "Name must be at least 3 characters");
    } else if (value.length > 255) {
      isValid = false;
      message = t("Nama maksimal 255 karakter", "Name must be at most 255 characters");
    }
  }

  // Email validation
  if (fieldName === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      isValid = false;
      message = t("Email wajib diisi", "Email is required");
    } else if (!emailRegex.test(value)) {
      isValid = false;
      message = t("Format email tidak valid", "Invalid email address");
    } else if (value.length > 255) {
      isValid = false;
      message = t("Email maksimal 255 karakter", "Email must be at most 255 characters");
    }
  }

  // Message validation
  if (fieldName === "message") {
    if (!value) {
      isValid = false;
      message = t("Pesan wajib diisi", "Message is required");
    } else if (value.length < 10) {
      isValid = false;
      message = t("Pesan minimal 10 karakter", "Message must be at least 10 characters");
    } else if (value.length > 5000) {
      isValid = false;
      message = t("Pesan maksimal 5000 karakter", "Message must be at most 5000 characters");
    }
  }

  // Update UI
  if (!isValid) {
    input.classList.add("is-invalid");
    input.classList.remove("is-valid");
    showFieldError(fieldName, message);
  } else {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    showFieldError(fieldName, "");
  }

  return isValid;
}

// Validate entire form
function validateForm() {
  const isNameValid = validateField(elements.nameInput);
  const isEmailValid = validateField(elements.emailInput);
  const isMessageValid = validateField(elements.messageInput);

  return isNameValid && isEmailValid && isMessageValid;
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  // Capture values IMMEDIATELY before anything else
  const formValues = {
    name: elements.nameInput.value.trim(),
    email: elements.emailInput.value.trim(),
    message: elements.messageInput.value.trim(),
  };

  // Clear previous errors
  clearErrors();

  // Validate using captured values
  if (!formValues.name || formValues.name.length < 3) {
    elements.nameInput.classList.add("is-invalid");
    showFieldError("name", t("Nama wajib diisi minimal 3 karakter", "Name is required (at least 3 characters)"));
    showFormMessage(t("Mohon lengkapi semua field dengan benar", "Please complete all fields correctly"), "danger");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formValues.email || !emailRegex.test(formValues.email)) {
    elements.emailInput.classList.add("is-invalid");
    showFieldError("email", t("Email wajib diisi dengan format yang benar", "Please enter a valid email address"));
    showFormMessage(t("Mohon lengkapi semua field dengan benar", "Please complete all fields correctly"), "danger");
    return;
  }

  if (!formValues.message || formValues.message.length < 10) {
    elements.messageInput.classList.add("is-invalid");
    showFieldError("message", t("Pesan wajib diisi minimal 10 karakter", "Message is required (at least 10 characters)"));
    showFormMessage(t("Mohon lengkapi semua field dengan benar", "Please complete all fields correctly"), "danger");
    return;
  }

  // Prevent double submission
  if (state.isSubmitting) {
    return;
  }
  state.isSubmitting = true;

  // Update UI - Loading state
  elements.submitBtn.disabled = true;
  elements.submitBtn.innerHTML =
    `<span class="spinner-border spinner-border-sm me-2"></span>${t("Mengirim...", "Sending...")}`;

  try {
    // Prepare request body using captured values
    const requestBody = {
      name: formValues.name,
      email: formValues.email,
      message: formValues.message,
    };
    // Kolom jebakan bot: hanya ikut bila terisi (manusia tidak melihatnya).
    const jebakan = document.getElementById("situsWeb")?.value;
    if (jebakan) requestBody.situs_web = jebakan;

    // Submit to API
    const response = await fetch(`${API_BASE_URL}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Request-ID": generateRequestId(),
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      throw { response, data: result };
    }

    // Success
    showFormMessage(
      result.message ||
        t("Pesan Anda berhasil dikirim. Kami akan menghubungi Anda segera.", "Your message has been sent. We will get back to you soon."),
      "success"
    );

    // Reset form
    elements.form.reset();
    elements.form.querySelectorAll(".is-valid, .is-invalid").forEach((el) => {
      el.classList.remove("is-valid", "is-invalid");
    });

    // Scroll to message
    elements.formMessage.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  } catch (error) {
    console.error("Contact form error:", error);

    // Handle validation errors from server
    if (error.response?.status === 422 && error.data?.errors) {
      handleValidationErrors(error.data.errors);
      showFormMessage(
        error.data?.message ||
          t("Terdapat kesalahan pada form. Mohon periksa kembali.", "There are errors in the form. Please check again."),
        "danger"
      );
    } else if (error.response?.status >= 500) {
      showFormMessage(
        t("Terjadi kesalahan pada server. Silakan coba lagi nanti.", "A server error occurred. Please try again later."),
        "danger"
      );
    } else if (!error.response) {
      showFormMessage(
        t("Tidak dapat menghubungi server. Periksa koneksi internet Anda.", "Could not reach the server. Please check your internet connection."),
        "danger"
      );
    } else {
      showFormMessage(
        error.data?.message || t("Terjadi kesalahan. Silakan coba lagi.", "Something went wrong. Please try again."),
        "danger"
      );
    }
  } finally {
    // Reset UI
    state.isSubmitting = false;
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = `<i class="bi bi-send me-1"></i> ${t("Kirim Pesan", "Send Message")}`;
  }
}

// Handle validation errors from server
function handleValidationErrors(errors) {
  Object.keys(errors).forEach((fieldName) => {
    const input = elements[`${fieldName}Input`];
    if (input) {
      input.classList.add("is-invalid");
      input.classList.remove("is-valid");

      const errorMessage = Array.isArray(errors[fieldName])
        ? errors[fieldName][0]
        : errors[fieldName];

      showFieldError(fieldName, errorMessage);
    }
  });
}

// Generate unique request ID
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
