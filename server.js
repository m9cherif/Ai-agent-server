const express = require("express");
const cors = require("cors");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-pro",
});

app.get("/", (req, res) => {
  res.json({
    status: "AI Agent Running"
  });
});

app.post("/chat", async (req, res) => {

  try {

    const msg = req.body.message;

    const result = await model.generateContent(msg);

    const response = result.response;

    const text = response.text();

    res.json({
      response: text
    });

  } catch (err) {

    console.log(err);

    res.json({
      error: err.message
    });

  }

});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server Running");
});
