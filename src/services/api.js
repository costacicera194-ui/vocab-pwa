// Contextual Translation lookup using LLM
export const fetchTranslation = async (word, sentence) => {
  const apiKey = localStorage.getItem('ai_api_key');
  if (!apiKey || !apiKey.trim()) {
    return "请先配置 API Key 以启用考研语境翻译。";
  }

  const cacheKey = `dict_cache_${word.toLowerCase()}`;
  const cachedOthers = localStorage.getItem(cacheKey);

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
            content: cachedOthers 
              ? "你是一个考研英语词汇专家。已知该单词的其他考研常见含义，请结合给定的句子，仅给出该单词在句中的精准中文释义。不要包含任何额外废话，直接输出释义即可。"
              : "你是一个考研英语词汇专家。请结合给定的句子，给出该单词在句中的精准中文释义，以及它在考研中其他的常见中文释义。必须严格按照以下格式返回（不要包含任何额外废话，用三个下划线作为分隔符）：\n在此句中的含义___其他考研常见含义（用逗号隔开）"
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
    const result = data.choices[0].message.content.trim();

    if (cachedOthers) {
      return `${result}___${cachedOthers}`;
    } else {
      if (result.includes('___')) {
        const parts = result.split('___');
        if (parts.length > 1) {
          localStorage.setItem(cacheKey, parts[1].trim());
        }
      }
      return result;
    }
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
            content: `你是一个最严格的考研英语语境生成器。\n【规则】：\n1. 优先从历年考研英语真题原文中提取包含特定单词的“原句”。\n2. 如果实在找不到匹配该词义的考研真题，必须在中文翻译的最前面加上“[未找到真题，已为您生成同等难度例句]”，然后再提供对应的中文翻译。\n3. 该单词在句中的词义必须贴近用户提供的中文释义！\n4. 必须严格按照以下格式输出（绝不要在前面加“英语原文：”等废话标签，直接输出句子本身）：\n[纯英文原句]\n---\n[纯中文翻译]\n\n【高亮要求】：\n1. 在“纯英文原句”中，必须用两个星号将该单词（或其变形）包裹起来（例如：He is **studying** hard.）。这是为了让前端高亮显示。\n2. 在“中文翻译”中，也必须用两个星号将该单词对应的中文词义包裹起来（例如：**学习**）。`
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
