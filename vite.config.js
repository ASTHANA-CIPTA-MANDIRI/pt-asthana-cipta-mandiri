import { defineConfig, loadEnv } from "vite";
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FOLDER_POTONGAN = resolve(__dirname, "partials");
const BERKAS_DATA = resolve(__dirname, "data/perusahaan.json");

// Salinan ganda buatan OneDrive/iCloud ("index 2.html", "en/news 2") —
// dulu ikut terbit sebagai halaman versi lama.
const SALINAN_GANDA = / \d+(\.[^.]+)?$/;

// Folder yang bukan halaman situs
const BUKAN_HALAMAN = new Set(["node_modules", "dist", "partials", "public", "src", "data", "alat", ".git"]);

/** Semua berkas .html halaman, untuk input build & sitemap. */
function cariHalaman(dir = __dirname) {
  const hasil = [];
  for (const nama of readdirSync(dir)) {
    const jalur = resolve(dir, nama);
    if (statSync(jalur).isDirectory()) {
      if (!BUKAN_HALAMAN.has(nama) && !nama.startsWith(".") && !SALINAN_GANDA.test(nama)) hasil.push(...cariHalaman(jalur));
    } else if (nama.endsWith(".html") && !SALINAN_GANDA.test(nama)) {
      hasil.push(jalur);
    }
  }
  return hasil;
}

/** "/tentang/index.html" → "/tentang/", "/karir/detail.html" → "/karir/detail.html" */
function jalurPublik(berkas) {
  const rel = "/" + relative(__dirname, berkas).split(sep).join("/");
  return rel.replace(/index\.html$/, "");
}

const escAtribut = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Menyusun halaman dari potongan bersama dan data perusahaan.
 *
 *   <!-- @include header aktif="tentang" -->   sisipkan partials/header.html
 *   {{judul}}                                  parameter @include
 *   {{p.whatsapp}} / {{p.peta_kueri|url}}      data/perusahaan.json
 *   <a data-jika="instagram" ...>…</a>         dibuang bila datanya kosong
 *
 * Berjalan sebelum Vite memproses HTML, jadi aset di potongan tetap diproses.
 */
