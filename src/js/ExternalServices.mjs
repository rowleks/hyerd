const JSEARCH_URL = import.meta.env.VITE_JSEARCH_URL;
const LINKEDIN_URL = import.meta.env.VITE_LINKEDIN_URL;
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

export default class ExternalServices {
  async getLatestJobs() {
    try {
      if (LINKEDIN_URL && RAPIDAPI_KEY) {
        const url = `${LINKEDIN_URL}/active-jb?time_frame=24h&limit=6&offset=0&title=developer&location=%22United%20States%22`;
        return await this.#fetchRapidAPI(url);
      }
      return await this.#fetchData("/json/linkedinJobs.json");
    } catch (error) {
      console.warn("Falling back to local LinkedIn jobs");
      return await this.#fetchData("/json/linkedinJobs.json");
    }
  }

  async getJSearchJobs(query = "developer jobs") {
    try {
      if (JSEARCH_URL && RAPIDAPI_KEY) {
        // Using v2 for cursor-based pagination
        const url = `${JSEARCH_URL}/search-v2?query=${encodeURIComponent(query)}&num_pages=1&country=us&language=en`;
        return await this.#fetchRapidAPI(url);
      }
      return await this.#fetchData("/json/jSearchJobs.json");
    } catch (error) {
      console.warn("Falling back to local JSearch jobs");
      return await this.#fetchData("/json/jSearchJobs.json");
    }
  }

  async getJobDetails(jobId) {
    try {
      if (JSEARCH_URL && RAPIDAPI_KEY) {
        const url = `${JSEARCH_URL}/job-details?job_id=${encodeURIComponent(jobId)}&country=us`;
        return await this.#fetchRapidAPI(url);
      }
      return await this.#fetchData("/json/jobDetails.json");
    } catch (error) {
      return await this.#fetchData("/json/jobDetails.json");
    }
  }

  async #fetchRapidAPI(url) {
    const hostname = new URL(url).hostname;

    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": hostname,
        "Content-Type": "application/json",
      },
    };

    const res = await fetch(url, options);

    if (!res.ok) {
      throw {
        name: "Service Error",
        message: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return await res.json();
  }

  async #fetchData(url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw {
        name: "Service Error",
        message: `HTTP ${res.status}: ${res.statusText}`,
      };
    }
    return await res.json();
  }
}
