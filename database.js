(() => {
  window.data = {
    weapons: [
      { name: "スプラシューター", sub: "2", sp: "1", role: "バランス", gear: ["イカ速", "安全靴"] },
      { name: "スプラシューターコラボ", sub: "1", sp: "9", role: "バランス", gear: ["イカ速", "安全靴"] },
      { name: ".52ガロン", sub: "9", sp: "6", role: "前衛", gear: ["メイン性能", "ステジャン"] },
      { name: "スプラチャージャー", sub: "1", sp: "5", role: "後衛", gear: ["ヒト速", "安全靴"] }
    ],
    stages: [
      { name: "ユノハナ大渓谷", tips: "高台を取ると有利" },
      { name: "マサバ海峡大橋", tips: "中央の橋を制圧するのが重要" }
    ],
    rules: [
      { name: "ガチエリア", focus: "塗りと維持力" },
      { name: "ガチヤグラ", focus: "防衛と高台処理" }
    ],
    subs: [
      { name: "スプラッシュボム", id: "1" },
      { name: "キューバンボム", id: "2" },
      { name: "クイックボム", id: "3" },
      { name: "カーリングボム", id: "4" },
      { name: "タンサンボム", id: "5" },
      { name: "ロボットボム", id: "6" },
      { name: "トーピード", id: "7" },
      { name: "スプリンクラー", id: "8" },
      { name: "スプラッシュシールド", id: "9" },
      { name: "ジャンプビーコン", id: "10" },
      { name: "ポイントセンサー", id: "11" },
      { name: "トラップ", id: "12" },
      { name: "ポイズンミスト", id: "13" },
      { name: "ラインマーカー", id: "14" }
    ],
    sp: [
      { name: "ウルトラショット", id: "1" },
      { name: "グレードバリア", id: "2" },
      { name: "ショクワンダー", id: "3" },
      { name: "ホップソナー", id: "4" },
      { name: "キューインキ", id: "5" },
      { name: "メガホンレーザー5.1ch", id: "6" },
      { name: "カニタンク", id: "7" },
      { name: "サメライド", id: "8" },
      { name: "トリプルトルネード", id: "9" },
      { name: "エナジースタンド", id: "10" },
      { name: "テイオウイカ", id: "11" },
      { name: "デコイチラシ", id: "12" },
      { name: "スミナガシート", id: "13" },
      { name: "ウルトラチャクチ", id: "14" }
    ],

    // サブIDからサブ名を取得
    getSubName(id) {
      const sub = this.subs.find(s => s.id === id);
      return sub ? sub.name : "不明";
    },

    getSpName(id) {
      const sp = this.sp.find(s => s.id === id);
      return sp ? sp.name : "不明";
    },

    // 武器検索（完全一致）
    getWeapon(name) {
      return this.weapons.find(w => w.name === name);
    },

    // ステージ検索（完全一致）
    getStage(name) {
      return this.stages.find(s => s.name === name);
    },

    // ルール検索（完全一致）
    getRule(name) {
      return this.rules.find(r => r.name === name);
    },

    // サブ検索（完全一致）
    getSub(name) {
      return this.subs.find(s => s.name === name || s.id === name);
    },

    // 部分一致検索（武器・ステージ・ルールをまとめて探す）
    searchAll(keyword) {
      return {
        weapon: this.weapons.find(w => w.name.includes(keyword)),
        stage: this.stages.find(s => s.name.includes(keyword)),
        rule: this.rules.find(r => r.name.includes(keyword)),
        sub: this.subs.find(s => s.name.includes(keyword))
      };
    }
  };
})();