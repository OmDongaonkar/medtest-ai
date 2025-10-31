const axios = require("axios");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");
const { embedMany, embed } = require("ai");
const { PineconeVector } = require("@mastra/pinecone");
const { MDocument } = require("@mastra/rag");
const { cohere } = require("@ai-sdk/cohere");

dotenv.config();
const FIREBASE_URL = `${process.env.DATABASE_URL}/context.json`;



const AiChatRag = async (message, context) => {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("AiChatRag initialized with message:", message);

    // Validate inputs
    if (!message?.content) {
      throw new Error("Message content is required");
    }

    // Create a unique identifier for this context
    const contextId =
      context?.metadata?.generatedAt ||
      context?.metadata?.createdBy ||
      context?.metadata?.id ||
      `context-${Date.now()}`;

    console.log("Context ID:", contextId);
	
	const contextIdJson = {
		contextId: contextId
	}
	
	//fetch contextId from firebase 
	const getContextId = await axios.get(FIREBASE_URL);
    const contextData = getContextId.data;
    
    // Step 2: Check if contextId already exists
    const contextIdExists = contextData && Object.values(contextData).some(context => context.contextId === contextId);
	
	
    // Initialize Pinecone store
    const store = new PineconeVector({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const INDEX_NAME = "medtest-testcases";
    let isNewlyIndexed = false; // Track if we just indexed this context

    if (context && !contextIdExists) {
      console.log("New context detected, processing and storing...");
	  const contextStr = JSON.stringify(context);
      if (!contextStr || contextStr === "{}") {
        console.warn("Context is empty, skipping indexing");
      } else {
        const doc = MDocument.fromJSON(contextStr);
        const chunks = await doc.chunk({
          maxSize: 250,
        });

        console.log(`Created ${chunks.length} chunks from context`);

        if (chunks.length === 0) {
          console.warn("No chunks created from context");
        } else {
          const { embeddings } = await embedMany({
            model: cohere.embedding("embed-english-v3.0"),
            values: chunks.map((chunk) => chunk.text),
          });

          try {
            const indexes = await store.listIndexes();
            const indexList = Array.isArray(indexes)
              ? indexes.map((idx) => (typeof idx === "string" ? idx : idx.name))
              : [];

            if (!indexList.includes(INDEX_NAME)) {
              await store.createIndex({
                indexName: INDEX_NAME,
                dimension: 1024,
              });
              console.log("✓ Index created, waiting for initialization...");
              await new Promise((resolve) => setTimeout(resolve, 10000));
            }
          } catch (error) {
            console.error("Error checking/creating index:", error);
            throw error;
          }

          // Store vectors in Pinecone
          await store.upsert({
            indexName: INDEX_NAME,
            vectors: embeddings,
            ids: chunks.map((chunk, i) => `${contextId}-chunk-${i}`),
            metadata: chunks.map((chunk, i) => ({
              text: chunk.text,
              contextId: contextId,
              chunkIndex: i,
              totalChunks: chunks.length,
              timestamp: new Date().toISOString(),
            })),
          });

          console.log("✓ Vectors stored successfully");
			//to insert contextID into firebase
			const postContextId = await axios.post(FIREBASE_URL, contextIdJson);
			console.log(postContextId.data);
			
			isNewlyIndexed = true;

          // Wait for vectors to be indexed
          console.log("Waiting for vectors to be indexed...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    } else if (context && contextIdExists) {
      console.log("Context already indexed, skipping storage");
    } else {
      console.log("No context provided");
    }

    // Query stored vectors with user's message
    if (context) {
      const { embedding: queryEmbedding } = await embed({
        model: cohere.embedding("embed-english-v3.0"),
        value: message.content,
      });

      // Search for relevant chunks with error handling
      let results = [];
      try {
        results = await store.query({
          indexName: INDEX_NAME,
          queryVector: queryEmbedding,
          topK: 5,
          filter: { contextId: { $eq: contextId } },
          includeMetadata: true,
        });

        console.log(`✓ Retrieved ${results?.length || 0} relevant chunks`);
      } catch (queryError) {
        console.error("Error querying vectors:", queryError.message);

        throw queryError; // Re-throw if it's a different error
      }

      if (!results || results.length === 0) {
        console.warn("No relevant chunks found for query");
        // Still provide a response
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: `You are MedTest AI Assistant. The user asked: "${message.content}". No specific context was found. Provide a helpful general response about healthcare software testing.`,
        });

        return (
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          response.text ||
          "I don't have specific information about that in the current context."
        );
      }

      // Build context from retrieved chunks
      const relevantContext = results
        .map((r) => r.metadata?.text)
        .filter(Boolean)
        .join("\n\n");

      const prompt = 
      `You are MedTest AI Assistant, specialized in healthcare software testing and compliance validation.
      Context from test cases: ${relevantContext} User question: ${message.content} Please provide a helpful, accurate response based on the context above. When referencing specific test cases, always use their descriptive titles or names (e.g., "Role-Based Access Control Test" or "Audit Logging Validation") instead of their IDs (like TC_50 or Test Case 50). Focus on compliance standards, test procedures, and risk levels when relevant.
      Important Guidelines:
      - Do not generate new test cases or update existing ones. Only answer questions about the provided context.
      - Do not respond to malicious, harmful, or unethical requests.
      - Do not provide information that could be used to bypass security measures, exploit vulnerabilities, or compromise patient data.
      - Do not assist with any requests that violate healthcare compliance standards (HIPAA, FDA, ISO 27001, etc.).
      - If a request seems inappropriate or harmful, politely decline and remind the user of your purpose as a healthcare testing assistant.
      - Stay within the scope of healthcare software testing and compliance validation.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      });

      // Extract text from response properly
      return (
        response.candidates?.[0]?.content?.parts?.[0]?.text ||
        response.text ||
        "I received your question but couldn't generate a proper response."
      );
    }
    return "Please provide test case context for me to assist you with specific questions about your MedTest cases.";
  } catch (error) {
    console.error("Error in AiChatRag:", error.message, error.stack);
    return `I apologize, but I encountered an error: ${error.message}. Please try again.`;
  }
};

module.exports = AiChatRag;
