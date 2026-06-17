const loadTemplate = async (path) => {
  return fetch(path)
    .then((res) => res.text())
    .catch((err) => console.error(err));
};

const initializeMobileMenu = () => {
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", function () {
      mobileMenu.classList.toggle("hidden");
    });
  }
};

//Helpers
export const qs = (selector, parent = document) => {
  return parent.querySelector(selector);
};

// LocalStorage helpers
export const saveToLocalStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getFromLocalStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const removeFromLocalStorage = (key) => {
  localStorage.removeItem(key);
};

// Applied jobs helpers
export const markJobAsApplied = (job) => {
  const applied = getFromLocalStorage("hyerd_applied") || [];
  if (!applied.some(j => j.id === job.id)) {
    applied.push({
      ...job,
      appliedAt: new Date().toISOString()
    });
    saveToLocalStorage("hyerd_applied", applied);
  }
};

export const getAppliedJobs = () => {
  return getFromLocalStorage("hyerd_applied") || [];
};

export const loadHeaderFooter = async () => {
  const headerTemplate = await loadTemplate("/partials/header.html");
  const footerTemplate = await loadTemplate("/partials/footer.html");

  document.querySelector("header").innerHTML = headerTemplate;
  document.querySelector("footer").innerHTML = footerTemplate;

  initializeMobileMenu();
};
