const express = require("express");
const router = express.Router();
const axios = require("axios");

const JIRA_CLIENT_ID = process.env.JIRA_CLIENT_ID;
const JIRA_REDIRECT_URI = process.env.JIRA_REDIRECT_URI;
const JIRA_CLIENT_SECRET = process.env.JIRA_CLIENT_SECRET;

// Helper function to get user's Jira data from Firebase
async function getUserJiraData(userId) {
  const url = `${process.env.DATABASE_URL}/users/${userId}/jira.json`;
  const response = await axios.get(url);
  return response.data;
}

// Helper function to refresh access token if expired
async function refreshAccessToken(userId, refreshToken) {
  try {
    const tokenResponse = await axios.post("https://auth.atlassian.com/oauth/token", {
      grant_type: "refresh_token",
      client_id: JIRA_CLIENT_ID,
      client_secret: JIRA_CLIENT_SECRET,
      refresh_token: refreshToken,
    });

    const { access_token, refresh_token: new_refresh_token, expires_in } = tokenResponse.data;

    // Update tokens in Firebase
    const updateUrl = `${process.env.DATABASE_URL}/users/${userId}/jira.json`;
    await axios.patch(updateUrl, {
      accessToken: access_token,
      refreshToken: new_refresh_token || refreshToken,
      expiresIn: expires_in,
      expiresAt: Date.now() + expires_in * 1000,
    });

    return access_token;
  } catch (error) {
    console.error("Error refreshing token:", error.response?.data || error.message);
    throw new Error("Failed to refresh access token");
  }
}

// Helper function to get valid access token
async function getValidAccessToken(userId) {
  const jiraData = await getUserJiraData(userId);

  if (!jiraData) {
    throw new Error("Jira not connected");
  }

  // Check if token is expired or about to expire (5 min buffer)
  if (Date.now() >= jiraData.expiresAt - 300000) {
    return await refreshAccessToken(userId, jiraData.refreshToken);
  }

  return jiraData.accessToken;
}

