const scrollBtn = document.getElementById("toTop");

// Initially hide the button
scrollBtn.style.display = "none";

// Show/hide button based on scroll position
window.addEventListener("scroll", () => {
  // Show button when scrolled down 100px
  if (window.scrollY > 100) {
    scrollBtn.style.display = "block";
  } else {
    scrollBtn.style.display = "none";
  }
});

// Scroll to top when clicked
scrollBtn.addEventListener("click", () => {
  document.documentElement.scrollTo({
    top: 0,
    behavior: "smooth",
  });
  document.body.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});
