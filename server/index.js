const {Configuration, OpenAIApi}  = require('openai');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.API_TOKEN, 
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());


app.get('/',async (req, res) => {
    res.status(200).send({
        message: 'Welcome to the OpenAI API',
    })
});



app.post('/',async (req,res) => {
    try {
        const prompt = req.body.prompt;
    
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `${prompt}`,
        temperature: 0,
        top_p : 1,
        frequency_penalty:0.5,
        presence_penalty : 0,
        max_tokens : 3000,
    });

    res.status(200).send({
        bot: response.data.choices[0].text
    })
    } catch (error) {
        console.log(error);
        res.status(500).send({error})
     }
})

app.listen(5000, () => {
    console.log('Server running on port http://localhost:5000');
})

