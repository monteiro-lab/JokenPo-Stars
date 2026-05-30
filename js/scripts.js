const app = {
    state: {
        name: '',
        score: { user: 0, ai: 0 },
        round: 1,
        history: [],
        isThinking: false
    },

    // dicionário visual de ícones
    icons: {
        pedra: 'aperture',
        papel: 'file-text',
        tesoura: 'scissors',
        waiting: 'cpu',
        thinking: 'loader'
    },

    init() {
        feather.replace();
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('user-name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });
        
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', () => this.play(btn.dataset.move));
        });
    },

    startGame() {
        const input = document.getElementById('user-name-input');
        if (!input.value.trim()) return; 
        
        this.state.name = input.value.trim();
        document.getElementById('user-display-name').textContent = this.state.name;
        document.getElementById('user-avatar').textContent = this.state.name[0].toUpperCase();
        
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('game-container').style.position = 'relative';
    },

    async play(userMove) {
        if (this.state.isThinking) return;
        this.setThinking(true);

        this.updateSlot('user', userMove);
        
        try {
            const res = await fetch('/api/ai-move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: this.state.history,
                    score: this.state.score,
                    round: this.state.round,
                    name: this.state.name
                })
            });
            
            if (!res.ok) throw new Error('erro na rede');
            const data = await res.json();
            
            // evita ataques maliciosos
            const safeAiMove = data.move.toLowerCase().trim();
            
            this.resolveRound(userMove, safeAiMove, data.reaction);
        } catch (e) {
            console.error(e);
            const fallbacks = ['pedra', 'papel', 'tesoura'];
            const randomMove = fallbacks[Math.floor(Math.random() * 3)];
            this.resolveRound(userMove, randomMove, 'Minha conexão piscou, mas lancei no escuro!');
        }
    },

    setThinking(status) {
        this.state.isThinking = status;
        const aiSlot = document.getElementById('ai-move-slot');
        
        // bloqueia os botões
        document.querySelectorAll('.move-btn').forEach(b => b.disabled = status);
        
        // status = TRUE
        // cálculo de IA em andamento
        if(status) {
            aiSlot.innerHTML = `<i data-feather="loader"></i>`;
            document.getElementById('status-msg').textContent = 'A máquina está calculando...';
            document.getElementById('ai-bubble').classList.add('hidden');
            feather.replace();
            aiSlot.querySelector('svg').classList.add('spin');
        }
    },

    updateSlot(player, move) {
        const slot = document.getElementById(`${player}-move-slot`);
        slot.innerHTML = `<i data-feather="${this.icons[move]}"></i>`;
        feather.replace();
    },

    getResult(user, ai) {
        if (user === ai) return 'empate';
        if (
            (user === 'pedra' && ai === 'tesoura') ||
            (user === 'papel' && ai === 'pedra') ||
            (user === 'tesoura' && ai === 'papel')
        ) return 'vitoria';
        
        return 'derrota';
    },

    resolveRound(userMove, aiMove, reaction) {
        // 1. Atualiza o ícone da IA com a jogada verdadeira
        this.updateSlot('ai', aiMove);
        this.showReaction(reaction);

        const result = this.getResult(userMove, aiMove);

        if (result === 'vitoria') this.state.score.user++;
        if (result === 'derrota') this.state.score.ai++;
        this.state.history.push(userMove);
        this.state.round++;
        
        this.updateUI(result);
        
        // aguarda o fim do cálculo
        this.setThinking(false);
    },

    showReaction(text) {
        const bubble = document.getElementById('ai-bubble');
        bubble.textContent = text;
        bubble.classList.remove('hidden');
    },

    updateUI(result) {
        document.getElementById('score-user').textContent = this.state.score.user;
        document.getElementById('score-ai').textContent = this.state.score.ai;
        document.getElementById('round-text').textContent = `Round ${this.state.round}`;
        
        const msgs = { 
            vitoria: 'Ponto para você!', 
            derrota: 'A máquina pontuou!', 
            empate: 'Empate técnico!' 
        };
        document.getElementById('status-msg').textContent = msgs[result];
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());