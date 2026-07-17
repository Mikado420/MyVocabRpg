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

    // ラスボス用：コンボ吸収シールド管理ステート
    comboShieldCount: 0, // 現在のコンボ吸収中の正解数
    requiredComboShield: 2, // 突破に必要な連続正解コンボ数

    // 中ボス用：毒に汚染された選択肢の「正解テキスト」を裏で保持（見た目では判別不能）
    poisonMeaningText: "",

    // 各属性キャラクターのアクティブスキル用ターンチャージ（残り正解ターン数）
    skillCharge: {
        fire: 3, // レオン：3問正解で発動可能
        water: 4, // アクア：4問正解で発動可能
        wood: 3  // ウッド：3問正解で発動可能
    },
    // それぞれの初期必要チャージ値
    skillChargeMax: { fire: 3, water: 4, wood: 3 },

    // 各敵モンスターに属性（attr）を設定し、三すくみダメージをサポート
    enemyConfigs: [
        { name: "レッドスライム (火)", emoji: "👿", hp: 50, turn: 3, attr: "fire" },
        { name: "アクアナイト (水/中ボス)", emoji: "🛡️", hp: 80, turn: 2, attr: "water" },
        { name: "古代木霊獣 (BOSS/木)", emoji: "🦁", hp: 150, turn: 3, attr: "wood" }
    ],

    currentQuizWord: null,
    quizTimer: null,
    quizTimeLeft: 7,
    quizLimitMax: 7, // 通常制限時間 (火のリーダースキルで書き換え可能)

    isInputLocked: false,

    init() {
        // 安全なイベントリスナーの登録（ガード節）
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
                this.comboShieldCount = 0; // シールドカウンターをリセットしてクイズ開始
                this.triggerQuiz(attr, false);
            });
        });
    },

    async startDungeon(chapterNum) {
        this.isInputLocked = true;
        
        await window.GameStateManager.loadChapter(chapterNum);
        
        this.currentWave = 0;
        this.playerHp = this.playerMaxHp;
        this.comboShieldCount = 0;
        this.poisonMeaningText = "";

        // スキルチャージの初期リセット
        this.skillCharge.fire = this.skillChargeMax.fire;
        this.skillCharge.water = this.skillChargeMax.water;
        this.skillCharge.wood = this.skillChargeMax.wood;

        // リーダースキル（常時発動）の判定
        const hasFireMaster = Object.keys(window.GameStateManager.saveData.words).some(
            id => id.includes("sistand") && 
                  window.GameStateManager.saveData.words[id].status === "mastered" && 
                  window.GameStateManager.wordDatabase.find(x => x.id === id)?.attr === "fire"
        );
        // リーダースキル発動 ➔ 制限時間を10秒に延長（火マスター所持時）
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

        // BOSS戦（WAVE 3）開始時の特殊シールドスキル警告
        if (this.currentWave === 2) {
            const logEl = document.getElementById('battle-log');
            if (logEl) {
                logEl.innerHTML = `⚠️ <strong>BOSS常時スキル発動：『2コンボ吸収シールド』</strong><br>クイズに【2連続で正解】しなければ、ダメージはすべて無効化（吸収）される！`;
            }
        }
    },

    // 属性相性（ダメージ倍率）算出
    getDamageMultiplier(attackerAttr, defenderAttr) {
        if (attackerAttr === 'fire' && defenderAttr === 'wood') return 2.0; 
        if (attackerAttr === 'fire' && defenderAttr === 'water') return 0.5; 
        
        if (attackerAttr === 'water' && defenderAttr === 'fire') return 2.0; 
        if (attackerAttr === 'water' && defenderAttr === 'wood') return 0.5; 
        
        if (attackerAttr === 'wood' && defenderAttr === 'water') return 2.0; 
        if (attackerAttr === 'wood' && defenderAttr === 'fire') return 0.5; 
        
        return 1.0; 
    },

    triggerQuiz(attr, isShieldChain = false) {
        if (this.isInputLocked && !isShieldChain) return;
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

        // コンボ吸収中の場合はヘッダーに進捗を表示
        const quizGenreEl = document.getElementById('quiz-genre');
        if (quizGenreEl) {
            if (this.currentWave === 2) {
                quizGenreEl.innerText = `【シールド突破まで あと ${this.requiredComboShield - this.comboShieldCount} 問】属性: ${attr.toUpperCase()}`;
            } else {
                quizGenreEl.innerText = `属性: ${attr.toUpperCase()} (${wordObj.part_of_speech})`;
            }
        }

        const quizWordEl = document.getElementById('quiz-word');
        if (quizWordEl) quizWordEl.innerText = wordObj.word;

        // 4択選択肢：正解(1) ＋ 誤答(2) ＋ 毒(1)
        const choices = [wordObj.meaning, ...wordObj.distractors].sort(() => Math.random() - 0.5);
        
        // 修正仕様：中ボス（WAVE 2）による『ステルス型毒トラップ選択肢の混入』
        this.poisonMeaningText = "";
        if (this.currentWave === 1 && Math.random() < 0.6) { // 60%の確率で混入
            this.poisonMeaningText = wordObj.poison_distractor; // json上で設計されたスペル酷似ひっかけ単語
        }

        const choicesBox = document.getElementById('quiz-choices');
        if (!choicesBox) return;
        choicesBox.innerHTML = '';

        choices.forEach((choice) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice; // 💀などの視覚マーカーは一切入れず、通常の表示にする
            
            // タップ時に、裏で保持している「毒テキスト」と一致するかどうかを自動判定
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
                this.handleNormalAnswer("", false); // 時間切れ
            }
        }, 1000);
    },

    handleNormalAnswer(selected, isPoison = false) {
        clearInterval(this.quizTimer);

        // 1. ステルス毒トラップ（スペル・連想酷似ひっかけ）を踏んだ場合の判定
        if (isPoison) {
            this.combo = 0;
            this.updateCombo();
            const overlay = document.getElementById('quiz-overlay');
            if (overlay) overlay.style.display = 'none';

            // 毒による自傷ダメージ (最大HPの25%)
            const poisonDmg = 25;
            this.playerHp -= poisonDmg;
            if (this.playerHp < 0) this.playerHp = 0;
            this.updatePlayerHpBar();

            const logEl = document.getElementById('battle-log');
            if (logEl) {
                logEl.innerHTML = `💀 <strong>毒トラップ発動！</strong><br>スペル・概念が酷似した『うろ覚えひっかけパネル』を踏んでしまい、25 の大ダメージ！<br>(正解: 「${this.currentQuizWord.meaning}」)`;
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
            
            // 正解時、対応する属性メンバーのスキルゲージをチャージ
            const attr = this.currentQuizWord.attr;
            if (this.skillCharge[attr] > 0) {
                this.skillCharge[attr]--;
                if (this.skillCharge[attr] === 0) {
                    window.GameUI.renderBattleParty();
                }
            }

            // 2. 2コンボ吸収シールドの判定処理（ラスボススキル）
            if (this.currentWave === 2) {
                this.comboShieldCount++;
                if (this.comboShieldCount < this.requiredComboShield) {
                    // 1問目正解：オーバーレイを閉じず、シームレスに2問目の単語を切り替えて出題
                    if (logEl) logEl.innerHTML = `🔥 <strong>1コンボ達成！</strong><br>シールド破壊まであと1問！連続で正解せよ！`;
                    
                    setTimeout(() => {
                        this.triggerQuiz(this.currentQuizWord.attr, true); // シールド連戦フラグ
                    }, 800);
                    return;
                }
            }

            // 通常、または2コンボシールド完全突破時はミニマルフレーズ追撃へ
            setTimeout(() => {
                this.triggerChaseQuiz();
            }, 600);

        } else {
            // 不正解時の処理
            this.combo = 0;
            this.updateCombo();
            const overlay = document.getElementById('quiz-overlay');
            if (overlay) overlay.style.display = 'none';

            // ラスボス戦でミスした場合はシールド吸収
            if (this.currentWave === 2) {
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

        let baseDmg = 30;
        let comboMult = 1 + (this.combo - 1) * 0.1;
        let finalDmg = Math.floor(baseDmg * comboMult);

        const logEl = document.getElementById('battle-log');

        // 属性相性（三すくみ補正）の計算
        const defenderConfig = this.enemyConfigs[this.currentWave];
        const multiplier = this.getDamageMultiplier(this.currentQuizWord.attr, defenderConfig.attr);
        finalDmg = Math.floor(finalDmg * multiplier);

        let multiplierText = "";
        if (multiplier === 2.0) multiplierText = " (効果は抜群だ！🔥)";
        if (multiplier === 0.5) multiplierText = " (効果はいまひとつのようだ…💧)";

        if (isCorrect) {
            finalDmg = Math.floor(finalDmg * 2.0); // クリティカル補正
            if (logEl) logEl.innerText = `⚡クリティカル追撃成功！⚡ ${finalDmg} ダメージ！${multiplierText}`;
            this.playAttackEffect(this.currentQuizWord.attr, true);
        } else {
            if (logEl) logEl.innerText = `通常攻撃成功！敵に ${finalDmg} ダメージ！${multiplierText}`;
            this.playAttackEffect(this.currentQuizWord.attr, false);
        }

        this.enemyHp -= finalDmg;
        if (this.enemyHp < 0) this.enemyHp = 0;
        this.updateEnemyHp();

        // 突破完了したため、シールド正解数をリセット
        this.comboShieldCount = 0;

        setTimeout(() => {
            if (this.enemyHp <= 0) {
                this.handleWaveClear();
            } else {
                this.endTurnProcess();
            }
        }, 1100);
    },

    activateSkill(attr, wordId) {
        if (this.isInputLocked || this.skillCharge[attr] > 0) return;

        this.isInputLocked = true; 
        const logEl = document.getElementById('battle-log');

        this.skillCharge[attr] = this.skillChargeMax[attr];
        window.GameUI.renderBattleParty(); 

        const flashPanel = document.getElementById('flash-effect-panel');
        if (flashPanel) {
            flashPanel.classList.add('flash-white');
            setTimeout(() => flashPanel.classList.remove('flash-white'), 300);
        }

        if (attr === 'fire') {
            if (logEl) logEl.innerHTML = `🔥 <strong>レオンのスキル：『2択スキャン』発動！</strong><br>次の火属性パネルの難易度が大幅に下がった！`;
            setTimeout(() => {
                this.isInputLocked = false;
                this.comboShieldCount = 0; 
                this.triggerQuiz('fire', false); 
            }, 1000);

        } else if (attr === 'water') {
            this.enemyTurn += 2;
            this.updateEnemyTurn();
            if (logEl) logEl.innerHTML = `💧 <strong>アクアのスキル：『遅延シールド』発動！</strong><br>敵の反撃ターンが 2ターン 延長された！`;
            setTimeout(() => {
                this.isInputLocked = false;
            }, 1200);

        } else if (attr === 'wood') {
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