// Existing routes
router.get("/jira", async (req, res) => {
  console.log("Initiating Jira OAuth flow");
  
  // ✅ UPDATED SCOPES - Added missing scopes
  const scopes = [
    'read:jira-work',      // Required to read projects and issues
    'write:jira-work',     // Required to create/update issues
    'read:jira-user',      // Read user info
    'manage:jira-project', // Manage projects
    'read:me',             // Read account info
    'read:account',        // Read account details
    'offline_access'       // Get refresh token
  ].join('%20');
  
  const jiraAuthUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${JIRA_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(
    JIRA_REDIRECT_URI
  )}&state=someRandomValue123&response_type=code&prompt=consent`;
  
  console.log("Auth URL:", jiraAuthUrl);
  
  return res.json({ url: jiraAuthUrl });
});
router.get("/jira/callback", async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({
      error: "Authorization code missing",
    });
  }

  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({
      error: "User not authenticated",
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

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userResponse = await axios.get("https://api.atlassian.com/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const resourcesResponse = await axios.get(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const jiraData = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      expiresAt: Date.now() + expires_in * 1000,
      accountId: userResponse.data.account_id,
      email: userResponse.data.email,
      name: userResponse.data.name,
      sites: resourcesResponse.data,
      connectedAt: new Date().toISOString(),
    };

    const userId = req.session.user.id;
    const updateUrl = `${process.env.DATABASE_URL}/users/${userId}/jira.json`;
    await axios.patch(updateUrl, jiraData);

    console.log("Jira data saved successfully for user:", userId);
	
  /*  res.json({
      status: "success",
      message: "Jira connected successfully",
      user: userResponse.data,
      sites: resourcesResponse.data,
    });*/
	res.redirect(`${process.env.FRONTEND_URL}/upload`);

	
  } catch (error) {
    console.error("Error during Jira OAuth:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to complete Jira OAuth",
      details: error.response?.data || error.message,
    });
  }
});

// NEW ROUTES FOR ISSUE MANAGEMENT

// Get all projects
// Get all projects
router.get("/jira/projects", async (req, res) => {
  console.log("📋 Fetching Jira projects...");
  console.log("Session user:", req.session.user);
  
  if (!req.session.user || !req.session.user.id) {
    console.error("❌ User not authenticated");
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const userId = req.session.user.id;
    console.log("👤 User ID:", userId);
    
    const accessToken = await getValidAccessToken(userId);
    console.log("🔑 Access token obtained");
    
    const jiraData = await getUserJiraData(userId);
    console.log("📊 Jira data:", JSON.stringify(jiraData, null, 2));

    if (!jiraData) {
      console.error("❌ No Jira data found");
      return res.status(400).json({ 
        error: "Jira not connected",
        message: "Please connect your Jira account first" 
      });
    }

    if (!jiraData.sites || jiraData.sites.length === 0) {
      console.error("❌ No Jira sites found in data");
      return res.status(400).json({ 
        error: "No Jira sites found",
        message: "No Jira sites found in your account" 
      });
    }

    const cloudId = jiraData.sites[0].id;
    console.log("☁️ Cloud ID:", cloudId);

    const response = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log("✅ Projects fetched successfully:", response.data.length);

    res.json({
      status: "success",
      projects: response.data,
    });
  } catch (error) {
    console.error("❌ Error fetching projects:", error.response?.data || error.message);
    console.error("Full error:", error);
    
    res.status(500).json({
      error: "Failed to fetch projects",
      details: error.response?.data || error.message,
      message: "There was an error fetching Jira projects. Please try reconnecting your Jira account."
    });
  }
});
// Create a new issue
router.post("/jira/issue", async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { projectKey, summary, description, issueType = "Task" } = req.body;

  if (!projectKey || !summary) {
    return res.status(400).json({
      error: "Missing required fields: projectKey and summary",
    });
  }

  try {
    const userId = req.session.user.id;
    const accessToken = await getValidAccessToken(userId);
    const jiraData = await getUserJiraData(userId);

    if (!jiraData.sites || jiraData.sites.length === 0) {
      return res.status(400).json({ error: "No Jira sites found" });
    }

    const cloudId = jiraData.sites[0].id;

    // Format description for Atlassian Document Format (ADF)
    const descriptionADF = description
      ? {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: description,
                },
              ],
            },
          ],
        }
      : undefined;

    const issueData = {
      fields: {
        project: {
          key: projectKey,
        },
        summary: summary,
        issuetype: {
          name: issueType,
        },
        ...(descriptionADF && { description: descriptionADF }),
      },
    };

    const response = await axios.post(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`,
      issueData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      status: "success",
      message: "Issue created successfully",
      issue: response.data,
    });
  } catch (error) {
    console.error("Error creating issue:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create issue",
      details: error.response?.data || error.message,
    });
  }
});

// Fetch issues by project or JQL
// Fetch issues by project or JQL - ALTERNATIVE METHOD
// Fetch issues by project or JQL - CORRECTED FOR API v3
// ALTERNATIVE METHOD - Using issue picker API
router.get("/jira/issues", async (req, res) => {
  console.log("🔍 Fetching Jira issues (Issue Picker Method)...");
  
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { projectKey, maxResults = 50 } = req.query;

  try {
    const userId = req.session.user.id;
    const accessToken = await getValidAccessToken(userId);
    const jiraData = await getUserJiraData(userId);

    if (!jiraData || !jiraData.sites || jiraData.sites.length === 0) {
      return res.status(400).json({ error: "No Jira sites found" });
    }

    const cloudId = jiraData.sites[0].id;

    if (!projectKey) {
      return res.status(400).json({
        error: "projectKey parameter is required",
      });
    }

    console.log("📋 Fetching issues from project:", projectKey);

    // ✅ Method 1: Get all issues using issue picker
    const pickerUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/picker`;
    
    const pickerResponse = await axios.get(pickerUrl, {
      params: {
        query: projectKey,
        currentProjectId: projectKey,
        showSubTasks: false
      },
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    console.log("✅ Issue picker response:", pickerResponse.data);

    // Get full details for each issue
   const issueKeys = pickerResponse.data.sections?.[0]?.issues?.map(i => i.key) || [];

    
    if (issueKeys.length === 0) {
      return res.json({
        status: "success",
        total: 0,
        issues: []
      });
    }

    console.log("📝 Found issue keys:", issueKeys);

    // Fetch full details for each issue (limit to maxResults)
    const limitedKeys = issueKeys.slice(0, parseInt(maxResults));
   const issuePromises = limitedKeys.map(async (key) => {

      try {
        const issueResponse = await axios.get(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${key}`,
          {
            params: {
              fields: 'summary,description,status,issuetype,created,updated'
            },
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );
        return issueResponse.data;
      } catch (err) {
        console.error(`Error fetching issue ${key}:`, err.message);
        return null;
      }
    });

    const issues = (await Promise.all(issuePromises)).filter(i => i !== null);

    console.log("✅ Fetched", issues.length, "issues successfully");

    res.json({
      status: "success",
      total: issues.length,
      issues: issues
    });

  } catch (error) {
    console.error("❌ Error fetching issues:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch issues",
      details: error.response?.data || error.message
    });
  }
});
// Get a specific issue by key
router.get("/jira/issue/:issueKey", async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { issueKey } = req.params;

  try {
    const userId = req.session.user.id;
    const accessToken = await getValidAccessToken(userId);
    const jiraData = await getUserJiraData(userId);

    if (!jiraData.sites || jiraData.sites.length === 0) {
      return res.status(400).json({ error: "No Jira sites found" });
    }

    const cloudId = jiraData.sites[0].id;

    const response = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json({
      status: "success",
      issue: response.data,
    });
  } catch (error) {
    console.error("Error fetching issue:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch issue",
      details: error.response?.data || error.message,
    });
  }
});

