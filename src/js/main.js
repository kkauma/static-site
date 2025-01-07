document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button");
  const navLinks = document.querySelector(".nav-links");

  menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-container")) {
      navLinks.classList.remove("active");
    }
  });
});
