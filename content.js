// ============================================================================
// Content Script for Romaji Translator
// Handles popup display and user interaction
// ============================================================================

let activePopup = null;
let currentTranslation = null;

// ============================================================================
// Message Listener
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    handleTranslation(request.text);
    sendResponse({ success: true });
  }
  return true;
});

// ============================================================================
// Translation Handler
// ============================================================================

async function handleTranslation(romajiText) {
  // Remove any existing popup
  removePopup();
  
  // Get selection position for popup placement
  const selection = window.getSelection();
  let rect = null;
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    rect = range.getBoundingClientRect();
  }
  
  // Quick hiragana conversion first (doesn't need API)
  let quickHiragana = "Converting...";
  try {
    // Use the tokenizer for quick hiragana (this is synchronous)
    if (typeof tokenizeRomaji === 'function') {
      const tokens = tokenizeRomaji(romajiText);
      quickHiragana = tokens.map(t => t.hiragana).join('');
    }
  } catch (e) {
    console.warn("Quick conversion failed:", e);
  }
  
  // Create and show popup with loading state (but show hiragana immediately)
  showPopup({
    romaji: romajiText,
    hiragana: quickHiragana,
    english: "Translating...",
    loading: true
  }, rect);
  
  // Perform full translation (includes API call for English)
  try {
    const result = await translateRomaji(romajiText);
    currentTranslation = result;
    
    // Update popup with full translation
    updatePopup(result);
  } catch (error) {
    console.error("Translation error:", error);
    // Still show the hiragana even if English translation fails
    updatePopup({
      romaji: romajiText,
      hiragana: quickHiragana !== "Converting..." ? quickHiragana : "Conversion failed",
      english: "English translation unavailable - check your connection",
      error: true,
      confidence: 0.3
    });
  }
}

// ============================================================================
// Popup Display Functions
// ============================================================================

/**
 * Create and display the translation popup
 */
function showPopup(data, rect) {
  // Create popup container
  const popup = document.createElement('div');
  popup.className = 'romaji-translator-popup';
  popup.id = 'romaji-translator-popup';
  
  // Build popup content
  popup.innerHTML = buildPopupHTML(data);
  
  // Add to DOM first (needed for dimension calculations)
  document.body.appendChild(popup);
  
  // Position popup
  positionPopup(popup, rect);
  
  activePopup = popup;
  
  // Add event listeners
  setupPopupListeners(popup);
}

/**
 * Build the popup HTML content
 */
function buildPopupHTML(data) {
  const { romaji, hiragana, english, alternatives, confidence, loading, error } = data;
  
  // Confidence indicator (if available)
  let confidenceHTML = '';
  if (typeof confidence === 'number' && confidence > 0 && !loading) {
    const level = confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low';
    confidenceHTML = `<span class="romaji-confidence romaji-confidence-${level}" title="Confidence: ${Math.round(confidence * 100)}%"></span>`;
  }
  
  // Loading spinner
  const loadingClass = loading ? 'romaji-loading' : '';
  
  // Error styling
  const errorClass = error ? 'romaji-error' : '';
  
  // Alternatives section (multiple meanings)
  let alternativesHTML = '';
  if (alternatives && alternatives.length > 0) {
    const altItems = alternatives.slice(0, 3).map(alt => 
      `<div class="romaji-alt-item">• ${escapeHtml(alt)}</div>`
    ).join('');
    alternativesHTML = `
      <div class="romaji-alternatives">
        <div class="romaji-alt-header">Other meanings:</div>
        ${altItems}
      </div>
    `;
  }
  
  return `
    <div class="romaji-popup-content ${loadingClass} ${errorClass}">
      <div class="romaji-header">
        ${confidenceHTML}
        <div class="romaji-original">${escapeHtml(romaji)}</div>
      </div>
      <div class="romaji-hiragana">${escapeHtml(hiragana)}</div>
      <div class="romaji-english">${escapeHtml(english)}</div>
      ${alternativesHTML}
    </div>
    <button class="romaji-close" aria-label="Close">×</button>
  `;
}

/**
 * Position the popup near the selection
 */
