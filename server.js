const express = require("express");
const cors = require("cors");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-pro"
});

app.get("/", (req, res) => {
  res.json({
    status: "AI Agent Running"
  });
});

app.post("/chat", async (req, res) => {

  try {

    console.log(req.body);

    const msg = req.body.message;

    if (!msg) {
      return res.json({
        error: "No message"
      });
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: msg
            }
          ]
        }
      ]
    });

    const text =
      result.response.candidates[0]
      .content.parts[0]
      .text;

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
