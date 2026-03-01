let agent = localStorage.getItem("agent_name");

if (!agent) {
  agent = prompt("Enter Agent Name:");
  if (agent) {
    localStorage.setItem("agent_name", agent);
  } else {
    agent = "Travel Agent"; // fallback
  }
}

function editAgentName() {
  const newName = prompt("Enter New Agent Name:", agent);
  if (newName) {
    agent = newName;
    localStorage.setItem("agent_name", agent);
    updateAgentNameUI();
  }
}

function updateAgentNameUI() {
  document.getElementById("agentName").innerText = "Logged in as: " + agent;
}

document.addEventListener("DOMContentLoaded", () => {
  updateAgentNameUI();
});

let chats = JSON.parse(localStorage.getItem("copilot_chats")) || [];
let currentChatId = null;

// ------------------ INIT ------------------
window.onload = function () {
  if (chats.length === 0) {
    showWelcomeScreen();
  } else {
    renderChatList();
    loadChat(chats[0].id);
  }
};

// ------------------ UI STATES ------------------

function showWelcomeScreen() {
  currentChatId = null;
  const chatWindow = document.getElementById("chatWindow");
  const responseArea = document.getElementById("response");
  const inputArea = document.querySelector(".input-area");

  chatWindow.innerHTML = `
    <div class="welcome-screen">
      <h1>✈️ TBO Travel Copilot</h1>
      <p>Your AI-powered assistant for intelligent flight recommendations.</p>
      
      <div class="steps">
        <div class="step">
          <span class="icon">➕</span>
          <strong>Create a Chat</strong>
          <p>Click "+ New Chat" to start a new customer session.</p>
        </div>
        <div class="step">
          <span class="icon">🤖</span>
          <strong>Ask the Copilot</strong>
          <p>Type requests like "Delhi to Dubai under 20k".</p>
        </div>
        <div class="step">
          <span class="icon">📄</span>
          <strong>Finalize & Share</strong>
          <p>Draft professional messages and export PDF itineraries.</p>
        </div>
      </div>
      
      <button onclick="newChat()" class="start-btn">Get Started</button>
    </div>
  `;

  responseArea.innerHTML = `
    <div style="text-align:center; opacity:0.5; margin-top:50px;">
      <p>Booking insights will appear here after a search.</p>
    </div>
  `;

  // Hide/Disable main input when no chat is active
  if (inputArea) inputArea.style.opacity = "0.3";
  document.getElementById("query").disabled = true;
}

// ------------------ CHAT MANAGEMENT ------------------

function newChat() {
  const name = prompt("Enter Customer Name:");
  if (!name) return;

  const id = Date.now().toString();

  const newChat = {
    id,
    customerName: name,
    status: "Draft",
    messages: [],
    results: null,
  };

  chats.unshift(newChat);
  saveChats();
  renderChatList();
  loadChat(id);
}

function loadChat(id) {
  currentChatId = id;
  const chat = chats.find((c) => c.id === id);
  if (!chat) return;

  const chatWindow = document.getElementById("chatWindow");
  const inputArea = document.querySelector(".input-area");
  
  chatWindow.innerHTML = "";
  document.getElementById("response").innerHTML = "";
  
  // Enable input
  if (inputArea) inputArea.style.opacity = "1";
  document.getElementById("query").disabled = false;

  chat.messages.forEach((msg) => {
    addMessage(msg.content, msg.sender, false);
  });

  if (chat.results) {
    displayResults(chat.results);
  }

  highlightActiveChat();
}

