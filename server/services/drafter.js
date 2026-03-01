const OpenAI = require("openai");

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function draftClientMessage(customerName, flightData, agentName) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are a professional travel agent's assistant.
Your goal is to draft a friendly, persuasive, and professional message (suitable for WhatsApp or Email) that summarizes flight options for a customer.

Tone: Helpful, professional, and slightly enthusiastic.
Format: Clear sections, use emojis for readability.
`,
      },
      {
        role: "user",
        content: `
Customer Name: ${customerName}
Agent Name: ${agentName}
Flight Details: ${JSON.stringify(flightData)}

Draft a message to the customer sharing these options. Highlight why the "Best Choice" is recommended.
`,
      },
    ],
    temperature: 0.7,
  });

  return completion.choices[0].message.content.trim();
}

module.exports = draftClientMessage;
