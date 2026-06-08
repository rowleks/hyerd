const linkedInUrl = import.meta.env.VITE_LINKEDIN_URL;

export default class ExternalServices {
  async getLatestJobs() {
    try {
      const url = `${linkedInUrl}/active-jb-24h?limit=10&offset=0&title_filter="Developer"&location_filter="United States" OR "Canada"&description_type=html`;
      const latestJobs = await this.#fetchData(encodeURI(url));
      console.log(latestJobs);
      return latestJobs;
    } catch (error) {
      return error.message;
    }
  }

  async #fetchData(url) {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_RAPIDAPI_KEY,
        "x-rapidapi-host": new URL(url).hostname,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw {
        name: "Service Error",
        message: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return await res.json();
  }
}
