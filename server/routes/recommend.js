const express = require("express");
const router = express.Router();
const flights = require("../data/flights.json");
const parseQuery = require("../services/parser");
const generateReasoning = require("../services/reasoner");
let lastParsedInput = null;

router.post("/", async (req, res) => {
  const { query } = req.body;

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
  if (lastParsedInput) {
    parsed = {
      from: parsed.from || lastParsedInput.from,
      to: parsed.to || lastParsedInput.to,
      preference: parsed.preference || lastParsedInput.preference,
      budget: parsed.budget || lastParsedInput.budget,
    };
  }

  lastParsedInput = parsed;

  const { from, to, preference, budget } = parsed;

  let filtered = flights.filter((f) => f.from === from && f.to === to);

  if (preference === "evening") {
    filtered = filtered.filter((f) => parseInt(f.departure) >= 18);
  }

  if (budget) {
    filtered = filtered.filter((f) => f.price <= budget);
  }

  filtered.sort((a, b) => a.price - b.price);

  const shortlisted = filtered.slice(0, 3);

  if (shortlisted.length === 0) {
    return res.json({ error: "No flights found." });
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
  });
});

module.exports = router;
