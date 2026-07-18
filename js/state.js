window.GameStateManager = {
    wordDatabase: [],
    currentChapterNum: "1-1", // デフォルトチャプターキーを "1-1" に変更
    
    saveData: {
        rank: 1,
        ep: 100,
        gold: 500,
        words: {} 
    },

    fallbackChapters: {
        "1-1": [
            { "id": "sistand_0001", "word": "follow", "meaning": "に続く、に従う", "part_of_speech": "動詞", "sprite": "👥", "etymology": "語源: follow her advice（彼女の助言に従う）、as follows（次のように）", "distractors": ["を決定する", "を保護する"], "poison_distractor": "を許す", "has_related": true, "related_type": "phrase", "related_question": "follow her ( ____ ) （彼女の助言に従う）", "related_correct": "advice", "related_distractors": ["device", "service", "notice"], "related_meaning": "彼女の助言に従う" },
            { "id": "sistand_0002", "word": "consider", "meaning": "を考慮する、みなす", "part_of_speech": "動詞", "sprite": "🤔", "etymology": "注意: considerは他動詞。consider A as B（AをBとみなす）", "distractors": ["を関係づける", "を描写する"], "poison_distractor": "構成される", "has_related": true, "related_type": "derivative", "related_question": "思いやりのある（形）: ( ____ )", "related_correct": "considerate", "related_distractors": ["considerable", "consideration", "considering"], "related_meaning": "considerate：思いやりのある" },
            { "id": "sistand_0003", "word": "increase", "meaning": "増える、を増やす", "part_of_speech": "動詞", "sprite": "📈", "etymology": "対義語: decrease（減る）。副詞: increasingly（ますます）", "distractors": ["を減少させる", "を破壊する"], "poison_distractor": "減少する", "has_related": true, "related_type": "phrase", "related_question": "increase ( ____ ) 20% （20%増加する）", "related_correct": "by", "related_distractors": ["at", "to", "for"], "related_meaning": "increase by 20%：20%増加する" },
            { "id": "sistand_0004", "word": "expect", "meaning": "を予期する、期待する", "part_of_speech": "動詞", "sprite": "⏱️", "etymology": "構文: expect A to V（AがVするのを予期する）", "distractors": ["を提案する", "を説得する"], "poison_distractor": "を検査する", "has_related": true, "related_type": "phrase", "related_question": "expect you ( ____ ) arrive soon （君がすぐ着くことを予期する）", "related_correct": "to", "related_distractors": ["for", "at", "about"], "related_meaning": "expect A to V：AがVするのを予期する" },
            { "id": "sistand_0005", "word": "decide", "meaning": "を決定する、判断する", "part_of_speech": "動詞", "sprite": "⚖️", "etymology": "名詞: decision（決定）。形容詞: decisive（決定的な、断固とした）", "distractors": ["を供給する", "を雇用する"], "poison_distractor": "を分割する", "has_related": true, "related_type": "derivative", "related_question": "決定的な、断固とした（形）: ( ____ )", "related_correct": "decisive", "related_distractors": ["decision", "decide", "division"], "related_meaning": "decisive：決定的な、断固とした" },
            { "id": "sistand_0006", "word": "develop", "meaning": "を発達させる、開発する", "part_of_speech": "動詞", "sprite": "🧪", "etymology": "名詞: development（発達）。developing country（発展途上国）", "distractors": ["を非難する", "を制限する"], "poison_distractor": "を配達する", "has_related": true, "related_type": "phrase", "related_question": "develop a unique ( ____ ) （特殊な能力を発達させる）", "related_correct": "ability", "related_distractors": ["utility", "reality", "quality"], "related_meaning": "能力を発達させる" },
            { "id": "sistand_0007", "word": "provide", "meaning": "を供給する、与える", "part_of_speech": "動詞", "sprite": "🎁", "etymology": "構文: provide A with B = provide B to A", "distractors": ["を分析する", "を解決する"], "poison_distractor": "を証明する", "has_related": true, "related_type": "phrase", "related_question": "provide him ( ____ ) information （彼に情報を与える）", "related_correct": "with", "related_distractors": ["for", "to", "about"], "related_meaning": "provide A with B：彼に情報を与える" },
            { "id": "sistand_0008", "word": "continue", "meaning": "続く、を続ける", "part_of_speech": "動詞", "sprite": "🔁", "etymology": "形容詞: continuous（絶え間ない）、continual（繰り返される）", "distractors": ["を輸入する", "を展示する"], "poison_distractor": "を含んでいる", "has_related": true, "related_type": "derivative", "related_question": "絶え間ない（休みない）（形）: ( ____ )", "related_correct": "continuous", "related_distractors": ["continual", "continuity", "contains"], "related_meaning": "continuous：絶え間ない（休みない）" },
            { "id": "sistand_0009", "word": "include", "meaning": "を含む、含める", "part_of_speech": "動詞", "sprite": "📦", "etymology": "前置詞: including（〜を含めて）。対義語: exclude", "distractors": ["を誤解する", "を当惑させる"], "poison_distractor": "を除外する", "has_related": true, "related_type": "phrase", "related_question": "The list includes his ( ____ ). （リストは彼の名前を含んでいる）", "related_correct": "name", "related_distractors": ["same", "game", "fame"], "related_meaning": "リストは彼の名前を含んでいる" },
            { "id": "sistand_0010", "word": "remain", "meaning": "のままでいる、残る", "part_of_speech": "動詞", "sprite": "⏳", "etymology": "名詞: remains（遺物）。remain to be Ved（これからVされねばならない）", "distractors": ["を指示する", "を治療する"], "poison_distractor": "を思い出させる", "has_related": true, "related_type": "phrase", "related_question": "remain ( ____ ) （黙ったままでいる）", "related_correct": "silent", "related_distractors": ["science", "client", "salient"], "related_meaning": "remain silent：黙ったままでいる" }
        ],
        "1-2": [
            { "id": "sistand_0088", "word": "vary", "meaning": "変わる、さまざまである", "part_of_speech": "動詞", "sprite": "🎨", "etymology": "形容詞: various（さまざまな）。副詞: invariably（いつも、変わることなく）", "distractors": ["を主張する", "を決定する"], "poison_distractor": "を固定する", "has_related": true, "related_type": "phrase", "related_question": "vary from country to ( ____ ) （国によって変わる）", "related_correct": "country", "related_distractors": ["county", "counter", "century"], "related_meaning": "国によって変わる" },
            { "id": "sistand_0089", "word": "remove", "meaning": "を移す、取り去る", "part_of_speech": "動詞", "sprite": "🚚", "etymology": "名詞: removal（除去、移動）。衣服を脱ぐ（＝take off）", "distractors": ["を関係づける", "を当惑させる"], "poison_distractor": "を移動する", "has_related": true, "related_type": "phrase", "related_question": "remove the ( ____ ) （カバーを取り除く）", "related_correct": "cover", "related_distractors": ["color", "lover", "cave"], "related_meaning": "カバーを取り除く" },
            { "id": "sistand_0090", "word": "insist", "meaning": "を強く主張する、と言い張る", "part_of_speech": "動詞", "sprite": "🗣️", "etymology": "insist on A（Aを強く主張する）、insist that S + S V（〜することを要求する）", "distractors": ["に接近する", "を拒絶する"], "poison_distractor": "をさまたげる", "has_related": true, "related_type": "phrase", "related_question": "insist ( ____ ) going to France （フランスに行くと言い張る）", "related_correct": "on", "related_distractors": ["at", "for", "about"], "related_meaning": "フランスに行くと言い張る" },
            { "id": "sistand_0091", "word": "examine", "meaning": "を調査する、検査する", "part_of_speech": "動詞", "sprite": "🔎", "etymology": "名詞: examination（試験、調査）。類義語: look into, go over", "distractors": ["をさまたげる", "を治療する"], "poison_distractor": "を検査される", "has_related": true, "related_type": "phrase", "related_question": "examine every ( ____ ) （あらゆる記録を調べる）", "related_correct": "record", "related_distractors": ["report", "reward", "result"], "related_meaning": "あらゆる記録を調べる" },
            { "id": "sistand_0092", "word": "remind", "meaning": "AにBのことを思い出させる", "part_of_speech": "動詞", "sprite": "🧠", "etymology": "構文: remind A of B（AにBを思い出させる）、remind A to V（Vするのを思い出させる）", "distractors": ["に接近する", "を意味する"], "poison_distractor": "を思い出す", "has_related": true, "related_type": "phrase", "related_question": "remind him ( ____ ) the promise （彼に約束を思い出させる）", "related_correct": "of", "related_distractors": ["for", "about", "with"], "related_meaning": "約束を思い出させる" },
            { "id": "sistand_0093", "word": "contribute", "meaning": "貢献する、一因となる", "part_of_speech": "動詞", "sprite": "🌍", "etymology": "名詞: contribution（貢献）。CO2は地球温暖化の一因だ（contribute to）", "distractors": ["に依存する", "を誤解する"], "poison_distractor": "を寄付させる", "has_related": true, "related_type": "phrase", "related_question": "contribute to world ( ____ ) （世界平和に貢献する）", "related_correct": "peace", "related_distractors": ["piece", "place", "price"], "related_meaning": "世界平和に貢献する" },
            { "id": "sistand_0094", "word": "warn", "meaning": "に警告する", "part_of_speech": "動詞", "sprite": "🚨", "etymology": "構文: warn A of B（AにBを警告する）、名詞: warning（警告、警報）", "distractors": ["を説得する", "を非難する"], "poison_distractor": "を警告される", "has_related": true, "related_type": "phrase", "related_question": "warn him of the ( ____ ) （彼に危険を警告する）", "related_correct": "danger", "related_distractors": ["anger", "dinner", "damage"], "related_meaning": "彼に危険を警告する" },
            { "id": "sistand_0095", "word": "connect", "meaning": "をつなぐ、関係づける", "part_of_speech": "動詞", "sprite": "🔌", "etymology": "名詞: connection（関係）。be connected to A（Aと関係がある）", "distractors": ["を向上させる", "に匹敵する"], "poison_distractor": "を接続させる", "has_related": true, "related_type": "phrase", "related_question": "connect the computer ( ____ ) the Internet （ネットにつなぐ）", "related_correct": "to", "related_distractors": ["for", "at", "with"], "related_meaning": "コンピュータをインターネットにつなぐ" },
            { "id": "sistand_0096", "word": "match", "meaning": "に匹敵する、調和する", "part_of_speech": "動詞", "sprite": "🆚", "etymology": "名詞: 試合、競争相手。その靴は君の服に合っている（The shoes match your dress.）", "distractors": ["を保護する", "に近づく"], "poison_distractor": "をマッチさせる", "has_related": true, "related_type": "phrase", "related_question": "match him in ( ____ ) （力で彼に匹敵する）", "related_correct": "power", "related_distractors": ["paper", "poker", "tower"], "related_meaning": "力で彼に匹敵する" },
            { "id": "sistand_0097", "word": "focus", "meaning": "焦点を合わせる、集中する", "part_of_speech": "動詞", "sprite": "🎯", "etymology": "構文: focus on A（Aに焦点を合わせる）。名詞: 焦点", "distractors": ["を拡大する", "を歓迎する"], "poison_distractor": "をピントを合わせる", "has_related": true, "related_type": "phrase", "related_question": "focus ( ____ ) the problem （その問題に焦点を合わせる）", "related_correct": "on", "related_distractors": ["at", "for", "about"], "related_meaning": "その問題に焦点を合わせる" }
        ],
        "2": [
            { "id": "sistand_0601", "word": "banish", "meaning": "を追放する、追い払う", "part_of_speech": "動詞", "sprite": "💥", "etymology": "語源: ban(布告) + ish(動詞化) = 追放を公式に布告する", "distractors": ["を確立する", "を保護する", "を誇張する"] },
            { "id": "sistand_0602", "word": "biodiversity", "meaning": "生物の多様性", "part_of_speech": "名詞", "sprite": "🌱", "etymology": "語源: bio(生命) + diversity(多様性) = 生物学的な多様さ", "distractors": ["高度な科学技術", "厳しい逆境", "人類の歴史"] }
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
        
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            parsed = { rank: 1, ep: 100, gold: 500, words: {} };
        }

        if (!parsed.words || typeof parsed.words !== 'object' || Array.isArray(parsed.words)) {
            parsed.words = {};
        }

        if (typeof parsed.rank !== 'number' || isNaN(parsed.rank)) parsed.rank = 1;
        if (typeof parsed.ep !== 'number' || isNaN(parsed.ep)) parsed.ep = 100;
        if (typeof parsed.gold !== 'number' || isNaN(parsed.gold)) parsed.gold = 500;

        this.saveData = parsed;
        
        // サイクル学習用フラグ（learned_in_cycle）の補正・自動移行
        if (this.wordDatabase && Array.isArray(this.wordDatabase)) {
            this.wordDatabase.forEach(word => {
                if (!this.saveData.words[word.id] || typeof this.saveData.words[word.id] !== 'object') {
                    this.saveData.words[word.id] = {
                        status: 'none',
                        correct_count: 0,
                        incorrect_count: 0,
                        is_favorite: false,
                        learned_in_cycle: false // 初期ステート
                    };
                } else if (typeof this.saveData.words[word.id].learned_in_cycle === 'undefined') {
                    this.saveData.words[word.id].learned_in_cycle = false; // 旧セーブデータからの補正
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
