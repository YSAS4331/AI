(() => {
  const HP = 100; // イカ・タコの体力基準

  // === 正規化（カタカナ化＋小文字） ===
  function normalize(str) {
    return str
      .toLowerCase()
      .replace(/[ぁ-ん]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
  }

  // === レーベンシュタイン距離 ===
  function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  }

  // === 類似度スコア ===
  function scoreMatch(input, target) {
    let score = 0;
    const normInput = normalize(input);
    const normTarget = normalize(target);

    if (normInput === normTarget) score += 5;
    if (normTarget.includes(normInput)) score += normInput.length;
    if (normInput.includes(normTarget)) score += normTarget.length;

    const dist = levenshtein(normInput, normTarget);
    const len = Math.max(normInput.length, normTarget.length);
    const similarity = 1 - dist / len;
    if (similarity > 0.7) score += Math.floor(similarity * 5);

    return score;
  }

  // === ダメージからコンボ判定 ===
  function comboCheck(main, sub) {
    const total = main.damage * 2 + sub.damage;
    if (total >= HP) {
      return `**${sub.name}の爆風 + メイン2発**で相手を倒せます！`;
    } else if (main.damage * 3 >= HP) {
      return `**${main.name}**は3発でキル可能です。`;
    }
    return `主に**${sub.name}**で牽制し、メイン${main.damage}ダメージを活かすのがコツです。`;
  }

  // === 会話履歴 ===
  const history = [];

  async function createRes(message) {
    history.push({ role: "user", content: message });
    let responses = [];

    try {
      const candidates = [];

      // === キーワード応答 ===
      const keywords = {
        splatoon: ["Splatoon3", "スプラトゥーン3", "スプラ3"],
        you: ["あなた", "きみ", "君", "あんた", "自己紹介", "Who"],
        greeting: ["こんにちは", "おはよう", "こんばんは"],
      };

      if (keywords.splatoon.some(k => scoreMatch(message, k) >= 3)) {
        responses.push("Splatoon3ですね！\n武器・ステージ・ルール・ギア・立ち回りなど、何でも聞いてください。\n例えば「スプラシューターって強い？」「ガチエリアのコツは？」など、具体的に聞いてくれると嬉しいです！\n *** \nでは､Splatoon3について詳しく説明します:\n|質問|詳細情報|\n|:--|:--|\n|発売日|2022/09/09|\n|発売元/開発元|Nintendo|\n|対応機種|Nintendo Switch Nintendo Switch 2|\n|プレイ人数|1台あたり1人 最大8人|\n|価格|約¥6,500|");
      }

      if (keywords.you.some(k => scoreMatch(message, k) >= 3)) {
        responses.push("私はSplatoon3に特化して作成されたAIです。武器やステージ、ルールや立ち回りなど、Splatoon3に関することなら何でも答えますよ！");
      }
      
      const matchedGreetings = keywords.greeting.filter(k => scoreMatch(message, k) >= 3);
      
      if (matchedGreetings.length === 1) {
        responses.push(`${matchedGreetings[0]}！Splatoon3について何か知りたいことはありますか？`);
      } else if (matchedGreetings.length > 1) {
        const randomGreeting = matchedGreetings[Math.floor(Math.random() * matchedGreetings.length)];
        responses.push(`${randomGreeting}！Splatoon3について何か知りたいことはありますか？`);
      }

      // === 入力をスペースで分割 ===
      const tokens = message.split(/\s+/).filter(t => t.length > 0);

      for (const token of tokens) {
        // 武器
        for (const w of data.weapons) {
          const score = scoreMatch(token, w.name);
          if (score >= 2) candidates.push({ type: "weapon", item: w, score, token });
        }

        // ステージ
        for (const s of data.stages) {
          const score = scoreMatch(token, s.name);
          if (score >= 2) candidates.push({ type: "stage", item: s, score, token });
        }

        // ルール
        for (const r of data.rules) {
          const score = scoreMatch(token, r.name);
          if (score >= 2) candidates.push({ type: "rule", item: r, score, token });
        }
      }

      // === トークンごとに処理 ===
      const grouped = {};
      for (const c of candidates) {
        if (!grouped[c.token]) grouped[c.token] = [];
        grouped[c.token].push(c);
      }

      for (const token in grouped) {
        const group = grouped[token].sort((a, b) => b.score - a.score);
        const topScore = group[0].score;
        const topCandidates = group.filter(c => c.score === topScore);

        if (topCandidates.length > 1) {
          responses.push(`"${token}" に一致する候補が複数あります:\n${topCandidates.map((c, i) => `${i+1} ${c.item.name}`).join("\n")}\n番号で選んでください`);
        } else {
          const best = topCandidates[0];
          history.push({ role: "ai", content: best.item.name });

          if (best.type === "weapon") {
            const w = best.item;
            const subName = data.getSubName(w.sub);
            const spName = data.getSpName(w.sp);
            const subData = data.subs.find(s => s.id === w.sub);
            const combo = subData ? comboCheck(w, subData) : "";
            const sup = w.sup ? `\n***\n補足:\n${w.sup}` : "";

            responses.push(`${w.name} の基本情報は以下の通りです。\nサブ: ${subName}\nスペシャル: ${spName}\n攻撃力: ${w.damage}\n役割: ${w.role}\nおすすめギア: ${w.gear.join("・")}\n${combo}${sup}`);
          }

          if (best.type === "stage") {
            responses.push(`${best.item.name} の立ち回りポイント:\n${best.item.tips}`);
          }

          if (best.type === "rule") {
            const lastAI = history.slice().reverse().find(h => h.role === "ai")?.content;
            if (lastAI?.includes(best.item.name)) {
              responses.push(`また${best.item.name}の話ですね。前回より詳しく説明しますね。`);
            } else {
              responses.push(`${best.item.name} では ${best.item.focus} が重要です。`);
            }
          }
        }
      }

      // === 最終まとめ ===
      if (responses.length === 0) {
        return "私はSplatoon3に特化したAIです\nSplatoon3以外の質問やデータベースにない質問には答えられません\nもしSplatoon3に関する質問であった場合､さらに詳しくお書きください";
      } else if (responses.length === 1) {
        return responses[0];
      } else {
        return `複数の質問があるのでまとめて返しますね:\n\n${responses.join("\n\n")}`;
      }

    } catch (err) {
      console.error("createRes内でエラー:", err);
      return `処理中にエラーが発生しました。\n${err}`;
    }
  }

  window.API = {
    send: async (msg) => await createRes(msg.trim()),
    datas: (args) => {
      let result = window.data;
      if (args) {
        try {
          result = Function("data", `return data.${args}`)(window.data);
        } catch (e) {
          result = `データ参照エラー: ${e.message}`;
        }
      }
      return JSON.stringify(result, null, 2);
    },
    echo: (args) => {
      return args;
    },
    copy: (id) => {
      function escapeHtml(str) {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }
      if (Number.isInteger(id)) return "数値を指定してください";
      const el = document.getElementById(`chat-${id}`);
      return el ? escapeHtml(el.innerHTML) : "";
    },
    APIs: () => {
      return Object.entries(window.API)
      .map(([key, val]) => {
        if (typeof val === "function") {
          return `${key}: ${val.toString()}`;
        }
        try {
          return `${key}: ${JSON.stringify(val, null, 2)}`;
        } catch {
          return `${key}: ${String(val)}`;
        }
      })
      .join("\n\n");
    }
  };
})();