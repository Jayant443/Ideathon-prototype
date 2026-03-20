//toggle the incident card
//toggle side panel

/* Show card
function showCard() {
  document.getElementById("incidentCard").style.display = "block";
}
*/
//Close card
function closeCard() {
  document.getElementById("incidentCard").style.display = "none";
}

// Fake blockchain
function storeBlockchain() {
  const hash = "0x" + Math.random().toString(16).substr(2, 8);
  alert("Stored on Blockchain \nHash: " + hash);
}

let reportsPanel = document.querySelector(".reports-panel");
let sidePanel = document.getElementById("sidePanel");
reportsPanel.addEventListener("click", () => {
  sidePanel.classList.toggle("open");
});

//map setup
let map = L.map("map").setView([18.52, 73.85], 10);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

/* Marker
let marker = L.marker([18.52, 73.85]).addTo(map);

marker.on("click", function () {
  showCard();
});
*/

//Highlight Pin on map when an incident is clicked in the side panel

/*function focusLocation(lat, lng) {
  map.setView([lat, lng], 14);
}*/

//backend connection:

//fetch data from backend
async function loadReports() {
  const res = await fetch("http://127.0.0.1:8000/dispatch/get");
  const data = await res.json();

  renderReports(data);
}

//add to panel function
function addToPanel(report) {
  panel.innerHTML = "";
  const panel = document.querySelector(".reports-list");

  const item = document.createElement("button");
  item.classList.add("list-group-item list-group-item-action");
  item.innerText = report.description;
  //description or report id to be displayed in the side panel?

  item.addEventListener("click", () => {
    map.setView([report.location.lat, report.location.lng], 15);
  });

  panel.appendChild(item);
}

//show data in card
function showIncidentCard(report) {
  document.querySelector(".report-id").innerText = report.dispatch_id;
  document.querySelector(".desc").innerText = report.description;
  document.querySelector(".location").innerText =
    report.location.lat + ", " + report.location.lng;
  document.querySelector(".severity").innerText = report.severity;

  const date = new Date(report.timestamp);
  document.querySelector(".time").innerText = date.toLocaleString();

  document.querySelector(".incident-img").src = report.image_url;

  document.querySelector(".incident-card").style.display = "block";
}

//show markers on map
function renderReports(reports) {
  reports.forEach((report) => {
    const { lat, lng } = report.location;

    const marker = L.marker([lat, lng]).addTo(map);

    marker.on("click", () => {
      showIncidentCard(report);
    });

    addToPanel(report);
  });
}

loadReports();
