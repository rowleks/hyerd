import { loadHeaderFooter } from "./utils.mjs";
import FavouritesListing from "./FavouritesListing.mjs";

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();

  const listing = new FavouritesListing();
  listing.init();

  const searchInput = document.getElementById("fav-search");
  const debouncedSearch = debounce((value) => {
    listing.setSearchTerm(value);
  }, 300);

  searchInput.addEventListener("input", (e) => {
    debouncedSearch(e.target.value);
  });
});
