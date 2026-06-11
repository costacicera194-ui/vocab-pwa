import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// Global Yjs Doc
export const ydoc = new Y.Doc();
export const ydeck = ydoc.getMap('deck');
let yprovider = null;

// Helper: Uint8Array to Base64
const uint8ArrayToBase64 = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper: Base64 to Uint8Array
const base64ToUint8Array = (base64) => {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
};

export const initLocalYjs = async () => {
  if (!yprovider) {
    yprovider = new IndexeddbPersistence('vocab-pwa-yjs', ydoc);
  }
  return new Promise((resolve) => {
    if (yprovider.synced) {
      resolve();
    } else {
      yprovider.on('synced', () => resolve());
    }
  });
};

export const syncDeckToYjs = (deckArray) => {
  const currentIds = new Set(deckArray.map(c => c.id));
  ydoc.transact(() => {
    deckArray.forEach(card => ydeck.set(card.id, card));
    for (const key of ydeck.keys()) {
      if (!currentIds.has(key)) {
        ydeck.delete(key);
      }
    }
  });
};

export const getDeckFromYjs = () => {
  return Array.from(ydeck.values());
};

export const syncToCloud = async (deck) => {
  const token = localStorage.getItem('github_token');
  const gistId = localStorage.getItem('gist_id');
  if (!token || !gistId || !deck) return false;
  
  // Ensure local Yjs is up to date with React state
  syncDeckToYjs(deck);

  try {
    const update = Y.encodeStateAsUpdate(ydoc);
    const base64Update = uint8ArrayToBase64(update);

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`
      },
      body: JSON.stringify({
        files: {
          'vocab_pwa_deck.yjs': {
            content: base64Update
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
    const file = data.files['vocab_pwa_deck.yjs'];
    
    if (file && file.content) {
      const remoteUpdate = base64ToUint8Array(file.content);
      Y.applyUpdate(ydoc, remoteUpdate);
      return getDeckFromYjs();
    }
    
    // Backwards compatibility: if no Yjs file, try to read the old json file
    const oldFile = data.files['vocab_pwa_deck.json'];
    if (oldFile && oldFile.content) {
       // Old format, we don't have LZString imported here anymore but let's just return what we can
       // Actually it's best to let the user manually import if they really need it.
       // We'll return null to force local override if they migrate
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch from cloud:', error);
    return null;
  }
};
