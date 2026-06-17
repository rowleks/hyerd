import { loadHeaderFooter } from "./utils.mjs";
import Dashboard from "./Dashboard.mjs";

document.addEventListener("DOMContentLoaded", async () => {
  const dashboard = new Dashboard();
  await dashboard.init();
});
