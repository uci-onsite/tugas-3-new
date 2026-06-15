export function statusBadge(qty, safety) {
  const numQty = Number(qty ?? 0);
  const numSafety = Number(safety ?? 0);

  // Instruksi: aman jika qty >= safety
  if (numQty >= numSafety && numSafety > 0) {
    return { label: "Aman", className: "ok" };
  }

  // Instruksi: Kosong jika qty = 0
  if (numQty === 0) {
    return { label: "Kosong", className: "bad" };
  }

  // Instruksi: Menipis jika 0 < qty < safety
  if (numQty > 0 && numQty < numSafety) {
    return { label: "Menipis", className: "warn" };
  }

  // edge-case jika safety = 0
  if (numSafety === 0) {
    return { label: numQty === 0 ? "Kosong" : "Aman", className: numQty === 0 ? "bad" : "ok" };
  }

  return { label: "—", className: "" };
}
