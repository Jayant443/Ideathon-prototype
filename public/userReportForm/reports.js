let btn = document.querySelector(".btn");
let analyzeElement = document.querySelector(".analyze-element");
let form = document.querySelector(".form");

btn.addEventListener("click", (e) => {
  e.preventDefault();

  setTimeout(() => {
    form.style.display = "none";
    analyzeElement.classList.add("active");
  }, 3000);
});
