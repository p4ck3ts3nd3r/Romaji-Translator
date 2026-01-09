// ============================================================================
// Background Service Worker for Romaji Translator Extension
// Handles context menu and Jisho.org API requests
// ============================================================================

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateRomaji",
    title: "Translate Romaji to English",
    contexts: ["selection"]
  });
  
  console.log("Romaji Translator: Extension installed, context menu created");
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "translateRomaji" && info.selectionText) {
    try {
      // Try to send message to content script
      await chrome.tabs.sendMessage(tab.id, {
        action: "translate",
        text: info.selectionText,
        frameId: info.frameId || 0
      });
    } catch (err) {
      // Content script not loaded - inject it first
      console.log("Content script not found, injecting...");
      
      try {
        // Inject the scripts and CSS
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['translator.js', 'content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['popup.css']
        });
        
        // Small delay to let scripts initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try sending the message again
        await chrome.tabs.sendMessage(tab.id, {
          action: "translate",
          text: info.selectionText,
          frameId: info.frameId || 0
        });
      } catch (injectErr) {
        console.error("Failed to inject content script:", injectErr);
        // This can happen on chrome:// pages or other restricted pages
      }
    }
  }
});

// ============================================================================
// Message Handler - Routes requests from content script
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle translation API requests (Jisho)
  if (request.action === "fetchTranslation") {
    handleJishoRequest(request.query)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message 
      }));
    
    // Return true to indicate async response
    return true;
  }
  
  // Handle AniList API requests (for anime/manga title lookup)
  if (request.action === "searchAniList") {
    handleAniListSearch(request.query)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    
    return true;
  }
  
  // Handle logging requests
  if (request.action === "log") {
    console.log("Romaji Translator:", request.message);
    sendResponse({ success: true });
    return false;
  }
  
  // Unknown action
  return false;
});

// ============================================================================
// AniList GraphQL API Handler
// ============================================================================

/**
 * Search AniList for anime/manga titles
 * @param {string} searchQuery - The romaji title to search for
 * @returns {Object} API response with title info
 */
async function handleAniListSearch(searchQuery) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return { success: false, error: "Empty query" };
  }
  
  // GraphQL query to search for media (anime/manga)
  const query = `
    query ($search: String) {
      Media (search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        format
        status
        synonyms
      }
    }
  `;
  
  // Also search manga as a fallback
  const mangaQuery = `
    query ($search: String) {
      Media (search: $search, type: MANGA) {
        id
        title {
          romaji
          english
          native
        }
        format
        status
        synonyms
      }
    }
  `;
  
  try {
    // Try anime first
    let response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: { search: searchQuery.trim() }
      })
    });
    
    let data = await response.json();
    
    // If no anime found, try manga
    if (!data.data?.Media) {
      response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: mangaQuery,
          variables: { search: searchQuery.trim() }
        })
      });
      
      data = await response.json();
    }
    
    if (data.data?.Media) {
      const media = data.data.Media;
      const romaji = media.title.romaji || '';
      const nativeTitle = media.title.native || '';
      let englishTitle = media.title.english || '';
      const synonyms = media.synonyms || [];
      
      // If english field is empty, null, or same as romaji, try to find English in synonyms
      if (!englishTitle || englishTitle.toLowerCase() === romaji.toLowerCase()) {
        // Look for an English synonym (contains only ASCII/Latin characters)
        const englishSynonym = synonyms.find(s => {
          // Check if the synonym is primarily English (Latin characters)
          return s && /^[a-zA-Z0-9\s\-:!?'",.\(\)]+$/.test(s) && s.length > 3;
        });
        
        if (englishSynonym) {
          englishTitle = englishSynonym;
        }
      }
      
      // If still no good English title, check if any synonym looks like a proper English title
      if (!englishTitle || englishTitle === romaji) {
        // Try to find "The ...", "A ...", or other English patterns
        const betterEnglish = synonyms.find(s => 
          s && (/^(The|A|An)\s/i.test(s) || /\s(of|the|and|in|at|to|for)\s/i.test(s))
        );
        if (betterEnglish) {
          englishTitle = betterEnglish;
        }
      }
      
      return {
        success: true,
        data: {
          id: media.id,
          romaji: romaji,
          english: englishTitle || romaji,  // Fall back to romaji if no English
          native: nativeTitle,  // Japanese title
          format: media.format,
          status: media.status,
          synonyms: synonyms
        }
      };
    }
    
    return {
      success: false,
      error: "No results found"
    };
    
  } catch (error) {
    console.error("AniList API error:", error);
    return {
      success: false,
      error: error.message || "AniList API request failed"
    };
  }
}

// ============================================================================
// Jisho.org API Handler
// ============================================================================

// Simple rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // ms between requests

/**
 * Fetch translation from Jisho.org API
 * @param {string} query - Hiragana or Japanese text to look up
 * @returns {Object} API response with success flag and data
 */
async function handleJishoRequest(query) {
  if (!query || query.trim().length === 0) {
    return { success: false, error: "Empty query" };
  }
  
  // Basic rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
  
  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://jisho.org/api/v1/search/words?keyword=${encodedQuery}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the data array from Jisho response
    return {
      success: true,
      data: data.data || [],
      meta: {
        status: data.meta?.status || 200
      }
    };
    
  } catch (error) {
    console.error("Jisho API error:", error);
    
    // Provide helpful error messages
    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: "Network error - check your internet connection"
      };
    }
    
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}

// ============================================================================
// Service Worker Keep-Alive (for Manifest V3)
// ============================================================================

// Periodic alarm to keep service worker active during extended use
chrome.alarms?.create?.('keepAlive', { periodInMinutes: 0.5 });

chrome.alarms?.onAlarm?.addListener?.((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Just a heartbeat - service worker stays active
    console.debug("Romaji Translator: Service worker heartbeat");
  }
});
