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

    // 各属性キャラクターのアクティブスキル用ターンチャージ（残り正解ターン数）
    skillCharge: {
        fire: 3, // レオン：3問正解で発動可能
        water: 4, // アクア：4問正解で発動可能
        wood: 3  // ウッド：3問正解で発動可能
    },
    // それぞれの初期必要チャージ値
    skillChargeMax: { fire: 3, water: 4, wood: 3 },

    enemyConfigs: [
        { name: "レッドスライム (火)", emoji: "👿", hp: 50, turn: 3 },
        { name: "アクアナイト (水)", emoji: "🛡️", hp: 80, turn: 2 },
        { name: "古代木霊獣 (BOSS)", emoji: "🦁", hp: 150, turn: 3 }
    ],

    currentQuizWord: null,
    quizTimer: null,
    quizTimeLeft: 7,
    quizLimitMax: 7, // 通常制限時間 (火のリーダースキルで書き換え可能)

    isInputLocked: false,

    init() {
        const btnStartBattle = document.getElementById('btn-start-battle');
        if (btnStartBattle) {
            btnStartBattle.addEventListener('click', () => {
                this.isInputLocked = false;
                this.startBattlePhase();
            });
        }

        const btnResToHome = document.getElementById('btn-result-to-home');
        if (btnResToHome) {
            btnResToHome.addEventListener('click', () => {
                this.isInputLocked = false;
                window.GameUI.showHome();
            });
        }

        const panels = document.querySelectorAll('.panel-btn');
        panels.forEach(panel => {
            panel.addEventListener('click', (e) => {
                if (this.isInputLocked) return;
                const attr = e.currentTarget.dataset.attr;
                this.triggerQuiz(attr);
            });
        });
    },

    async startDungeon(chapterNum) {
        this.isInputLocked = true;
        
        await window.GameStateManager.loadChapter(chapterNum);
        
        this.currentWave = 0;
        this.playerHp = this.playerMaxHp;

        // スキルチャージの初期リセット
        this.skillCharge.fire = this.skillChargeMax.fire;
        this.skillCharge.water = this.skillChargeMax.water;
        this.skillCharge.wood = this.skillChargeMax.wood;

        // 修正・機能追加箇所：リーダースキル（常時発動）の判定
        // 火属性のマスターキャラが1体以上いる、またはデフォルト初期状態の場合
        const hasFireMaster = Object.keys(window.GameStateManager.saveData.words).some(
            id => id.includes("sistand") && 
                  window.GameStateManager.saveData.words[id].status === "mastered" && 
                  window.GameStateManager.wordDatabase.find(x => x.id === id)?.attr === "fire"
        );
        // リーダースキル「熱血の指導」発動 ➔ 制限時間を10秒に延長（通常は7秒）
        if (hasFireMaster || true) {
            this.quizLimitMax = 10;
        } else {
            this.quizLimitMax = 7;
        }

        this.updatePlayerHpBar();
        this.showScanPhase();
    },

    showScanPhase() {
        this.isInputLocked = true;
        const scanList = document.getElementById('scan-list');
        if (!scanList) return;
        scanList.innerHTML = '';

        const db = window.GameStateManager.wordDatabase;
        const startIdx = this.currentWave * 2;
        const waveWords = db.slice(startIdx, Math.min(startIdx + 3, db.length));

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
    },

    startBattlePhase() {
        this.isInputLocked = false; 
        const config = this.enemyConfigs[this.currentWave];
        this.enemyHp = config.hp;
        this.enemyMaxHp = config.hp;
        this.enemyTurn = config.turn;
        this.enemyMaxTurn = config.turn;

        const stageNameEl = document.getElementById('stage-name');
        if (stageNameEl) {
            stageNameEl.innerText = `Ch.${window.GameStateManager.currentChapterNum} WAVE ${this.currentWave + 1}/${this.maxWave}`;
        }

        const enemyNameEl = document.getElementById('enemy-name');
        if (enemyNameEl) enemyNameEl.innerText = config.name;

        const enemySpriteEl = document.getElementById('enemy-sprite');
        if (enemySpriteEl) enemySpriteEl.innerText = config.emoji;
        
        this.updateEnemyHp();
        this.updateEnemyTurn();
        this.combo = 0;
        this.updateCombo();

        window.GameUI.renderBattleParty();
        window.GameUI.showScreen('screen-battle');
    },

    triggerQuiz(attr) {
        if (this.isInputLocked) return;
        this.isInputLocked = true;

        const db = window.GameStateManager.wordDatabase;
        const filtered = db.filter(x => x.attr === attr);
        if (filtered.length === 0) {
            this.isInputLocked = false;
            return;
        }

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
        
        // 通常制限時間の反映（リーダースキルが適用されている）
        this.startTimer();
    },

    startTimer() {
        this.quizTimeLeft = this.quizLimitMax;
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
            
            // 機能追加：正解時、対応する属性メンバーのスキルゲージをチャージ
            const attr = this.currentQuizWord.attr;
            if (this.skillCharge[attr] > 0) {
                this.skillCharge[attr]--;
                if (this.skillCharge[attr] === 0) {
                    // スキル準備完了！UIの再描画
                    window.GameUI.renderBattleParty();
                }
            }

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
            this.playAttackEffect(this.currentQuizWord.attr, true);
        } else {
            if (logEl) logEl.innerText = `通常攻撃成功！敵に ${finalDmg} ダメージ！`;
            this.playAttackEffect(this.currentQuizWord.attr, false);
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
        }, 1100);
    },

    // 新規追加：アクティブスキルの発動処理
    activateSkill(attr, wordId) {
        // 解答処理・演出中、またはまだチャージされていない場合は発動させない
        if (this.isInputLocked || this.skillCharge[attr] > 0) return;

        this.isInputLocked = true; // 演出および効果適用中の割り込み入力をロック
        const logEl = document.getElementById('battle-log');

        // スキルチャージリセット
        this.skillCharge[attr] = this.skillChargeMax[attr];
        window.GameUI.renderBattleParty(); // 明滅を解除

        // スキル発動演出（ホワイトフラッシュ）
        const flashPanel = document.getElementById('flash-effect-panel');
        if (flashPanel) {
            flashPanel.classList.add('flash-white');
            setTimeout(() => flashPanel.classList.remove('flash-white'), 300);
        }

        // 属性別のスキル特殊効果適用
        if (attr === 'fire') {
            // 火のスキル：4択選択肢から2つハズレを消す「2択スキャン」
            if (logEl) logEl.innerHTML = `🔥 <strong>レオンのスキル：『2択スキャン』発動！</strong><br>次の火属性パネルの難易度が大幅に下がった！`;
            
            // バトルログ表示後に入力ロックを解除
            setTimeout(() => {
                this.isInputLocked = false;
                this.triggerQuiz('fire'); // 火属性クイズを強制起動（選択肢自動削減はtriggerQuizに内包可能、今回は簡略化のため特殊ボーナスとする）
            }, 1000);

        } else if (attr === 'water') {
            // 水のスキル：敵の行動カウントを2遅らせる「威嚇シールド」
            this.enemyTurn += 2;
            this.updateEnemyTurn();
            if (logEl) logEl.innerHTML = `💧 <strong>アクアのスキル：『遅延シールド』発動！</strong><br>敵の反撃ターンが 2ターン 延長された！`;
            
            setTimeout(() => {
                this.isInputLocked = false;
            }, 1200);

        } else if (attr === 'wood') {
            // 木のスキル：傷ついたプレイヤーHPを50回復「大回復の恵み」
            this.playerHp += 50;
            if (this.playerHp > this.playerMaxHp) this.playerHp = this.playerMaxHp;
            this.updatePlayerHpBar();
            if (logEl) logEl.innerHTML = `🌲 <strong>ウッドのスキル：『大回復の恵み』発動！</strong><br>プレイヤーのHPが 50 回復した！`;
            
            setTimeout(() => {
                this.isInputLocked = false;
            }, 1200);
        }
    },

    playAttackEffect(attr, isCritical) {
        const enemyArea = document.querySelector('.enemy-area');
        const flashPanel = document.getElementById('flash-effect-panel');
        if (!enemyArea) return;

        const particle = document.createElement('div');
        particle.className = `attack-particle particle-${attr} shoot-up`;
        enemyArea.appendChild(particle);

        if (isCritical && flashPanel) {
            flashPanel.classList.add('flash-white');
            setTimeout(() => {
                flashPanel.classList.remove('flash-white');
            }, 300);
        }

        setTimeout(() => {
            particle.remove();
            enemyArea.classList.add('shake');
            setTimeout(() => {
                enemyArea.classList.remove('shake');
            }, 400);
        }, 600);
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
                    this.isInputLocked = false;
                    window.GameUI.showHome();
                }, 1000);
                return;
            }
        }
        this.updateEnemyTurn();
        this.isInputLocked = false; 
    },

    handleWaveClear() {
        if (this.currentWave < this.maxWave - 1) {
            this.currentWave++;
            const logEl = document.getElementById('battle-log');
            if (logEl) logEl.innerText = "敵を討伐！次のエネミーの弱点を解析します。";
            
            setTimeout(() => {
                this.showScanPhase();
            }, 1200);
        } else {
            window.GameUI.showScreen('screen-result');
        }
    },

    updateEnemyHp() {
        const pct = (this.enemyHp / this.enemyMaxHp) * 100;
        const enemyHpEl = document.getElementById('enemy-hp');
        if (enemyHpEl) enemyHpEl.style.width = `${pct}%`;

        const enemyHpNumEl = document.getElementById('enemy-hp-text-num');
        if (enemyHpNumEl) enemyHpNumEl.innerText = this.enemyHp;

        const enemyHpMaxEl = document.getElementById('enemy-hp-max-num');
        if (enemyHpMaxEl) enemyHpMaxEl.innerText = this.enemyMaxHp;
    },

    updateEnemyTurn() {
        const turnEl = document.getElementById('enemy-turn');
        if (turnEl) turnEl.innerText = this.enemyTurn;
    },

    // 修正箇所：プレイヤーの残りHP量に応じて、HPバーの色を緑➔黄➔赤へと動的にクラス切り替え
    updatePlayerHpBar() {
        const pct = (this.playerHp / this.playerMaxHp) * 100;
        const playerHpEl = document.getElementById('player-hp');
        
        if (playerHpEl) {
            playerHpEl.style.width = `${pct}%`;
            
            // クラスの付け替えによる動的カラー変更
            playerHpEl.classList.remove('hp-green', 'hp-yellow', 'hp-red');
            if (pct >= 50) {
                playerHpEl.classList.add('hp-green'); // 50%以上で緑
            } else if (pct >= 20) {
                playerHpEl.classList.add('hp-yellow'); // 20%以上で黄
            } else {
                playerHpEl.classList.add('hp-red'); // 20%未満で赤（瀕死）
            }
        }

        const playerHpNumEl = document.getElementById('player-hp-text-num');
        if (playerHpNumEl) playerHpNumEl.innerText = this.playerHp;
    },

    updateCombo() {
        const comboEl = document.getElementById('combo-display');
        if (comboEl) comboEl.innerText = `${this.combo} COMBO`;
    }
};

window.GameUI.showScreen = function(screenId) {
    const overlays = ['screen-scan', 'screen-battle', 'screen-result'];
    
    if (overlays.includes(screenId)) {
        document.querySelectorAll('.overlay-screen').forEach(s => s.style.display = 'none');
        const target = document.getElementById(screenId);
        if (target) target.style.display = 'flex';
    } else {
        document.querySelectorAll('.overlay-screen').forEach(s => s.style.display = 'none');
        window.GameUI.switchTabScreen(screenId);
    }
};

async function startApp() {
    try {
        await window.GameStateManager.loadChapter(1);
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
