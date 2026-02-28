const OpenAI = require("openai");

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function generateReasoning(flights, parsedInput) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are a travel booking decision assistant.

Given flight options and user preference, 
analyze tradeoffs and generate reasoning.

Return ONLY valid JSON in this format:

{
  "bestFlightId": number,
  "analysis": [
    {
      "flightId": number,
      "reason": string
    }
  ]
}

Be concise but intelligent.
Mention trade-offs.
`,
      },
      {
        role: "user",
        content: `
User preference:
${JSON.stringify(parsedInput)}

Flight options:
${JSON.stringify(flights)}
`,
      },
    ],
    temperature: 0.4,
  });

  const content = completion.choices[0].message.content.trim();

  try {
    return JSON.parse(content);
  } catch (err) {
    console.log("Reasoning parse error:", content);
    return null;
  }
}

module.exports = generateReasoning;
