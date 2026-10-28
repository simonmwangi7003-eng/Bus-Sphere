export function notify(message, type = "success") {
  const region = document.querySelector("#notification-region");
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " error" : ""}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}
