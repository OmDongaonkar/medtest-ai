const express = require("express");
const router = express.Router();
const axios = require("axios");

const JIRA_CLIENT_ID = process.env.JIRA_CLIENT_ID;
const JIRA_REDIRECT_URI = process.env.JIRA_REDIRECT_URI;
const JIRA_CLIENT_SECRET = process.env.JIRA_CLIENT_SECRET;

router.get("/jira", async (req, res) => {
  console.log("Initiating Jira OAuth flow");

  const jiraAuthUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${JIRA_CLIENT_ID}&scope=write%3Ajira-work%20read%3Ajira-user%20manage%3Ajira-project%20read%3Ame%20read%3Aaccount&redirect_uri=${encodeURIComponent(
    JIRA_REDIRECT_URI
  )}&state=someRandomValue123&response_type=code&prompt=consent`;

  return res.json({ url: jiraAuthUrl });
});

router.get("/jira/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      error: "Authorization code missing",
    });
  }

  try {
    const tokenResponse = await axios.post("https://auth.atlassian.com/oauth/token", {
      grant_type: "authorization_code",
      client_id: JIRA_CLIENT_ID,
      client_secret: JIRA_CLIENT_SECRET,
      code,
      redirect_uri: JIRA_REDIRECT_URI,
    });

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://api.atlassian.com/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("Jira User Info:", userResponse.data);

    res.json({
      status: "success",
      user: userResponse.data,
      accessToken,
    });
  } catch (error) {
    console.error("Error during Jira OAuth:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to complete Jira OAuth",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;