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
          content: `あなたは人生経験が豊富で他者の曖昧な言葉や表現の奥にある本質を読み取ってアナロジー思考で考えられる非凡なメンターです。

入力されたワード・文章を深く分析し、そこに秘められた潜在的な可能性を見つけ出し、
ユーザーが心からワクワクして「もっと探究してみたい！」と思えるアナロジーに富んだ提案をしてください。

入力されたワード・文章：
${words}

探究心をくすぐる示唆に富んだ表現で以下の形式で出力してください：

ありたい姿：[25-35文字の魅力的な表現]

解説：[ありたい姿への潜在意識を引き出すアナロジーに富んだ具体的な120-170文字の描写]

行動案：
1. [楽しみながら実践できる150-200文字の具体的行動]
2. [発見や成長を感じられる150-200文字の具体的行動]
3. [仲間と一緒に取り組める150-200文字の具体的行動]

※入力されたワードは絶対にそのまま使わず、アナロジー思考でその奥にある本質的な言葉に変換して表現すること
※ユーザーが内発的にやりたくなるような表現をすること`
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
