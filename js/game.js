window.GameController = {
    currentWave: 0,
    maxWave: 3,
    combo: 0,

    enemyHp: 100,
    enemyMaxHp: 100,
    enemyTurn: 3,
    enemyMaxTurn: 3,

    playerHp: 100,
    playerMaxHp: 100,

    enemyConfigs: [
        { name: "レッドスライム (火)", emoji: "👿", hp: 50, turn: 3 },
        { name: "アクアナイト (水)", emoji: "🛡️", hp: 80, turn: 2 },
        { name: "古代木霊獣 (BOSS)", emoji: "🦁", hp: 150, turn: 3 }
    ],

    currentQuizWord: null,
    quizTimer: null,
    quizTimeLeft: 7,

    init() {
        document.getElementById('btn-to-dungeon').addEventListener('click', () => this.startDungeon());
        document.getElementById('btn-start-battle').addEventListener('click', () => this.startBattlePhase());
        document.getElementById('btn-result-to-home').addEventListener('click', () => window.GameUI.showHome());

        const panels = document.querySelectorAll('.panel-btn');
        panels.forEach(panel => {
            panel.addEventListener('click', (e) => {
                const attr = e.currentTarget.dataset.attr; // e.currentTargetに変更
                this.triggerQuiz(attr);
            });
        });
    },

    startDungeon() {
        this.currentWave = 0;
        this.playerHp = this.playerMaxHp;
        this.updatePlayerHpBar();
        this.showScanPhase();
    }

    showScanPhase() {
        const scanList = document.getElementById('scan-list');
        scanList.innerHTML = '';

        const db = window.GameStateManager.wordDatabase;
        const startIdx = this.currentWave * 2;
        const waveWords = db.slice(startIdx, startIdx + 3);

        waveWords.forEach(word => {
            window.GameStateManager.encounterWord(word.id);

            const card = document.createElement('div');
            card.className = 'scan-card';
            card.innerHTML = `
                <h4>
                    <span>${word.word} <span style="font-size:11px; color:#aaa;">[${word.part_of_speech}]</span></span>
                    <button class="speak-btn">🔊</button>
                </h4>
                <p><strong>意味:</strong> ${word.meaning}</p>
                <p style="font-size:11px; color:#f1c40f; margin-top:2px;"><strong>Phrase:</strong> ${word.phrase_mask} (${word.phrase_meaning})</p>
                <p class="scan-etymology" style="font-size:11px; color:#888; margin-top:2px;">${word.etymology}</p>
            `;

            card.querySelector('.speak-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                window.GameUI.speakWord(word.word);
            });

            scanList.appendChild(card);
        });

        window.GameUI.showScreen('screen-scan');
    }

    startBattlePhase() {
        const config = this.enemyConfigs[this.currentWave];
        this.enemyHp = config.hp;
        this.enemyMaxHp = config.hp;
        this.enemyTurn = config.turn;
        this.enemyMaxTurn = config.turn;

        document.getElementById('stage-name').innerText = `基礎の森 (WAVE ${this.currentWave + 1}/${this.maxWave})`;
        document.getElementById('enemy-name').innerText = config.name;
        document.getElementById('enemy-sprite').innerText = config.emoji;
        
        this.updateEnemyHp();
        this.updateEnemyTurn();
        this.combo = 0;
        this.updateCombo();
        document.getElementById('battle-log').innerText = "攻撃したい属性のパネルを選択してください。";

        window.GameUI.renderBattleParty();
        window.GameUI.showScreen('screen-battle');
    }

    triggerQuiz(attr) {
        const db = window.GameStateManager.wordDatabase;
        const filtered = db.filter(x => x.attr === attr);
        if (filtered.length === 0) return;

        const wordObj = filtered[Math.floor(Math.random() * filtered.length)];
        this.currentQuizWord = wordObj;

        document.getElementById('normal-quiz-box').style.display = 'block';
        document.getElementById('chase-quiz-box').style.display = 'none';

        document.getElementById('quiz-genre').innerText = `属性: ${attr.toUpperCase()} (${wordObj.part_of_speech})`;
        document.getElementById('quiz-word').innerText = wordObj.word;

        const choices = [wordObj.meaning, ...wordObj.distractors].sort(() => Math.random() - 0.5);
        const choicesBox = document.getElementById('quiz-choices');
        choicesBox.innerHTML = '';

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice;
            btn.addEventListener('click', () => this.handleNormalAnswer(choice));
            choicesBox.appendChild(btn);
        });

        document.getElementById('quiz-overlay').style.display = 'flex';
        this.startTimer();
    }

    startTimer() {
        this.quizTimeLeft = 7;
        document.getElementById('quiz-timer').innerText = `⏱️ ${this.quizTimeLeft}s`;
        clearInterval(this.quizTimer);
        this.quizTimer = setInterval(() => {
            this.quizTimeLeft--;
            document.getElementById('quiz-timer').innerText = `⏱️ ${this.quizTimeLeft}s`;
            if (this.quizTimeLeft <= 0) {
                clearInterval(this.quizTimer);
                this.handleNormalAnswer("");
            }
        }, 1000);
    }

    handleNormalAnswer(selected) {
        clearInterval(this.quizTimer);
        const isCorrect = (selected === this.currentQuizWord.meaning);

        window.GameStateManager.recordResult(this.currentQuizWord.id, isCorrect);

        if (isCorrect) {
            this.combo++;
            this.updateCombo();
            
            setTimeout(() => {
                this.triggerChaseQuiz();
            }, 600);
        } else {
            this.combo = 0;
            this.updateCombo();
            document.getElementById('quiz-overlay').style.display = 'none';
            document.getElementById('battle-log').innerText = `ミス！正解は「${this.currentQuizWord.meaning}」`;
            
            this.endTurnProcess();
        }
    }

    triggerChaseQuiz() {
        const wordObj = this.currentQuizWord;
        document.getElementById('normal-quiz-box').style.display = 'none';
        document.getElementById('chase-quiz-box').style.display = 'block';

        document.getElementById('chase-phrase').innerText = wordObj.phrase_mask;
        document.getElementById('chase-phrase-jp').innerText = `(${wordObj.phrase_meaning})`;

        const choices = [wordObj.phrase_correct, ...wordObj.phrase_distractors].sort(() => Math.random() - 0.5);
        const choicesBox = document.getElementById('chase-choices');
        choicesBox.innerHTML = '';

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice;
            btn.addEventListener('click', () => this.handleChaseAnswer(choice));
            choicesBox.appendChild(btn);
        });
    }

    handleChaseAnswer(selected) {
        document.getElementById('quiz-overlay').style.display = 'none';
        const isCorrect = (selected === this.currentQuizWord.phrase_correct);

        let baseDmg = 30;
        let comboMult = 1 + (this.combo - 1) * 0.1;
        let finalDmg = Math.floor(baseDmg * comboMult);

        if (isCorrect) {
            finalDmg = Math.floor(finalDmg * 2.0);
            document.getElementById('battle-log').innerText = `⚡クリティカル追撃成功！⚡ ${finalDmg} ダメージ！`;
        } else {
            document.getElementById('battle-log').innerText = `通常攻撃成功！敵に ${finalDmg} ダメージ！`;
        }

        this.enemyHp -= finalDmg;
        if (this.enemyHp < 0) this.enemyHp = 0;
        this.updateEnemyHp();

        setTimeout(() => {
            if (this.enemyHp <= 0) {
                this.handleWaveClear();
            } else {
                this.endTurnProcess();
            }
        }, 1000);
    }

    endTurnProcess() {
        this.enemyTurn--;
        if (this.enemyTurn <= 0) {
            const dmg = 25;
            this.playerHp -= dmg;
            if (this.playerHp < 0) this.playerHp = 0;
            this.updatePlayerHpBar();

            document.getElementById('battle-log').innerText += ` 敵の反撃！${dmg}ダメージ！`;
            this.enemyTurn = this.enemyMaxTurn;

            if (this.playerHp <= 0) {
                setTimeout(() => {
                    alert("敗北しました。ホームに戻り、図鑑で苦手な単語を復習してください。");
                    window.GameUI.showHome();
                }, 1000);
                return;
            }
        }
        this.updateEnemyTurn();
    }

    handleWaveClear() {
        if (this.currentWave < this.maxWave - 1) {
            this.currentWave++;
            document.getElementById('battle-log').innerText = "敵を討伐！次のエネミーの弱点を解析します。";
            setTimeout(() => this.showScanPhase(), 1200);
        } else {
            window.GameUI.showScreen('screen-result');
        }
    }

    updateEnemyHp() {
        const pct = (this.enemyHp / this.enemyMaxHp) * 100;
        document.getElementById('enemy-hp').style.width = `${pct}%`;
    }

    updateEnemyTurn() {
        document.getElementById('enemy-turn').innerText = `あと ${this.enemyTurn} ターン`;
    }

    updatePlayerHpBar() {
        const pct = (this.playerHp / this.playerMaxHp) * 100;
        document.getElementById('player-hp').style.width = `${pct}%`;
        document.getElementById('player-hp-text-num').innerText = this.playerHp;
    }

    updateCombo() {
        document.getElementById('combo-display').innerText = `${this.combo} COMBO`;
    }
};

// 共通の画面表示切り替えメソッド
window.GameUI.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(screenId);
    if (target) {
        target.style.display = 'flex';
    } else {
        console.error(`Screen ID not found: ${screenId}`);
    }
};

// レースコンディションを完全に防止する堅牢なエントリーポイント設計
async function startApp() {
    try {
        await window.GameStateManager.loadDatabase();
        window.GameUI.init();
        window.GameController.init();
    } catch (error) {
        console.error("アプリケーションの起動中にエラーが発生しました:", error);
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