function positionPopup(popup, rect) {
  if (!rect) {
    // Fallback: center on screen
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    return;
  }
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Start below the selection
  let top = rect.bottom + scrollTop + 8;
  let left = rect.left + scrollLeft;
  
  // Set initial position
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
  
  // Get popup dimensions after render
  const popupRect = popup.getBoundingClientRect();
  
  // Adjust if would go off right edge
  if (popupRect.right > window.innerWidth - 10) {
    left = Math.max(10, window.innerWidth - popupRect.width - 10 + scrollLeft);
    popup.style.left = `${left}px`;
  }
  
  // Adjust if would go off bottom - show above selection instead
  if (popupRect.bottom > window.innerHeight - 10) {
    top = rect.top + scrollTop - popupRect.height - 8;
    // Make sure we don't go off the top
    if (top < scrollTop + 10) {
      top = scrollTop + 10;
    }
    popup.style.top = `${top}px`;
  }
  
  // Adjust if would go off left edge
  if (left < scrollLeft + 10) {
    popup.style.left = `${scrollLeft + 10}px`;
  }
}

/**
 * Update popup content after translation completes
 */
function updatePopup(data) {
  if (!activePopup) return;
  
  const content = activePopup.querySelector('.romaji-popup-content');
  if (!content) return;
  
  // Remove loading state
  content.classList.remove('romaji-loading');
  
  // Update hiragana
  const hiraganaDiv = activePopup.querySelector('.romaji-hiragana');
  if (hiraganaDiv) {
    hiraganaDiv.textContent = data.hiragana || '';
  }
  
  // Update English translation
  const englishDiv = activePopup.querySelector('.romaji-english');
  if (englishDiv) {
    englishDiv.textContent = data.english || '';
    if (data.error) {
      englishDiv.classList.add('romaji-error-text');
    }
  }
  
  // Add alternatives if present
  if (data.alternatives && data.alternatives.length > 0) {
    let altContainer = activePopup.querySelector('.romaji-alternatives');
    
    if (!altContainer) {
      altContainer = document.createElement('div');
      altContainer.className = 'romaji-alternatives';
      content.appendChild(altContainer);
    }
    
    const altItems = data.alternatives.slice(0, 3).map(alt => 
      `<div class="romaji-alt-item">• ${escapeHtml(alt)}</div>`
    ).join('');
    
    altContainer.innerHTML = `
      <div class="romaji-alt-header">Other meanings:</div>
      ${altItems}
    `;
  }
  
  // Update confidence indicator
  if (typeof data.confidence === 'number') {
    let confidenceEl = activePopup.querySelector('.romaji-confidence');
    
    if (!confidenceEl) {
      confidenceEl = document.createElement('span');
      confidenceEl.className = 'romaji-confidence';
      const header = activePopup.querySelector('.romaji-header');
      // Insert at the beginning (before the romaji text)
      if (header) header.insertBefore(confidenceEl, header.firstChild);
    }
    
    const level = data.confidence > 0.8 ? 'high' : data.confidence > 0.5 ? 'medium' : 'low';
    confidenceEl.className = `romaji-confidence romaji-confidence-${level}`;
    confidenceEl.title = `Confidence: ${Math.round(data.confidence * 100)}%`;
  }
}

/**
 * Setup event listeners for popup
 */
function setupPopupListeners(popup) {
  // Close button
  const closeBtn = popup.querySelector('.romaji-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removePopup();
    });
  }
  
  // Prevent popup clicks from closing it
  popup.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Close on outside click (with small delay to avoid immediate close)
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);
  }, 150);
}

/**
 * Remove popup from page
 */
function removePopup() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
    currentTranslation = null;
    
    // Remove event listeners
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

/**
 * Handle clicks outside popup
 */
function handleOutsideClick(event) {
  if (activePopup && !activePopup.contains(event.target)) {
    removePopup();
  }
}

/**
 * Handle Escape key press
 */
function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    removePopup();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  removePopup();
});

// ============================================================================
// Debug Helper (can be removed in production)
// ============================================================================

// Expose for debugging in console
window.__romajiTranslator = {
  getPopup: () => activePopup,
  getTranslation: () => currentTranslation,
  testTranslate: async (text) => {
    const result = await translateRomaji(text);
    console.log("Translation result:", result);
    return result;
  }
};
