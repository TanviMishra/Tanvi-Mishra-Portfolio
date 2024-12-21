// slider.js
function initializeSlider() {
  let currentSlide = 0;
  const slides = document.querySelectorAll(".slide");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");

  function updateSlides() {
    const offset = currentSlide * -100;
    document.querySelector(
      ".slider"
    ).style.transform = `translateX(${offset}%)`;
  }

  function nextSlide() {
    if (currentSlide < slides.length - 1) {
      currentSlide++;
      updateSlides();
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      updateSlides();
    }
  }

  if (prevButton && nextButton) {
    prevButton.addEventListener("click", prevSlide);
    nextButton.addEventListener("click", nextSlide);
  }
}
