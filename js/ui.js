window.GameUI = {
    init() {
        document.getElementById('btn-to-dictionary').addEventListener('click', () => this.showDictionary());
        document.getElementById('btn-dict-back').addEventListener('click', () => this.showHome());
        
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active'); // e.currentTargetに変更
                this.renderDictionary(e.currentTarget.dataset.tab);
            });
        });

        this.updateHomeStats();
    },

    showHome() {
        this.updateHomeStats();
        this.showScreen('screen-home');
    },

    updateHomeStats() {
        document.getElementById('player-rank').innerText = window.GameStateManager.saveData.rank;
        document.getElementById('ep-display').innerText = window.GameStateManager.saveData.ep;
    },

    showDictionary() {
        this.renderDictionary('all');
        this.showScreen('screen-dictionary');
    },

    renderDictionary(filterType = 'all') {
        const listContainer = document.getElementById('dict-list');
        listContainer.innerHTML = '';

        const db = window.GameStateManager.wordDatabase;
        const saveState = window.GameStateManager.saveData.words;

        db.forEach(word => {
            const progress = saveState[word.id] || { status: 'none', correct_count: 0, incorrect_count: 0, is_favorite: false };

            if (filterType === 'mastered' && progress.status !== 'mastered') return;
            if (filterType === 'favorite' && !progress.is_favorite) return;

            const card = document.createElement('div');
            card.className = `dict-card state-${progress.status} attr-${word.attr}`;
            
            const isClickableVoice = progress.status !== 'none';
            const voiceIcon = isClickableVoice ? '🔊' : '🔒';

            card.innerHTML = `
                <button class="fav-btn ${progress.is_favorite ? 'active' : ''}" data-id="${word.id}">★</button>
                <div class="card-sprite">${word.sprite}</div>
                <div class="card-word">${word.word}</div>
                <div class="card-meaning">${progress.status === 'none' ? '？？？' : word.meaning}</div>
                <div class="card-stats">正解: ${progress.correct_count} / 不正解: ${progress.incorrect_count}</div>
                
                <div class="card-detail">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>発音: <button class="speak-btn" ${isClickableVoice ? '' : 'disabled'}>${voiceIcon}</button></span>
                        <span style="font-size:9px; color:#f1c40f;">${word.part_of_speech}</span>
                    </div>
                    <div class="card-phrase-info" style="margin-top:5px;">
                        <strong>Phrase:</strong><br>${word.phrase_mask}<br>
                        <strong>訳:</strong> ${word.phrase_meaning}
                    </div>
                    <div class="card-etymology-info" style="margin-top:5px; color:#888;">
                        ${word.etymology}
                    </div>
                </div>
            `;

            // イベント追加
            const favBtn = card.querySelector('.fav-btn');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.GameStateManager.toggleFavorite(word.id);
                this.renderDictionary(filterType);
            });

            const speakBtn = card.querySelector('.speak-btn');
            if (speakBtn && isClickableVoice) {
                speakBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.speakWord(word.word);
                });
            }

            listContainer.appendChild(card);
        });
    },

    speakWord(word) {
        if ('speechSynthesis' in window) {
            // 前の発音をキャンセルして連打時のお詰まりを防止
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("このブラウザは音声合成に対応していません");
        }
    },

    renderBattleParty() {
        const partyContainer = document.getElementById('battle-party');
        partyContainer.innerHTML = '';

        const db = window.GameStateManager.wordDatabase;
        const saveState = window.GameStateManager.saveData.words;

        let renderedCount = 0;
        db.forEach(word => {
            const progress = saveState[word.id];
            if (progress && progress.status === 'mastered') {
                const member = document.createElement('div');
                member.className = `party-member char-${word.attr}`;
                member.innerText = word.word.substring(0, 3).toUpperCase();
                partyContainer.appendChild(member);
                renderedCount++;
            }
        });

        if (renderedCount === 0) {
            partyContainer.innerHTML = `
                <div class="party-member char-fire">火妖精</div>
                <div class="party-member char-water">水妖精</div>
                <div class="party-member char-wood">木妖精</div>
            `;
        }
    }
};
