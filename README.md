# Travel Copilot ✈️🤖

Travel Copilot is an AI-powered flight recommendation assistant designed to help travel agents find the best options for their customers through natural language queries. It leverages Large Language Models (LLMs) to parse complex user intents and provide intelligent reasoning for flight selections.

## 🌟 Key Features

- **Modern Welcome Interface**: A clean, "ChatGPT-style" landing screen for new sessions, providing clear onboarding steps for travel agents.
- **Agent Identity Management**: Easily update and personalize your professional profile with the built-in "Edit Agent Name" functionality.
- **Natural Language Parsing**: Extract travel details (origin, destination, budget, preferences) directly from conversational input using **Llama 3.1 8B**.
- **Chat Management**: Support for multiple customer chats with persistent storage using `localStorage`.
- **Status Lifecycle Tracking**: Track the full lifecycle of each recommendation: **Draft** (initial), **Sent** (itinerary shared with customer), and **Confirmed** (booking approved).
- **AI Client Message Drafter**: Generate professional, persuasive summaries for customers (ready for Email/WhatsApp) using AI reasoning.
- **Smart Flexible Date Insights**: Proactive tips suggesting cheaper travel dates to help customers save money.
- **Destination Context (Agent Briefing)**: Real-time briefings on destination weather, visa requirements, and local travel tips.
- **One-Click Booking Simulation**: Experience the full workflow with an automated "Processing Booking" state that finalizes itineraries.
- **Round-Trip Support**: Intelligent handling of outbound and return flight itineraries within a single conversation.
- **Expanded Flight Database**: Support for international routes including Singapore, London, Dubai, and New York.
- **Proactive Alerts**: Simulation of real-time price drops to show how the Copilot anticipates needs.
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
    - `drafter.js`: Uses AI to generate professional client-facing summaries.
    - `destinationBrief.js`: Provides contextual knowledge about destinations (Weather, Visa, Tips).
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

### POST `/recommend/draft`
Generates a professional client message based on flight data.

---

## 📝 License
This project is licensed under the ISC License.
