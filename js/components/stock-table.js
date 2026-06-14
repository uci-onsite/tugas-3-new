import { getStorage, setStorage } from "../app.js";
import { statusBadge } from "./status-badge.js";

const STORAGE_KEYS = {
  stocks: "tugas3_stocks_v1",
};

function formatRupiah(n) {
  const num = Number(n ?? 0);
  return "Rp " + num.toLocaleString("id-ID");
}

function collectFilterState() {
  return {
    upbji: document.getElementById("upbjiList")?.value ?? "all",
    kategori: document.getElementById("kategoriList")?.value ?? "all",
    safety: document.getElementById("safetyFilter")?.value ?? "all",
    sortBy: document.getElementById("sortBy")?.value ?? "judul:asc",
    searchJudul: document.getElementById("searchJudul")?.value ?? "",
  };
}

function applyFiltersSort(data, state) {
  const txt = String(state.searchJudul ?? "").trim().toLowerCase();

  const filtered = data.filter((it) => {
    if (state.upbji !== "all" && it.upbji !== state.upbji) return false;
    if (state.kategori !== "all" && it.kategori !== state.kategori) return false;

    const qty = Number(it.qty ?? 0);
    const safety = Number(it.safety ?? 0);

    // instruksi gambar
    // - Aman: qty >= safety (safety > 0)
    // - Kosong: qty = 0
    // - Menipis: 0 < qty < safety
    if (state.safety !== "all") {
      if (state.safety === "kosong" && qty !== 0) return false;
      if (state.safety === "safe" && !(qty >= safety && safety > 0)) return false;
      if (state.safety === "menipis" && !(qty > 0 && qty < safety)) return false;
    }

    if (txt) {
      const judul = String(it.judul ?? "").toLowerCase();
      if (!judul.includes(txt)) return false;
    }

    return true;
  });

  const [field, dir] = String(state.sortBy ?? "judul:asc").split(":");
  const asc = dir === "asc";

  filtered.sort((a, b) => {
    const av = a[field];
    const bv = b[field];

    if (typeof av === "number" || typeof bv === "number") {
      return (Number(av ?? 0) - Number(bv ?? 0)) * (asc ? 1 : -1);
    }

    return String(av ?? "").localeCompare(String(bv ?? "")) * (asc ? 1 : -1);
  });

  return filtered;
}

function buildOptions(selectEl, items, valueKey) {
  const values = (items ?? []).map((x) => x?.[valueKey]).filter(Boolean);
  const uniq = Array.from(new Set(values)).sort((a, b) => String(a).localeCompare(String(b)));

  selectEl.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = valueKey === "upbji" ? "Semua UT-Daerah" : "Semua Kategori";
  selectEl.appendChild(optAll);

  for (const v of uniq) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  }
}

function tdText(text) {
  const td = document.createElement("td");
  td.className = "td";
  td.textContent = text ?? "";
  return td;
}

