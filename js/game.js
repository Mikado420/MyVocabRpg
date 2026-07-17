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

    enemyConfigs:
