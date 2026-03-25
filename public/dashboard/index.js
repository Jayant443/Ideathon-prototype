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
	reports.forEach((report) => {
		const { lat, lng } = report.location;

		const marker = L.marker([lat, lng]).addTo(map);

		addToPanel(report, marker);
		marker.on("click", () => {
			showIncidentCard(report, marker);
		});
	});
}

function connectWebSocket() {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/1");

    ws.onopen = () => {
        console.log("Connected to WebSocket");
    };

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.event === "new_dispatch") {
            const res = await fetch(`http://127.0.0.1:8000/dispatch/get/${data.dispatch_id}`);
            const report = await res.json();
            const marker = L.marker([report.location.lat, report.location.lng]).addTo(map);
            marker.on("click", () => {
                showIncidentCard(report, marker);
            });
            addToPanel(report, marker);
            showToast(data.severity, data.description);
        }
    };

    ws.onclose = () => {
        console.log("WebSocket disconnected — reconnecting in 3s...");
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
        console.error("WebSocket error", err);
        ws.close();
    };
}

connectWebSocket();

function showToast(severity, description) {
    const color = severity === "high" ? "#dc3545" : severity === "medium" ? "#ffc107" : "#198754";
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 9999;
        font-family: Poppins;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    toast.innerHTML = `<strong>New Dispatch!</strong><br>${description}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
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
