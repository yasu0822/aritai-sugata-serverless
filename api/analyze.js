export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // リクエストボディの取得
    const { words, accessCode } = req.body || {};

    // 入力検証
    if (!words || !accessCode) {
      return res.status(400).json({ error: 'ワードとアクセスコードを入力してください' });
    }

    // アクセスコード確認
    const validCodes = ['VISION2025JUL'];
    if (!validCodes.includes(accessCode)) {
      return res.status(403).json({ error: 'アクセスコードが正しくありません' });
    }

    // 環境変数確認
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'サーバー設定エラー' });
    }

    // OpenAI API呼び出し
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `あなたは百戦錬磨のメンターです。

以下のワード・文章から、その人だけのオーダーメイドな分析を行ってください。

入力されたワード・文章：
${words}

以下の形式で出力してください：

ありたい姿：[15-25文字の魅力的な表現]

解説：[ワクワクする具体的シーンを含む100-150文字の描写]

行動案：
1. [具体的で楽しい行動1]
2. [具体的で楽しい行動2]
3. [具体的で楽しい行動3]

※入力ワードをそのまま使わず、その奥にある本質的な魅力を表現してください`
        }],
        max_tokens: 800,
        temperature: 0.8
      })
    });

    // OpenAI APIレスポンス確認
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      return res.status(500).json({ error: 'AI分析でエラーが発生しました' });
    }

    const openaiData = await openaiResponse.json();
    
    // レスポンス検証
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      return res.status(500).json({ error: '分析結果の取得に失敗しました' });
    }

    const result = openaiData.choices[0].message.content;
    
    // 成功レスポンス
    return res.status(200).json({ result });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: '分析中にエラーが発生しました' });
  }
}
