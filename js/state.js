window.GameStateManager = {
    wordDatabase: [],
    currentChapterNum: 1, 
    
    saveData: {
        rank: 1,
        ep: 100,
        gold: 500,
        words: {} 
    },

    fallbackChapters: {
        "1": [
            { "id": "sistand_0001", "word": "abandon", "meaning": "を捨てる、諦める", "part_of_speech": "動詞", "attr": "fire", "sprite": "🔥", "minimal_phrase": "abandon a plan", "phrase_mask": "abandon a ( ____ )", "phrase_correct": "plan", "phrase_distractors": ["play", "place", "plain"], "phrase_meaning": "計画をあきらめる", "etymology": "語源: a(〜へ) + bandon(支配) = 支配下に投げ捨てる", "distractors": ["を始める", "を禁止する"], "poison_distractor": "を置き忘れる" },
            { "id": "sistand_0002", "word": "acquire", "meaning": "を取得する、身につける", "part_of_speech": "動詞", "attr": "fire", "sprite": "🦁", "minimal_phrase": "acquire a computer skill", "phrase_mask": "acquire a computer ( ____ )", "phrase_correct": "skill", "phrase_distractors": ["skull", "tool", "skin"], "phrase_meaning": "コンピュータの技術を身につける", "etymology": "語源: ac(〜へ) + quire(求める) = 求め続けて手に入れる", "distractors": ["を調査する", "をあきらめる"], "poison_distractor": "を要求する" },
            { "id": "sistand_0003", "word": "agriculture", "meaning": "農業", "part_of_speech": "名詞", "attr": "water", "sprite": "💧", "minimal_phrase": "modern agriculture", "phrase_mask": "modern ( ____ )", "phrase_correct": "agriculture", "phrase_distractors": ["architecture", "chemistry", "archeology"], "phrase_meaning": "現代農業", "etymology": "語源: agri(野原) + culture(耕作) = 野原を耕すこと", "distractors": ["気象学", "高度な科学"], "poison_distractor": "建築・土木" },
            { "id": "sistand_0004", "word": "authority", "meaning": "権威、権限", "part_of_speech": "名詞", "attr": "water", "sprite": "🐳", "minimal_phrase": "the authority of the government", "phrase_mask": "the authority of the ( ____ )", "phrase_correct": "government", "phrase_distractors": ["environment", "monument", "apartment"], "phrase_meaning": "政府の権威", "etymology": "語源: author(創始者) + ity(性質) = 絶対的な力を持つ人", "distractors": ["本物の価値", "企業の誠実さ"], "poison_distractor": "著者、作家" },
            { "id": "sistand_0005", "word": "accurate", "meaning": "正確な、精密な", "part_of_speech": "形容詞", "attr": "wood", "sprite": "🌲", "minimal_phrase": "provide accurate information", "phrase_mask": "provide ( ____ ) information", "phrase_correct": "accurate", "phrase_distractors": ["acute", "abundant", "accumulated"], "phrase_meaning": "正確な情報を提供する", "etymology": "語源: ac(〜へ) + cure(手入れ・注意) = 注意深く手入れされた", "distractors": ["資源が豊富な", "蓄積された"], "poison_distractor": "鋭く深い" },
            { "id": "sistand_0006", "word": "advocate", "meaning": "を主張する、支持する", "part_of_speech": "動詞", "attr": "fire", "sprite": "📣", "minimal_phrase": "advocate human rights", "phrase_mask": "advocate human ( ____ )", "phrase_correct": "rights", "phrase_distractors": ["lights", "fights", "flights"], "phrase_meaning": "人権を主張する", "etymology": "語源: ad(〜へ) + voc(声・呼ぶ) = 〜を求めて声を上げる", "distractors": ["を決定する", "を疑う"], "poison_distractor": "を呼びかける" },
            { "id": "sistand_0007", "word": "allocate", "meaning": "を割り当てる、分配する", "part_of_speech": "動詞", "attr": "fire", "sprite": "📊", "minimal_phrase": "allocate a budget", "phrase_mask": "allocate a ( ____ )", "phrase_correct": "budget", "phrase_distractors": ["target", "market", "bullet"], "phrase_meaning": "予算を割り当てる", "etymology": "語源: ad(〜へ) + loc(場所) = 各場所に配置する", "distractors": ["を拒否する", "を消費する"], "poison_distractor": "を配置する" },
            { "id": "sistand_0008", "word": "alternative", "meaning": "代わりの、選択肢", "part_of_speech": "形容詞", "attr": "wood", "sprite": "🔄", "minimal_phrase": "an alternative energy source", "phrase_mask": "an alternative ( ____ ) source", "phrase_correct": "energy", "phrase_distractors": ["gravity", "security", "activity"], "phrase_meaning": "代替エネルギー源", "etymology": "語源: alter(他のもの) = もうひとつの代わりのもの", "distractors": ["伝統的な", "正確な"], "poison_distractor": "交代の、交互の" },
            { "id": "sistand_0009", "word": "analyze", "meaning": "を分析する", "part_of_speech": "動詞", "attr": "fire", "sprite": "🔍", "minimal_phrase": "analyze the data", "phrase_mask": "analyze the ( ____ )", "phrase_correct": "data", "phrase_distractors": ["date", "debt", "deal"], "phrase_meaning": "データを分析する", "etymology": "語源: ana(徹底的に) + lyze(解きほぐす) = 細かく解き明かす", "distractors": ["を集める", "を無視する"], "poison_distractor": "を解剖する" },
            { "id": "sistand_0010", "word": "ancestor", "meaning": "祖先、先祖", "part_of_speech": "名詞", "attr": "water", "sprite": "👴", "minimal_phrase": "worship ancestors", "phrase_mask": "worship ( ____ )", "phrase_correct": "ancestors", "phrase_distractors": ["monsters", "ministers", "masters"], "phrase_meaning": "祖先を崇拝する", "etymology": "語源: ante(前に) + cessor(行く人) = 以前に進んだ人々", "distractors": ["子孫", "指導者"], "poison_distractor": "古代人" },
            { "id": "sistand_0011", "word": "anxiety", "meaning": "心配、不安", "part_of_speech": "名詞", "attr": "water", "sprite": "😰", "minimal_phrase": "relieve anxiety", "phrase_mask": "relieve ( ____ )", "phrase_correct": "anxiety", "phrase_distractors": ["society", "variety", "gravity"], "phrase_meaning": "不安を和らげる", "etymology": "語源: anx(絞め殺すような苦しみ) + iety(状態)", "distractors": ["社会の仕組み", "重大な責任"], "poison_distractor": "怒り、いらだち" },
            { "id": "sistand_0012", "word": "apparent", "meaning": "明白な、明らかな", "part_of_speech": "形容詞", "attr": "wood", "sprite": "☀️", "minimal_phrase": "for no apparent reason", "phrase_mask": "for no ( ____ ) reason", "phrase_correct": "apparent", "phrase_distractors": ["abundant", "artificial", "accidental"], "phrase_meaning": "明白な理由なしに", "etymology": "語源: ap(〜へ) + par(現れる・見える) = 一目で見える状態の", "distractors": ["一時的な", "複雑な"], "poison_distractor": "豊かな" },
            { "id": "sistand_0013", "word": "appreciate", "meaning": "を正しく評価する、感謝する", "part_of_speech": "動詞", "attr": "fire", "sprite": "🙏", "minimal_phrase": "appreciate art", "phrase_mask": "appreciate ( ____ )", "phrase_correct": "art", "phrase_distractors": ["act", "arc", "air"], "phrase_meaning": "芸術を正しく理解する", "etymology": "語源: ap(〜へ) + preci(価値・価格) = 正しい価値を見出す", "distractors": ["を誤解する", "を批判する"], "poison_distractor": "を褒める" },
            { "id": "sistand_0014", "word": "approach", "meaning": "に近づく、接近する", "part_of_speech": "動詞", "attr": "fire", "sprite": "🏃", "minimal_phrase": "approach the target", "phrase_mask": "approach the ( ____ )", "phrase_correct": "target", "phrase_distractors": ["market", "ticket", "jacket"], "phrase_meaning": "目標に近づく", "etymology": "語源: ap(〜へ) + proach(近い) = 〜のほうへ近づく", "distractors": ["を避ける", "を歓迎する"], "poison_distractor": "に追いつく" },
            { "id": "sistand_0015", "word": "appropriate", "meaning": "適切な、ふさわしい", "part_of_speech": "形容詞", "attr": "wood", "sprite": "👌", "minimal_phrase": "take appropriate action", "phrase_mask": "take ( ____ ) action", "phrase_correct": "appropriate", "phrase_distractors": ["approximate", "aggressive", "arrogant"], "phrase_meaning": "適切な行動を取る", "etymology": "語源: ap(〜へ) + propri(独自の・適した) = 目的に適した", "distractors": ["傲慢な", "無関係な"], "poison_distractor": "およその、大体の" }
        ],
        "2": [
            { "id": "sistand_0601", "word": "banish", "meaning": "を追放する、追い払う", "part_of_speech": "動詞", "attr": "fire", "sprite": "💥", "minimal_phrase": "banish fear from mind", "phrase_mask": "banish fear from ( ____ )", "phrase_correct": "mind", "phrase_distractors": ["mine", "kind", "wind"], "phrase_meaning": "心から恐怖を追い払う", "etymology": "語源: ban(布告) + ish(動詞化) = 追放を公式に布告する", "distractors": ["を確立する", "を保護する", "を誇張する"] },
            { "id": "sistand_0602", "word": "biodiversity", "meaning": "生物の多様性", "part_of_speech": "名詞", "attr": "water", "sprite": "🌱", "minimal_phrase": "preserve biodiversity", "phrase_mask": "preserve ( ____ )", "phrase_correct": "biodiversity", "phrase_distractors": ["adversity", "university", "necessity"], "phrase_meaning": "生物の多様性を保護する", "etymology": "語源: bio(生命) + diversity(多様性) = 生物学的な多様さ", "distractors": ["高度な科学技術", "厳しい逆境", "人類の歴史"] }
        ]
    },

    async loadChapter(chapterNum) {
        const numStr = String(chapterNum);
        try {
            const response = await fetch(`data/chapter${numStr}.json`);
            if (!response.ok) throw new Error(`chapter${numStr}.json load failed`);
            const data = await response.json();
            
            if (data && data.words) {
                this.wordDatabase = data.words;
                this.currentChapterNum = chapterNum;
            } else {
                throw new Error("JSON structure invalid");
            }
        } catch (error) {
            console.warn(`chapter${numStr}.json の読み込みに失敗したためフォールバックします:`, error);
            this.wordDatabase = this.fallbackChapters[numStr] || [];
            this.currentChapterNum = chapterNum;
        }
        this.loadSaveData();
    },

    loadSaveData() {
        const stored = localStorage.getItem('vocab_rpg_save');
        let parsed = null;
        if (stored) {
            try {
                parsed = JSON.parse(stored);
            } catch (e) {
                console.error("セーブデータのパースエラー。初期化します:", e);
            }
        }
        
        // 壊れたデータ（nullや空配列など）を完全に排除して新規データに置き換え
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            parsed = { rank: 1, ep: 100, gold: 500, words: {} };
        }

        // words プロパティがオブジェクト（かつ配列ではない）であることを厳密に保証
        if (!parsed.words || typeof parsed.words !== 'object' || Array.isArray(parsed.words)) {
            parsed.words = {};
        }

        // 各数値パラメータの厳密な補正
        if (typeof parsed.rank !== 'number' || isNaN(parsed.rank)) parsed.rank = 1;
        if (typeof parsed.ep !== 'number' || isNaN(parsed.ep)) parsed.ep = 100;
        if (typeof parsed.gold !== 'number' || isNaN(parsed.gold)) parsed.gold = 500;

        this.saveData = parsed;
        
        // 未踏ステート補完
        if (this.wordDatabase && Array.isArray(this.wordDatabase)) {
            this.wordDatabase.forEach(word => {
                if (!this.saveData.words[word.id] || typeof this.saveData.words[word.id] !== 'object') {
                    this.saveData.words[word.id] = {
                        status: 'none',
                        correct_count: 0,
                        incorrect_count: 0,
                        is_favorite: false
                    };
                }
            });
        }
        this.save();
    },

    save() {
        localStorage.setItem('vocab_rpg_save', JSON.stringify(this.saveData));
    },

    encounterWord(id) {
        if (this.saveData.words[id] && this.saveData.words[id].status === 'none') {
            this.saveData.words[id].status = 'encountered';
            this.save();
        }
    },

    recordResult(id, isCorrect) {
        const record = this.saveData.words[id];
        if (!record) return;

        if (isCorrect) {
            record.correct_count++;
            if (record.status !== 'mastered' && record.correct_count >= 3) {
                record.status = 'mastered';
                setTimeout(() => {
                    alert(`🎉 【マスター】単語「${this.getWordName(id)}」を習得！仲間（キャラクター）として完全解放されました！`);
                }, 400);
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
    },

    calculateExpProgress() {
        if (!this.wordDatabase || this.wordDatabase.length === 0) return 0;
        let masteredCount = 0;
        this.wordDatabase.forEach(word => {
            const state = this.saveData.words[word.id];
            if (state && state.status === 'mastered') {
                masteredCount++;
            }
        });
        return Math.floor((masteredCount / this.wordDatabase.length) * 100);
    }
};
