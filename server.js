require("dotenv").config();
console.log("BOT_TOKEN loaded:", !!process.env.BOT_TOKEN);
console.log("CHAT_ID loaded:", !!process.env.CHAT_ID);

const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

// Parse JSON requests
app.use(express.json({ limit: "10kb" }));

// Serve your website files
app.use(express.static(path.join(__dirname, "public")));

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Connect-up page
app.get("/connect-up.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "connect-up.html"));
});

// Connect page
app.get("/connect.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "connect.html"));
});

// Favourite color API
app.post("/api/favourite-color", async (req, res) => {
  try {
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

    // Telegram credentials
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error("BOT_TOKEN or CHAT_ID is missing.");

      return res.status(500).json({
        success: false,
        message: "Server configuration error."
      });
    }

    // Send to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🎨 New Color Entry\n\nColor: ${cleanColor}`
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
});

// Start local server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});