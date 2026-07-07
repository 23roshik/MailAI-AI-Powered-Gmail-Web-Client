async function chat(messages, context = {}) {
  try {
    console.log("Gemini 2.5 Flash call started");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in .env file");
    }

    const lastUserMessage =
      messages[messages.length - 1]?.content || "Hello";

    // 🧠 System instruction forcing structured JSON output
    const systemInstruction = `
You are an AI mail assistant that controls a Gmail web app UI.

You MUST respond ONLY in valid JSON format like this:

{
  "message": "short response to user",
  "actions": [
    {
      "type": "action_name",
      ...parameters
    }
  ]
}

Available action types:
- navigate { view: "inbox" | "sent" | "compose" }
- filter_inbox { filters: { keyword?: string } }
- search { query?: string, filters?: object }
- open_email { emailId: string }
- fill_compose { to?: string, cc?: string, subject?: string, body?: string }
- send_email {}
- reply_to_email { body?: string }
- forward_email { to?: string }
- clear_filters {}

If user just chats normally, return:
{
  "message": "your reply",
  "actions": []
}

DO NOT wrap JSON in markdown.
DO NOT add explanations.
ONLY return pure JSON.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemInstruction },
                { text: `User: ${lastUserMessage}` },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '{"message":"No response due to free tier limit hit for today.","actions":[]}';


    // ✅ Clean markdown wrappers if Gemini adds them
    rawText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error("JSON parse failed, returning fallback.");
      parsed = {
        message: rawText,
        actions: [],
      };
    }

    return parsed;

  } catch (error) {
    console.error("Gemini error:", error);
    throw error;
  }
}

module.exports = { chat };