// Update an issue
router.put("/jira/issue/:issueKey", async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { issueKey } = req.params;
  const { summary, description, status } = req.body;

  try {
    const userId = req.session.user.id;
    const accessToken = await getValidAccessToken(userId);
    const jiraData = await getUserJiraData(userId);

    if (!jiraData.sites || jiraData.sites.length === 0) {
      return res.status(400).json({ error: "No Jira sites found" });
    }

    const cloudId = jiraData.sites[0].id;

    const updateData = { fields: {} };

    if (summary) {
      updateData.fields.summary = summary;
    }

    if (description) {
      updateData.fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: description }],
          },
        ],
      };
    }

    await axios.put(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // If status update is requested, handle it separately
    if (status) {
      // Get available transitions
      const transitionsResponse = await axios.get(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/transitions`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const transition = transitionsResponse.data.transitions.find(
        (t) => t.name.toLowerCase() === status.toLowerCase() || t.to.name.toLowerCase() === status.toLowerCase()
      );

      if (transition) {
        await axios.post(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/transitions`,
          {
            transition: { id: transition.id },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    res.json({
      status: "success",
      message: "Issue updated successfully",
    });
  } catch (error) {
    console.error("Error updating issue:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to update issue",
      details: error.response?.data || error.message,
    });
  }
});

// Check Jira connection status
router.get("/jira/status", async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const userId = req.session.user.id;
    const jiraData = await getUserJiraData(userId);

    if (!jiraData) {
      return res.json({
        connected: false,
        message: "Jira not connected",
      });
    }

    res.json({
      connected: true,
      accountId: jiraData.accountId,
      email: jiraData.email,
      name: jiraData.name,
      sites: jiraData.sites,
      connectedAt: jiraData.connectedAt,
    });
  } catch (error) {
    console.error("Error checking Jira status:", error.message);
    res.status(500).json({
      error: "Failed to check Jira status",
      details: error.message,
    });
  }
});

module.exports = router;
/*
```

## API Usage Examples:

### 1. **Check Connection Status**
```
GET /jira/status
```

### 2. **Get All Projects**
```
GET /jira/projects
```

### 3. **Create an Issue**
```
POST /jira/issue
Content-Type: application/json

{
  "projectKey": "TEST",
  "summary": "Bug in login page",
  "description": "Users cannot login with their credentials",
  "issueType": "Bug"
}
```

### 4. **Fetch Issues**
```
GET /jira/issues?projectKey=TEST&maxResults=10
```

Or with custom JQL:
```
GET /jira/issues?jql=assignee=currentUser()&maxResults=20
```

### 5. **Get Specific Issue**
```
GET /jira/issue/TEST-123
```

### 6. **Update an Issue**
```
PUT /jira/issue/TEST-123
Content-Type: application/json

{
  "summary": "Updated summary",
  "description": "Updated description",
  "status": "In Progress"
}*/