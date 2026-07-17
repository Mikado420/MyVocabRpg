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
        const btnStartBattle = document.getElementById('btn-start-battle');
        if (btnStartBattle) {
            btnStartBattle.addEventListener('click', () => this.startBattlePhase());
        }

        const btnResToHome = document.getElementById('btn-result-to-home');
        if (btnResToHome) {
            btnResToHome.addEventListener('click', () => window.GameUI.showHome());
        }

        const panels = document.querySelectorAll('.panel-btn');
        panels.forEach(panel => {
            panel.addEventListener('click', (e) => {
                const attr = e.currentTarget.dataset.attr;
                this.triggerQuiz(attr);
            });
        });
    },

    startDungeon() {
        this.currentWave = 0;
        this.playerHp = this.playerMaxHp;
        this.updatePlayerHpBar();
        this.showScanPhase();
    },

    showScanPhase() {
        const scanList = document.getElementById('scan-list');
        if (!scanList) return;
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

        // スキャン画面オーバーレイを表示
        window.GameUI.showScreen('screen-scan');
    },

    startBattlePhase() {
        const config = this.enemyConfigs[this.currentWave];
        this.enemyHp = config.hp;
        this.enemyMaxHp = config.hp;
        this.enemyTurn = config.turn;
        this.enemyMaxTurn = config.turn;

        const stageNameEl = document.getElementById('stage-name');
        if (stageNameEl) stageNameEl.innerText = `基礎の森 (WAVE ${this.currentWave + 1}/${this.maxWave})`;

        const enemyNameEl = document.getElementById('enemy-name');
        if (enemyNameEl) enemyNameEl.innerText = config.name;

        const enemySpriteEl = document.getElementById('enemy-sprite');
        if (enemySpriteEl) enemySpriteEl.innerText = config.emoji;
        
        this.updateEnemyHp();
        this.updateEnemyTurn();
        this.combo = 0;
        this.updateCombo();

        const logEl = document.getElementById('battle-log');
        if (logEl) logEl.innerText = "攻撃したい属性のパネルを選択してください。";

        window.GameUI.renderBattleParty();
        window.GameUI.showScreen('screen-battle');
    },

    triggerQuiz(attr) {
        const db = window.GameStateManager.wordDatabase;
        const filtered = db.filter(x => x.attr === attr);
        if (filtered.length === 0) return;

        const wordObj = filtered[Math.floor(Math.random() * filtered.length)];
        this.currentQuizWord = wordObj;

        const normalBox = document.getElementById('normal-quiz-box');
        if (normalBox) normalBox.style.display = 'block';

        const chaseBox = document.getElementById('chase-quiz-box');
        if (chaseBox) chaseBox.style.display = 'none';

        const quizGenreEl = document.getElementById('quiz-genre');
        if (quizGenreEl) quizGenreEl.innerText = `属性: ${attr.toUpperCase()} (${wordObj.part_of_speech})`;

        const quizWordEl = document.getElementById('quiz-word');
        if (quizWordEl) quizWordEl.innerText = wordObj.word;

        const choices = [wordObj.meaning, ...wordObj.distractors].sort(() => Math.random() - 0.5);
        const choicesBox = document.getElementById('quiz-choices');
        if (!choicesBox) return;
        choicesBox.innerHTML = '';

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice;
            btn.addEventListener('click', () => this.handleNormalAnswer(choice));
            choicesBox.appendChild(btn);
        });

        const overlay = document.getElementById('quiz-overlay');
        if (overlay) overlay.style.display = 'flex';
        this.startTimer();
    },

    startTimer() {
        this.quizTimeLeft = 7;
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) timerEl.innerText = `⏱️ ${this.quizTimeLeft}s`;
        clearInterval(this.quizTimer);
        this.quizTimer = setInterval(() => {
            this.quizTimeLeft--;
            if (timerEl) timerEl.innerText = `⏱️ ${this.quizTimeLeft}s`;
            if (this.quizTimeLeft <= 0) {
                clearInterval(this.quizTimer);
                this.handleNormalAnswer("");
            }
        }, 1000);
    },

    handleNormalAnswer(selected) {
        clearInterval(this.quizTimer);
        const isCorrect = (selected === this.currentQuizWord.meaning);

        window.GameStateManager.recordResult(this.currentQuizWord.id, isCorrect);

        const logEl = document.getElementById('battle-log');

        if (isCorrect) {
            this.combo++;
            this.updateCombo();
            
            setTimeout(() => {
                this.triggerChaseQuiz();
            }, 600);
        } else {
            this.combo = 0;
            this.updateCombo();
            const overlay = document.getElementById('quiz-overlay');
            if (overlay) overlay.style.display = 'none';
            if (logEl) logEl.innerText = `ミス！正解は「${this.currentQuizWord.meaning}」`;
            
            this.endTurnProcess();
        }
    },

    triggerChaseQuiz() {
        const wordObj = this.currentQuizWord;
        const normalBox = document.getElementById('normal-quiz-box');
        if (normalBox) normalBox.style.display = 'none';

        const chaseBox = document.getElementById('chase-quiz-box');
        if (chaseBox) chaseBox.style.display = 'block';

        const phraseEl = document.getElementById('chase-phrase');
        if (phraseEl) phraseEl.innerText = wordObj.phrase_mask;

        const phraseJpEl = document.getElementById('chase-phrase-jp');
        if (phraseJpEl) phraseJpEl.innerText = `(${wordObj.phrase_meaning})`;

        const choices = [wordObj.phrase_correct, ...wordObj.phrase_distractors].sort(() => Math.random() - 0.5);
        const choicesBox = document.getElementById('chase-choices');
        if (!choicesBox) return;
        choicesBox.innerHTML = '';

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice;
            btn.addEventListener('click', () => this.handleChaseAnswer(choice));
            choicesBox.appendChild(btn);
        });
    },

    handleChaseAnswer(selected) {
        const overlay = document.getElementById('quiz-overlay');
        if (overlay) overlay.style.display = 'none';

        const isCorrect = (selected === this.currentQuizWord.phrase_correct);

        let baseDmg = 30;
        let comboMult = 1 + (this.combo - 1) * 0.1;
        let finalDmg = Math.floor(baseDmg * comboMult);

        const logEl = document.getElementById('battle-log');

        if (isCorrect) {
            finalDmg = Math.floor(finalDmg * 2.0);
            if (logEl) logEl.innerText = `⚡クリティカル追撃成功！⚡ ${finalDmg} ダメージ！`;
        } else {
            if (logEl) logEl.innerText = `通常攻撃成功！敵に ${finalDmg} ダメージ！`;
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
    },

    endTurnProcess() {
        this.enemyTurn--;
        if (this.enemyTurn <= 0) {
            const dmg = 25;
            this.playerHp -= dmg;
            if (this.playerHp < 0) this.playerHp = 0;
            this.updatePlayerHpBar();

            const logEl = document.getElementById('battle-log');
            if (logEl) logEl.innerText += ` 敵の反撃！${dmg}ダメージ！`;
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
    },

    handleWaveClear() {
        if (this.currentWave < this.maxWave - 1) {
            this.currentWave++;
            const logEl = document.getElementById('battle-log');
            if (logEl) logEl.innerText = "敵を討伐！次のエネミーの弱点を解析します。";
            setTimeout(() => this.showScanPhase(), 1200);
        } else {
            // リザルト画面
            window.GameUI.showScreen('screen-result');
        }
    },

    updateEnemyHp() {
        const pct = (this.enemyHp / this.enemyMaxHp) * 100;
        const enemyHpEl = document.getElementById('enemy-hp');
        if (enemyHpEl) enemyHpEl.style.width = `${pct}%`;
    },

    updateEnemyTurn() {
        const turnEl = document.getElementById('enemy-turn');
        if (turnEl) turnEl.innerText = this.enemyTurn; // パズドラ同様「あと ○」のテキストはCSSで付与
    },

    updatePlayerHpBar() {
        const pct = (this.playerHp / this.playerMaxHp) * 100;
        const playerHpEl = document.getElementById('player-hp');
        if (playerHpEl) playerHpEl.style.width = `${pct}%`;

        const playerHpNumEl = document.getElementById('player-hp-text-num');
        if (playerHpNumEl) playerHpNumEl.innerText = this.playerHp;
    },

    updateCombo() {
        const comboEl = document.getElementById('combo-display');
        if (comboEl) comboEl.innerText = `${this.combo} COMBO`;
    }
};

window.GameUI.showScreen = function(screenId) {
    // スキャン、バトル、リザルトはフルスクリーンのオーバーレイとして処理
    const overlays = ['screen-scan', 'screen-battle', 'screen-result'];
    
    if (overlays.includes(screenId)) {
        // オーバーレイ画面を表示
        document.querySelectorAll('.overlay-screen').forEach(s => s.style.display = 'none');
        const target = document.getElementById(screenId);
        if (target) target.style.display = 'flex';
    } else {
        // 通常のタブ画面を切り替え
        document.querySelectorAll('.overlay-screen').forEach(s => s.style.display = 'none');
        window.GameUI.switchTabScreen(screenId);
    }
};

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
