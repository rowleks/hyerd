import { loadHeaderFooter } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";
import JSearchJobListing from "./JSearchJobListing.mjs";

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();

  const dataSource = new ExternalServices();
  const jobListing = new JSearchJobListing(dataSource);
  await jobListing.init();

  // --- Wire Search (debounced) ---
  const searchInput = document.getElementById("job-search");
  const debouncedSearch = debounce((value) => {
    jobListing.setFilters({ searchTerm: value });
  }, 300);

  searchInput.addEventListener("input", (e) => {
    debouncedSearch(e.target.value);
  });

  // --- Wire Filters ---
  const employmentContainer = document.getElementById("filter-employment");
  const remoteCheckbox = document.getElementById("filter-remote");
  const locationContainer = document.getElementById("filter-location");
  const dateSelect = document.getElementById("filter-date");

  // Dynamically populate employment types
  const employmentTypes = [
    ...new Set(jobListing.allJobs.map((j) => j.job_employment_type).filter(Boolean)),
  ];
  employmentTypes.forEach((type) => {
    const label = document.createElement("label");
    label.className = "flex items-center gap-2";
    label.innerHTML = `
      <input type="checkbox" value="${type}" class="filter-employment-check" />
      <span>${type}</span>
    `;
    employmentContainer.appendChild(label);
  });

  // Dynamically populate locations
  const locations = [
    ...new Set(
      jobListing.allJobs
        .map((j) => {
          if (j.job_city && j.job_state) return `${j.job_city}, ${j.job_state}`;
          return j.job_location;
        })
        .filter(Boolean),
    ),
  ];
  locations.forEach((loc) => {
    const label = document.createElement("label");
    label.className = "flex items-center gap-2";
    label.innerHTML = `
      <input type="checkbox" value="${loc}" class="filter-location-check" />
      <span>${loc}</span>
    `;
    locationContainer.appendChild(label);
  });

  // Attach listeners to all filter controls
  const updateFilters = () => {
    const employmentChecks = Array.from(
      document.querySelectorAll(".filter-employment-check:checked"),
    ).map((c) => c.value);

    const locationChecks = Array.from(
      document.querySelectorAll(".filter-location-check:checked"),
    ).map((c) => c.value);

    jobListing.setFilters({
      employmentTypes: employmentChecks,
      remoteOnly: remoteCheckbox.checked,
      locations: locationChecks,
      dateRange: dateSelect.value,
    });
  };

  // Employment checkboxes
  employmentContainer.addEventListener("change", updateFilters);
  // Remote checkbox
  remoteCheckbox.addEventListener("change", updateFilters);
  // Location checkboxes
  locationContainer.addEventListener("change", updateFilters);
  // Date select
  dateSelect.addEventListener("change", updateFilters);
});
