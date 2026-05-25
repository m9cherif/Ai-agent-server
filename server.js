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
        error: "No message provided"
      });
    }

    console.log("Sending request to Hugging Face API...");
    console.log("API Key present:", !!process.env.API_KEY);

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

    console.log("Response data:", data);

    if(data.error){
      return res.json({
        error: data.error
      });
    }

    if(!Array.isArray(data) || !data[0]){
      return res.json({
        error: "No AI response - unexpected response format"
      });
    }

    const text = data[0].generated_text;

    res.json({
      response: text
    });

  } catch(err){

    console.error("Catch block error:", err.message);
    console.error("Error stack:", err.stack);

    res.json({
      error: `Request failed: ${err.message}`
    });

  }

});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server Running on port ${process.env.PORT || 3000}`);
});
