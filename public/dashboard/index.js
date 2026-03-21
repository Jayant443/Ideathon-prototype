//toggle the incident card
//toggle side panel

/* Show card
function showCard() {
	document.getElementById("incidentCard").style.display = "block";
}
*/
//Close card

const panel = document.querySelector(".reports-list");
const reportsPanel = document.querySelector(".reports-panel");
const sidePanel = document.getElementById("sidePanel");
const reportIdSection = document.querySelector(".report-id");
const descriptionSection = document.querySelector(".desc");
const aiDescSection = document.querySelector(".ai-desc");
const locationSection = document.querySelector(".location");
const severitySection = document.querySelector(".severity");
const timeSection = document.querySelector(".time");
const imageSection = document.querySelector(".incident-img");
const incidentCard = document.querySelector(".incident-card");

let activeMarker = null;

function closeCard() {
	document.getElementById("incidentCard").style.display = "none";
}

// Fake blockchain
function storeBlockchain() {
	const hash = "0x" + Math.random().toString(16).substr(2, 8);
	alert("Stored on Blockchain \nHash: " + hash);
}

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
	navigator.geolocation.getCurrentPosition(async (position) => {
		// const lat = position.coords.latitude;
		// const lng = position.coords.longitude;
	});
	const lat = 18.5204;
	const lng = 73.8567;
	const res = await fetch(
		`http://127.0.0.1:8000/dispatch/get?lng=${lng}&lat=${lat}`,
	);
	const data = await res.json();
	renderReports(data);
}

//add to panel function
function addToPanel(report, marker) {
	const item = document.createElement("button");
	item.classList.add("list-group-item");
	item.classList.add("list-group-item-action");
	//description or report id to be displayed in the side panel?
	let locationInPanel = document.createElement("div");
	locationInPanel.innerText = `Location: ${report.location.lat}, ${report.location.lng}`;

	let descInPanel = document.createElement("div");
	descInPanel.classList.add("list-group-description");
	descInPanel.innerText = `Description: ${report.description}`;

	item.addEventListener("click", () => {
		map.setView([report.location.lat, report.location.lng], 15);
		showIncidentCard(report, marker);
	});

	item.appendChild(locationInPanel);
	item.appendChild(descInPanel);

	panel.appendChild(item);
}

//show data in card
function showIncidentCard(report, marker) {
	activeMarker = marker;
	reportIdSection.innerText = report.dispatch_id;
	descriptionSection.innerText = report.description;
	locationSection.innerText = report.location.lat + ", " + report.location.lng;
	severitySection.innerText = report.severity;
	aiDescSection.innerText = report.ai_description;

	const date = new Date(report.timestamp);
	timeSection.innerText = date.toLocaleString();
	imageSection.src = report.image_url;
	updateCardPosition();
	incidentCard.style.display = "block";
}

//show markers on map
function renderReports(reports) {
	panel.innerHTML = "";
	reports.forEach((report) => {
		console.log(report);
		const { lat, lng } = report.location;

		const marker = L.marker([lat, lng]).addTo(map);

		addToPanel(report, marker);
		marker.on("click", () => {
			showIncidentCard(report, marker);
		});
	});
}

loadReports();

reportsPanel.addEventListener("click", () => {
	sidePanel.classList.toggle("open");
});

function updateCardPosition() {
	if (!activeMarker) return;
	const pos = map.latLngToContainerPoint(activeMarker.getLatLng());
	incidentCard.style.left = (pos.x + 20) + "px";
	incidentCard.style.top = (pos.y - 20) + "px";
}

map.on("move", updateCardPosition);
map.on("zoom", updateCardPosition);
