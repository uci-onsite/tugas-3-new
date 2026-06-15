import { getStorage, setStorage } from "../app.js";

const STORAGE_KEYS = {
  dos: "tugas3_dos_v1",
  doCounter: "tugas3_do_counter_v1",
};

function formatDoNotFound() {
  return "DO tidak ditemukan. Coba ulangi dengan nomor pesanan atau kode modul yang benar.";
}

function normalize(s) {
  return String(s ?? "").trim().toLowerCase();
}

function createStep(step) {
  const el = document.createElement("div");
  el.className = "step";

  const dot = document.createElement("div");
  dot.className = "step-dot";
  dot.textContent = step.icon ? step.icon : "•";

  const body = document.createElement("div");
  body.className = "step-body";

  const title = document.createElement("div");
  title.className = "step-title";
  title.textContent = step.title ?? "";

  const meta = document.createElement("div");
  meta.className = "step-meta";
  meta.textContent = (step.meta ?? "") + (step.time ? " • " + step.time : "");

  body.appendChild(title);
  body.appendChild(meta);

  el.appendChild(dot);
  el.appendChild(body);

  return el;
}

function renderSteps(progress) {
  const container = document.getElementById("doSteps");
  if (!container) return;

  container.innerHTML = "";
  const steps = Array.isArray(progress) ? progress : [];
  if (!steps.length) {
    const empty = document.createElement("div");
    empty.className = "small";
    empty.textContent = "Belum ada timeline untuk DO ini.";
    container.appendChild(empty);
    return;
  }

  for (const s of steps) container.appendChild(createStep(s));
}

function renderSummary(doItem) {
  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v ?? "";
  };

  setText("doNamaMahasiswa", doItem.namaMahasiswa ?? "");
  setText("doKodeModul", doItem.kodeModul ?? "");
  setText("doEstimasi", doItem.estimasiTiba ?? "");
  setText("doRoute", doItem.route ?? "");
}

function findDoByQuery(dos, query) {
  const q = normalize(query);
  if (!q) return null;

  // cocokkan nomorDO / nim / kodeModul
  const hit = dos.find((d) => {
    const nomor = normalize(d.nomorDO);
    const nim = normalize(d.nim);
    const kode = normalize(d.kodeModul);
    return nomor === q || nim === q || kode === q || normalize(String(d.nomorDO)).includes(q) || normalize(String(d.kodeModul)).includes(q);
  });

  return hit ?? null;
}

function initDoTracking() {
  const input = document.getElementById("doSearchInput");
  const btnSearch = document.getElementById("btnSearchDO");
  const btnClear = document.getElementById("btnClearDO");
  const btnAddDO = document.getElementById("btnAddDO");

  if (!input || !btnSearch || !btnAddDO) return; // bukan halaman tracking

  const { open, close } = window.__appModal ?? { open: () => {}, close: () => {} };
  const backdrop = document.getElementById("modalBackdrop");
  const doForm = document.getElementById("doForm");

  let lastFound = null;

  const refreshFromStorage = () => {
    const dos = getStorage(STORAGE_KEYS.dos) ?? [];
    return Array.isArray(dos) ? dos : [];
  };

  const doSearch = () => {
    const dos = refreshFromStorage();
    const q = input.value;

    const found = findDoByQuery(dos, q);

    if (!found) {
      lastFound = null;
      renderSummary({
        namaMahasiswa: "",
        kodeModul: "",
        estimasiTiba: "",
        route: "",
      });
      renderSteps([]);
      alert(formatDoNotFound());
      return;
    }

    lastFound = found;
    renderSummary(found);
    renderSteps(found.progress);
  };

  btnSearch.addEventListener("click", doSearch);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch();
    }
  });

  btnClear?.addEventListener("click", () => {
    input.value = "";
    lastFound = null;
    renderSummary({
      namaMahasiswa: "",
      kodeModul: "",
      estimasiTiba: "",
      route: "",
    });
    renderSteps([]);
    input.focus();
  });

  const modalShow = () => {
    open();
    backdrop?.classList.add("show");
  };

  const modalHide = () => {
    close();
    backdrop?.classList.remove("show");
  };

  // Add DO
  btnAddDO.addEventListener("click", () => {
    const counter = Number(getStorage(STORAGE_KEYS.doCounter) ?? 1);
    const year = 2025; // sesuai contoh
    const nomorUrut = String(counter).padStart(3, "0");
    const nomorDO = `DO${year}-${nomorUrut}`;

    document.getElementById("fDoNomor").value = nomorDO;

    doForm?.reset?.();
    document.getElementById("fDoNomor").value = nomorDO;

    modalShow();
  });

  doForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const nomorDO = document.getElementById("fDoNomor").value;

    const nim = document.getElementById("fDoNim").value;
    const namaMahasiswa = document.getElementById("fDoNama").value;
    const sequenceNumber = Number(document.getElementById("fDoSequence").value);
    const kodeModul = document.getElementById("fDoKodeModul").value;

    if (!nomorDO || !nim || !namaMahasiswa || !kodeModul || !sequenceNumber) {
      alert("Semua field wajib diisi.");
      return;
    }

    const dos = refreshFromStorage();

    // contoh timeline (diisi berdasarkan sequenceNumber)
    const baseTime = new Date();
    const fmt = (d) => d.toISOString().slice(0, 19).replace("T", " ");

    const progress = [
      { title: "Pengiriman Dimulai", meta: "Gudang Pusat Universitas Terbuka", time: fmt(baseTime), icon: "🏭" },
      { title: "Dalam Proses Antar Kurir Akhir", meta: "Kurir: Raka", time: fmt(new Date(baseTime.getTime() - 1000 * 60 * 60 * 24)), icon: "🚚" },
      { title: "Tiba di Kantor Distribusi Akhir (Tujuan)", meta: "Semarang", time: fmt(new Date(baseTime.getTime() - 1000 * 60 * 60 * 30)), icon: "🏠" },
      { title: "Selesai Antar (Estimasi)", meta: `Diterima: ${namaMahasiswa}`, time: fmt(new Date(baseTime.getTime() - 1000 * 60 * 60 * 50)), icon: "✅" },
    ];

    const newDo = {
      id: nomorDO,
      nomorDO,
      nim,
      namaMahasiswa,
      sequenceNumber,
      kodeModul,
      estimasiTiba: "15 Oktober 2023",
      route: "Gudang Pusat (Jakarta) → Semarang → Tujuan Akhir",
      progress,
    };

    dos.push(newDo);
    setStorage(STORAGE_KEYS.dos, dos);

    const counter = Number(getStorage(STORAGE_KEYS.doCounter) ?? 1);
    setStorage(STORAGE_KEYS.doCounter, counter + 1);

    modalHide();

    // Setelah submit, auto tampilkan timeline DO yang baru
    renderSummary(newDo);
    renderSteps(newDo.progress);

    lastFound = newDo;

    // juga isi input search supaya sesuai instruksi pencarian
    input.value = nomorDO;
  });

  // Enter submit semua input
  doForm?.querySelectorAll("input, textarea, select")?.forEach((el) => {
    el.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        doForm.requestSubmit();
      }
    });
  });
}

initDoTracking();
