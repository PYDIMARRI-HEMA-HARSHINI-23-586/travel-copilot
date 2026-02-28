const OpenAI = require("openai");

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function parseQuery(query) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are a travel intent parser.

Extract structured travel booking information from user input.

Return ONLY valid JSON in this format:

{
  "from": string | null,
  "to": string | null,
  "preference": "evening" | "morning" | null,
  "budget": number | null
}

If a field is missing, return null.
Do NOT include explanation text.
Only JSON.
`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    temperature: 0,
  });

  const content = completion.choices[0].message.content.trim();

  try {
    return JSON.parse(content);
  } catch (err) {
    console.log("Groq returned non-JSON:", content);
    return null;
  }
}

module.exports = parseQuery;
