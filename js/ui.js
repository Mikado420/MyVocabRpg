window.GameUI = {
    init() {
        const dungeonBtns = document.querySelectorAll('.start-dungeon-btn');
        dungeonBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const chap = parseInt(e.currentTarget.dataset.chap);
                await window.GameController.startDungeon(chap);
            });
        });

        const btnGacha = document.getElementById('btn-gacha-pull');
        if (btnGacha) btnGacha.addEventListener('click', () => this.pullGacha());

        const btnReset = document.getElementById('btn-reset-data');
        if (btnReset) btnReset.addEventListener('click', () => this.resetGameData());

        const dictChapSelect = document.getElementById('dict-chapter-select');
        if (dictChapSelect) {
            dictChapSelect.addEventListener('change', async (e) => {
                const selectedChap = parseInt(e.target.value);
                await window.GameStateManager.loadChapter(selectedChap);
                const activeSubTab = document.querySelector('.sub-tab-btn.active');
                const filter = activeSubTab ? activeSubTab.dataset.tab : 'all';
                this.renderDictionary(filter);
                this.updateHeaderStats();
            });
        }

        const footerTabs = document.querySelectorAll('.footer-tab');
        footerTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                footerTabs.forEach(t => t.classList.remove('active'));
                
                const activeTabBtn = e.currentTarget;
                activeTabBtn.classList.add('active');
                
                const targetScreenId = activeTabBtn.dataset.target;
                this.switchTabScreen(targetScreenId);
            });
        });
        
        const subTabs = document.querySelectorAll('.sub-tab-btn');
        subTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                subTabs.forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderDictionary(e.currentTarget.dataset.tab);
            });
        });

        this.updateHeaderStats();
    },

    switchTabScreen(screenId) {
        document.querySelectorAll('.tab-screen').forEach(screen => {
            screen.style.display = 'none';
        });
        const target = document.getElementById(screenId);
        if (target) {
            target.style.display = 'flex';
            if (screenId === 'tab-dictionary') {
                this.renderDictionary('all');
            }
        }
    },

    showHome() {
        this.updateHeaderStats();
        const footerTabs = document.querySelectorAll('.footer-tab');
        footerTabs.forEach(t => t.classList.remove('active'));
        const dungeonTab = document.querySelector('[data-target="tab-dungeon"]');
        if (dungeonTab) dungeonTab.classList.add('active');

        this.showScreen('tab-dungeon');
    },

    updateHeaderStats() {
        const rankEl = document.getElementById('player-rank');
        if (rankEl) rankEl.innerText = window.GameStateManager.saveData.rank;

        const epEl = document.getElementById('ep-display');
        if (epEl) epEl.innerText = window.GameStateManager.saveData.ep;

        const goldEl = document.getElementById('gold-display');
        if (goldEl) goldEl.innerText = window.GameStateManager.saveData.gold;

        const expBar = document.getElementById('exp-bar');
        if (expBar) {
            const expPercent = window.GameStateManager.calculateExpProgress();
            expBar.style.width = `${expPercent}%`;
        }
    },

    renderDictionary(filterType = 'all') {
        const listContainer = document.getElementById('dict-list');
        if (!listContainer) return;
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
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("このブラウザは音声合成に対応していません");
        }
    },

    // 修正・機能追加箇所：バトル中の味方キャラクター編成表示、およびスキル発動可能時に明滅クラスを付与
    renderBattleParty() {
        const partyContainer = document.getElementById('battle-party');
        if (!partyContainer) return;
        partyContainer.innerHTML = '';

        const db = window.GameStateManager.wordDatabase;
        const saveState = window.GameStateManager.saveData.words;
        const skillTracker = window.GameController.skillCharge; // バトルマネージャー側のスキルチャージ情報を参照

        let renderedCount = 0;
        db.forEach(word => {
            const progress = saveState[word.id];
            if (progress && progress.status === 'mastered') {
                const member = document.createElement('div');
                
                // チャージ数が溜まりきっている場合（0以下）に明滅アニメーションクラスを付与
                const currentCharge = skillTracker[word.attr] || 0;
                const isReady = currentCharge <= 0;
                
                member.className = `party-member char-${word.attr} ${isReady ? 'skill-ready' : ''}`;
                member.innerText = word.word.substring(0, 3).toUpperCase();
                member.dataset.wordId = word.id;
                member.dataset.attr = word.attr;

                // 明滅キャラタップでアクティブスキルを発動
                member.addEventListener('click', (e) => {
                    const attr = e.currentTarget.dataset.attr;
                    const wordId = e.currentTarget.dataset.wordId;
                    window.GameController.activateSkill(attr, wordId);
                });

                partyContainer.appendChild(member);
                renderedCount++;
            }
        });

        // 誰も解放していない場合の仮のスキル妖精
        if (renderedCount === 0) {
            const types = ['fire', 'water', 'wood'];
            types.forEach(type => {
                const member = document.createElement('div');
                const isReady = (skillTracker[type] || 0) <= 0;
                member.className = `party-member char-${type} ${isReady ? 'skill-ready' : ''}`;
                member.innerText = type === 'fire' ? '火妖' : type === 'water' ? '水妖' : '木妖';
                member.dataset.attr = type;
                member.dataset.wordId = `fairy_${type}`;
                
                member.addEventListener('click', (e) => {
                    window.GameController.activateSkill(e.currentTarget.dataset.attr, e.currentTarget.dataset.wordId);
                });
                partyContainer.appendChild(member);
            });
        }
    },

    pullGacha() {
        const save = window.GameStateManager.saveData;
        if (save.ep < 15) {
            alert("所持EPが足りません！ダンジョンをクリアしてEPを稼ぎましょう！");
            return;
        }

        const db = window.GameStateManager.wordDatabase;
        const unmastered = db.filter(w => save.words[w.id].status !== 'mastered');
        
        const resultBox = document.getElementById('gacha-result');
        if (!resultBox) return;
        resultBox.style.display = 'block';

        if (unmastered.length === 0) {
            resultBox.innerHTML = `<h4>召喚結果</h4><p style="margin-top:5px; color:#27ae60;">おめでとうございます！現在のチャプターに未マスターの英単語キャラは存在しません！</p>`;
            return;
        }

        save.ep -= 15;
        this.updateHeaderStats();

        const prize = unmastered[Math.floor(Math.random() * unmastered.length)];
        const wordState = save.words[prize.id];
        
        wordState.status = 'encountered';
        wordState.correct_count += 1;
        window.GameStateManager.save();

        resultBox.innerHTML = `
            <h4 style="color:#f1c40f;">✨ 召喚成功！ ✨</h4>
            <div style="font-size:36px; margin:10px 0;">${prize.sprite}</div>
            <p style="font-size:16px; font-weight:bold; color:#fff;">${prize.word}</p>
            <p style="font-size:12px; color:#bdc3c7;">意味: ${prize.meaning}</p>
            <p style="font-size:10px; color:#27ae60; margin-top:5px;">遭遇に成功＆マスター条件1回分を自動チャージ！</p>
        `;
    },

    resetGameData() {
        if (confirm("これまでの単語の暗記状況、プレイヤーランク、EPなどのセーブデータをすべてリセットします。本当によろしいですか？")) {
            localStorage.removeItem('vocab_rpg_save');
            alert("データをリセットしました。アプリを再読み込みします。");
            location.reload();
        }
    }
};
