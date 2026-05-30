require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MOVES = ['pedra', 'papel', 'tesoura'];

app.post('/api/ai-move', async (req, res) => {
  const { history = [], score = {user: 0, ai: 0}, round = 1, name = 'Humano' } = req.body;

  try {
    // para a requisição caso a ia demore mais de 5 segundos
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
          content: `round: ${round}. placar: IA ${score.ai} x ${score.user} ${name}. histórico recente do ${name}: [${history.slice(-5).join(', ')}]. analise o padrão, preveja a jogada dele e escolha a sua para vencer. retorne estritamente um JSON: {"move": "pedra|papel|tesoura", "reaction": "frase curta e irônica"}`
        }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    // garante que a ia não alucinou
    if(!MOVES.includes(content.move)) throw new Error('movimento inválido fora do schema');
    
    res.json(content);
  } catch (error) {
    // fallback seguro mantendo o jogo rodando
    console.error('erro na ia, usando fallback:', error.message);
    res.json({ move: MOVES[Math.floor(Math.random()*3)], reaction: "minha conexão falhou, mas joguei no escuro pra ganhar!" });
  }
});

// const port = process.env.PORT || 3000;
// app.listen(port, () => console.log(`backend proxy rodando na porta ${port}`));

module.exports = app;