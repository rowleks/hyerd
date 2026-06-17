import { loadHeaderFooter } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";
import JobDetails from "./JobDetails.mjs";

document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();

  const dataSource = new ExternalServices();
  const jobDetails = new JobDetails(dataSource);
  await jobDetails.init();
});
