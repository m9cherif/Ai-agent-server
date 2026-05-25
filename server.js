const express = require("express");
const cors = require("cors");

// Use node-fetch if native fetch is not available (Node < 18)
let fetchFn;
try {
  fetchFn = fetch; // Try native fetch first
} catch (e) {
  console.log("Native fetch not available, using node-fetch");
  fetchFn = require("node-fetch");
}

const app = express();

app.use(cors());
app.use(express.json());

console.log("=== Server Starting ===");
console.log("Node version:", process.version);
console.log("Using fetch:", fetchFn === fetch ? "native" : "node-fetch");
console.log("Environment API_KEY set:", !!process.env.API_KEY);
console.log("Port:", process.env.PORT || 3000);
console.log("====================\n");

app.get("/", (req, res) => {
  res.json({
    status: "AI Agent Running",
    nodeVersion: process.version
  });
});

app.post("/chat", async (req, res) => {

  try {

    const msg = req.body.message;

    if(!msg){
      return res.json({
        error: "No message provided"
      });
    }

    if (!process.env.API_KEY) {
      console.error("CRITICAL: API_KEY environment variable is not set!");
      return res.json({
        error: "Server configuration error: API_KEY not set"
      });
    }

    console.log("\n>>> New Chat Request");
    console.log("Message:", msg.substring(0, 50) + (msg.length > 50 ? "..." : ""));

    const apiUrl = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";
    
    console.log("Sending request to:", apiUrl);
    console.log("Using fetch:", fetchFn === fetch ? "native" : "node-fetch");

    const fetchOptions = {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: msg
      }),
      timeout: 30000 // 30 second timeout
    };

    console.log("Request headers (sanitized):", {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (process.env.API_KEY ? "***" : "NOT SET")
    });

    let response;
    try {
      response = await fetchFn(apiUrl, fetchOptions);
    } catch (fetchErr) {
      console.error("Fetch network error:", fetchErr.message);
      console.error("Error code:", fetchErr.code);
      console.error("Error type:", fetchErr.constructor.name);
      
      // Detailed network diagnostics
      if (fetchErr.code === "ENOTFOUND") {
        return res.json({
          error: "DNS resolution failed - cannot reach api-inference.huggingface.co",
          details: "Check your internet connection or firewall settings"
        });
      } else if (fetchErr.code === "ECONNREFUSED") {
        return res.json({
          error: "Connection refused - server may be down",
          details: fetchErr.message
        });
      } else if (fetchErr.code === "ETIMEDOUT") {
        return res.json({
          error: "Request timeout - server took too long to respond",
          details: fetchErr.message
        });
      } else {
        return res.json({
          error: `Network error: ${fetchErr.message}`,
          code: fetchErr.code
        });
      }
    }

    console.log("Response status:", response.status, response.statusText);

    // Check if response is OK before parsing
    if (!response.ok) {
      console.error("API returned error status:", response.status);
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error("Error response:", errorData);
      return res.json({
        error: `API Error ${response.status}: ${JSON.stringify(errorData)}`
      });
    }

    const data = await response.json();

    console.log("Response data received:", Array.isArray(data) ? `Array with ${data.length} items` : typeof data);

    if(data.error){
      console.error("API returned error field:", data.error);
      return res.json({
        error: data.error
      });
    }

    if(!Array.isArray(data) || !data[0]){
      console.error("Unexpected response format:", data);
      return res.json({
        error: "No AI response - unexpected response format"
      });
    }

    const text = data[0].generated_text;

    console.log("Generated text length:", text.length);
    console.log("✓ Request successful\n");

    res.json({
      response: text
    });

  } catch(err){

    console.error("\n!!! CATCH BLOCK ERROR !!!");
    console.error("Error message:", err.message);
    console.error("Error type:", err.constructor.name);
    console.error("Error stack:", err.stack);

    res.json({
      error: `Request failed: ${err.message}`,
      errorType: err.constructor.name
    });

  }

});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKeySet: !!process.env.API_KEY
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server Running on http://localhost:${PORT}`);
  console.log(`✓ Health check: GET /health`);
  console.log(`✓ Chat endpoint: POST /chat with {"message": "your message"}`);
});
