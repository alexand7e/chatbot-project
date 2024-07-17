const path = require('path');
require("dotenv").config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY || "chave_api";
const genAI = new GoogleGenerativeAI(apiKey);


const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "Você é um assistente virtual capaz de responder dúvidas de alunos, principalmente a respeito de inteligência artificial.",
});

const generationConfig = {
  temperature: 0.15,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Armazena sessões de chat
const sessions = {};

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    const sessionId = req.body.sessionId || 'default';

    // Cria uma nova sessão se não existir
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        chatSession: model.startChat({
          generationConfig,
          history: [],
        }),
        history: [],
      };
    }

    const { chatSession, history } = sessions[sessionId];

    // Envia a mensagem do usuário e recebe a resposta
    const result = await chatSession.sendMessage(userMessage);

    // Atualiza o histórico da sessão
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'bot', content: result.response.text() });

    res.json({ response: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
