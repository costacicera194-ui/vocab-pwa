// Cloud sync using GitHub Gist

export const syncToCloud = async (deck) => {
  const token = localStorage.getItem('github_token');
  const gistId = localStorage.getItem('gist_id');
  
  if (!token || !gistId || !deck) return false;
  
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`
      },
      body: JSON.stringify({
        files: {
          'vocab_pwa_deck.json': {
            content: JSON.stringify(deck)
          }
        }
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to sync to cloud:', error);
    return false;
  }
};

export const fetchFromCloud = async () => {
  const token = localStorage.getItem('github_token');
  const gistId = localStorage.getItem('gist_id');
  
  if (!token || !gistId) return null;
  
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const file = data.files['vocab_pwa_deck.json'];
    if (file && file.content) {
      return JSON.parse(file.content);
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch from cloud:', error);
    return null;
  }
};
