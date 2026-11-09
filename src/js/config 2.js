// Alamat API (backend Phoenix). Atur lewat VITE_API_URL di berkas .env
// untuk build produksi; nilai bawaan dipakai saat pengembangan lokal.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");
