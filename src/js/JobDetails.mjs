import { loadHeaderFooter, qs, markJobAsApplied } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";

export default class JobDetails {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.container = null;
    this.job = null;
  }

  async init() {
    this.container = document.getElementById("job-detail-content");

    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("id");

    if (!jobId) {
      this.renderError("No job ID provided.");
      return;
    }

    try {
      const response = await this.dataSource.getJobDetails(jobId);
      this.job = this.#extractJobData(response);

      if (!this.job || this.job.id !== jobId) {
        this.renderError("Job not found.");
        return;
      }

      this.#render();
    } catch (err) {
      console.error(err);
      this.renderError("Failed to load job details.");
    }
  }

  #extractJobData(raw) {
    const job = raw.data?.[0] || raw;
    if (!job) return null;

    return {
      id: job.job_id,
      title: job.job_title,
      organization: job.employer_name,
      logo: job.employer_logo,
      location: job.job_location,
      type: job.job_employment_type,
      posted: job.job_posted_at,
      applyLink: job.job_apply_link,
      description: job.job_description,
      highlights: job.job_highlights || {},
      publisher: job.job_publisher,
      workArrangement: job.work_arrangement,
    };
  }

  #render() {
    if (!this.container || !this.job) return;

    const template = document.getElementById("job-detail-template");
    if (!template) {
      this.container.innerHTML = `<p class="text-red-500">Template not found.</p>`;
      return;
    }

    const clone = template.content.cloneNode(true);
    const job = this.job;

    // Logo
    const logoImg = clone.querySelector(".job-logo");
    if (job.logo) {
      logoImg.src = job.logo;
      logoImg.alt = job.organization || "Company";
      logoImg.classList.remove("hidden");
    }

    // Basic info
    clone.querySelector(".job-title").textContent = job.title || "N/A";
    clone.querySelector(".job-organization").textContent = job.organization || "N/A";
    clone.querySelector(".job-meta").textContent =
      [job.location, job.type, job.workArrangement].filter(Boolean).join(" • ");

    // Apply button
    const applyBtn = clone.querySelector(".job-apply-btn");
    applyBtn.href = job.applyLink || "#";
    applyBtn.addEventListener("click", () => {
      markJobAsApplied({
        id: job.id,
        title: job.title,
        organization: job.organization,
        location: job.location,
        type: job.type,
        url: job.applyLink,
        logo: job.logo,
        date: job.posted,
      });
    });

    // Description (Markdown → styled HTML)
    const descContainer = clone.querySelector(".job-description");
    descContainer.innerHTML = this.#descriptionToHtml(job.description);

    // Highlights
    this.#populateHighlightSection(clone, ".job-responsibilities", job.highlights.Responsibilities);
    this.#populateHighlightSection(clone, ".job-requirements", job.highlights.Qualifications);
    this.#populateHighlightSection(clone, ".job-benefits", job.highlights.Benefits);

    // Footer
    clone.querySelector(".job-footer").textContent =
      `Posted ${job.posted || "recently"} • via ${job.publisher || "Unknown"}`;

    this.container.innerHTML = "";
    this.container.appendChild(clone);

    // Save button handler
    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.#saveToFavourites(saveBtn));
    }
  }

  #populateHighlightSection(clone, selector, items) {
    if (!items || items.length === 0) return;

    const section = clone.querySelector(selector);
    if (!section) return;

    section.classList.remove("hidden");
    const ul = section.querySelector("ul");
    ul.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  }

  #saveToFavourites(saveBtn) {
    const favs = JSON.parse(localStorage.getItem("hyerd_favourites") || "[]");
    if (!favs.some((j) => j.id === this.job.id)) {
      favs.push({
        id: this.job.id,
        title: this.job.title,
        organization: this.job.organization,
        location: this.job.location,
        type: this.job.type,
        url: this.job.applyLink,
        logo: this.job.logo,
        date: this.job.posted,
      });
      localStorage.setItem("hyerd_favourites", JSON.stringify(favs));
      saveBtn.textContent = "Saved ✓";
      saveBtn.disabled = true;
    }
  }

  renderError(message) {
    if (!this.container) return;
    this.container.innerHTML = `<p class="text-red-500">${message}</p>`;
  }

  /**
   * Convert the raw job description into clean Markdown,
   * then turn it into styled HTML.
   */
  #descriptionToHtml(description) {
    if (!description) return "<p>No description available.</p>";

    let text = description;

    // Normalize line endings
    text = text.replace(/\r\n/g, "\n");

    // Convert known section headers into Markdown headings (##)
    const headingRegex = /^(What's (the Job|Needed|in it for me)\??|Job Title|Location|Pay Range|Upon Completion Of Waiting Period Consultants Are Eligible For)\s*:?\s*$/gmi;
    text = text.replace(headingRegex, "## $1");

    // Convert bullet points (• or -) into Markdown list items
    text = text.replace(/^[•-]\s+/gm, "- ");

    // Split into lines and build HTML
    const lines = text.split("\n");
    let html = "";
    let inList = false;
    let paragraph = [];

    const flushParagraph = () => {
      if (paragraph.length) {
        html += `<p class="mb-4 text-gray-700 leading-relaxed">${paragraph.join(" ")}</p>`;
        paragraph = [];
      }
    };

    const closeList = () => {
      if (inList) {
        html += `</ul>`;
        inList = false;
      }
    };

    for (let line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        closeList();
        continue;
      }

      // Heading
      if (trimmed.startsWith("## ")) {
        flushParagraph();
        closeList();
        const headingText = trimmed.replace(/^##\s*/, "");
        html += `<h3 class="mt-8 mb-3 text-lg font-semibold text-gray-900 tracking-tight border-b border-gray-200 pb-1">${headingText}</h3>`;
        continue;
      }

      // List item
      if (trimmed.startsWith("- ")) {
        flushParagraph();
        if (!inList) {
          html += `<ul class="list-disc pl-5 mb-4 space-y-1.5 text-gray-700 marker:text-gray-400">`;
          inList = true;
        }
        html += `<li>${trimmed.substring(2)}</li>`;
        continue;
      }

      // Regular paragraph text
      closeList();
      paragraph.push(trimmed);
    }

    flushParagraph();
    closeList();

    return html;
  }
}
