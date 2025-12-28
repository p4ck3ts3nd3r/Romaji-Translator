# Prompt for Claude Opus 4.5: Romaji Translator Refinement

## Context

I've built a working Chrome extension (v1.0) that translates Romaji (romanized Japanese) to English via right-click context menu. It currently achieves ~70% accuracy but needs refinement for production use.

**Current Functionality:**
- User selects Romaji text on any webpage
- Right-click → "Translate Romaji to English"
- Popup shows: Original Romaji → Hiragana → English translation
- Uses Jisho.org API for dictionary lookups

**Architecture Overview:**
- `manifest.json` - Chrome extension config (Manifest V3)
- `background.js` - Service worker handling context menu
- `content.js` - Page injection and popup display
- `translator.js` - Core Romaji→Hiragana→English logic
- `popup.css` - Popup UI styling

## Your Mission

Refine the `translator.js` file to improve translation accuracy from 70% → 90%+. The other files work well and don't need major changes.

## Specific Problems to Solve

### 1. **Word Boundary Detection** (CRITICAL)
**Current Issue:** No reliable way to split romaji strings without spaces.

Example failures:
- Input: `"watashiwa"` (no space)
- Current: Treats as one word → `わたしわ` → translation fails
- Expected: Split into `"watashi wa"` → `わたし は` → "I" + topic particle

**What you need to implement:**
- Dictionary-based tokenization (longest-match algorithm)
- Particle detection (は、が、を、に、で、と、へ、の、か、も、や、etc.)
- Backtracking when initial tokenization fails
- Handle both spaced and non-spaced romaji input

### 2. **Particle Handling** (HIGH PRIORITY)
**Current Issue:** Particles aren't always converted correctly.

Problematic conversions:
- `"wa"` should be `は` (topic particle) when used grammatically, but `わ` when part of a word
- `"he"` should be `へ` (direction particle) vs `へ` in words
- `"wo"` / `"o"` should be `を` (object particle)

