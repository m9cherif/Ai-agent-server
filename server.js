const express = require("express");
const cors = require("cors");
const https = require("https");
const http = require("http");

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

// Test connectivity endpoint
app.get("/test-connection", async (req, res) => {
  console.log("\n>>> Testing connectivity to Hugging Face API...");
  
  try {
    const testUrl = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";
    console.log("Testing URL:", testUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetchFn(testUrl, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "Authorization": "Bearer test"
      }
    }).catch(err => {
      clearTimeout(timeoutId);
      throw err;
    });
    
    clearTimeout(timeoutId);
    
    console.log("✓ Connection test successful - status:", response.status);
    return res.json({
      status: "ok",
      message: "Successfully connected to Hugging Face API",
      httpStatus: response.status
    });
    
  } catch (err) {
    console.error("✗ Connection test failed");
    console.error("Error:", err.message);
    console.error("Error code:", err.code);
    console.error("Error name:", err.name);
    console.error("Full error:", err);
    
    return res.json({
      status: "error",
      message: "Cannot connect to Hugging Face API",
      errorMessage: err.message,
      errorCode: err.code,
      errorName: err.name,
      troubleshooting: {
        checkInternetConnection: "Verify you have internet access",
        checkFirewall: "Check if firewall/proxy is blocking api-inference.huggingface.co",
        checkDNS: "Try pinging api-inference.huggingface.co",
        checkAPIKey: "Verify API_KEY environment variable is set correctly"
      }
    });
  }
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
        error: "Server configuration error: API_KEY not set",
        hint: "Set the API_KEY environment variable with your Hugging Face API token"
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
        "Content-Type": "application/json",
        "User-Agent": "Node.js AI Agent"
      },
      body: JSON.stringify({
        inputs: msg
      })
    };

    // Add timeout handling
    if (fetchFn === fetch) {
      // Native fetch supports AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      fetchOptions.signal = controller.signal;
      
      var response;
      try {
        response = await fetchFn(apiUrl, fetchOptions);
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      // node-fetch also supports timeout option
      fetchOptions.timeout = 30000;
      response = await fetchFn(apiUrl, fetchOptions);
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
        error: `API Error ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();

    console.log("Response data received:", Array.isArray(data) ? `Array with ${data.length} items` : typeof data);

    if(data.error){
      console.error("API returned error field:", data.error);
      return res.json({
        error: "API Error",
        details: data.error
      });
    }

    if(!Array.isArray(data) || !data[0]){
      console.error("Unexpected response format:", data);
      return res.json({
        error: "No AI response - unexpected response format",
        receivedData: data
      });
    }

    const text = data[0].generated_text;

    console.log("Generated text length:", text.length);
    console.log("✓ Request successful\n");

    res.json({
      response: text
    });

  } catch(err){

    console.error("\n!!! ERROR !!!");
    console.error("Message:", err.message);
    console.error("Name:", err.name);
    console.error("Code:", err.code);
    console.error("Stack:", err.stack);

    // Provide detailed error info
    let errorResponse = {
      error: err.message,
      errorName: err.name,
      errorCode: err.code
    };

    // Specific error handling
    if (err.name === "AbortError" || err.code === "ABORT_ERR") {
      errorResponse.error = "Request timeout - took longer than 30 seconds";
    } else if (err.code === "ENOTFOUND") {
      errorResponse.error = "Cannot resolve api-inference.huggingface.co - DNS issue or no internet";
    } else if (err.code === "ECONNREFUSED") {
      errorResponse.error = "Connection refused - API server may be down";
    } else if (err.code === "ETIMEDOUT") {
      errorResponse.error = "Connection timeout";
    } else if (err.code === "ECONNRESET") {
      errorResponse.error = "Connection reset by server";
    }

    res.json(errorResponse);

  }

});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKeySet: !!process.env.API_KEY,
    nodeVersion: process.version
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server Running on http://localhost:${PORT}`);
  console.log(`✓ Health check: GET /health`);
  console.log(`✓ Test connectivity: GET /test-connection`);
  console.log(`✓ Chat endpoint: POST /chat with {"message": "your message"}`);
});
