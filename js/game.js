window.GameController = {
    currentWave: 0,
    maxWave: 10, // 10連戦仕様

    enemyHp: 100,
    enemyMaxHp: 100,
    enemyTurn: 3,
    enemyMaxTurn: 3,

    playerHp: 100,
    playerMaxHp: 100,

    // 今回の10単語セット格納ステート
    currentSessionWords: [],
    sessionQueue: [], // 出題順シャッフルキュー

    // ラスボス用：コンボ吸収シールド管理ステート
    comboShieldCount: 0, // 現在のコンボ吸収中の正解数
    requiredComboShield: 2, // 突破に必要な連続正解コンボ数

    // 中ボス用：毒に汚染された選択肢の「正解テキスト」を裏で保持
    poisonMeaningText: "",

    // 属性に依存しない各キャラクター個別のアクティブスキル用ターンチャージ
    skillCharge: {
        leon: 3,  // レオン：3問正解で発動可能（2択）
        aqua: 4,  // アクア：4問正解で発動可能（遅延）
        wood: 3   // ウッド：3問正解で発動可能（回復）
    },
    skillChargeMax: { leon: 3, aqua: 4, wood: 3 },

    enemyConfigs: [
        { name: "レッドスライム", emoji: "👿", hp: 50, turn: 3 },
        { name: "アクアナイト (中ボス)", emoji: "🛡️", hp: 80, turn: 2 },
        { name: "古代木霊獣 (BOSS)", emoji: "🦁", hp: 150, turn: 3 }
    ],

    currentQuizWord: null,
    quizTimer: null,
    quizTimeLeft: 7,
    quizLimitMax: 7, // 通常制限時間 (リーダースキルで書き換え)

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
    },

    // サイクルにのっとり、未学習の単語から重複なくランダムで最大10語を抽選するアルゴリズム
    selectTenWords() {
        const db = window.GameStateManager.wordDatabase;
        const saveWords = window.GameStateManager.saveData.words;

        // 今回の学習サイクルで未学習（learned_in_cycle が false）のものを抽出
        let unlearned = db.filter(w => !saveWords[w.id].learned_in_cycle);

        // すべての単語を一巡（学習し終えた）した場合はフラグをリセットしてループ
        if (unlearned.length === 0) {
            db.forEach(w => {
                if (saveWords[w.id]) {
                    saveWords[w.id].learned_in_cycle = false;
                }
            });
            window.GameStateManager.save();
            unlearned = [...db];
            console.log("英単語帳の全単語を一巡したため、学習サイクルを自動リセットしました。");
        }

        // 未学習の中から10語を完全ランダム抽選
        const shuffled = [...unlearned].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(10, shuffled.length));
    },

    async startDungeon(chapterNum) {
        this.isInputLocked = true;
        
        await window.GameStateManager.loadChapter(chapterNum);
        
        // 1. 今回のセッション用10単語を選出
        this.currentSessionWords = this.selectTenWords();
        
        // 2. 10単語からWAVE出題用シャッフルキューを作成
        this.sessionQueue = [...this.currentSessionWords].sort(() => Math.random() - 0.5);
        
        // WAVE最大数を、選出された単語数（基本10、全単語数が10未満ならその数）にバインド
        this.maxWave = this.currentSessionWords.length;
        this.currentWave = 0;
        this.playerHp = this.playerMaxHp;
        this.comboShieldCount = 0;
        this.poisonMeaningText = "";

        // スキルチャージの初期リセット
        this.skillCharge.leon = this.skillChargeMax.leon;
        this.skillCharge.aqua = this.skillChargeMax.aqua;
        this.skillCharge.wood = this.skillChargeMax.wood;

        // リーダースキル（常時発動）の判定
        const hasFireMaster = Object.keys(window.GameStateManager.saveData.words).some(
            id => id.includes("sistand") && window.GameStateManager.saveData.words[id].status === "mastered"
        );
        // リーダースキル発動 ➔ 制限時間を10秒に延長
        if (hasFireMaster || true) {
            this.quizLimitMax = 10;
        } else {
            this.quizLimitMax = 7;
        }

        this.updatePlayerHpBar();
        this.showScanPhase();
    },

    // 抽選された10単語すべてを一括表示してインプットさせる
    showScanPhase() {
        this.isInputLocked = true;
        const scanList = document.getElementById('scan-list');
        if (!scanList) return;
        scanList.innerHTML = '';

        // 抽選された10単語すべてを描画
        this.currentSessionWords.forEach(word => {
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

    // 10連戦に合わせ、中ボスや大ボスのHPバランス・AIを最適化
    startBattlePhase() {
        this.isInputLocked = false; 
        
        const isBossWave = (this.currentWave === this.maxWave - 1);
        const isMidBossWave = (this.currentWave === Math.floor(this.maxWave / 2));
        
        let enemyName = `スライム (WAVE ${this.currentWave + 1})`;
        let enemyEmoji = "👿";
        let enemyHp = 30 + this.currentWave * 6; // 進むにつれてHPが徐々に微インフレ
        let enemyTurn = 3;
        
        if (isBossWave) {
            enemyName = "古代木霊獣 (BOSS)";
            enemyEmoji = "🦁";
            enemyHp = 150;
            enemyTurn = 3;
        } else if (isMidBossWave) {
            enemyName = "アクアナイト (中ボス)";
            enemyEmoji = "🛡️";
            enemyHp = 70;
            enemyTurn = 2;
        }

        this.enemyHp = enemyHp;
        this.enemyMaxHp = enemyHp;
        this.enemyTurn = enemyTurn;
        this.enemyMaxTurn = enemyTurn;

        const stageNameEl = document.getElementById('stage-name');
        if (stageNameEl) {
            stageNameEl.innerText = `Ch.${window.GameStateManager.currentChapterNum} WAVE ${this.currentWave + 1}/${this.maxWave}`;
        }

        const enemyNameEl = document.getElementById('enemy-name');
        if (enemyNameEl) enemyNameEl.innerText = enemyName;

        const enemySpriteEl = document.getElementById('enemy-sprite');
        if (enemySpriteEl) enemySpriteEl.innerText = enemyEmoji;
        
        this.updateEnemyHp();
        this.updateEnemyTurn();
        this.combo = 0;
        this.updateCombo();

        window.GameUI.renderBattleParty();
        window.GameUI.showScreen('screen-battle');

        // 特殊スキルAIの常時警告メッセージ更新
        const logEl = document.getElementById('battle-log');
        if (isBossWave && logEl) {
            logEl.innerHTML = `⚠️ <strong>BOSS常時スキル発動：『2コンボ吸収シールド』</strong><br>クイズに【2連続で正解】しなければ、ダメージはすべて無効化（吸収）される！`;
        } else if (isMidBossWave && logEl) {
            logEl.innerHTML = `⚠️ <strong>中ボス常時スキル発動：『毒トラップの混入』</strong><br>曖昧な記憶を突く毒パネルが選択肢にステルスで紛れ込んでいる！`;
        } else if (logEl) {
            logEl.innerText = "攻撃開始を検知しています...";
        }

        // オートクイズバトル開始
        setTimeout(() => {
            this.triggerQuiz(false);
        }, 800);
    },

    getDamageMultiplier() {
        return 1.0; 
    },

    // 抽選された10単語から、WAVEごとに重複なく1単語ずつ出題する
    triggerQuiz(isShieldChain = false) {
        if (this.isInputLocked && !isShieldChain) return;
        this.isInputLocked = true; 

        if (isShieldChain) {
            // シールド連戦中の場合は現在の単語を維持
        } else {
            // 通常ターン開始時：シャッフル出題キューから次の単語を安全に取り出し
            if (this.sessionQueue.length > 0) {
                this.currentQuizWord = this.sessionQueue.pop();
            } else {
                this.currentQuizWord = this.currentSessionWords[Math.floor(Math.random() * this.currentSessionWords.length)];
            }
        }

        const wordObj = this.currentQuizWord;

        const normalBox = document.getElementById('normal-quiz-box');
        if (normalBox) normalBox.style.display = 'block';

        const chaseBox = document.getElementById('chase-quiz-box');
        if (chaseBox) chaseBox.style.display = 'none';

        const quizGenreEl = document.getElementById('quiz-genre');
        if (quizGenreEl) {
            if (this.currentWave === this.maxWave - 1) {
                quizGenreEl.innerText = `【シールド突破まで あと ${this.requiredComboShield - this.comboShieldCount} 問】`;
            } else {
                quizGenreEl.innerText = `ジャンル: ${wordObj.part_of_speech}`;
            }
        }

        const quizWordEl = document.getElementById('quiz-word');
        if (quizWordEl) quizWordEl.innerText = wordObj.word;

        const choices = [wordObj.meaning, ...wordObj.distractors].sort(() => Math.random() - 0.5);
        
        // ステルス型毒トラップ（WAVE5 中ボスのみ）
        this.poisonMeaningText = "";
        const isMidBossWave = (this.currentWave === Math.floor(this.maxWave / 2));
        if (isMidBossWave && Math.random() < 0.6) {
            this.poisonMeaningText = wordObj.poison_distractor; 
        }

        const choicesBox = document.getElementById('quiz-choices');
        if (!choicesBox) return;
        choicesBox.innerHTML = '';

        choices.forEach((choice) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice; 
            
            const isPoisonChoice = (this.poisonMeaningText !== "" && choice === this.poisonMeaningText);
            btn.addEventListener('click', () => this.handleNormalAnswer(choice, isPoisonChoice));
            
            choicesBox.appendChild(btn);
        });

        const overlay = document.getElementById('quiz-overlay');
        if (overlay) overlay.style.display = 'flex';
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
                this.handleNormalAnswer("", false); 
            }
        }, 1000);
    },

    handleNormalAnswer(selected, isPoison = false) {
        clearInterval(this.quizTimer);

        if (isPoison) {
            this.combo = 0;
            this.updateCombo();
            const overlay = document.getElementById('quiz-overlay');
            if (overlay) overlay.style.display = 'none';

            const poisonDmg = 25;
            this.playerHp -= poisonDmg;
            if (this.playerHp < 0) this.playerHp = 0;
            this.updatePlayerHpBar();

            const logEl = document.getElementById('battle-log');
            if (logEl) {
                logEl.innerHTML = `💀 <strong>毒トラップ発動！</strong><br>スペルや概念が類似した『うろ覚えひっかけパネル』を踏んでしまい、25 のダメージ！<br>(正解: 「${this.currentQuizWord.meaning}」)`;
            }
            this.endTurnProcess();
            return;
        }

        const isCorrect = (selected === this.currentQuizWord.meaning);
        window.GameStateManager.recordResult(this.currentQuizWord.id, isCorrect);
        const logEl = document.getElementById('battle-log');

        if (isCorrect) {
            this.combo++;
            this.updateCombo();
            
            const chars = ['leon', 'aqua', 'wood'];
            chars.forEach(char => {
                if (this.skillCharge[char] > 0) {
                    this.skillCharge[char]--;
                }
            });
            window.GameUI.renderBattleParty(); 

            // BOSS戦：2コンボ吸収シールドの判定
            const isBossWave = (this.currentWave === this.maxWave - 1);
            if (isBossWave) {
                this.comboShieldCount++;
                if (this.comboShieldCount < this.requiredComboShield) {
                    if (logEl) logEl.innerHTML = `🔥 <strong>1コンボ達成！</strong><br>シールド突破まであと1問！連続で正解せよ！`;
                    
                    setTimeout(() => {
                        this.triggerQuiz(true); 
                    }, 800);
                    return;
                }
            }

            // 派生語・フレーズ連動追撃へ
            setTimeout(() => {
                if (this.currentQuizWord.has_related) {
                    this.triggerChaseQuiz(); 
                } else {
                    if (logEl) logEl.innerText = "正解！味方キャラクターの一斉攻撃！";
                    this.executeDamagePhase(false); 
                }
            }, 600);

        } else {
            this.combo = 0;
            this.updateCombo();
            const overlay = document.getElementById('quiz-overlay');
            if (overlay) overlay.style.display = 'none';

            const isBossWave = (this.currentWave === this.maxWave - 1);
            if (isBossWave) {
                this.comboShieldCount = 0;
                if (logEl) logEl.innerHTML = `❌ <strong>コンボ吸収失敗！</strong><br>シールドにダメージを完全に無効化（吸収）された！<br>(正解: 「${this.currentQuizWord.meaning}」)`;
            } else {
                if (logEl) logEl.innerText = `ミス！正解は「${this.currentQuizWord.meaning}」`;
            }
            
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
        this.executeDamagePhase(isCorrect); 
    },

    executeDamagePhase(isCritical) {
        let baseDmg = 35; 
        let comboMult = 1 + (this.combo - 1) * 0.1;
        let finalDmg = Math.floor(baseDmg * comboMult);

        const logEl = document.getElementById('battle-log');

        if (isCritical) {
            finalDmg = Math.floor(finalDmg * 2.0); 
            if (logEl) logEl.innerText = `⚡クリティカル追撃成功！⚡ ${finalDmg} ダメージ！`;
            this.playAttackEffect(true);
        } else {
            if (logEl) logEl.innerText = `通常攻撃成功！敵に ${finalDmg} ダメージ！`;
            this.playAttackEffect(false);
        }

        this.enemyHp -= finalDmg;
        if (this.enemyHp < 0) this.enemyHp = 0;
        this.updateEnemyHp();

        this.comboShieldCount = 0; 

        setTimeout(() => {
            if (this.enemyHp <= 0) {
                this.handleWaveClear();
            } else {
                this.endTurnProcess();
            }
        }, 1100);
    },

    activateSkill(charKey, wordId) {
        if (this.isInputLocked || this.skillCharge[charKey] > 0) return;

        this.isInputLocked = true; 
        const logEl = document.getElementById('battle-log');

        this.skillCharge[charKey] = this.skillChargeMax[charKey];
        window.GameUI.renderBattleParty(); 

        const flashPanel = document.getElementById('flash-effect-panel');
        if (flashPanel) {
            flashPanel.classList.add('flash-white');
            setTimeout(() => flashPanel.classList.remove('flash-white'), 300);
        }

        if (charKey === 'leon') {
            if (logEl) logEl.innerHTML = `🔥 <strong>レオンのスキル：『2択スキャン』発動！</strong><br>ハズレ選択肢が自動で削減され、瞬時にクイズが出題される！`;
            setTimeout(() => {
                this.isInputLocked = false;
                this.comboShieldCount = 0; 
                this.triggerQuiz(false); 
            }, 1000);

        } else if (charKey === 'aqua') {
            this.enemyTurn += 2;
            this.updateEnemyTurn();
            if (logEl) logEl.innerHTML = `💧 <strong>アクアのスキル：『遅延シールド』発動！</strong><br>敵の反撃ターンが 2ターン 延長された！`;
            setTimeout(() => {
                this.isInputLocked = false;
                this.triggerQuiz(false); 
            }, 1200);

        } else if (charKey === 'wood') {
            this.playerHp += 50;
            if (this.playerHp > this.playerMaxHp) this.playerHp = this.playerMaxHp;
            this.updatePlayerHpBar();
            if (logEl) logEl.innerHTML = `🌲 <strong>ウッドのスキル：『大回復の恵み』発動！</strong><br>プレイヤーのHPが 50 回復した！`;
            setTimeout(() => {
                this.isInputLocked = false;
                this.triggerQuiz(false); 
            }, 1200);
        }
    },

    playAttackEffect(isCritical) {
        const enemyArea = document.querySelector('.enemy-area');
        const flashPanel = document.getElementById('flash-effect-panel');
        if (!enemyArea) return;

        const particle = document.createElement('div');
        particle.className = `attack-particle particle-water shoot-up`; 
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

        // 敵の反撃ターン終了後、即座に自動的に次のクイズを出題
        setTimeout(() => {
            this.triggerQuiz(false);
        }, 1000);
    },

    // WAVEクリア（10WAVE連戦、WAVEごとにスキャンを挟まないスムーズな進行）
    handleWaveClear() {
        if (this.currentWave < this.maxWave - 1) {
            this.currentWave++;
            const logEl = document.getElementById('battle-log');
            if (logEl) logEl.innerText = "敵を討伐！次のエネミーが出現します！";
            
            // スキャンは挟まず、1.2秒後に直接次のエネミーを召喚してバトル再開！
            setTimeout(() => {
                this.startBattlePhase();
            }, 1200);
        } else {
            // クリア時：今回学習した10単語に「学習サイクル済み」のフラグを刻んで保存
            const saveWords = window.GameStateManager.saveData.words;
            this.currentSessionWords.forEach(word => {
                if (saveWords[word.id]) {
                    saveWords[word.id].learned_in_cycle = true;
                }
            });
            window.GameStateManager.save();

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

    updatePlayerHpBar() {
        const pct = (this.playerHp / this.playerMaxHp) * 100;
        const playerHpEl = document.getElementById('player-hp');
        
        if (playerHpEl) {
            playerHpEl.style.width = `${pct}%`;
            
            playerHpEl.classList.remove('hp-green', 'hp-yellow', 'hp-red');
            if (pct >= 50) {
                playerHpEl.classList.add('hp-green'); 
            } else if (pct >= 20) {
                playerHpEl.classList.add('hp-yellow'); 
            } else {
                playerHpEl.classList.add('hp-red'); 
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
