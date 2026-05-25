const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";

console.log("=== AI Agent Server Starting ===");
console.log("Node version:", process.version);
console.log("Ollama URL:", OLLAMA_URL);
console.log("Ollama Model:", OLLAMA_MODEL);
console.log("Port:", process.env.PORT || 3000);
console.log("==================================\n");

app.get("/", (req, res) => {
  res.json({
    status: "AI Agent Running",
    mode: "Ollama (No API Key Required)",
    nodeVersion: process.version,
    ollamaUrl: OLLAMA_URL,
    ollamaModel: OLLAMA_MODEL
  });
});

// Test Ollama connectivity
app.get("/test-connection", async (req, res) => {
  console.log("\n>>> Testing connectivity to Ollama...");
  
  try {
    const testUrl = `${OLLAMA_URL}/api/tags`;
    console.log("Testing URL:", testUrl);
    
    const response = await fetch(testUrl, {
      method: "GET",
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✓ Ollama connection successful");
    
    return res.json({
      status: "ok",
      message: "Successfully connected to Ollama",
      httpStatus: response.status,
      availableModels: data.models ? data.models.map(m => m.name) : []
    });
    
  } catch (err) {
    console.error("✗ Ollama connection failed");
    console.error("Error:", err.message);
    
    return res.json({
      status: "error",
      message: "Cannot connect to Ollama",
      errorMessage: err.message,
      troubleshooting: {
        step1: "Make sure Ollama is installed from https://ollama.ai",
        step2: "Run 'ollama serve' in a terminal to start the Ollama server",
        step3: "Run 'ollama pull mistral' to download a model (or use 'ollama pull neural-chat', 'ollama pull llama2', etc)",
        step4: "Verify Ollama is running on localhost:11434 (or set OLLAMA_URL environment variable)"
      }
    });
  }
});

// Get available models
app.get("/models", async (req, res) => {
  console.log("\n>>> Fetching available models from Ollama...");
  
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: "GET",
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const models = data.models ? data.models.map(m => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at
    })) : [];

    console.log("Available models:", models.map(m => m.name));
    
    res.json({
      status: "ok",
      models: models,
      currentModel: OLLAMA_MODEL
    });
    
  } catch (err) {
    console.error("Error fetching models:", err.message);
    res.json({
      error: "Failed to fetch models",
      message: err.message
    });
  }
});

app.post("/chat", async (req, res) => {

  try {

    const msg = req.body.message;

    if (!msg) {
      return res.json({
        error: "No message provided"
      });
    }

    console.log("\n>>> New Chat Request");
    console.log("Message:", msg.substring(0, 100) + (msg.length > 100 ? "..." : ""));
    console.log("Using model:", OLLAMA_MODEL);

    const ollamaUrl = `${OLLAMA_URL}/api/generate`;
    
    console.log("Sending request to:", ollamaUrl);

    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: msg,
        stream: false,
        options: {
          temperature: 0.7,
          top_k: 40,
          top_p: 0.9
        }
      }),
      timeout: 120000 // 2 minute timeout for longer responses
    });

    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API returned error status:", response.status);
      console.error("Error response:", errorText);
      return res.json({
        error: `Ollama Error ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    console.log("Response received");

    if (!data.response) {
      console.error("Unexpected response format:", data);
      return res.json({
        error: "No response from model",
        receivedData: data
      });
    }

    const text = data.response.trim();

    console.log("Generated response length:", text.length);
    console.log("✓ Request successful\n");

    res.json({
      response: text,
      model: data.model,
      totalDuration: data.total_duration,
      loadDuration: data.load_duration,
      promptEvalDuration: data.prompt_eval_duration,
      evalDuration: data.eval_duration
    });

  } catch (err) {

    console.error("\n!!! ERROR !!!");
    console.error("Message:", err.message);
    console.error("Name:", err.name);
    console.error("Code:", err.code);

    let errorMessage = err.message;

    if (err.code === "ECONNREFUSED") {
      errorMessage = `Cannot connect to Ollama at ${OLLAMA_URL}. Make sure Ollama is running (ollama serve)`;
    } else if (err.code === "ENOTFOUND") {
      errorMessage = `Cannot resolve Ollama host. Check OLLAMA_URL environment variable`;
    } else if (err.name === "AbortError") {
      errorMessage = "Request timeout - model took too long to respond";
    }

    res.json({
      error: errorMessage,
      errorName: err.name,
      errorCode: err.code
    });

  }

});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mode: "Ollama (No API Key)",
    nodeVersion: process.version,
    ollamaUrl: OLLAMA_URL
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✓ Server Running on http://localhost:${PORT}`);
  console.log(`✓ Home: GET /`);
  console.log(`✓ Health check: GET /health`);
  console.log(`✓ Test Ollama: GET /test-connection`);
  console.log(`✓ List models: GET /models`);
  console.log(`✓ Chat: POST /chat with {"message": "your message"}\n`);
});
