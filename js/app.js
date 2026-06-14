const STORAGE_KEYS = {
  stocks: "tugas3_stocks_v1",
  dos: "tugas3_dos_v1",
  doCounter: "tugas3_do_counter_v1",
};

export function getStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

export function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initBootstrap() {
  const DATA_URL = "./data/dataBahanAjar.json";

  // init stocks + metadata dari data json jika belum ada di localStorage
  if (!localStorage.getItem(STORAGE_KEYS.stocks)) {
    fetch(DATA_URL)
      .then((r) => r.json())
      .then((data) => {
        // kita simpan seluruh payload agar komponen stok bisa baca konfigurasi
        // catatan: stock-table.js akan tetap mengambil localStorage.stocks sebagai array,
        // jadi kita simpan array stok langsung (data.stok) untuk kompatibilitas.
        setStorage(STORAGE_KEYS.stocks, data?.stok ?? []);
      })
      .catch(() => {
        setStorage(STORAGE_KEYS.stocks, []);
      });
  }

  // init DO dari data json jika belum ada di localStorage
  if (!localStorage.getItem(STORAGE_KEYS.dos)) {
    fetch(DATA_URL)
      .then((r) => r.json())
      .then((data) => {
        // bentuk data.tracking: array objek { "DOxxxx": { ... } }
        const trackingArr = Array.isArray(data?.tracking) ? data.tracking : [];
        const normalized = [];

        for (const obj of trackingArr) {
          if (!obj || typeof obj !== "object") continue;
          const keys = Object.keys(obj);
          if (!keys.length) continue;

          const nomorDO = keys[0];
          const tr = obj[nomorDO] ?? {};
          normalized.push({
            id: nomorDO,
            nomorDO,
            nim: tr.nim ?? "",
            namaMahasiswa: tr.nama ?? "",
            kodeModul: tr.paket ?? "",
            estimasiTiba: "", // tidak ada di file, bisa diisi saat user tambah progress
            route: "", // tidak ada di file, bisa diisi saat user tambah progress
            ekspedisi: tr.ekspedisi ?? "",
            paket: tr.paket ?? "",
            totalHarga: tr.total ?? 0,
            progress: Array.isArray(tr.perjalanan)
              ? tr.perjalanan.map((p) => ({
                  waktu: p.waktu ?? "",
                  keterangan: p.keterangan ?? "",
                }))
              : [],
          });
        }

        setStorage(STORAGE_KEYS.dos, normalized);

        // counter untuk tahun berjalan: ambil max sequence dari nomor DO
        const tahun = new Date().getFullYear();
        const seqs = normalized
          .map((d) => String(d.nomorDO ?? ""))
          .filter((s) => s.startsWith(`DO${tahun}-`))
          .map((s) => Number(s.split("-")[1]))
          .filter((n) => !Number.isNaN(n));
        const next = seqs.length ? Math.max(...seqs) + 1 : 1;

        setStorage(STORAGE_KEYS.doCounter, next);
      })
      .catch(() => {
        setStorage(STORAGE_KEYS.dos, []);
        setStorage(STORAGE_KEYS.doCounter, 1);
      });
  }
}

initBootstrap();
