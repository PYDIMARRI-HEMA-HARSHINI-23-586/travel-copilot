const express = require("express");
const router = express.Router();
const flights = require("../data/flights.json");
const parseQuery = require("../services/parser");
const generateReasoning = require("../services/reasoner");
const draftClientMessage = require("../services/drafter");
const getDestinationBrief = require("../services/destinationBrief");

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
    console.log("Existing context found. Merging...");
    parsed = {
      from: parsed.from !== null ? parsed.from : lastParsedInput.from,
      to: parsed.to !== null ? parsed.to : lastParsedInput.to,
      preference: parsed.preference !== null ? parsed.preference : lastParsedInput.preference,
      budget: parsed.budget !== null ? parsed.budget : lastParsedInput.budget,
      isRoundTrip: parsed.isRoundTrip !== null ? parsed.isRoundTrip : lastParsedInput.isRoundTrip,
      returnDate: parsed.returnDate !== null ? parsed.returnDate : lastParsedInput.returnDate,
    };
  }

  // Save context for this specific chat
  if (chatId) {
    chatContexts[chatId] = parsed;
    console.log("Updated Context:", JSON.stringify(parsed, null, 2));
  }

  const { from, to, preference, budget, isRoundTrip } = parsed;

  // If even after merging we don't have basic info
  if (!from || !to) {
    return res.json({ 
      error: "I need to know both origin and destination. (e.g., 'Delhi to Dubai')",
      parsedInput: parsed 
    });
  }

  let filtered = flights.filter((f) => f.from === from && f.to === to);

  if (preference === "evening") {
    filtered = filtered.filter((f) => parseInt(f.departure) >= 18);
  }

  if (budget) {
    filtered = filtered.filter((f) => f.price <= budget);
  }

  if (filtered.length === 0) {
    return res.json({ 
      error: `No flights found from ${from} to ${to} matching your criteria.`,
      parsedInput: parsed 
    });
  }

  // Identify Cheapest and Fastest
  const cheapestPrice = Math.min(...filtered.map((f) => f.price));
  const fastestDuration = Math.min(...filtered.map((f) => f.duration));

  const resultsWithTags = filtered.map((f) => {
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

  // Generate Return Flights if Round Trip
  let returnOptions = [];
  if (isRoundTrip) {
    returnOptions = flights
      .filter((f) => f.from === to && f.to === from)
      .slice(0, 2);
  }

  // AI Reasoning
  let reasoningResult;
  try {
    reasoningResult = await generateReasoning(shortlisted, parsed);
  } catch (err) {
    console.error("Reasoning failed:", err);
    return res.status(500).json({ error: "Reasoning failed" });
  }

  if (!reasoningResult) {
    return res.json({ error: "Could not generate reasoning.", parsedInput: parsed });
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
    destinationBrief
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

module.exports = router;
