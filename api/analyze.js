export default async function handler(req, res) {
console.log('Function called:', req.method);

// CORS設定
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
console.log('OPTIONS request received');
res.status(200).end();
return;
}

if (req.method !== 'POST') {
console.log('Invalid method:', req.method);
return res.status(405).json({ error: 'Method not allowed' });
}

try {
console.log('Request body:', req.body);

const { words, accessCode } = req.body;

// 入力検証
if (!words || !accessCode) {
console.log('Missing required fields');
return res.status(400).json({ error: 'Missing required fields' });
}

// アクセスコード確認
const validCodes = ['VISION2025JUL'];
if (!validCodes.includes(accessCode)) {
console.log('Invalid access code:', accessCode);
return res.status(403).json({ error: 'Invalid access code' });
}

// 環境変数確認
if (!process.env.OPENAI_API_KEY) {
console.log('Missing OPENAI_API_KEY');
return res.status(500).json({ error: 'Server configuration error' });
}

console.log('Making OpenAI API call...');

// OpenAI API呼び出し
const response = await fetch('https://api.openai.com/v1/chat/completions', {
method: 'POST',
headers: {
'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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

以下の形式で、探究心をくすぐる魅力的な表現で出力してください：

ありたい姿：[夢と希望に満ちた魅力的な15-25文字表現]

解説：[ワクワクする具体的シーンを含む100-150文字の描写]

行動案：
1. [楽しみながら実践できる具体的行動]
2. [発見や成長を感じられる具体的行動]
3. [仲間と一緒に取り組める具体的行動]

※入力ワードをそのまま使わず、その奥にある本質的な魅力を表現すること
※ユーザーが内発的にやりたくなるような表現を心がけること`
}],
max_tokens: 800,
temperature: 0.8
})
});

console.log('OpenAI API response status:', response.status);

const data = await response.json();
console.log('OpenAI API response:', data);

if (!response.ok) {
console.log('OpenAI API error:', data);
throw new Error(data.error?.message || 'OpenAI API error');
}

const result = data.choices[0].message.content;
console.log('Analysis result generated successfully');

res.status(200).json({ result });

} catch (error) {
console.error('Detailed error:', error);
res.status(500).json({
error: 'Analysis failed',
details: error.message
});
}
}
