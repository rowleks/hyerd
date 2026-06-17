// const linkedInUrl = import.meta.env.VITE_LINKEDIN_URL;

export default class ExternalServices {
  async getLatestJobs() {
    try {
      /* const url = `${linkedInUrl}/active-jb-24h?limit=4&offset=0&title_filter="Developer"&location_filter="United States" OR "Canada"&description_type=html`;
      const latestJobs = await this.#fetchData(encodeURI(url)); */

      const latestJobs = await this.#fetchData("/json/linkedinJobs.json");
      console.log(latestJobs);
      return latestJobs;
    } catch (error) {
      return error.message;
    }
  }

  async getJSearchJobs() {
    return this.#fetchData("/json/jSearchJobs.json");
  }

  async getJobDetails(jobId) {
    // Stub: returns the full response; later replace with real /job-details call
    const data = await this.#fetchData("/json/jobDetails.json");
    return data;
  }

  async #fetchData(url) {
    /*  const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_RAPIDAPI_KEY,
        "x-rapidapi-host": new URL(url).hostname,
        "Content-Type": "application/json",
      },
    }; */
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
