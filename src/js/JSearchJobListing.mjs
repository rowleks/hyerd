import {
  qs,
  getFromLocalStorage,
  saveToLocalStorage,
  markJobAsApplied,
} from "./utils.mjs";

const FAV_KEY = "hyerd_favourites";

export default class JSearchJobListing {
  constructor(dataSource) {
    this.allJobs = [];
    this.filteredJobs = [];
    this.dataSource = dataSource;
    this.container = null;
    this.filters = {
      searchTerm: "",
      employmentTypes: [],
      remoteOnly: false,
      locations: [],
      dateRange: "all",
    };
  }

  async init() {
    this.container = document.getElementById("job-cards-container");
    this.#showSkeleton(9);

    try {
      const response = await this.dataSource.getJSearchJobs();
      this.allJobs = response.data?.jobs || [];
      this.filteredJobs = [...this.allJobs];
      this.renderJobs();
    } catch (error) {
      console.error("Error loading JSearch jobs:", error);
      this.renderError();
    }
  }

  #showSkeleton(count = 6) {
    if (!this.container) return;
    this.container.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement("div");
      skeleton.className = "job-card animate-pulse";
      skeleton.innerHTML = `
        <div class="flex items-start justify-between mb-4">
          <div class="size-12 rounded-lg bg-gray-200"></div>
          <div class="w-5 h-5 bg-gray-200 rounded"></div>
        </div>
        <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div class="flex gap-2 mb-4">
          <div class="h-4 w-16 bg-gray-200 rounded"></div>
          <div class="h-4 w-12 bg-gray-200 rounded"></div>
        </div>
        <div class="flex justify-between items-center">
          <div class="h-3 w-20 bg-gray-200 rounded"></div>
          <div class="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
      `;
      this.container.appendChild(skeleton);
    }
  }

  setFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.filterAndRender();
  }

  filterAndRender() {
    const { searchTerm, employmentTypes, remoteOnly, locations, dateRange } =
      this.filters;

    const now = Date.now() / 1000; // current time in seconds

    this.filteredJobs = this.allJobs.filter((job) => {
      // Search: title OR location
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (job.job_title && job.job_title.toLowerCase().includes(term)) ||
        (job.job_location && job.job_location.toLowerCase().includes(term)) ||
        (job.job_city && job.job_city.toLowerCase().includes(term));

      // Employment type
      const matchesType =
        employmentTypes.length === 0 ||
        employmentTypes.includes(job.job_employment_type);

      // Remote
      const matchesRemote = !remoteOnly || job.job_is_remote === true;

      // Location
      const jobLoc = `${job.job_city || ""}, ${job.job_state || ""}`.trim();
      const matchesLocation =
        locations.length === 0 || locations.includes(jobLoc);

      // Date range
      let matchesDate = true;
      if (dateRange !== "all" && job.job_posted_at_timestamp) {
        const posted = job.job_posted_at_timestamp;
        const diff = now - posted;
        if (dateRange === "today" && diff > 86400) matchesDate = false;
        if (dateRange === "3days" && diff > 259200) matchesDate = false;
        if (dateRange === "week" && diff > 604800) matchesDate = false;
        if (dateRange === "month" && diff > 2592000) matchesDate = false;
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesRemote &&
        matchesLocation &&
        matchesDate
      );
    });

    this.renderJobs();
  }

  renderJobs() {
    if (!this.container) {
      console.warn("[JSearchJobListing] container not found");
      return;
    }

    this.container.innerHTML = ""; // clear skeletons

    if (this.filteredJobs.length === 0) {
      this.renderEmpty();
      return;
    }

    this.filteredJobs.forEach((job) => {
      const extractedData = this.#extractJobData(job);
      const jobCard = this.#createJobCard(extractedData);
      if (jobCard) {
        this.container.appendChild(jobCard);
      }
    });
  }

  #extractJobData(job) {
    if (!job) return null;
    return {
      id: job.job_id,
      title: job.job_title || "",
      organization: job.employer_name || "",
      location: job.job_location || job.job_city || "",
      type: job.job_employment_type || "",
      remote: job.job_is_remote || false,
      date: job.job_posted_at || "",
      url: job.job_apply_link || "#",
      logo: job.employer_logo || "",
    };
  }

  #createJobCard(job) {
    const template = document.getElementById("job-card-template");
    if (!template) return null;

    const clone = template.content.cloneNode(true);
    const article = clone.querySelector(".job-card");

    article.addEventListener("click", (e) => {
      if (
        !e.target.closest(".bookmark-btn") &&
        !e.target.closest(".apply-link")
      ) {
        window.location.href = `/jobs/details?id=${encodeURIComponent(job.id)}`;
      }
    });

    const logoImg = qs(".company-logo img", article);
    if (job.logo) {
      logoImg.src = job.logo;
      logoImg.alt = job.organization || "Company";
      logoImg.style.display = "block";
    } else {
      logoImg.style.display = "none";
    }

    qs(".job-title", article).textContent = job.title || "N/A";
    qs(".company-name", article).textContent = job.organization || "N/A";
    qs(".job-location", article).textContent = job.location || "N/A";

    qs(".job-type-tag", article).textContent =
      this.#formatJobType(job.type) || "Full Time";

    if (job.remote) {
      qs(".job-remote-tag", article).textContent = "Remote";
    } else {
      qs(".job-remote-tag", article).style.display = "none";
    }

    qs(".job-date", article).textContent = this.#formatDate(job.date) || "N/A";
    qs(".apply-link", article).href = job.url || "#";
    qs(".apply-link", article).addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      markJobAsApplied(job);
    });

    const bookmarkBtn = qs(".bookmark-btn", article);
    bookmarkBtn.addEventListener("click", () =>
      this.#toggleBookmark(article, job),
    );

    return article;
  }

  #formatJobType(type) {
    const typeMap = {
      FULL_TIME: "Full-time",
      "Full-time": "Full-time",
      PART_TIME: "Part-time",
      CONTRACTOR: "Contract",
      Contractor: "Contract",
      INTERN: "Internship",
      TEMPORARY: "Temporary",
      VOLUNTEER: "Volunteer",
      OTHER: "Other",
    };
    return typeMap[type] || type;
  }

  #formatDate(dateString) {
    if (!dateString) return "Posted recently";
    // JSearch uses relative strings like "4 days ago" — keep as-is
    return dateString;
  }

  #toggleBookmark(cardElement, job) {
    const bookmarkBtn = cardElement.querySelector(".bookmark-btn svg");
    const isBookmarked = bookmarkBtn.getAttribute("fill") === "currentColor";

    let favourites = getFromLocalStorage(FAV_KEY) || [];

    if (isBookmarked) {
      bookmarkBtn.setAttribute("fill", "none");
      bookmarkBtn.classList.remove("text-accent");
      bookmarkBtn.classList.add("text-gray-400");
      favourites = favourites.filter((j) => j.id !== job.id);
    } else {
      bookmarkBtn.setAttribute("fill", "currentColor");
      bookmarkBtn.classList.remove("text-gray-400");
      bookmarkBtn.classList.add("text-accent");
      if (!favourites.some((j) => j.id === job.id)) {
        favourites.push(job);
      }
    }
    saveToLocalStorage(FAV_KEY, favourites);
  }

  renderError() {
    const errorDiv = document.createElement("div");
    errorDiv.className = "col-span-full text-center py-8";
    errorDiv.innerHTML = `
      <p class="text-gray-500 mb-4">Unable to load jobs at this time.</p>
      <button onclick="location.reload()" class="btn-accent px-4 py-2 rounded-full text-sm">
        Try Again
      </button>
    `;
    this.container.appendChild(errorDiv);
  }

  renderEmpty() {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "col-span-full text-center py-8";
    emptyDiv.innerHTML = `
      <p class="text-gray-500">No jobs match your current filters.</p>
    `;
    this.container.appendChild(emptyDiv);
  }
}
