# Quick Start Guide

## Install in 2 Minutes

### Step 1: Get Icon Files (Optional but Recommended)

The extension needs icons. You have two options:

**Option A: Download Simple Icons**
1. Go to https://www.flaticon.com/free-icon/japan_10054687
2. Download the icon in PNG format
3. Resize to 16x16, 48x48, and 128x128 pixels (use any image editor)
4. Save as `icon16.png`, `icon48.png`, `icon128.png` in an `icons/` folder

**Option B: Skip Icons (Extension Still Works)**
- The extension will work without icons
- Chrome will show a default puzzle piece icon
- You can add icons later

### Step 2: Load Extension

1. Open Chrome and go to: `chrome://extensions/`

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Select the `romaji-translator` folder

5. Done! The extension is now active.

### Step 3: Test It

1. Go to YouTube and search for Japanese content, or copy this test text:
   ```
   konnichiwa watashi wa gakusei desu
   ```

2. Paste it anywhere (Discord, Google Docs, even Chrome's address bar)

3. **Select the text** with your mouse

4. **Right-click** → Choose **"Translate Romaji to English"**

5. A popup should appear showing:
   - Original: `konnichiwa watashi wa gakusei desu`
   - Hiragana: `こんにちはわたしはがくせいです`
   - English: `hello; I; student; am`

## Troubleshooting

**Don't see the context menu option?**
- Make sure text is actually selected
- Refresh the page after installing extension
- Check extension is enabled in chrome://extensions/

**Popup doesn't appear?**
- Open browser console (F12) and check for errors
- Make sure you have internet (needs Jisho.org access)
- Try shorter text first

**Translation shows "Error"?**
- Check your internet connection
- Jisho.org might be temporarily down
- Try again in a few seconds

## What Works Well (v1.0)

✅ Standard romaji like `konnichiwa`, `arigatou`, `sayonara`  
✅ Simple phrases with spaces: `watashi wa gakusei desu`  
✅ Common words from Jisho.org dictionary  

## Known Limitations (v1.0)

❌ Text without spaces: `watashiwa` instead of `watashi wa`  
❌ Ambiguous words: `kami` could mean hair, god, or paper  
❌ Complex sentences: accuracy drops with longer phrases  
❌ Proper names: may try to translate names incorrectly  

## Next Steps

**If you like it:**
- Read `OPUS_REFINEMENT_PROMPT.md`
- Copy the current `translator.js` content
- Send both to Claude Opus 4.5
- Get a refined version with 90%+ accuracy

**If you want to customize:**
- Edit `popup.css` to change colors/fonts
- Modify `translator.js` to add more romaji mappings
- Check `README.md` for full documentation

---

**Enjoy your new extension!** 🎌
