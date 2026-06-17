import { formatDistanceToNow, parseISO } from "date-fns";
import { qs, getFromLocalStorage, saveToLocalStorage, markJobAsApplied } from "./utils.mjs";

const FAV_KEY = "hyerd_favourites";

export default class JobListing {
  constructor(datasource) {
    this.jobs = [];
    this.dataSource = datasource;
    this.container = null;
  }

  async init() {
    this.container = document.getElementById("job-cards-container");

    try {
      const jobsData = await this.dataSource.getLatestJobs();
      this.jobs = jobsData.data || jobsData || [];
      this.renderJobs();
    } catch (error) {
      console.error("Error loading jobs:", error);
      this.renderError();
    }
  }

  renderJobs() {
    this.jobs.forEach((job) => {
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
      id: job.id,
      title: job.title || "",
      organization: job.organization || "",
      location: job.locations_derived?.[0] || job.cities_derived?.[0] || "",
      type: job.employment_type?.[0] || "FULL_TIME",
      remote: job.remote_derived || false,
      date: job.date_posted || job.date_created,
      url: job.url,
      logo: job.organization_logo,
      description: job.description_html || "",
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
        this.#showJobModal(job);
      }
    });

    // Set company logo
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

    // Add job type tag
    qs(".job-type-tag", article).textContent =
      this.#formatJobType(job.type) || "Full Time";

    // Add remote tag if applicable
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

    // Add bookmark button functionality
    const bookmarkBtn = qs(".bookmark-btn", article);
    bookmarkBtn.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      this.#toggleBookmark(article, job);
    });

    return article;
  }

  #formatJobType(type) {
    const typeMap = {
      FULL_TIME: "Full-time",
      PART_TIME: "Part-time",
      CONTRACTOR: "Contract",
      INTERN: "Internship",
      TEMPORARY: "Temporary",
      VOLUNTEER: "Volunteer",
      OTHER: "Other",
    };
    return typeMap[type] || type;
  }

  #formatDate(dateString) {
    if (!dateString) return "Posted recently";

    const date = parseISO(dateString);
    const distance = formatDistanceToNow(date, { addSuffix: true });

    // Capitalize first letter
    return distance.charAt(0).toUpperCase() + distance.slice(1);
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

  #showJobModal(job) {
    const modal = document.getElementById("job-modal");
    if (!modal) return;

    qs(".modal-title", modal).textContent = job.title || "Job Details";
    qs(".modal-body", modal).innerHTML =
      job.description || "<p>No description available.</p>";
    const applyLink = qs(".modal-apply", modal);
    applyLink.href = job.url || "#";

    modal.showModal();

    modal
      .querySelectorAll(".modal-close")
      .forEach((btn) =>
        btn.addEventListener("click", () => modal.close(), { once: true }),
      );
  }
}
