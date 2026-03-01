async function getDestinationBrief(destination) {
  // Simple simulation of a destination knowledge base
  const briefs = {
    Dubai: {
      weather: "32°C (Sunny)",
      visa: "Visa on arrival available for many nationalities.",
      tip: "Dubai Shopping Festival is ongoing—expect great deals!",
    },
    Delhi: {
      weather: "22°C (Hazy)",
      visa: "E-visa required for most foreign tourists.",
      tip: "Traffic is heavy near Connaught Place due to metro work.",
    },
    Mumbai: {
      weather: "28°C (Humid)",
      visa: "E-visa required for most foreign tourists.",
      tip: "Marine Drive is beautiful for an evening walk.",
    },
  };

  return (
    briefs[destination] || {
      weather: "Data not available",
      visa: "Check local embassy guidelines.",
      tip: "General travel insurance is always recommended.",
    }
  );
}

module.exports = getDestinationBrief;