function renderTableRows(rows) {
  const tbody = document.getElementById("stockTableBody");
  const tooltip = document.getElementById("noteTooltip");
  if (!tbody) return;

  tbody.innerHTML = "";

  for (const it of rows) {
    const badge = statusBadge(it.qty, it.safety);

    const tr = document.createElement("tr");
    tr.className = "row-hover";
    tr.tabIndex = 0;

    const tdKode = document.createElement("td");
    tdKode.className = "td";
    tdKode.textContent = it.kode ?? "";

    const tdJudul = document.createElement("td");
    tdJudul.className = "td";
    const judulDiv = document.createElement("div");
    judulDiv.style.fontWeight = "1000";
    judulDiv.style.color = "var(--blue-900)";
    judulDiv.textContent = it.judul ?? "";
    tdJudul.appendChild(judulDiv);

    const tdKategori = document.createElement("td");
    tdKategori.className = "td";
    tdKategori.textContent = it.kategori ?? "";

    const tdUpbji = document.createElement("td");
    tdUpbji.className = "td";
    tdUpbji.textContent = it.upbji ?? "";

    const tdLokasiRak = document.createElement("td");
    tdLokasiRak.className = "td";
    tdLokasiRak.textContent = it.lokasiRak ?? "";

    const tdHarga = document.createElement("td");
    tdHarga.className = "td";
    tdHarga.textContent = formatRupiah(it.harga);

    const tdQty = document.createElement("td");
    tdQty.className = "td";
    const qtyDiv = document.createElement("div");
    qtyDiv.style.fontWeight = "1000";
    qtyDiv.textContent = String(Number(it.qty ?? 0));
    const qtySmall = document.createElement("span");
    qtySmall.className = "small";
    qtySmall.textContent = " buah";
    qtyDiv.appendChild(qtySmall);
    tdQty.appendChild(qtyDiv);

    const tdSafety = document.createElement("td");
    tdSafety.className = "td";
    const safetyDiv = document.createElement("div");
    safetyDiv.style.fontWeight = "1000";
    safetyDiv.textContent = String(Number(it.safety ?? 0));
    const safetySmall = document.createElement("span");
    safetySmall.className = "small";
    safetySmall.textContent = " safety";
    safetyDiv.appendChild(safetySmall);
    tdSafety.appendChild(safetyDiv);

    const tdStatus = document.createElement("td");
    tdStatus.className = "td";
  const badgeSpan = document.createElement("span");
  badgeSpan.className = "badge " + (badge.className || "");
  badgeSpan.setAttribute("data-status", "");
  badgeSpan.textContent = badge.label;
    tdStatus.appendChild(badgeSpan);

    const tdAksi = document.createElement("td");
    tdAksi.className = "td";
    const actions = document.createElement("div");
    actions.className = "actions";

    const btnEdit = document.createElement("button");
    btnEdit.className = "icon-btn";
    btnEdit.type = "button";
    btnEdit.title = "Edit";
    btnEdit.textContent = "✏️";
    btnEdit.setAttribute("data-action", "edit");
    btnEdit.setAttribute("data-id", it.kode ?? "");

    const btnDelete = document.createElement("button");
    btnDelete.className = "icon-btn danger";
    btnDelete.type = "button";
    btnDelete.title = "Hapus";
    btnDelete.textContent = "🗑️";
    btnDelete.setAttribute("data-action", "delete");
    btnDelete.setAttribute("data-id", it.kode ?? "");

    const btnNote = document.createElement("button");
    btnNote.className = "icon-btn";
    btnNote.type = "button";
    btnNote.title = "Catatan";
    btnNote.textContent = "📝";
    btnNote.setAttribute("data-action", "note");
    btnNote.setAttribute("data-note", it.catatan ?? "");
    actions.appendChild(btnEdit);
    actions.appendChild(btnDelete);
    actions.appendChild(btnNote);
    tdAksi.appendChild(actions);

    tr.appendChild(tdKode);
    tr.appendChild(tdJudul);
    tr.appendChild(tdKategori);
    tr.appendChild(tdUpbji);
    tr.appendChild(tdLokasiRak);
    tr.appendChild(tdHarga);
    tr.appendChild(tdQty);
    tr.appendChild(tdSafety);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAksi);

    // hover tooltip catatan
    const noteText = String(it.catatanHTML ?? it.catatan ?? "");
    tr.addEventListener("mouseenter", () => {
      if (!tooltip || !noteText) return;
      tooltip.textContent = noteText;
      const rect = tr.getBoundingClientRect();
      tooltip.style.left = rect.left + rect.width / 2 + "px";
      tooltip.style.top = rect.top + "px";
      tooltip.classList.add("show");
    });
    tr.addEventListener("mouseleave", () => {
      tooltip?.classList.remove("show");
    });

    tr.addEventListener("focus", () => {
      if (!tooltip || !noteText) return;
      tooltip.textContent = noteText;
      const rect = tr.getBoundingClientRect();
      tooltip.style.left = rect.left + rect.width / 2 + "px";
      tooltip.style.top = rect.top + "px";
      tooltip.classList.add("show");
    });
    tr.addEventListener("blur", () => {
      tooltip?.classList.remove("show");
    });

    tbody.appendChild(tr);
  }
}

function readFormValues() {
  const get = (id) => document.getElementById(id)?.value;

  return {
    kode: get("fKode"),
    judul: get("fJudul"),
    kategori: get("fKategori"),
    upbji: get("fUpbji"),
    lokasiRak: get("fLokasiRak"),
    harga: Number(get("fHarga") ?? 0),
    qty: Number(get("fJumlahStok") ?? 0),
    safety: Number(get("fSafety") ?? 0),
    catatanHTML: get("fCatatan") ?? "",
  };
}

function setFormValues(stock) {
  const map = {
    kode: "fKode",
    judul: "fJudul",
    kategori: "fKategori",
    upbji: "fUpbji",
    lokasiRak: "fLokasiRak",
    harga: "fHarga",
    qty: "fJumlahStok",
    safety: "fSafety",
    catatanHTML: "fCatatan",
  };

  for (const [k, id] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.value = stock?.[k] ?? "";
  }
}

function validateStock(s) {
  const requiredText = ["kode", "judul", "kategori", "upbji", "lokasiRak", "catatan"];
  for (const k of requiredText) {
    if (String(s[k] ?? "").trim().length === 0) return false;
  }

  const requiredNum = ["harga", "qty", "safety"];
  for (const k of requiredNum) {
    const v = Number(s[k]);
    if (Number.isNaN(v) || v < 0) return false;
  }

  return true;
}

