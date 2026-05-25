const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "AI Agent Running"
  });
});

app.post("/chat", async (req, res) => {

  try {

    const msg = req.body.message;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization":
            "Bearer " + process.env.API_KEY,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          model:
            "meta-llama/llama-3-8b-instruct:free",

          max_tokens: 200,

          messages: [
            {
              role: "user",
              content: msg
            }
          ]

        })

      }
    );

    const data = await response.json();

    console.log(data);

    const text =
      data.choices[0].message.content;

    res.json({
      response: text
    });

  } catch(err){

    console.log(err);

    res.json({
      error: err.message
    });

  }

});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server Running");
});
