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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `你是一个严格的考研英语出题专家。请用单词 '${word}' 造一个符合中国研究生入学考试（考研）英语一或英语二难度、包含适当长难句结构和正式学术语境的英文例句。仅输出一句英文例句，绝对不要包含任何中文、解释或多余的废话。`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('API Request Failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Sentence generation error:', error);
    return `(生成失败，请检查网络或Key) To successfully master '${word}' requires persistence.`;
  }
};
