const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-pro",
});

let memory = [];

app.get("/", (req, res) => {
  res.json({
    status: "AI Agent Running"
  });
});

app.post("/chat", async (req, res) => {

  try {

    const msg = req.body.message;

    memory.push({
      user: msg
    });

    const prompt = `
    You are a smart AI Agent.

    Memory:
    ${JSON.stringify(memory)}

    User:
    ${msg}
    `;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response.text();

    memory.push({
      ai: text
    });

    res.json({
      response: text
    });

  } catch(err){

    res.json({
      error: err.message
    });

  }

});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server Running");
});
