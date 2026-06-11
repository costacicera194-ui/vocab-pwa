let staticDict = null;

const loadStaticDict = async () => {
  if (staticDict) return staticDict;
  try {
    const res = await fetch('/dict.json');
    if (res.ok) {
      staticDict = await res.json();
    } else {
      staticDict = {};
    }
  } catch (e) {
    staticDict = {};
  }
  return staticDict;
};

// Helper for parsing SSE Streams safely
const fetchStream = async (url, options, onChunk) => {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error("API stream failed");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let done = false;
  let fullText = "";
  let buffer = "";
  
  // Throttle updates to ~30 FPS (30ms) to prevent React layout thrashing
  let lastUpdate = 0;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n');
      while (boundary !== -1) {
        const line = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 1);
        
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
              fullText += data.choices[0].delta.content;
              const now = Date.now();
              if (onChunk && (now - lastUpdate > 30)) {
                onChunk(fullText);
                lastUpdate = now;
              }
            }
          } catch (e) {
            // Partial JSON or other format issues
          }
        }
        boundary = buffer.indexOf('\n');
      }
    }
  }
  
  // Guarantee a final flush
  if (onChunk) onChunk(fullText);
  
  return fullText;
};

const cleanTranslationRaw = (result) => {
  let cleanResult = result;
  if (cleanResult.includes('___')) {
    let parts = cleanResult.split('___');
    parts[0] = parts[0].replace(/^(在此句中的含义|句中含义|该词在句中的含义)[:：\s]*/, '').trim();
    if (parts.length > 1) {
      parts[1] = parts[1].replace(/^(其他考研常见含义|其他常见含义|其他含义)[:：\s]*/, '').trim();
      cleanResult = parts.join('___');
    }
  } else {
    cleanResult = cleanResult.replace(/^(在此句中的含义|句中含义|该词在句中的含义)[:：\s]*/, '').trim();
  }
  return cleanResult;
};

// Contextual Translation lookup using LLM (Streaming)
export const fetchTranslation = async (word, sentence, onChunk) => {
  const apiKey = localStorage.getItem('ai_api_key');
  if (!apiKey || !apiKey.trim()) {
    return "请先配置 API Key 以启用考研语境翻译。";
  }

  const cacheKey = `dict_cache_${word.toLowerCase()}`;
  let cachedOthers = localStorage.getItem(cacheKey);

  if (!cachedOthers) {
    const dict = await loadStaticDict();
    if (dict[word.toLowerCase()]) {
      cachedOthers = dict[word.toLowerCase()];
    }
  }

  try {
    const streamCallback = (rawText) => {
      if (onChunk) {
        const clean = cleanTranslationRaw(rawText);
        if (cachedOthers) {
          onChunk(`${clean}___${cachedOthers}`);
        } else {
          onChunk(clean);
        }
      }
    };

    const resultText = await fetchStream(`https://api.deepseek.com/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        stream: true,
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
    }, streamCallback);

    const cleanResult = cleanTranslationRaw(resultText);
    if (cachedOthers) {
      return `${cleanResult}___${cachedOthers}`;
    } else {
      return cleanResult;
    }
  } catch (error) {
    console.error(error);
    return "翻译服务暂时不可用。";
  }
};

// Real LLM Sentence Generation (Streaming)
export const generateSentence = async (word, meaning, onChunk) => {
  const apiKey = localStorage.getItem('ai_api_key');
  
  if (!apiKey || !apiKey.trim()) {
    return `(未配置API Key) The postgraduate entrance exam requires you to understand the word '${word}'.`;
  }

  try {
    const resultText = await fetchStream(`https://api.deepseek.com/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        stream: true,
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
    }, onChunk);

    return resultText;
  } catch (error) {
    console.error('Sentence generation error:', error);
    return `(生成失败，请检查网络或Key) To successfully master '${word}' requires persistence.`;
  }
};
