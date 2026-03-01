const express = require("express");
const router = express.Router();
const flights = require("../data/flights.json");
const parseQuery = require("../services/parser");
const generateReasoning = require("../services/reasoner");
const draftClientMessage = require("../services/drafter");
const getDestinationBrief = require("../services/destinationBrief");
const getHotelRecommendations = require("../services/hotelService");

// Per-chat context storage (In-memory)
let chatContexts = {};

router.post("/", async (req, res) => {
  const { query, chatId } = req.body;

  console.log(`--- New Request [Chat: ${chatId}] ---`);
  console.log(`Query: "${query}"`);

  let lastParsedInput = chatContexts[chatId] || null;
  let parsed;

  try {
    parsed = await parseQuery(query);
  } catch (err) {
    console.error("Parser crashed:", err);
    return res.status(500).json({ error: "Parser failed" });
  }

  if (!parsed) {
    return res.json({ error: "Could not understand request." });
  }

  // 🔥 Precision Merging Logic
  if (lastParsedInput) {
    parsed = {
      from: parsed.from !== null ? parsed.from : lastParsedInput.from,
      to: parsed.to !== null ? parsed.to : lastParsedInput.to,
      preference: parsed.preference !== null ? parsed.preference : lastParsedInput.preference,
      budget: parsed.budget !== null ? parsed.budget : lastParsedInput.budget,
      isRoundTrip: parsed.isRoundTrip !== null ? parsed.isRoundTrip : lastParsedInput.isRoundTrip,
      returnDate: parsed.returnDate !== null ? parsed.returnDate : lastParsedInput.returnDate,
    };
  }

  // Save context
  if (chatId) {
    chatContexts[chatId] = parsed;
  }

  const { from, to, preference, budget, isRoundTrip } = parsed;

  if (!from || !to) {
    return res.json({ 
      error: "I need to know both origin and destination. (e.g., 'Delhi to Dubai')",
      parsedInput: parsed 
    });
  }

  // 1. EXACT SEARCH
  let filtered = flights.filter((f) => f.from === from && f.to === to);
  let finalPreference = preference;
  let finalBudget = budget;

  if (preference === "evening") {
    filtered = filtered.filter((f) => parseInt(f.departure) >= 18);
  }
  if (budget) {
    filtered = filtered.filter((f) => f.price <= budget);
  }

  let alternatives = [];
  let alternativeNote = null;

  // 2. RELAXED SEARCH (If exact fails)
  if (filtered.length === 0) {
    console.log("No exact matches. Relaxing constraints...");
    
    // Try ignoring budget first
    let relaxedBudget = flights.filter(f => f.from === from && f.to === to);
    if (preference === "evening") relaxedBudget = relaxedBudget.filter(f => parseInt(f.departure) >= 18);
    
    if (relaxedBudget.length > 0) {
      alternatives = relaxedBudget.slice(0, 2);
      alternativeNote = "I couldn't find anything in your budget, but here are the closest options if you can stretch it.";
    } else {
      // Try ignoring everything but cities
      alternatives = flights.filter(f => f.from === from && f.to === to).slice(0, 2);
      alternativeNote = "No exact matches for your preferences. Here are the available flights for this route.";
    }
  }

  if (filtered.length === 0 && alternatives.length === 0) {
    return res.json({ error: `No flights found from ${from} to ${to}.`, parsedInput: parsed });
  }

  const resultsToProcess = filtered.length > 0 ? filtered : alternatives;

  // Identify Cheapest and Fastest
  const cheapestPrice = Math.min(...resultsToProcess.map((f) => f.price));
  const fastestDuration = Math.min(...resultsToProcess.map((f) => f.duration));

  const resultsWithTags = resultsToProcess.map((f) => {
    let tags = [];
    if (f.price === cheapestPrice) tags.push("💰 Cheapest");
    if (f.duration === fastestDuration) tags.push("⚡ Fastest");
    return { ...f, tags };
  });

  resultsWithTags.sort((a, b) => a.price - b.price);
  const shortlisted = resultsWithTags.slice(0, 3);

  // Flexible Date Insight
  const flexibleTip = cheapestPrice > 10000 
    ? `Tip: Flying 2 days later could save you ₹${Math.floor(cheapestPrice * 0.15)}.`
    : null;

  // Destination Brief
  const destinationBrief = to ? await getDestinationBrief(to) : null;

  // Generate Return Flights
  let returnOptions = [];
  if (isRoundTrip) {
    returnOptions = flights.filter((f) => f.from === to && f.to === from).slice(0, 2);
  }

  // AI Reasoning
  let reasoningResult;
  try {
    reasoningResult = await generateReasoning(shortlisted, parsed);
  } catch (err) {
    console.error("Reasoning failed:", err);
    return res.status(500).json({ error: "Reasoning failed" });
  }

  const recommendations = shortlisted.map((flight) => {
    const match = reasoningResult.analysis.find((r) => r.flightId === flight.id);
    return {
      flight,
      returnFlight: isRoundTrip ? returnOptions[0] : null,
      reason: match ? match.reason : "Recommended option.",
    };
  });

  const bestChoice = recommendations.find((r) => r.flight.id === reasoningResult.bestFlightId) || recommendations[0];

  res.json({
    parsedInput: parsed,
    bestChoice,
    recommendations,
    flexibleTip,
    destinationBrief,
    alternativeNote,
    isAlternative: filtered.length === 0
  });
});

router.post("/draft", async (req, res) => {
  const { customerName, flightData, agentName } = req.body;
  try {
    const draft = await draftClientMessage(customerName, flightData, agentName);
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: "Drafter failed" });
  }
});

router.post("/hotels", async (req, res) => {
  const { destination } = req.body;
  try {
    const hotels = await getHotelRecommendations(destination);
    res.json({ hotels });
  } catch (err) {
    res.status(500).json({ error: "Hotel fetch failed" });
  }
});

module.exports = router;
