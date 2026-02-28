async function sendQuery() {
  const query = document.getElementById("query").value;

  // Still hardcoded for now (AI parsing comes later)
  const requestBody = {
    query: query,
  };

  try {
    const res = await fetch("http://localhost:5000/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    displayResults(data);
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("response").innerText = "Something went wrong 🚨";
  }
}

function displayResults(data) {
  const container = document.getElementById("response");
  container.innerHTML = "";

  if (!data.recommendations || data.recommendations.length === 0) {
    container.innerHTML = "<p>No flights found.</p>";
    return;
  }

  // 🌟 Best Choice
  const best = data.bestChoice;

  const bestDiv = document.createElement("div");
  bestDiv.style.border = "2px solid green";
  bestDiv.style.padding = "15px";
  bestDiv.style.marginBottom = "20px";
  bestDiv.style.backgroundColor = "#f0fff4";

  bestDiv.innerHTML = `
    <h3>🌟 Best Choice</h3>
    <strong>${best.flight.airline}</strong><br>
    Departure: ${best.flight.departure} <br>
    Arrival: ${best.flight.arrival} <br>
    Price: ₹${best.flight.price} <br>
    Duration: ${best.flight.duration} hrs <br>
    Layover: ${best.flight.layover} <br>
    <strong>Reason:</strong> ${best.reason}
  `;

  container.appendChild(bestDiv);

  // 🚨 Alerts Section
  if (data.alerts && data.alerts.length > 0) {
    const alertDiv = document.createElement("div");
    alertDiv.style.border = "1px solid orange";
    alertDiv.style.padding = "10px";
    alertDiv.style.marginBottom = "20px";
    alertDiv.style.backgroundColor = "#fff4e6";

    alertDiv.innerHTML = "<h4>⚡ Smart Insights</h4>";

    data.alerts.forEach((alert) => {
      alertDiv.innerHTML += `<p>${alert}</p>`;
    });

    container.appendChild(alertDiv);
  }

  // Other recommendations
  data.recommendations.slice(1).forEach((rec) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <strong>${rec.flight.airline}</strong><br>
      Departure: ${rec.flight.departure} <br>
      Arrival: ${rec.flight.arrival} <br>
      Price: ₹${rec.flight.price} <br>
      Duration: ${rec.flight.duration} hrs <br>
      Layover: ${rec.flight.layover} <br>
      <strong>Reason:</strong> ${rec.reason}
    `;

    container.appendChild(div);
  });
}
