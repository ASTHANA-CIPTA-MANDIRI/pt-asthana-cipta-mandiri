// Perilaku bersama untuk semua halaman.
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Navbar: bayangan saat digulir & tombol kembali ke atas
const navbar = document.getElementById("navbarSitus");
const tombolAtas = document.getElementById("tombolAtas");

function saatGulir() {
  const y = window.scrollY;
  navbar?.classList.toggle("menggulir", y > 8);
  tombolAtas?.classList.toggle("tampak", y > 480);
}
window.addEventListener("scroll", saatGulir, { passive: true });
saatGulir();

tombolAtas?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Tutup menu ponsel dengan Escape atau saat tautan dipilih
const menu = document.getElementById("menuUtama");
if (menu) {
  const tutupMenu = () => {
    if (menu.classList.contains("show")) {
      document.querySelector(".tombol-menu")?.click();
    }
  };
  document.addEventListener("keydown", (e) => e.key === "Escape" && tutupMenu());
  // kecuali pembuka submenu: klik itu harus membuka submenu, bukan menutup menu
  menu
    .querySelectorAll("a:not(.dropdown-toggle)")
    .forEach((a) => a.addEventListener("click", tutupMenu));
}

// Pindah bahasa ke halaman padanannya, termasuk ?slug= di halaman detail.
document.querySelectorAll("[data-pindah-bahasa]").forEach((a) => {
  if (location.search) a.href = a.getAttribute("href") + location.search;
});

// Tahun berjalan di footer
document.querySelectorAll("[data-tahun]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Animasi muncul saat elemen masuk layar
const elemenMuncul = document.querySelectorAll("[data-muncul]");
if ("IntersectionObserver" in window) {
  const pengamat = new IntersectionObserver(
    (entri) => {
      entri.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("tampak");
          pengamat.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  elemenMuncul.forEach((el) => pengamat.observe(el));
} else {
  elemenMuncul.forEach((el) => el.classList.add("tampak"));
}

// Teks berganti di hero beranda
const ketik = document.getElementById("typewriter");
if (ketik) {
  const kata =
    document.documentElement.lang === "en"
      ? ["innovative", "efficient", "trusted"]
      : ["inovatif", "efisien", "terpercaya"];
  const diam = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (diam) {
    ketik.textContent = kata[0];
  } else {
    const ketikKata = (k, selesai) => {
      ketik.textContent = "";
      let i = 0;
      (function langkah() {
        if (i < k.length) {
          ketik.textContent += k[i++];
          setTimeout(langkah, 85);
        } else {
          setTimeout(selesai, 1600);
        }
      })();
    };
    const putar = (n = 0) =>
      ketikKata(kata[n], () => {
        ketik.classList.add("pudar");
        setTimeout(() => {
          ketik.classList.remove("pudar");
          putar((n + 1) % kata.length);
        }, 350);
      });
    putar();
  }
}
