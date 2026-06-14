import { getStorage, setStorage } from "../app.js";

export function wireAppModal() {
  const backdrop = document.getElementById("modalBackdrop");
  if (!backdrop) return;

  const btnClose = document.getElementById("btnCloseModal");
  const btnCancel = document.getElementById("btnCancelStock") ?? document.getElementById("btnCancelDO");
  const form = document.getElementById("stockForm") ?? document.getElementById("doForm");

  const close = () => {
    backdrop.classList.remove("show");
    backdrop.setAttribute("aria-hidden", "true");
    // prevent stale validation UI
    form?.reset?.();
  };

  const open = () => {
    backdrop.classList.add("show");
    backdrop.setAttribute("aria-hidden", "false");
    const firstInput = backdrop.querySelector("input, textarea, select");
    firstInput?.focus?.();
  };

  btnClose?.addEventListener("click", close);
  btnCancel?.addEventListener("click", close);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop.classList.contains("show")) {
      e.preventDefault();
      close();
    }
  });

  // expose for pages
  window.__appModal = { open, close };
}

wireAppModal();
