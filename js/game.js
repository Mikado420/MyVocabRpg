class GameManager {
    constructor() {
        // ゲームデータ
        this.wordsData = null;
        this.currentWave = 0;
        this.maxWave = 3;
        this.combo = 0;
        this.ep = 100;
        
        // バトル内ステータス
        this.enemyHp = 100;
        this.enemyMaxHp = 100;
        this.enemyTurn = 3;
        this.enemyMaxTurn = 3;
        
        this.playerHp = 100;
        this.playerMaxHp = 100;

        // WAVE毎の敵設定
        this.enemySettings = [
            { name: "レッドスライム (火)", emoji: "👿", hp: 60, turn: 3, reward: "火のタマゴ" },
            { name: "アクアナイト (水)", emoji: "🛡️", hp: 100, turn: 2, reward: "水のタマゴ" },
            { name: "古代木霊獣 (BOSS)", emoji: "🦁", hp: 200, turn: 3, reward: "ゴールドレアタマゴ" }
        ];

        // クイズ一時記憶用
        this.currentQuizWord = null;
        this.quizTimer = null;
        this.quizTimeLeft = 7;

        this.init();
    }

    async init() {
        // 単語データの非同期ロード
        try {
            const response = await fetch('data/words.json');
            this.wordsData = await response.json();
        } catch (error) {
            console.error("データのロードに失敗しました:", error);
            // ロールバック用ローカルデータ（ファイル直接起動対策）
            this.wordsData = { fire: [], water: [], wood: [] };
        }

        // イベントリスナー登録
        document.getElementById('btn-start-dungeon').addEventListener('click', () => this.startDungeon());
        document.getElementById('btn-start-battle').addEventListener('click', () => this.startBattlePhase());
        document.getElementById('btn-return-home').addEventListener('click', () => this.showScreen('screen-home'));

        // 属性パネルにリスナーを設定
        const panels = document.querySelectorAll('.panel-btn');
        panels.forEach(panel => {
            panel.addEventListener('click', (e) => {
                const attr = e.target.dataset.attr;
                this.triggerQuiz(attr);
            });
        });
    }

    // 画面切り替えメソッド
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        document.getElementById(screenId).style.display = 'flex';
    }

    // 1. ダンジョン挑戦開始
    startDungeon() {
        this.currentWave = 0;
        this.playerHp = this.playerMaxHp;
        this.updatePlayerHpBar();
        this.showScanPhase();
    }

    // 2. エネミー・スキャン（インプットフェーズ）表示
    showScanPhase() {
        const scanList = document.getElementById('scan-list');
        scanList.innerHTML = '';

        // このWAVEで出題される予定の単語（全属性から各1問ずつ抽出してプレビュー）
        const attrs = ['fire', 'water', 'wood'];
        attrs.forEach(attr => {
            if (this.wordsData[attr] && this.wordsData[attr].length > 0) {
                // 今回はシンプルにWAVEに応じた単語（WAVE1ならf_01、WAVE2ならf_02など）を取得
                const wordObj = this.wordsData[attr][this.currentWave % this.wordsData[attr].length];
                
                const card = document.createElement('div');
                card.className = 'scan-card';
                card.innerHTML = `
                    <h4>${wordObj.word} <span style="font-size:12px; color:#aaa;">[${wordObj.part_of_speech}]</span></h4>
                    <p><strong>意味:</strong> ${wordObj.meaning}</p>
                    <p class="scan-etymology">${wordObj.etymology}</p>
                `;
                scanList.appendChild(card);
            }
        });

        this.showScreen('screen-scan');
    }

    // 3. バトルフェーズ（戦闘画面）開始
    startBattlePhase() {
        const settings = this.enemySettings[this.currentWave];
        this.enemyHp = settings.hp;
        this.enemyMaxHp = settings.hp;
        this.enemyTurn = settings.turn;
        this.enemyMaxTurn = settings.turn;

        document.getElementById('stage-name').innerText = `基礎の森 (WAVE ${this.currentWave + 1}/${this.maxWave})`;
        document.getElementById('enemy-name').innerText = settings.name;
        document.getElementById('enemy-sprite').innerText = settings.emoji;
        
        this.updateEnemyHpBar();
        this.updateEnemyTurnText();
        this.combo = 0;
        this.updateComboText();
        document.getElementById('battle-log').innerText = "攻撃したい属性のパネルを選択してください！";

        this.showScreen('screen-battle');
    }

    // 4. クイズ出題処理
    triggerQuiz(attr) {
        if (!this.wordsData[attr] || this.wordsData[attr].length === 0) return;

        // WAVEに対応した単語を選択
        const wordObj = this.wordsData[attr][this.currentWave % this.wordsData[attr].length];
        this.currentQuizWord = wordObj;

        document.getElementById('quiz-genre').innerText = `属性: ${attr.toUpperCase()} (${wordObj.part_of_speech})`;
        document.getElementById('quiz-word').innerText = wordObj.word;

        // 4択選択肢の構築（1つの正解 ＋ 3つのAI生成ひっかけ誤答）
        const choices = [wordObj.meaning, ...wordObj.distractors];
        // ランダムシャッフル
        choices.sort(() => Math.random() - 0.5);

        const choicesBox = document.getElementById('quiz-choices');
        choicesBox.innerHTML = '';

        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice;
            btn.addEventListener('click', () => this.handleAnswer(choice));
            choicesBox.appendChild(btn);
        });

        // クイズオーバーレイを表示してタイマー起動
        document.getElementById('quiz-overlay').style.display = 'flex';
        this.startQuizTimer();
    }

    // タイマー管理
    startQuizTimer() {
        this.quizTimeLeft = 7;
        document.getElementById('quiz-timer').innerText = `⏱️ ${this.quizTimeLeft}s`;
        
        clearInterval(this.quizTimer);
        this.quizTimer = setInterval(() => {
            this.quizTimeLeft--;
            document.getElementById('quiz-timer').innerText = `⏱️ ${this.quizTimeLeft}s`;

            if (this.quizTimeLeft <= 0) {
                clearInterval(this.quizTimer);
                this.handleAnswer(""); // 時間切れ（ミス）
            }
        }, 1000);
    }

    // クイズ解答判定
    handleAnswer(selectedMeaning) {
        clearInterval(this.quizTimer);
        document.getElementById('quiz-overlay').style.display = 'none';

        const isCorrect = (selectedMeaning === this.currentQuizWord.meaning);

        if (isCorrect) {
            // 正解：プレイヤーのターン（ダメージ算出）
            this.combo++;
            this.updateComboText();

            // コンボ倍率を反映したダメージ
            let baseDamage = 30;
            let comboBonus = 1 + (this.combo - 1) * 0.1; // 1コンボ毎に10%アップ
            let finalDamage = Math.floor(baseDamage * comboBonus);

            this.enemyHp -= finalDamage;
            if (this.enemyHp < 0) this.enemyHp = 0;
            this.updateEnemyHpBar();

            document.getElementById('battle-log').innerText = `正解！ ${this.combo}連鎖！敵に ${finalDamage} ダメージを与えた！`;
        } else {
            // 不正解 or 時間切れ
            this.combo = 0;
            this.updateComboText();
            document.getElementById('battle-log').innerText = `不正解！攻撃失敗...。正解は「${this.currentQuizWord.meaning}」`;
        }

        // 敵の生存チェックおよびターン減少
        setTimeout(() => {
            if (this.enemyHp <= 0) {
                this.handleWaveClear();
            } else {
                this.processEnemyTurn();
            }
        }, 1200);
    }

    // 敵のターン進行
    processEnemyTurn() {
        this.enemyTurn--;
        if (this.enemyTurn <= 0) {
            // 敵の攻撃（プレイヤー被ダメージ）
            const enemyDamage = 25;
            this.playerHp -= enemyDamage;
            if (this.playerHp < 0) this.playerHp = 0;
            this.updatePlayerHpBar();
            
            document.getElementById('battle-log').innerText = `敵からの強烈な反撃！ ${enemyDamage} のダメージを受けた！`;
            this.enemyTurn = this.enemyMaxTurn; // ターンリセット

            // 敗北チェック
            if (this.playerHp <= 0) {
                setTimeout(() => {
                    alert("PLAYER HPが0になりました。ゲームオーバーです。ホームに戻って復習しましょう。");
                    this.showScreen('screen-home');
                }, 1000);
                return;
            }
        }
        this.updateEnemyTurnText();
    }

    // WAVEクリア
    handleWaveClear() {
        if (this.currentWave < this.maxWave - 1) {
            this.currentWave++;
            document.getElementById('battle-log').innerText = "敵を撃破しました！次の敵の解析に移ります。";
            setTimeout(() => {
                this.showScanPhase();
            }, 1500);
        } else {
            // ダンジョン完全クリア
            this.showResultScreen();
        }
    }

    // リザルト表示
    showResultScreen() {
        this.ep += 15; // EP報酬
        document.getElementById('ep-display').innerText = this.ep;
        document.getElementById('res-ep').innerText = "15";
        
        const finalReward = this.enemySettings[this.maxWave - 1].reward;
        document.getElementById('res-drop').innerText = finalReward;

        this.showScreen('screen-result');
    }

    // UI更新補助メソッド
    updateEnemyHpBar() {
        const pct = (this.enemyHp / this.enemyMaxHp) * 100;
        document.getElementById('enemy-hp').style.width = `${pct}%`;
    }

    updatePlayerHpBar() {
        const pct = (this.playerHp / this.playerMaxHp) * 100;
        document.getElementById('player-hp').style.width = `${pct}%`;
        document.getElementById('player-hp-text-num').innerText = this.playerHp;
    }

    updateEnemyTurnText() {
        document.getElementById('enemy-turn').innerText = `あと ${this.enemyTurn} ターン`;
    }

    updateComboText() {
        document.getElementById('combo-display').innerText = `${this.combo} COMBO`;
    }
}

// 起動
window.addEventListener('DOMContentLoaded', () => {
    new GameManager();
});