**What you need to implement:**
- Context-aware particle detection
- Position-based rules (particles typically don't start sentences)
- Word dictionary lookup to distinguish "wa" in "kawaii" (かわいい) vs standalone particle

### 3. **Long Vowel Handling** (MEDIUM PRIORITY)
**Current Issue:** Inconsistent handling of long vowels.

Example problems:
- `"joou"` vs `"jōu"` vs `"jou"` (女王 = queen)
- `"toukyou"` vs `"tōkyō"` vs `"tokyo"`
- `"ou"` sometimes means long "o" (ō), sometimes separate syllables

**What you need to implement:**
- Standardize long vowel detection
- Handle both macron notation (`ō`) and double-vowel (`ou`)
- Context clues (dictionary lookup to verify)

### 4. **Ambiguity Resolution** (MEDIUM PRIORITY)
**Current Issue:** No context awareness for homonyms.

Example:
- `"kami"` could be:
  - 髪 (かみ) = hair
  - 神 (かみ) = god
  - 紙 (かみ) = paper
  
**Current behavior:** Just returns first Jisho result (often wrong)

**What you need to implement:**
- Use surrounding context words to disambiguate
- Return top 2-3 possible meanings if ambiguous
- Probability scoring based on common usage

### 5. **Proper Name Detection** (LOW PRIORITY)
**Current Issue:** Names get translated incorrectly.

Example:
- `"Reika"` (麗華) is a name, shouldn't be broken into `rei` + `ka`
- `"Satoshi"` (さとし) is a name

**What you need to implement:**
- Capitalization detection (if present, likely a name)
- Common Japanese name dictionary (optional)
- Fallback: If translation fails, try as proper noun

### 6. **Improved Jisho.org API Usage** (MEDIUM PRIORITY)
**Current Issue:** Only using first result, no error handling for complex queries.

**What you need to implement:**
- Query the entire phrase first
- If that fails, break into words and query individually
- Combine partial results intelligently
- Cache common translations (avoid repeated API calls)
- Handle API rate limiting gracefully

## Implementation Guidelines

### Tokenization Algorithm Suggestion
```javascript
function tokenize(romaji) {
  // 1. Try longest-match algorithm with particle awareness
  // 2. Use dictionary lookups to validate tokens
  // 3. Backtrack if path leads to dead-end
  // 4. Return array of {romaji, hiragana, isParticle, confidence}
}
```

### Suggested Data Structures
You may want to add:
- **Particle dictionary** with context rules
- **Common word dictionary** for offline tokenization
- **Name patterns** (ending in -ko, -mi, -ta, etc.)
- **Frequency table** for ambiguity resolution

### API Strategy
Current approach: Send full hiragana string to Jisho.org

Improved approach:
1. Try full phrase query first
2. If low confidence, tokenize and query words individually
3. Use word-by-word results to reconstruct meaning
4. Show phrase translation if available, otherwise word list

### Code Quality Requirements
- **Clear comments** explaining complex logic
- **Error handling** for all external API calls
- **Performance**: Avoid unnecessary API calls (use caching)
- **Maintainability**: Modular functions, single responsibility
- **Edge cases**: Handle empty strings, special characters, mixed English/Romaji

## Files Included

You'll receive the current `translator.js` file. The other files (`manifest.json`, `background.js`, `content.js`, `popup.css`) work well and shouldn't need major changes unless you identify critical issues.

## Success Criteria

Your refined version should:
1. ✅ Handle "watashiwa" → "watashi wa" (word boundary detection)
2. ✅ Correctly convert particles: "wa" → は, "he" → へ, "wo" → を
3. ✅ Handle long vowels: "toukyou" → とうきょう → "Tokyo"
4. ✅ Provide context for ambiguous words (multiple meanings shown)
5. ✅ Not break proper names unnecessarily
6. ✅ Gracefully handle API failures with fallback behavior
7. ✅ Achieve 90%+ accuracy on common phrases

## Test Cases

Please verify your implementation handles these:

```javascript
// Basic phrases (should work perfectly)
"konnichiwa" → こんにちは → "hello"
"arigatou gozaimasu" → ありがとうございます → "thank you very much"

// Word boundaries (currently fails)
"watashiwa gakusei desu" → わたしは がくせい です → "I am a student"

// Particles (currently inconsistent)
"tokyo he ikimasu" → とうきょう へ いきます → "I will go to Tokyo"
"nihongo wo benkyou shimasu" → にほんご を べんきょう します → "I study Japanese"

// Long vowels (currently inconsistent)
"toukyou" → とうきょう → "Tokyo"
"sensei" → せんせい → "teacher"

// Ambiguous (currently shows only first result)
"kami" → かみ → "hair; god; paper" (should show multiple)

// Proper names (currently breaks them)
"Reika wa Karei na Boku no Joou" → 麗華は華麗な僕の女王 → "Reika is my gorgeous queen"

// Edge cases
"" → (empty) → "No text to translate"
"hello world" → (not romaji) → "Not Japanese text"
"watashi wa tabemasu" → わたし は たべます → "I eat"
```

## Deliverables

Please provide:

1. **Fully refined `translator.js`** with all improvements
2. **Inline comments** explaining complex logic (especially tokenization)
3. **Updated README section** documenting the improvements made
4. **Known limitations** that still exist (be honest about edge cases)
5. **Optional:** Any improvements to other files if you identify issues

## Additional Context

**User's Use Case:**
This extension is for casual browsing - encountering Romaji on YouTube titles, anime forums, etc. The user wants quick "what does this mean?" answers without manually copy-pasting into translation sites.

**Philosophy:**
- Favor **accuracy over speed** (it's okay to take 1-2 seconds)
- **Show confidence levels** when uncertain (e.g., "Possible meanings: X, Y, Z")
- **Fail gracefully** rather than showing wrong translations confidently

**Technical Constraints:**
- Must work in Chrome Manifest V3
- Jisho.org API is free but has unspecified rate limits (be respectful)
- Extension runs on arbitrary websites (avoid conflicts with page JavaScript)

## Questions to Consider

As you implement, think about:
- How do you distinguish "kawaii" (かわいい - cute) from "ka wa ii" (か は いい - ? is good)?
- When should you split on spaces vs. ignore them?
- How do you detect if something is English vs. Romaji? (e.g., "me" could be English or Romaji め)
- Should you show kanji alternatives alongside hiragana?
- How do you handle mixed English/Romaji strings?

---

## Summary

**Goal:** Transform a 70% accurate prototype into a 90%+ production-ready extension by improving:
1. Word tokenization
2. Particle handling
3. Long vowel conversion
4. Ambiguity resolution
5. API usage strategy

Focus your efforts on `translator.js` - that's where the magic happens. The UI and Chrome extension architecture are solid.

**Good luck!** 🚀