function renderChatList() {
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  chats.forEach((chat) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span>
          <strong>${chat.customerName}</strong>
          <span style="font-size:12px; opacity:0.7;">(${chat.status})</span>
        </span>
        <span style="cursor:pointer; color:#ef4444;" onclick="deleteChat('${chat.id}')">✕</span>
      </div>
    `;

    li.onclick = (e) => {
      if (e.target.innerText !== "✕") {
        loadChat(chat.id);
      }
    };
    li.dataset.id = chat.id;

    list.appendChild(li);
  });
}

function deleteChat(id) {
  chats = chats.filter((c) => c.id !== id);

  if (currentChatId === id) {
    currentChatId = null;
  }

  saveChats();
  renderChatList();

  if (chats.length > 0) {
    loadChat(chats[0].id);
  } else {
    showWelcomeScreen();
  }
}

function filterChats() {
  const search = document.getElementById("searchChat").value.toLowerCase();
  const items = document.querySelectorAll("#chatList li");

  items.forEach((item) => {
    item.style.display = item.innerText.toLowerCase().includes(search)
      ? "block"
      : "none";
  });
}

function highlightActiveChat() {
  const items = document.querySelectorAll("#chatList li");
  items.forEach((item) => {
    item.style.background =
      item.dataset.id === currentChatId ? "#334155" : "transparent";
  });
}

function saveChats() {
  localStorage.setItem("copilot_chats", JSON.stringify(chats));
}

// ------------------ MESSAGE HANDLING ------------------

function addMessage(content, sender, save = true) {
  const chatWindow = document.getElementById("chatWindow");

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.innerText = content;

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  if (save) {
    const chat = chats.find((c) => c.id === currentChatId);
    if (!chat) return;

    chat.messages.push({ content, sender });
    saveChats();
  }
}

// ------------------ SEND QUERY ------------------

async function sendQuery() {
  const input = document.getElementById("query");
  const query = input.value.trim();

  if (!query || !currentChatId) return;

  addMessage(query, "agent");
  input.value = "";

  try {
    const res = await fetch("http://localhost:5000/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, chatId: currentChatId }),
    });

    const data = await res.json();

    if (data.error) {
      addMessage("⚠️ " + data.error, "copilot");
      return;
    }

    addMessage("Here are the best options based on your request.", "copilot");

    const chat = chats.find((c) => c.id === currentChatId);
    chat.results = data;
    saveChats();

    displayResults(data);
  } catch (err) {
    addMessage("⚠️ Something went wrong.", "copilot");
  }
}

// ------------------ DRAFT MESSAGE ------------------

async function draftMessage(btn) {
  const chat = chats.find((c) => c.id === currentChatId);
  if (!chat || !chat.results) {
    addMessage("⚠️ Please search for flights first before drafting a message.", "copilot");
    return;
  }

  const originalText = btn.innerText;
  btn.innerText = "⌛ Drafting...";
  btn.disabled = true;

  addMessage("✍️ Drafting professional message for " + chat.customerName + "...", "copilot", false);

  try {
    const res = await fetch("http://localhost:5000/recommend/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: chat.customerName,
        agentName: agent,
        flightData: chat.results,
      }),
    });

    const data = await res.json();
    
    // Reset button
    btn.innerText = originalText;
    btn.disabled = false;

    if (data.draft) {
      // Clear the "Drafting..." helper message
      const chatWindow = document.getElementById("chatWindow");
      if (chatWindow.lastChild && chatWindow.lastChild.innerText.includes("Drafting professional message")) {
        chatWindow.removeChild(chatWindow.lastChild);
      }

      addMessage("📋 AI Suggested Message:", "copilot");
      addMessage(data.draft, "copilot");
    } else {
      addMessage("⚠️ Could not generate draft. Please try again.", "copilot");
    }
  } catch (err) {
    btn.innerText = originalText;
    btn.disabled = false;
    addMessage("⚠️ Connection error while drafting message.", "copilot");
  }
}

// ------------------ HOTEL SEARCH ------------------

async function fetchHotels() {
  const chat = chats.find((c) => c.id === currentChatId);
  if (!chat || !chat.results) return;

  addMessage("🏨 Finding hotel recommendations for " + chat.results.parsedInput.to + "...", "copilot", false);

  try {
    const res = await fetch("http://localhost:5000/recommend/hotels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: chat.results.parsedInput.to }),
    });

    const data = await res.json();
    if (data.hotels) {
      addMessage("🌟 Here are some stay options for your client:", "copilot");
      let hotelMsg = "";
      data.hotels.forEach(h => {
        hotelMsg += `• ${h.name} (${h.rating}) - ${h.price} in ${h.location}\n`;
      });
      addMessage(hotelMsg, "copilot");
    }
  } catch (err) {
    addMessage("⚠️ Could not fetch hotels.", "copilot");
  }
}

// ------------------ DISPLAY RESULTS ------------------

function displayResults(data) {
  const container = document.getElementById("response");
  container.innerHTML = "";

  const chat = chats.find((c) => c.id === currentChatId);
  if (!chat) return;

  // Ensure status exists
  if (!chat.status) {
    chat.status = "Draft";
    saveChats();
  }

  // --- TRIP BRIEF (If Confirmed) ---
  if (chat.status === "Confirmed" && data.bestChoice) {
    const briefDiv = document.createElement("div");
    briefDiv.style.background = "linear-gradient(135deg, #1e293b, #0f172a)";
    briefDiv.style.border = "1px solid #10b981";
    briefDiv.style.padding = "15px";
    briefDiv.style.borderRadius = "10px";
    briefDiv.style.marginBottom = "20px";
    briefDiv.style.boxShadow = "0 4px 20px rgba(16, 185, 129, 0.1)";

    briefDiv.innerHTML = `
      <h4 style="margin:0 0 10px 0; color:#10b981; text-transform:uppercase; font-size:11px; letter-spacing:1px;">✅ Trip Finalized</h4>
      <div style="font-size:14px; display:flex; flex-direction:column; gap:5px;">
        <span><strong>Customer:</strong> ${chat.customerName}</span>
        <span><strong>Airline:</strong> ${data.bestChoice.flight.airline}</span>
        <span><strong>Route:</strong> ${data.bestChoice.flight.from} ✈️ ${data.bestChoice.flight.to}</span>
        <span><strong>Price:</strong> ₹${data.bestChoice.flight.price}</span>
      </div>
    `;
    container.appendChild(briefDiv);
  }

  // Status Badge
  const statusDiv = document.createElement("div");
  statusDiv.classList.add("status-badge");
  statusDiv.classList.add(
    chat.status === "Confirmed" ? "status-confirmed" : chat.status === "Sent" ? "status-sent" : "status-draft"
  );
  statusDiv.innerText = "Status: " + chat.status;
  container.appendChild(statusDiv);

  // Lifecycle Buttons
  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";
  btnRow.style.marginBottom = "10px";

  if (chat.status === "Draft") {
    const sendBtn = document.createElement("button");
    sendBtn.innerText = "Send to Customer";
    sendBtn.onclick = function () {
      chat.status = "Sent";
      saveChats();
      renderChatList();
      displayResults(chat.results);
    };

    const alertBtn = document.createElement("button");
    alertBtn.innerText = "🔔 Simulate Price Drop";
    alertBtn.style.background = "#8b5cf6";
    alertBtn.onclick = function () {
      addMessage("⚡ PROACTIVE ALERT: I've detected a price drop! Should I update the itinerary?", "copilot");
    };

    btnRow.appendChild(sendBtn);
    btnRow.appendChild(alertBtn);
  }

  if (chat.status === "Sent") {
    const confirmBtn = document.createElement("button");
    confirmBtn.innerText = "Mark as Confirmed";
    confirmBtn.onclick = function () {
      confirmBtn.innerText = "⌛ Processing...";
      confirmBtn.disabled = true;
      setTimeout(() => {
        chat.status = "Confirmed";
        saveChats();
        renderChatList();
        displayResults(chat.results);
        addMessage("✅ Booking confirmed! The itinerary is now locked.", "copilot");
      }, 1500);
    };
    btnRow.appendChild(confirmBtn);
  }

  // Multi-Service: Hotel Suggestion (If Confirmed)
  if (chat.status === "Confirmed") {
    const hotelBtn = document.createElement("button");
    hotelBtn.innerText = "🏨 Find Stay in " + data.parsedInput.to;
    hotelBtn.style.background = "#f59e0b";
    hotelBtn.onclick = fetchHotels;
    btnRow.appendChild(hotelBtn);
  }

  container.appendChild(btnRow);

  // Action Row
  const actionRow = document.createElement("div");
  actionRow.style.display = "flex";
  actionRow.style.gap = "10px";
  actionRow.style.marginBottom = "10px";

  const draftBtn = document.createElement("button");
  draftBtn.innerText = "✍️ Draft Client Message";
  draftBtn.style.background = "#0ea5e9";
  draftBtn.onclick = function() { draftMessage(this); };

  const exportBtn = document.createElement("button");
  exportBtn.innerText = "📄 Export PDF";
  exportBtn.onclick = function () { window.print(); };

  actionRow.appendChild(draftBtn);
  actionRow.appendChild(exportBtn);
  container.appendChild(actionRow);

  // Alternative Note
  if (data.alternativeNote) {
    const altDiv = document.createElement("div");
    altDiv.style.background = "rgba(239, 68, 68, 0.1)";
    altDiv.style.borderLeft = "4px solid #ef4444";
    altDiv.style.padding = "10px";
    altDiv.style.marginBottom = "15px";
    altDiv.style.fontSize = "13px";
    altDiv.style.color = "#f87171";
    altDiv.innerHTML = `💡 <strong>Note:</strong> ${data.alternativeNote}`;
    container.appendChild(altDiv);
  }

  // Agent Briefing & Flexible Tips (Existing logic remains)
  if (data.destinationBrief) {
    const brief = data.destinationBrief;
    const briefDiv = document.createElement("div");
    briefDiv.style.background = "#1e293b";
    briefDiv.style.border = "1px solid #334155";
    briefDiv.style.padding = "12px";
    briefDiv.style.borderRadius = "8px";
    briefDiv.style.marginBottom = "15px";
    briefDiv.style.fontSize = "13px";
    briefDiv.innerHTML = `
      <h4 style="margin-top:0; color:#38bdf8;">🌍 Agent Briefing: ${data.parsedInput.to}</h4>
      <span>🌡️ <strong>Weather:</strong> ${brief.weather} | 🛂 <strong>Visa:</strong> ${brief.visa}</span>
    `;
    container.appendChild(briefDiv);
  }

  // If no recommendations
  if (!data || !data.recommendations || data.recommendations.length === 0) {
    const noFlights = document.createElement("p");
    noFlights.innerText = "No flights found.";
    container.appendChild(noFlights);
    return;
  }

  // Render Best Choice Card
  if (data.bestChoice && data.bestChoice.flight) {
    const best = data.bestChoice;
    const bestDiv = document.createElement("div");
    bestDiv.classList.add("best-choice-card");
    bestDiv.innerHTML = `
      <h3>🌟 Best Choice</h3>
      <strong>🛫 Outbound: ${best.flight.airline}</strong><br>
      Departure: ${best.flight.departure} | Arrival: ${best.flight.arrival}<br>
      Price: ₹${best.flight.price}<br>
      <div style="margin-top:10px;"><strong>Reason:</strong> ${best.reason}</div>
    `;
    container.appendChild(bestDiv);
  }

  // Other Recommendations
  data.recommendations.forEach((rec) => {
    if (!rec.flight) return;
    const div = document.createElement("div");
    div.classList.add("recommend-card");
    div.innerHTML = `
      <strong>🛫 Outbound: ${rec.flight.airline}</strong><br>
      Price: ₹${rec.flight.price}<br>
      <strong>Reason:</strong> ${rec.reason}
    `;
    container.appendChild(div);
  });
}


