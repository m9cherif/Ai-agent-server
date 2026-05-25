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

    if(!msg){
      return res.json({
        error: "No message"
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({

          model: "mistralai/mistral-7b-instruct",

          max_tokens: 100,

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

    if(data.error){
      return res.json({
        error: data.error.message
      });
    }

    if(!data.choices){
      return res.json({
        error: "No AI response"
      });
    }

    const text = data.choices[0].message.content;

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
