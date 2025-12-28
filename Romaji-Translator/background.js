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
  // Handle translation API requests
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
