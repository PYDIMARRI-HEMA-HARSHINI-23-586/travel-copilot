let chats = JSON.parse(localStorage.getItem("copilot_chats")) || [];
let currentChatId = null;

// ------------------ INIT ------------------
window.onload = function () {
  if (chats.length === 0) {
    newChat(); // auto-create first chat
  } else {
    renderChatList();
    loadChat(chats[0].id); // load most recent
  }
};

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

  document.getElementById("chatWindow").innerHTML = "";
  document.getElementById("response").innerHTML = "";

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
      <strong>${chat.customerName}</strong>
      <span style="font-size:12px; opacity:0.7;">(${chat.status})</span>
    `;

    li.onclick = () => loadChat(chat.id);
    li.dataset.id = chat.id;

    list.appendChild(li);
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
      body: JSON.stringify({ query }),
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

// ------------------ DISPLAY RESULTS ------------------

function displayResults(data) {
  const container = document.getElementById("response");
  container.innerHTML = "";

  const chat = chats.find((c) => c.id === currentChatId);
  if (!chat) return;

  // Ensure status exists (for older stored chats)
  if (!chat.status) {
    chat.status = "Draft";
    saveChats();
  }

  // If no recommendations
  if (!data || !data.recommendations || data.recommendations.length === 0) {
    container.innerHTML = `
      <div class="status-badge status-draft">
        Status: ${chat.status}
      </div>
      <p>No flights found.</p>
    `;
    return;
  }

  // Status Badge
  const statusDiv = document.createElement("div");
  statusDiv.classList.add("status-badge");
  statusDiv.classList.add(
    chat.status === "Confirmed" ? "status-confirmed" : "status-draft",
  );
  statusDiv.innerText = "Status: " + chat.status;

  container.appendChild(statusDiv);

  // Confirm Button
  if (chat.status !== "Confirmed") {
    const confirmBtn = document.createElement("button");
    confirmBtn.innerText = "Mark as Confirmed";
    confirmBtn.classList.add("confirm-btn");

    confirmBtn.onclick = function () {
      chat.status = "Confirmed";
      saveChats();
      renderChatList();
      displayResults(chat.results);
    };

    container.appendChild(confirmBtn);
  }

  // Best Choice (safe check)
  if (data.bestChoice && data.bestChoice.flight) {
    const best = data.bestChoice;

    const bestDiv = document.createElement("div");
    bestDiv.classList.add("best-choice-card");

    bestDiv.innerHTML = `
      <h3>🌟 Best Choice</h3>
      <strong>${best.flight.airline}</strong><br>
      Departure: ${best.flight.departure}<br>
      Arrival: ${best.flight.arrival}<br>
      Price: ₹${best.flight.price}<br>
      Duration: ${best.flight.duration} hrs<br>
      Layover: ${best.flight.layover}<br>
      <strong>Reason:</strong> ${best.reason}
    `;

    container.appendChild(bestDiv);
  }

  // Other Recommendations
  data.recommendations.forEach((rec) => {
    if (!rec.flight) return;

    const div = document.createElement("div");
    div.classList.add("recommend-card");

    div.innerHTML = `
      <strong>${rec.flight.airline}</strong><br>
      Departure: ${rec.flight.departure}<br>
      Arrival: ${rec.flight.arrival}<br>
      Price: ₹${rec.flight.price}<br>
      Duration: ${rec.flight.duration} hrs<br>
      Layover: ${rec.flight.layover}<br>
      <strong>Reason:</strong> ${rec.reason}
    `;

    container.appendChild(div);
  });
}
