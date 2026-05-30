require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); 

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const MOVES = ['pedra', 'papel', 'tesoura'];

app.post('/api/ai-move', async (req, res) => {
  const { history = [], score = {user: 0, ai: 0}, round = 1, name = 'Humano' } = req.body;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: `você é uma IA provocativa e sarcástica jogando jokenpô contra ${name}.`
        }, {
          role: 'user',
          content: `round: ${round}. placar: IA ${score.ai} x ${score.user} ${name}. histórico: [${history.slice(-5).join(', ')}]. preveja a jogada e escolha a sua para vencer. retorne JSON: {"move": "pedra|papel|tesoura", "reaction": "provocação"}`
        }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    if(!MOVES.includes(content.move)) throw new Error('movimento inválido');
    
    res.json(content);
  } catch (error) {
    console.error('erro:', error.message);
    res.json({ move: MOVES[Math.floor(Math.random()*3)], reaction: "minha conexão falhou, joguei no escuro!" });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


module.exports = app;