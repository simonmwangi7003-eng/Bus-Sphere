import { startRouter } from "./router.js";
import { initializeDataStore, getStorageWarning } from "./services/storage.js";
import { notify } from "./components/notification.js";

const initialization = initializeDataStore();
startRouter();
if (initialization.warning || getStorageWarning()) {
  notify(initialization.warning || getStorageWarning(), "error");
}
window.addEventListener("bussphere:storage-warning", (event) => notify(event.detail, "error"));
