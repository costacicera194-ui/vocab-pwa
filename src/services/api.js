// Dictionary lookup
export const fetchTranslation = async (word) => {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.meanings[0]?.definitions[0]?.definition || "暂无翻译";
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Real LLM Sentence Generation
export const generateSentence = async (word) => {
  const apiKey = localStorage.getItem('ai_api_key');
  
  if (!apiKey || !apiKey.trim()) {
    // Fallback logic if API key is not set
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
            content: "你是一个考研英语真题数据库。请从历年中国研究生入学考试（考研）英语一或英语二的真实考试题目（如阅读理解、翻译、完形填空）原文中，精确检索并提取出一句包含单词的用户指定的词语的真实考试原句。绝不能自己编造！只输出这句纯英文原句，不要包含任何年份标注、中文翻译、解释或多余的废话。"
          },
          {
            role: "user",
            content: `单词：${word}`
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