export function initStockTable() {
  const upbjiList = document.getElementById("upbjiList");
  const kategoriList = document.getElementById("kategoriList");
  const safetyFilter = document.getElementById("safetyFilter");
  const sortBy = document.getElementById("sortBy");
  const searchJudul = document.getElementById("searchJudul");

  if (!upbjiList || !kategoriList) return;

  const stockForm = document.getElementById("stockForm");
  const btnAdd = document.getElementById("btnAddStock");
  const btnReset = document.getElementById("btnResetFilters");

  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const backdrop = document.getElementById("modalBackdrop");

  const { open, close } = window.__appModal ?? { open: () => {}, close: () => {} };

  let mode = "create";
  let editingKode = null;

  const showModal = () => {
    open();
    backdrop?.classList.add("show");
  };
  const hideModal = () => {
    close();
    backdrop?.classList.remove("show");
  };

  const refresh = () => {
    const state = collectFilterState();
    const all = getStorage(STORAGE_KEYS.stocks) ?? [];
    const next = applyFiltersSort(all, state);
    renderTableRows(next);
  };

  const allStocks = getStorage(STORAGE_KEYS.stocks) ?? [];
  buildOptions(upbjiList, allStocks, "upbji");
  buildOptions(kategoriList, allStocks, "kategori");
  refresh();

  upbjiList.addEventListener("change", refresh);
  kategoriList.addEventListener("change", refresh);
  safetyFilter.addEventListener("change", refresh);
  sortBy.addEventListener("change", refresh);
  searchJudul?.addEventListener("input", refresh);

  btnReset?.addEventListener("click", () => {
    upbjiList.value = "all";
    kategoriList.value = "all";
    safetyFilter.value = "all";
    sortBy.value = "judul:asc";
    if (searchJudul) searchJudul.value = "";
    refresh();
  });

  btnAdd?.addEventListener("click", () => {
    mode = "create";
    editingKode = null;
    modalTitle.textContent = "Tambah Bahan Ajar";
    modalSubtitle.textContent = "Isi data stok bahan ajar";
    stockForm?.reset();
    document.getElementById("fKode")?.removeAttribute("readonly");
    showModal();
  });

  stockForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const values = readFormValues();

    if (!validateStock(values)) {
      alert("Data tidak valid. Pastikan semua field terisi dan angka >= 0.");
      return;
    }

    const current = getStorage(STORAGE_KEYS.stocks) ?? [];

    if (mode === "create") {
      if (current.some((x) => x.kode === values.kode)) {
        alert("Kode sudah ada. Gunakan mode Edit atau pakai kode berbeda.");
        return;
      }
      current.push(values);
    } else {
      const idx = current.findIndex((x) => x.kode === editingKode);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...values, kode: editingKode };
    }
    }

    setStorage(STORAGE_KEYS.stocks, current);

    buildOptions(upbjiList, current, "upbji");
    buildOptions(kategoriList, current, "kategori");

    hideModal();
    refresh();
  });

  stockForm?.querySelectorAll("input, textarea, select")?.forEach((el) => {
    el.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        stockForm.requestSubmit();
      }
    });
  });

  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const kode = btn.getAttribute("data-id");
    const note = btn.getAttribute("data-note");

    if (action === "edit") {
      const current = getStorage(STORAGE_KEYS.stocks) ?? [];
      const item = current.find((x) => x.kode === kode);
      if (!item) return;

      mode = "update";
      editingKode = kode;
      modalTitle.textContent = "Edit Bahan Ajar";
      modalSubtitle.textContent = "Perbarui data stok bahan ajar";

      setFormValues(item);
      document.getElementById("fKode")?.setAttribute("readonly", "true");
      showModal();
      return;
    }

    if (action === "delete") {
      const current = getStorage(STORAGE_KEYS.stocks) ?? [];
      const item = current.find((x) => x.kode === kode);
      if (!item) return;

      const ok = confirm("Hapus data " + item.kode + " ? ");
      if (!ok) return;

      const next = current.filter((x) => x.kode !== kode);
      setStorage(STORAGE_KEYS.stocks, next);

      buildOptions(upbjiList, next, "upbji");
      buildOptions(kategoriList, next, "kategori");

      refresh();
      return;
    }

    if (action === "note") {
      const txt = note ?? "";
      if (!txt.trim()) {
        alert("Tidak ada catatan.");
        return;
      }
      alert(txt);
      return;
    }
  });

  window.__stockTable = { refresh };
}

initStockTable();
