export function showModal(content) {
  const root = document.querySelector("#modal-root");
  root.innerHTML = `<div class="modal-backdrop" role="presentation"><section class="modal" role="dialog" aria-modal="true"><button class="modal-close" type="button" aria-label="Close dialog">×</button>${content}</section></div>`;
  const backdrop = root.querySelector(".modal-backdrop");
  root.querySelector(".modal-close").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });
  root.querySelector(".modal-close").focus();
}

export function closeModal() {
  document.querySelector("#modal-root").replaceChildren();
}
