const express = require('express');
const router = express.Router();
const axios = require('axios');

// Firebase REST API approach (no SDK required)
const FIREBASE_URL = "https://med-test-269d5-default-rtdb.firebaseio.com";

router.post('/generate-test', async (req, res) => {
    
  const { requirements } = req.body;
  const user = req.session?.user;
    
  // DEBUG SESSION INFORMATION
  console.log('🚀 Starting generate-test with REST API approach');
  console.log('🔍 SESSION DEBUG:');
  console.log('- req.session exists:', !!req.session);
  console.log('- req.session.user exists:', !!req.session?.user);
  console.log('- Full session object:', req.session);
  console.log('- User object:', user);
  console.log('- Session ID:', req.sessionID);
  console.log('- Headers:', JSON.stringify(req.headers, null, 2));

  if (!requirements) {
    return res.status(400).json({ error: 'Requirements are required' });
  }
    
  if (requirements.length > 3000) {
    return res.status(400).json({ error: 'Requirements cannot exceed 3000 chars as of now' });
  }

  try {
    const correctModel = "gemini-2.5-flash-preview-09-2025"; 
    
    // Gemini API call
    const geminiApiKey = process.env.GEMINI_API_KEY || "AIzaSyAy8eU9Joj9SEKr8oZ52Tf9zRSIL6-2CYk";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${correctModel}:generateContent?key=${geminiApiKey}`;
        
    const prompt = `
You are an AI system specialized in generating healthcare software test cases. Based on the provided requirements, generate exactly 10 comprehensive test cases that ensure compliance with healthcare regulations (FDA, IEC 62304, ISO 9001, ISO 13485, ISO 27001).

Requirements:
${requirements}

Generate test cases in the following JSON structure. Each test case should be detailed, specific, and traceable back to the requirements:

{
  "testCases": [
    {
      "id": "TC_001",
      "title": "Clear and descriptive test case title",
      "description": "Detailed description of what this test case validates",
      "category": "Functional|Security|Performance|Compliance|Integration|Usability",
      "priority": "High|Medium|Low",
      "requirementId": "REQ_XXX",
      "traceabilityLink": "Direct reference to specific requirement",
      "preconditions": [
        "List of conditions that must be met before test execution"
      ],
      "testSteps": [
        {
          "stepNumber": 1,
          "action": "Specific action to perform",
          "expectedResult": "Expected outcome of the action"
        }
      ],
      "expectedResults": "Overall expected results of the test case",
      "complianceStandards": ["FDA", "IEC 62304", "ISO 13485", "etc"],
      "riskLevel": "High|Medium|Low",
      "testData": {
        "inputs": "Required test data inputs",
        "outputs": "Expected data outputs"
      },
      "automationPotential": "High|Medium|Low",
      "estimatedDuration": "Time estimate in minutes"
    }
  ],
  "summary": {
    "totalTestCases": 10,
    "categoriesBreakdown": {
      "Functional": 0,
      "Security": 0,
      "Performance": 0,
      "Compliance": 0,
      "Integration": 0,
      "Usability": 0
    },
    "priorityBreakdown": {
      "High": 0,
      "Medium": 0,
      "Low": 0
    },
    "complianceStandardsCovered": [],
    "overallRiskAssessment": "Assessment of overall risk coverage"
  }
}

Important guidelines:
1. Make each test case specific and actionable
2. Ensure traceability to the original requirements
3. Include appropriate compliance standards for healthcare software
4. Vary test categories (functional, security, performance, compliance, etc.)
5. Provide realistic time estimates
6. Consider automation potential for each test case
7. Include risk assessment
8. Make test steps detailed and executable

Generate ONLY the JSON response without any additional text or markdown formatting.`;

    const geminiPayload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    console.log('🤖 Calling Gemini API...');
    const response = await axios.post(geminiUrl, geminiPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      // --- FIX: Increased timeout to 60 seconds (60000ms) to prevent timeout error ---
      timeout: 60000 
    });

    console.log('✅ Gemini API responded');

    const generatedContent = response.data.candidates[0].content.parts[0].text;
    console.log('📝 Content length:', generatedContent.length);

    let testCasesJson;
    try {
      const cleanedContent = generatedContent.replace(/```json\n?|\n?```/g, '').trim();
      testCasesJson = JSON.parse(cleanedContent);
      console.log('✅ JSON parsed, test cases:', testCasesJson.testCases?.length);
    } catch (parseError) {
      console.error('❌ Parse error:', parseError.message);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        details: parseError.message
      });
    }

    if (!testCasesJson.testCases || !Array.isArray(testCasesJson.testCases)) {
      return res.status(500).json({ 
        error: 'Invalid AI response structure'
      });
    }

    const responseWithMetadata = {
      ...testCasesJson,
      metadata: {
        generatedAt: new Date().toISOString(),
        requirementsLength: requirements.length,
        processingTime: Date.now(),
        version: '1.0',
        originalRequirements: requirements,
        user: user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL || null
        } : null,
        userEmail: user ? user.email : null, // Direct email field for easy querying
        createdBy: user ? user.email : 'anonymous', // Who created this test case
        // DEBUG INFO - remove in production
        sessionDebug: {
          hasSession: !!req.session,
          hasUser: !!user,
          sessionId: req.sessionID || null,
          userAgent: req.headers['user-agent'] || null
        }
      }
    };

    // Save to Firebase using REST API
    try {
      console.log('💾 Saving to Firebase via REST API...');
      
      const firebaseRestUrl = `${FIREBASE_URL}/testCases.json`;
      
      const firebaseResponse = await axios.post(firebaseRestUrl, responseWithMetadata, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });

      const docId = firebaseResponse.data.name; // Firebase returns generated key in 'name'
      console.log('✅ Firebase save successful via REST, ID:', docId);
      console.log('👤 Created by user:', user ? user.email : 'anonymous');
      
      // Also save to user-specific collection if user exists
      if (user && user.email) {
        try {
          console.log('💾 Saving to user-specific collection...');
          const userSpecificUrl = `${FIREBASE_URL}/users/${encodeURIComponent(user.email)}/testCases/${docId}.json`;
          
          const userSummary = {
            docId: docId,
            generatedAt: responseWithMetadata.metadata.generatedAt,
            requirementsLength: requirements.length,
            testCasesCount: testCasesJson.testCases.length,
            summary: testCasesJson.summary,
            userEmail: user.email,
            title: requirements.substring(0, 100) + (requirements.length > 100 ? '...' : '')
          };
          
          await axios.put(userSpecificUrl, userSummary, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          });
          
          console.log('✅ User-specific record saved');
          responseWithMetadata.userRecordSaved = true;
          
        } catch (userSaveError) {
          console.error('⚠️ Failed to save user-specific record:', userSaveError.message);
          responseWithMetadata.userRecordSaved = false;
        }
      } else {
        console.log('⚠️ No user found in session, skipping user-specific save');
        responseWithMetadata.userRecordSaved = false;
      }
      
      responseWithMetadata.firebaseDocId = docId;
      responseWithMetadata.firebaseSuccess = true;
      
    } catch (firebaseError) {
      console.error('❌ Firebase REST save failed:', firebaseError.message);
      responseWithMetadata.firebaseError = firebaseError.message;
      responseWithMetadata.firebaseSuccess = false;
    }

    console.log('📤 Sending response');
    res.json(responseWithMetadata);

  } catch (error) {
    console.error('❌ Main error:', error.message);
    
    if (error.response) {
      res.status(500).json({ 
        error: 'AI service error', 
        details: error.response.data,
        status: error.response.status
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message
      });
    }
  }
});

// Debug endpoint to check session
router.get('/debug-session', (req, res) => {
  res.json({
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    sessionId: req.sessionID || null,
    session: req.session || null,
    user: req.session?.user || null,
    headers: {
      cookie: req.headers.cookie || null,
      'user-agent': req.headers['user-agent'] || null,
      authorization: req.headers.authorization || null
    }
  });
});

// Test Firebase REST API
router.get('/test-firebase-rest', async (req, res) => {
  try {
    const testData = {
      message: 'REST API test',
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(`${FIREBASE_URL}/test.json`, testData, {
      timeout: 5000
    });

    res.json({
      success: true,
      message: 'Firebase REST API working',
      firebaseResponse: response.data
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Get test cases for a specific user by email
router.get('/test-cases/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { limit = 10 } = req.query;
    
    console.log(`🔍 Fetching test cases for user: ${userEmail}`);
    
    const userTestCasesUrl = `${FIREBASE_URL}/users/${encodeURIComponent(userEmail)}/testCases.json?limitToLast=${limit}&orderBy="$key"`;
    
    const response = await axios.get(userTestCasesUrl, {
      timeout: 5000
    });

    const userTestCases = [];
    if (response.data) {
      Object.keys(response.data).forEach(key => {
        userTestCases.push({
          id: key,
          ...response.data[key]
        });
      });
    }
    
    res.json({
      testCases: userTestCases.reverse(), // Newest first
      count: userTestCases.length,
      userEmail: userEmail
    });
    
  } catch (error) {
    console.error('❌ Error fetching user test cases:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch test cases',
      details: error.message
    });
  }
});

// Get full test case details by ID
router.get('/test-case/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    
    console.log(`🔍 Fetching full test case: ${docId}`);
    
    const testCaseUrl = `${FIREBASE_URL}/testCases/${docId}.json`;
    
    const response = await axios.get(testCaseUrl, {
      timeout: 5000
    });
    
    if (!response.data) {
      return res.status(404).json({ error: 'Test case not found' });
    }
    
    res.json({
      id: docId,
      ...response.data
    });
    
  } catch (error) {
    console.error('❌ Error fetching test case:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch test case',
      details: error.message
    });
  }
});

// Get all test cases (with optional filter by user email)
router.get('/all-test-cases', async (req, res) => {
  try {
    const { userEmail, limit = 20 } = req.query;
    
    console.log('🔍 Fetching all test cases', userEmail ? `for user: ${userEmail}` : '');
    
    let testCasesUrl = `${FIREBASE_URL}/testCases.json?limitToLast=${limit}&orderBy="$key"`;
    
    // If filtering by user email
    if (userEmail) {
      testCasesUrl = `${FIREBASE_URL}/testCases.json?orderBy="metadata/userEmail"&equalTo="${userEmail}"&limitToLast=${limit}`;
    }
    
    const response = await axios.get(testCasesUrl, {
      timeout: 10000
    });
    
    const testCases = [];
    if (response.data) {
      Object.keys(response.data).forEach(key => {
        testCases.push({
          id: key,
          ...response.data[key]
        });
      });
    }
    
    res.json({
      testCases: testCases.reverse(), // Newest first
      count: testCases.length,
      filter: userEmail ? { userEmail } : 'all'
    });
    
  } catch (error) {
    console.error('❌ Error fetching all test cases:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch test cases',
      details: error.message
    });
  }
});

module.exports = router;
