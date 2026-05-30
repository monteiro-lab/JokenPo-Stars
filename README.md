# <i data-feather="target"></i> Jokenpô Stars

Uma aplicação web moderna e gamificada do clássico "Pedra, Papel e Tesoura", onde o adversário é uma Inteligência Artificial real (LLM) que analisa o histórico do jogador para prever jogadas e gera provocações contextuais. 

O projeto adota uma arquitetura de proxy seguro com Node.js (Backend) e Vanilla JavaScript estruturado (Frontend), utilizando um design system baseado em Dark Analytics Dashboard e Feather Icons.

---

## <i data-feather="layers"></i> Estrutura de Diretórios

O projeto segue um padrão de organização focado em separação de responsabilidades (Frontend vs Backend/Configurações), otimizado para deploy em ambientes Serverless (como a Vercel).

```text
/
├── public/                 # Camada de Apresentação (Frontend)
│   ├── css/
│   │   └── styles.css      # Design system, glassmorphism e animações
│   ├── js/
│   │   └── scripts.js      # Lógica de estado, regras de negócio e chamadas de API
│   └── index.html          # Marcação semântica e acessibilidade (ARIA)
│
├── .env                    # Variáveis de ambiente (não versionado)
├── .gitignore              # Regras de exclusão do Git
├── package.json            # Dependências e metadados do projeto
├── server.js               # Proxy de segurança e comunicação com OpenAI
└── vercel.json             # Configuração de rotas para deploy Serverless
```

---

## <i data-feather="cpu"></i> Arquitetura do Sistema

A aplicação foi desenhada para garantir a segurança das credenciais (API Keys) e fornecer uma experiência de usuário reativa sem o uso de frameworks pesados.

1. **Frontend (Client):** Interface estática responsável por capturar o input do usuário e gerenciar o estado local da partida.
2. **Backend (Proxy):** Servidor intermediário (Express.js) que recebe o contexto do jogo (placar, rodada, histórico), assina a requisição com a chave da API e faz a ponte com a LLM.
3. **LLM (OpenAI):** Motor de processamento semântico que retorna a jogada calculada e a reação em um formato de dados estrito.

---

## <i data-feather="message-square"></i> Engenharia da IA e Organização de Resposta

O coração da aplicação não é baseado em heurística local ou `Math.random()`, mas em tomadas de decisão de uma IA.

### O Contexto (Prompt)
O backend constrói dinamicamente um prompt injetando o estado atual do jogo. A IA recebe:
* O nome do jogador.
* A rodada atual.
* O placar consolidado.
* Um array com as últimas 5 jogadas do usuário.

### Schema Estrito (JSON)
Para evitar que a IA quebre o frontend enviando texto livre, a requisição utiliza o parâmetro `response_format: { type: "json_object" }`. A LLM é instruída a devolver exatamente o seguinte contrato:

```json
{
  "move": "pedra",
  "reaction": "Achei que você tentaria papel para me enganar."
}
```

### Fallback de Segurança
Caso a OpenAI demore mais de 5 segundos para responder (Timeout) ou retorne um erro (como quebra de schema), o bloco `catch` do backend assume o controle imediatamente. Ele injeta uma resposta randômica no mesmo formato JSON e uma `reaction` relatando o erro de conexão, garantindo que a interface do usuário não congele.

---

## <i data-feather="layout"></i> Entrega da Lógica no Frontend

O frontend não utiliza React ou Vue, mas implementa um padrão de arquitetura baseado em Estado Centralizado.

### 1. Objeto de Estado (`state`)
Toda a memória do jogo reside em uma única fonte da verdade:

```javascript
state: {
    name: '',
    score: { user: 0, ai: 0 },
    round: 1,
    history: [],
    isThinking: false
}
```

### 2. O Ciclo de Requisição (`fetch`)
Quando o usuário escolhe uma jogada, a função `play()` é acionada:
* O estado `isThinking` é alterado para `true`.
* A UI exibe o ícone de carregamento e desabilita os botões.
* Um POST é enviado para `/api/ai-move` com o estado atual.

### 3. Resolução da Rodada (`resolveRound`)
Ao receber a resposta JSON da IA, o frontend:
* Avalia as regras clássicas do Jokenpô.
* Atualiza a pontuação e a rodada dentro do objeto `state`.
* Insere a jogada do usuário no `history`.
* Atualiza a interface gráfica com o ícone correspondente à jogada da IA, atualiza o placar e exibe o balão de fala da máquina.
* Altera `isThinking` para `false`, liberando a interface para a próxima rodada.

---

## <i data-feather="play-circle"></i> Como Executar

### Ambiente Local de Desenvolvimento
1. Clone o repositório.
2. Instale as dependências executando `npm install`.
3. Crie um arquivo `.env` na raiz e adicione sua chave: `OPENAI_API_KEY=sk-...`
4. Inicie o servidor local com `node server.js` (Ouvindo na porta 3000).
5. Sirva a pasta `/public` com um servidor HTTP local (como o Live Server) e acesse no navegador.

### Produção (Deploy na Vercel)
O projeto contém um `vercel.json` configurado.
1. Importe o repositório diretamente pelo painel da Vercel.
2. Na etapa de configuração, adicione a variável de ambiente `OPENAI_API_KEY`.
3. Clique em Deploy. As requisições de API serão roteadas automaticamente para as Serverless Functions da Vercel.