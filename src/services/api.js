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
            content: `你是一个最严格的考研英语真题数据库。你的唯一任务是：从历年中国研究生入学考试（考研）英语一或英语二的真实试卷原文中，精确检索出包含特定单词的“真实考试原句”。\n【三大铁律】：\n1. 这句话必须 100% 来自历年考研真题，绝不可自己编造或修改！\n2. 该单词在这句话中的词义，必须贴近或等同于用户提供的中文释义！\n3. 如果实在找不到包含该词义的考研真题原句，请直接回复：“(未找到匹配该词义的考研真题，请查阅其他资料)”。\n只输出这句纯英文原句，绝对不要任何中文、不要年份标注、不要多余废话。`
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
