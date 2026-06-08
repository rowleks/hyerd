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

export const loadHeaderFooter = async () => {
  const headerTemplate = await loadTemplate("/partials/header.html");
  const footerTemplate = await loadTemplate("/partials/footer.html");

  document.querySelector("header").innerHTML = headerTemplate;
  document.querySelector("footer").innerHTML = footerTemplate;

  initializeMobileMenu();
};
