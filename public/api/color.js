export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const { colors } = req.body || {};

    // Validate the submitted color
    if (!colors || typeof colors !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Please provide a color."
      });
    }

    // Telegram credentials stored in Vercel Environment Variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Telegram environment variables are missing.");

      return res.status(500).json({
        ok: false,
        error: "Telegram configuration is missing."
      });
    }

    // Message sent to Telegram
    const message = `🎨 New Color Submission\n\nColor: ${colors}`;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramData.ok) {
      console.error("Telegram error:", telegramData);

      return res.status(500).json({
        ok: false,
        error: "Could not send the color to Telegram."
      });
    }

    return res.status(200).json({
      ok: true
    });

  } catch (error) {
    console.error("API error:", error);

    return res.status(500).json({
      ok: false,
      error: "Server error. Please try again."
    });
  }
}