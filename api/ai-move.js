const MOVES = ['pedra', 'papel', 'tesoura'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { history = [], score = {user: 0, ai: 0}, round = 1, name = 'Humano' } = req.body;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de limite

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


    if (data.error) throw new Error(data.error.message);

    const content = JSON.parse(data.choices[0].message.content);
    

    if (!MOVES.includes(content.move)) throw new Error('movimento inválido retornado');
    
    return res.status(200).json(content);
    
  } catch (error) {
    console.error('Erro no processamento da IA:', error.message);
    
  
    return res.status(200).json({ 
      move: MOVES[Math.floor(Math.random() * 3)], 
      reaction: "Meus circuitos falharam, mas joguei no escuro!" 
    });
  }
}