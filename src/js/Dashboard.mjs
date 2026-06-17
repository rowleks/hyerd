import { loadHeaderFooter, getFromLocalStorage } from "./utils.mjs";

export default class Dashboard {
  constructor() {
    this.applied = [];
    this.favourites = [];
    this.container = null;
  }

  async init() {
    await loadHeaderFooter();

    this.applied = getFromLocalStorage("hyerd_applied") || [];
    this.favourites = getFromLocalStorage("hyerd_favourites") || [];

    this.#updateStats();
    this.#renderAppliedJobs();
  }

  #updateStats() {
    const appliedEl = document.getElementById("stat-applied");
    const savedEl = document.getElementById("stat-saved");
    const weekEl = document.getElementById("stat-week");

    if (appliedEl) appliedEl.textContent = this.applied.length;
    if (savedEl) savedEl.textContent = this.favourites.length;

    if (weekEl) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeek = this.applied.filter(j => new Date(j.appliedAt) > oneWeekAgo).length;
      weekEl.textContent = thisWeek;
    }
  }

  #renderAppliedJobs() {
    const container = document.getElementById("applied-jobs-container");
    if (!container) return;

    container.innerHTML = "";

    if (!this.applied.length) {
      const empty = document.createElement("div");
      empty.className = "col-span-full text-gray-500 py-8";
      empty.innerHTML = `
        <p>You haven't applied to any jobs yet.</p>
        <a href="/jobs" class="text-accent hover:underline mt-2 inline-block">Start exploring jobs →</a>
      `;
      container.appendChild(empty);
      return;
    }

    const template = document.getElementById("applied-job-card-template");
    if (!template) return;

    // Show latest 6
    const recent = [...this.applied]
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
      .slice(0, 6);

    recent.forEach(job => {
      const clone = template.content.cloneNode(true);
      const article = clone.querySelector("article");

      clone.querySelector(".job-title").textContent = job.title || "N/A";
      clone.querySelector(".company-name").textContent = job.organization || "N/A";
      clone.querySelector(".job-location").textContent = job.location || "Remote";
      clone.querySelector(".job-type").textContent = job.type || "Full-time";

      const logoImg = clone.querySelector(".company-logo img");
      if (job.logo) {
        logoImg.src = job.logo;
        logoImg.alt = job.organization || "Company";
      } else {
        logoImg.style.display = "none";
      }

      const appliedDate = new Date(job.appliedAt);
      clone.querySelector(".applied-date").textContent =
        appliedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

      const viewLink = clone.querySelector(".view-job-link");
      viewLink.href = job.url || "#";

      container.appendChild(article);
    });
  }
}
