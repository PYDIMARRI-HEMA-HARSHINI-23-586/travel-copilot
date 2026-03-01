# Travel Copilot ✈️🤖

Travel Copilot is an AI-powered flight recommendation assistant designed to help travel agents find the best options for their customers through natural language queries. It leverages Large Language Models (LLMs) to parse complex user intents and provide intelligent reasoning for flight selections.

## 🌟 Key Features

- **Natural Language Parsing**: Extract travel details (origin, destination, budget, preferences) directly from conversational input using **Llama 3.1 8B**.
- **Chat Management**: Support for multiple customer chats with persistent storage using `localStorage`.
- **Status Lifecycle Tracking**: Track the full lifecycle of each recommendation: **Draft** (initial), **Sent** (itinerary shared with customer), and **Confirmed** (booking approved).
- **Chat Management & Cleanup**: Organize your workspace by creating new customer sessions or deleting completed cases directly from the sidebar.
- **Instant Search Filter**: Quickly locate specific customer chats using the real-time sidebar search bar.
- **Export as PDF**: Generate professional, print-ready booking summaries for customers with a single click.
- **Agent Login Simulation**: A personalized experience that identifies the active travel agent, persisting the session locally.
- **AI-Driven Reasoning**: Beyond just filtering, the system analyzes trade-offs between price, duration, and timing to recommend the "Best Choice" with human-like justifications.
- **Session Persistence**: Maintains context within a session to handle follow-up queries (e.g., if a user doesn't specify a destination in a follow-up, it uses the last known one).
- **Responsive Dashboard**: A modern interface featuring a sidebar for chat history and a main area for flight recommendations and AI insights.

---

## 🏗️ Architecture

The project follows a decoupled Client-Server architecture:

### **Backend (Node.js/Express)**
- **Service Layer**:
    - `parser.js`: Uses **Groq (Llama 3.1 8B Instant)** to transform raw text into structured JSON.
    - `reasoner.js`: Employs AI to evaluate flight options and provide human-like justification for recommendations.
- **Routing**: RESTful API endpoints managed via Express.
- **Data**: A mock flight database stored in `flights.json` containing fields like airline, departure/arrival times, price, duration, and layovers.

### **Frontend (Vanilla JS/CSS/HTML)**
- **State Management**: Manages chat history and UI state locally.
- **Dynamic UI**: Renders flight cards, status badges, and AI reasoning dynamically based on API responses.
- **Persistence**: Uses `localStorage` to keep customer chats and statuses across browser refreshes.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- A [Groq API Key](https://console.groq.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd travel-copilot
   ```

2. **Setup the Server**:
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `server/` directory:
   ```env
   GROQ_API_KEY=your_api_key_here
   ```

4. **Start the Backend**:
   ```bash
   node index.js
   ```
   The server will run on `http://localhost:5000`.

5. **Run the Frontend**:
   Simply open `client/index.html` in your browser, or use a Live Server extension.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **AI Integration**: OpenAI SDK (configured for Groq Cloud)
- **Model**: `llama-3.1-8b-instant`

---

## 📈 API Documentation

### POST `/recommend`
Analyzes a user query and returns flight recommendations.

**Request Body:**
```json
{
  "query": "Find me a flight from Delhi to Dubai under 20000 for this evening"
}
```

**Response:**
```json
{
  "parsedInput": {
    "from": "Delhi",
    "to": "Dubai",
    "preference": "evening",
    "budget": 20000
  },
  "bestChoice": {
    "flight": {
      "id": 1,
      "from": "Delhi",
      "to": "Dubai",
      "departure": "18:30",
      "arrival": "21:00",
      "price": 18000,
      "duration": 3.5,
      "layover": 0,
      "airline": "Emirates"
    },
    "reason": "This flight fits your budget and evening preference perfectly while being a direct flight with a top-tier airline."
  },
  "recommendations": [ ... ]
}
```

---

## 📝 License
This project is licensed under the ISC License.
