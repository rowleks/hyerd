// import { qs } from "./utils.mjs";

import { formatDistanceToNow, parseISO } from "date-fns";

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
    if (!this.container) return;

    // Render each job using the template
    this.jobs.forEach((job) => {
      const extractedData = this.#extractJobData(job);
      const jobCard = this.#createJobCard(extractedData);
      if (jobCard) {
        this.container.appendChild(jobCard);
      }
    });
  }

  #extractJobData(job) {
    return {
      id: job.id,
      title: job.title || "",
      organization: job.organization || "",
      location: job.locations_derived?.[0] || job.cities_derived?.[0] || "",
      salary: job.salary_raw || "",
      type: job.employment_type?.[0] || "FULL_TIME",
      remote: job.remote_derived || false,
      date: job.date_posted || job.date_created,
      url: job.url,
      logo: job.organization_logo,
    };
  }

  #createJobCard(job) {
    const template = document.getElementById("job-card-template");
    if (!template) return null;

    const clone = template.content.cloneNode(true);
    const article = clone.getElementById("job-card");

    // Set company logo
    const logo = article.querySelector("#company-logo img");
    logo.src = job.logo || "";
    logo.alt = job.organization || "Unknown";

    // Set job title
    const title = article.getElementById("job-title");
    title.textContent = job.title || "N/A";

    // Set company name
    const company = article.getElementById("company-name");
    company.textContent = companyName;

    // Set location
    const location = article.getElementById("job-location");
    location.textContent = job.location || "Location Not Specified";

    // Set salary if available
    const salary = article.getElementById("job-salary");
    salary.textContent = job.salary_raw || job.salary || "N/A";

    // Set job type and remote status
    const tagsContainer = article.getElementById("job-tags");
    tagsContainer.innerHTML = ""; // Clear existing tags

    // Add job type tag
    const jobType = job.type || "FULL_TIME";
    const typeTag = document.createElement("span");
    typeTag.className = "job-tag bg-primary/10 text-primary";
    typeTag.textContent = this.#formatJobType(jobType);
    tagsContainer.appendChild(typeTag);

    // Add remote status tag if applicable
    if (job.remote || job.remote === true) {
      const remoteTag = document.createElement("span");
      remoteTag.className = "job-tag bg-accent/10 text-accent";
      remoteTag.textContent = "Remote";
      tagsContainer.appendChild(remoteTag);
    }

    // Set posted date
    const postedDate = article.getElementById("job-date");
    postedDate.textContent = this.#formatDate(job.date || job.created_at);

    // Set apply link
    const applyLink = article.getElementById("apply-link");
    const jobId = job.id || job.linkedin_id || job.slug;
    if (jobId) {
      applyLink.href = `/jobs/${jobId}`;
    } else {
      applyLink.href = "/jobs";
    }

    // Add bookmark button functionality
    const bookmarkBtn = article.getElementById("bookmark-btn");
    bookmarkBtn.addEventListener("click", () =>
      this.#toggleBookmark(article, jobId),
    );

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
    };
    return typeMap[type] || type;
  }

  #formatDate(dateString) {
    if (!dateString) return "Posted recently";

    const date = parseISO(dateString);

    return formatDistanceToNow(date, { addSuffix: true });
  }

  #toggleBookmark(cardElement, jobId) {
    const bookmarkBtn = cardElement.querySelector("button svg");
    const isBookmarked = bookmarkBtn.getAttribute("fill") === "currentColor";

    if (isBookmarked) {
      bookmarkBtn.setAttribute("fill", "none");
      bookmarkBtn.classList.remove("text-accent");
      bookmarkBtn.classList.add("text-gray-400");
    } else {
      bookmarkBtn.setAttribute("fill", "currentColor");
      bookmarkBtn.classList.remove("text-gray-400");
      bookmarkBtn.classList.add("text-accent");
      // TODO add logic to save to localStorage or send to backend
    }
  }

  renderError() {
    if (!this.container) return;

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
}
