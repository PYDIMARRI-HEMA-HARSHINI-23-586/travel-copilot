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

CRITICAL RULE: 
- Extract ONLY the information explicitly mentioned in the user's latest query.
- If a field (from, to, budget, etc.) is NOT mentioned in the query, you MUST return null for that field.
- NEVER use example data like "New York", "Los Angeles", or "2024-03-15" unless the user actually typed those words.
- If the user is asking a general question (e.g., "how is this best", "why?"), return null for ALL fields.

Return ONLY valid JSON in this format:
{
  "from": string | null,
  "to": string | null,
  "preference": "evening" | "morning" | null,
  "budget": number | null,
  "isRoundTrip": boolean | null,
  "returnDate": string | null
}
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
