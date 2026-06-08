import { loadHeaderFooter } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";
import JobListing from "./JobListing.mjs";

document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();

  // Initialize job listing
  const dataSource = new ExternalServices();
  const jobListing = new JobListing(dataSource);
  await jobListing.init();
});
