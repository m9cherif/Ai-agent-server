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
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: msg
        })
      }
    );

    const data = await response.json();

    console.log(data);

    if(data.error){
      return res.json({
        error: data.error
      });
    }

    if(!Array.isArray(data) || !data[0]){
      return res.json({
        error: "No AI response"
      });
    }

    const text = data[0].generated_text;

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
