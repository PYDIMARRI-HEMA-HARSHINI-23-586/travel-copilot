const express = require("express");
const router = express.Router();
const flights = require("../data/flights.json");
const parseQuery = require("../services/parser");
const generateReasoning = require("../services/reasoner");
const draftClientMessage = require("../services/drafter");
const getDestinationBrief = require("../services/destinationBrief");

// Per-chat context storage
let chatContexts = {};

router.post("/", async (req, res) => {
  const { query, chatId } = req.body;

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

  // Merge with previous context if exists
  if (lastParsedInput) {
    parsed = {
      from: parsed.from || lastParsedInput.from,
      to: parsed.to || lastParsedInput.to,
      preference: parsed.preference || lastParsedInput.preference,
      budget: parsed.budget || lastParsedInput.budget,
      isRoundTrip: parsed.isRoundTrip || lastParsedInput.isRoundTrip,
      returnDate: parsed.returnDate || lastParsedInput.returnDate,
    };
  }

  // Save context for this specific chat
  if (chatId) {
    chatContexts[chatId] = parsed;
  }

  const { from, to, preference, budget, isRoundTrip } = parsed;

  let filtered = flights.filter((f) => f.from === from && f.to === to);

  if (preference === "evening") {
    filtered = filtered.filter((f) => parseInt(f.departure) >= 18);
  }

  if (budget) {
    filtered = filtered.filter((f) => f.price <= budget);
  }

  if (filtered.length === 0) {
    return res.json({ error: "No flights found." });
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

  // Flexible Date Insight (Simulation)
  const flexibleTip = cheapestPrice > 10000 
    ? `Tip: Flying 2 days later could save you ₹${Math.floor(cheapestPrice * 0.15)}.`
    : null;

  // Destination Brief
  const destinationBrief = to ? await getDestinationBrief(to) : null;

  // Generate Return Flights if Round Trip
  let returnOptions = [];
  if (isRoundTrip) {
    // Simulate return options (Reverse from/to)
    returnOptions = flights
      .filter((f) => f.from === to && f.to === from)
      .slice(0, 2);
  }

  // 🔥 AI Reasoning
  let reasoningResult;

  try {
    reasoningResult = await generateReasoning(shortlisted, parsed);
  } catch (err) {
    console.error("Reasoning failed:", err);
    return res.status(500).json({ error: "Reasoning failed" });
  }

  if (!reasoningResult) {
    return res.json({ error: "Could not generate reasoning." });
  }

  const recommendations = shortlisted.map((flight) => {
    const match = reasoningResult.analysis.find(
      (r) => r.flightId === flight.id,
    );

    return {
      flight,
      returnFlight: isRoundTrip ? returnOptions[0] : null,
      reason: match ? match.reason : "Recommended option.",
    };
  });

  const bestChoice =
    recommendations.find((r) => r.flight.id === reasoningResult.bestFlightId) ||
    recommendations[0];

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
    const draft = await draftClientMessage(
      customerName,
      flightData,
      agentName,
    );
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: "Drafter failed" });
  }
});

module.exports = router;
