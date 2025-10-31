const express = require("express");
const router = express.Router();
const axios = require("axios");

const AiChatRag = require("../controllers/AiRag");

router.post("/ai", async function (req, res) {
  try {
    const { message, context } = req.body;

    const chat = message.content;
    const time = message.timestamp;
    const id = message.id;

    console.log("AI Chat request received:", {
      message,
      hasContext: !!context,
      testCasesCount: context?.totalTestCases || 0,
    });

    const result = await AiChatRag(message, context);

    res.status(200).json({
      response: result,
    });
  } catch (error) {
    console.error("Error in /ai route:", error);
    res.status(500).json({
      response: "An error occurred while processing your request.",
      error: error.message,
    });
  }
});

module.exports = router;
