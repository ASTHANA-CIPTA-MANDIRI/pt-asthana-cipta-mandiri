// Membuat public/company-profile-asthana.pdf dari alat/company-profile.html.
//   npm run profil:pdf
// Data kontak diambil dari data/perusahaan.json (sama dengan situs), alamat
// situs dari VITE_SITE_URL di .env. Butuh Google Chrome terpasang.
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const akar = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const p = JSON.parse(readFileSync(resolve(akar, "data/perusahaan.json"), "utf8"));
const env = existsSync(resolve(akar, ".env")) ? readFileSync(resolve(akar, ".env"), "utf8") : "";
const situs = (env.match(/^VITE_SITE_URL=(.*)$/m)?.[1] || "").trim().replace(/\/+$/, "");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const html = readFileSync(resolve(akar, "alat/company-profile.html"), "utf8")
  .replace(/<!--jika:(\w+)-->([\s\S]*?)<!--\/jika:\1-->/g, (_, k, isi) => (p[k] ? isi : ""))
  .replace(/\{\{p\.(\w+)\}\}/g, (_, k) => esc(p[k] ?? ""))
  // Baris alamat situs hanya ada bila VITE_SITE_URL sudah diisi.
  .replace(/<!--situs-->([\s\S]*?)<!--\/situs-->/, (_, isi) => (situs ? isi : ""))
  .replace("{{situs}}", esc(situs.replace(/^https?:\/\//, "")))
  .replace("{{tahun}}", String(new Date().getFullYear()));

const sementara = resolve(akar, "alat/.profil-sementara.html");
writeFileSync(sementara, html);
const keluaran = resolve(akar, "public/company-profile-asthana.pdf");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
try {
  execFileSync(chrome, [
    "--headless=new", "--disable-gpu", "--allow-file-access-from-files",
    "--no-pdf-header-footer", `--print-to-pdf=${keluaran}`, `file://${sementara}`,
  ], { stdio: "ignore" });
  console.log("Tersimpan:", keluaran);
} finally {
  rmSync(sementara, { force: true });
}