function susunHalaman(env) {
  const situs = (env.VITE_SITE_URL || "").replace(/\/+$/, "");
  const idAnalitik = env.VITE_GA_ID || "";
  const polaInclude = /<!--\s*@include\s+([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g;

  const bacaData = () => JSON.parse(readFileSync(BERKAS_DATA, "utf8"));

  return {
    name: "susun-halaman",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const p = bacaData();
        const jalur = ctx.path.replace(/index\.html$/, "");
        let padanan = null; // halaman yang sama dalam bahasa lain (param head)
        let bahasa = "id";

        html = html.replace(polaInclude, (_, nama, atribut) => {
          const param = Object.fromEntries(
            [...atribut.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]])
          );
          // Nilai bawaan: halaman tanpa padanan tetap punya tombol bahasa
          // yang menuju beranda bahasa lain.
          const en = (param.bahasa || (jalur.startsWith("/en/") ? "en" : "id")) === "en";
          param.locale ??= en ? "en_US" : "id_ID";
          param.padanan ??= en ? "/" : "/en/";
          if (nama === "head") {
            padanan = param.padanan;
            bahasa = en ? "en" : "id";
          }
          let isi = readFileSync(resolve(FOLDER_POTONGAN, `${nama}.html`), "utf8");
          isi = isi.replace(/\{\{(\w+)\}\}/g, (m, kunci) => (kunci in param ? param[kunci] : m));
          if (param.aktif) {
            isi = isi.replaceAll(`data-nav="${param.aktif}"`, `data-nav="${param.aktif}" aria-current="page"`);
          }
          return isi;
        });

        // Tag kepala yang bergantung pada alamat situs & analitik
        let kepala = "";
        if (situs) {
          kepala += `    <link rel="canonical" href="${situs}${jalur}" />\n`;
          kepala += `    <meta property="og:url" content="${situs}${jalur}" />\n`;
          if (padanan) {
            const lain = bahasa === "en" ? "id" : "en";
            kepala += `    <link rel="alternate" hreflang="${bahasa}" href="${situs}${jalur}" />\n`;
            kepala += `    <link rel="alternate" hreflang="${lain}" href="${situs}${padanan}" />\n`;
            if (bahasa === "id") kepala += `    <link rel="alternate" hreflang="x-default" href="${situs}${jalur}" />\n`;
          }
        }
        if (idAnalitik) {
          kepala +=
            `    <script async src="https://www.googletagmanager.com/gtag/js?id=${idAnalitik}"></script>\n` +
            `    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${idAnalitik}");</script>\n`;
        }
        html = html.replace("{{kepala_situs}}", kepala);
        html = html.replace(/\{\{situs\}\}/g, situs);

        // Blok bersyarat (boleh berisi elemen bersarang):
        //   <!--jika:alamat_jalan--> … <!--/jika:alamat_jalan-->
        html = html.replace(/<!--jika:(\w+)-->([\s\S]*?)<!--\/jika:\1-->/g, (_, kunci, isi) => (p[kunci] ? isi : ""));

        // Elemen bersyarat: dibuang bila data perusahaannya kosong
        html = html.replace(
          /<(a|li|div|p|span)\b([^>]*?)\sdata-jika="(\w+)"([^>]*)>([\s\S]*?)<\/\1>/g,
          (utuh, tag, a1, kunci, a2, isi) => (p[kunci] ? `<${tag}${a1}${a2}>${isi}</${tag}>` : "")
        );

        // Data perusahaan
        html = html.replace(/\{\{p\.(\w+)(\|url)?\}\}/g, (m, kunci, url) => {
          if (!(kunci in p)) throw new Error(`data/perusahaan.json tidak punya kunci "${kunci}" (${ctx.path})`);
          return url ? encodeURIComponent(p[kunci]) : escAtribut(p[kunci]);
        });
        return html;
      },
    },

    // sitemap.xml & robots.txt dibuat saat build
    generateBundle() {
      const halaman = cariHalaman()
        .map(jalurPublik)
        // Halaman yang isinya ditentukan ?slug= tidak berarti apa-apa tanpa slug.
        .filter((j) => !/(^|\/)404\.html$/.test(j) && !/\/(detail|baca|read|formulir|apply)\.html$/.test(j));
      if (situs) {
        const url = halaman
          .sort()
          .map((j) => `  <url><loc>${situs}${j}</loc></url>`)
          .join("\n");
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${url}\n</urlset>\n`,
        });
      } else {
        this.warn("VITE_SITE_URL kosong: sitemap.xml & URL kanonik tidak dibuat.");
      }
      // Halaman detail lowongan dirakit dari ?slug=, jadi tidak ada di sitemap
      // situs; daftar alamatnya dibuat lemon (hanya lowongan yang masih buka).
      const api = (env.VITE_API_URL || "").replace(/\/+$/, "");
      const peta = [situs && `Sitemap: ${situs}/sitemap.xml`, api && situs && `Sitemap: ${api}/situs/sitemap-lowongan.xml`].filter(Boolean);
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n${peta.length ? `\n${peta.join("\n")}\n` : ""}`,
      });
    },

    // Peladen produksi menaruh situs di subfolder (/asthana/) dan CDN Hostinger
    // tidak menerapkan ulang aturan pengalihan untuk ErrorDocument — jalur
    // halaman 404 harus ditulis lengkap. VITE_FOLDER_PELADEN di .env.production.
    closeBundle() {
      const folder = (env.VITE_FOLDER_PELADEN || "").replace(/\/+$/, "");
      if (!folder) return;
      for (const berkas of ["dist/.htaccess", "dist/en/.htaccess"]) {
        const jalur = resolve(__dirname, berkas);
        if (!existsSync(jalur)) continue;
        const isi = readFileSync(jalur, "utf8").replace(/^ErrorDocument 404 \//m, `ErrorDocument 404 ${folder}/`);
        writeFileSync(jalur, isi);
      }
    },

    configureServer(server) {
      server.watcher.add([FOLDER_POTONGAN, BERKAS_DATA]);
      server.watcher.on("change", (berkas) => {
        if (berkas.startsWith(FOLDER_POTONGAN) || berkas === BERKAS_DATA) {
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "VITE_");
  const input = Object.fromEntries(
    cariHalaman().map((f) => [jalurPublik(f).replace(/^\/|\/$/g, "").replace(/[\/.]/g, "_") || "beranda", f])
  );

  return {
    plugins: [susunHalaman(env)],
    build: { rollupOptions: { input } },
  };
});
