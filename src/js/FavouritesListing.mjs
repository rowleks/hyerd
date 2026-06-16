import { qs, getFromLocalStorage, saveToLocalStorage } from "./utils.mjs";

const FAV_KEY = "hyerd_favourites";

export default class FavouritesListing {
  constructor() {
    this.favourites = [];
    this.filtered = [];
    this.container = null;
    this.countEl = null;
  }

  init() {
    this.container = document.getElementById("job-cards-container");
    this.countEl = document.getElementById("favourites-count");
    this.favourites = getFromLocalStorage(FAV_KEY) || [];
    this.filtered = [...this.favourites];
    this.render();
    this.updateCount();
  }

  updateCount() {
    if (this.countEl) {
      this.countEl.textContent = `${this.favourites.length} saved`;
    }
  }

  setSearchTerm(term) {
    const t = term.toLowerCase();
    this.filtered = this.favourites.filter(
      (job) =>
        (job.title && job.title.toLowerCase().includes(t)) ||
        (job.location && job.location.toLowerCase().includes(t)) ||
        (job.organization && job.organization.toLowerCase().includes(t))
    );
    this.render();
  }

  removeFavourite(jobId) {
    this.favourites = this.favourites.filter((j) => j.id !== jobId);
    this.filtered = this.filtered.filter((j) => j.id !== jobId);
    saveToLocalStorage(FAV_KEY, this.favourites);
    this.updateCount();
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";

    if (!this.filtered.length) {
      const empty = document.createElement("div");
      empty.className = "col-span-full text-center py-8 text-gray-500";
      empty.textContent = this.favourites.length
        ? "No favourites match your search."
        : "No favourites yet.";
      this.container.appendChild(empty);
      return;
    }

    this.filtered.forEach((job) => {
      const template = document.getElementById("job-card-template");
      if (!template) return;

      const clone = template.content.cloneNode(true);
      const article = clone.querySelector(".job-card");

      qs(".job-title", article).textContent = job.title || "N/A";
      qs(".company-name", article).textContent = job.organization || "N/A";
      qs(".job-location", article).textContent = job.location || "N/A";
      qs(".job-type-tag", article).textContent = job.type || "Full-time";

      if (job.remote) {
        qs(".job-remote-tag", article).textContent = "Remote";
      } else {
        qs(".job-remote-tag", article).style.display = "none";
      }

      qs(".job-date", article).textContent = job.date || "N/A";
      qs(".apply-link", article).href = job.url || "#";

      const logoImg = qs(".company-logo img", article);
      if (job.logo) {
        logoImg.src = job.logo;
        logoImg.alt = job.organization || "Company";
      } else {
        logoImg.style.display = "none";
      }

      // Remove from favourites
      const bookmarkBtn = qs(".bookmark-btn", article);
      bookmarkBtn.addEventListener("click", (e) => {
        e.stopImmediatePropagation();
        this.removeFavourite(job.id);
      });

      // Navigate to details
      article.addEventListener("click", (e) => {
        if (!e.target.closest(".bookmark-btn") && !e.target.closest(".apply-link")) {
          window.location.href = `/jobs/details?id=${encodeURIComponent(job.id)}`;
        }
      });

      this.container.appendChild(article);
    });
  }
}
