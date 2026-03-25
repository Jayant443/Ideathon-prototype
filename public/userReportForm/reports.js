let btn = document.querySelector(".btn");
let analyzeElement = document.querySelector(".analyze-element");
let form = document.querySelector("#reportForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  formData.append("lat", 18.549);
  formData.append("lng", 73.869);

  try {
    const res = await fetch("http://127.0.0.1:8000/dispatch/report", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log(data);
    // UI effect AFTER submit
    setTimeout(() => {
      form.style.display = "none";
      analyzeElement.classList.add("active");
    }, 1000);
  } catch (err) {
    console.error(err);
    alert("Error submitting form");
  }
});
