// Contextual Translation lookup using LLM
export const fetchTranslation = async (word, sentence) => {
  const apiKey = localStorage.getItem('ai_api_key');
  if (!apiKey || !apiKey.trim()) {
    return "请先配置 API Key 以启用考研语境翻译。";
  }

  try {
    const response = await fetch(`https://api.deepseek.com/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一个考研英语词汇专家。请结合给定的句子，给出该单词在句中的精准中文释义，以及它在考研中其他的常见中文释义。必须严格按照以下格式返回（不要包含任何额外废话，用三个下划线作为分隔符）：\n在此句中的含义___其他考研常见含义（用逗号隔开）"
          },
          {
            role: "user",
            content: `原句：${sentence}\n被查单词：${word}`
          }
        ]
      })
    });

    if (!response.ok) return "查询失败，请检查网络或密钥。";
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error(error);
    return "翻译服务暂时不可用。";
  }
};

// Real LLM Sentence Generation
export const generateSentence = async (word, meaning) => {
  const apiKey = localStorage.getItem('ai_api_key');
  
  if (!apiKey || !apiKey.trim()) {
    return `(未配置API Key) The postgraduate entrance exam requires you to understand the word '${word}'.`;
  }

  try {
    const response = await fetch(`https://api.deepseek.com/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一个最严格的考研英语语境生成器。\n【规则】：\n1. 优先从历年考研英语真题原文中提取包含特定单词的“原句”。\n2. 如果实在找不到匹配该词义的考研真题，请说明“[未找到真题，已为您生成同等难度例句]”，并自己生成一句符合考研难度和学术语境的纯英文例句。\n3. 该单词在句中的词义必须贴近用户提供的中文释义！\n4. 必须严格按照以下格式输出（绝不要在前面加“英语原文：”等废话标签，直接输出句子本身）：\n[纯英文原句]\n---\n[纯中文翻译（如有前置说明，写在中文翻译的最前面）]\n\n【附加要求】：在“中文翻译”部分，务必用两个星号将该单词对应的中文词义包裹起来（例如：**能力**）。`
          },
          {
            role: "user",
            content: `单词：${word}\n限定释义：${meaning}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('API Request Failed');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Sentence generation error:', error);
    return `(生成失败，请检查网络或Key) To successfully master '${word}' requires persistence.`;
  }
};
