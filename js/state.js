window.GameStateManager = {
    // マスター（デフォルト）データ
    wordDatabase: [],
    
    // ユーザーセーブデータ構造
    saveData: {
        rank: 1,
        ep: 100,
        // 各単語の学習ステータス記録
        // [wordId]: { status: 'none'|'encountered'|'mastered', correct: 0, incorrect: 0, fav: false }
        words: {} 
    },

    // ローカルデータのフォールバック（file:// 起動時のCORSエラー用）
    fallbackData: {
        "chapter_1": {
            "section_1": [
                {
                    "id": "sistand_0001",
                    "word": "abandon",
                    "meaning": "を捨てる、諦める",
                    "part_of_speech": "動詞",
                    "attr": "fire",
                    "sprite": "🔥",
                    "minimal_phrase": "abandon a plan",
                    "phrase_mask": "abandon a ( ____ )",
                    "phrase_correct": "plan",
                    "phrase_distractors": ["play", "place", "plain"],
                    "phrase_meaning": "計画をあきらめる",
                    "etymology": "語源: a(〜へ) + bandon(支配) = 支配下に投げ捨てる",
                    "distractors": ["（資源が）豊かな", "を始める", "を禁止する"]
                },
                {
                    "id": "sistand_0002",
                    "word": "acquire",
                    "meaning": "を取得する、身につける",
                    "part_of_speech": "動詞",
                    "attr": "fire",
                    "sprite": "🦁",
                    "minimal_phrase": "acquire a computer skill",
                    "phrase_mask": "acquire a computer ( ____ )",
                    "phrase_correct": "skill",
                    "phrase_distractors": ["skull", "tool", "skin"],
                    "phrase_meaning": "コンピュータの技術を身につける",
                    "etymology": "語源: ac(〜へ) + quire(求める) = 求め続けて手に入れる",
                    "distractors": ["を必要とする", "を調査する", "をあきらめる"]
                },
                {
                    "id": "sistand_0003",
                    "word": "agriculture",
                    "meaning": "農業",
                    "part_of_speech": "名詞",
                    "attr": "water",
                    "sprite": "💧",
                    "minimal_phrase": "modern agriculture",
                    "phrase_mask": "modern ( ____ )",
                    "phrase_correct": "agriculture",
                    "phrase_distractors": ["architecture", "chemistry", "archeology"],
                    "phrase_meaning": "現代農業",
                    "etymology": "語源: agri(野原) + culture(耕作) = 野原を耕すこと",
                    "distractors": ["建築・土木", "現代の文化", "高度な科学"]
                },
                {
                    "id": "sistand_0004",
                    "word": "authority",
                    "meaning": "権威、権限",
                    "part_of_speech": "名詞",
                    "attr": "water",
                    "sprite": "🐳",
                    "minimal_phrase": "the authority of the government",
                    "phrase_mask": "the authority of the ( ____ )",
                    "phrase_correct": "government",
                    "phrase_distractors": ["environment", "monument", "apartment"],
                    "phrase_meaning": "政府の権威",
                    "etymology": "語源: author(創始者) + ity(性質) = 絶対的な力を持つ人",
                    "distractors": ["信頼できる人", "本物の価値", "企業の誠実さ"]
                },
                {
                    "id": "sistand_0005",
                    "word": "accurate",
                    "meaning": "正確な、精密な",
                    "part_of_speech": "形容詞",
                    "attr": "wood",
                    "sprite": "🌲",
                    "minimal_phrase": "provide accurate information",
                    "phrase_mask": "provide ( ____ ) information",
                    "phrase_correct": "accurate",
                    "phrase_distractors": ["acute", "abundant", "accumulated"],
                    "phrase_meaning": "正確な情報を提供する",
                    "etymology": "語源: ac(〜へ) + cure(手入れ・注意) = 注意深く手入れされた",
                    "distractors": ["鋭く深い", "資源が豊富な", "蓄積された"]
                }
            ]
        }
    },

    async loadDatabase() {
        try {
            const response = await fetch('data/words.json');
            if (!response.ok) throw new Error("Fetch failed");
            const data = await response.json();
            this.wordDatabase = data.chapter_1.section_1;
        } catch (error) {
            console.warn("CORS制限を検出。フォールバック用内部データを使用します:", error);
            this.wordDatabase = this.fallbackData.chapter_1.section_1;
        }
        this.loadSaveData();
    },

    loadSaveData() {
        const stored = localStorage.getItem('vocab_rpg_save');
        if (stored) {
            try {
                this.saveData = JSON.parse(stored);
            } catch (e) {
                console.error("セーブデータの破損を検知:", e);
            }
        }
        
        // データベースの全単語に対する未踏ステートの補完
        this.wordDatabase.forEach(word => {
            if (!this.saveData.words[word.id]) {
                this.saveData.words[word.id] = {
                    status: 'none',
                    correct_count: 0,
                    incorrect_count: 0,
                    is_favorite: false
                };
            }
        });
        this.save();
    },

    save() {
        localStorage.setItem('vocab_rpg_save', JSON.stringify(this.saveData));
    },

    // 遭遇時の更新
    encounterWord(id) {
        if (this.saveData.words[id] && this.saveData.words[id].status === 'none') {
            this.saveData.words[id].status = 'encountered';
            this.save();
        }
    },

    // 正解・不正解時の記録
    recordResult(id, isCorrect) {
        const record = this.saveData.words[id];
        if (!record) return;

        if (isCorrect) {
            record.correct_count++;
            // 遭遇状態からマスター（累計3回正解）への昇格
            if (record.status !== 'mastered' && record.correct_count >= 3) {
                record.status = 'mastered';
                alert(`🎉 単語「${this.getWordName(id)}」をマスターしました！仲間として編成に組み込めます！`);
            }
        } else {
            record.incorrect_count++;
        }
        this.save();
    },

    getWordName(id) {
        const w = this.wordDatabase.find(x => x.id === id);
        return w ? w.word : "";
    },

    toggleFavorite(id) {
        if (this.saveData.words[id]) {
            this.saveData.words[id].is_favorite = !this.saveData.words[id].is_favorite;
            this.save();
        }
    }
};
