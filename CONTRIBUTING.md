# Contributing to Romaji Translator

First off, thanks for considering contributing! 🎉

## How Can I Contribute?

### 🐛 Report Bugs

Found a bug? Help us fix it!

**Before submitting:**
- Check if the issue already exists in [GitHub Issues](https://github.com/p4ck3ts3nd3r/romaji-translator/issues)
- Make sure you're using the latest version

**When submitting:**
1. **Title**: Clear, concise description (e.g., "Particle 'wa' incorrectly converted in compound words")
2. **Description**: Include:
   - The Romaji text that failed
   - Expected behavior
   - Actual behavior
   - Screenshot (if applicable)
   - Browser version
   - Extension version

**Example:**
```
Title: "Konnichiwa" translates to wrong meaning

Description:
When I select "konnichiwa" on YouTube, the translation shows "good evening" 
instead of "hello/good afternoon".

Expected: "hello, good afternoon"
Actual: "good evening"

Browser: Chrome 120.0.6099.109
Extension: v2.0.0
Screenshot: [attached]
```

### 💡 Suggest Features

Have an idea? We'd love to hear it!

**Feature Request Template:**
```
Title: [Feature] Your feature name

Description:
- What: Brief description of the feature
- Why: Why would this be useful?
- How: (Optional) How you think it could work

Example Use Case:
Describe a real scenario where this would help

Additional Context:
Any mockups, examples, or related features
```

### 📝 Improve Documentation

Documentation improvements are always welcome:
- Fix typos
- Clarify confusing sections
- Add examples
- Translate README to other languages

### 🔤 Add Dictionary Entries

Know a common word that's missing? Add it!

**Steps:**
1. Fork the repository
2. Edit `translator.js`
3. Find the `WORD_DICTIONARY` object
4. Add your entry in alphabetical order:
   ```javascript
   'yourromanji': 'your hiragana',
   ```
5. Test it works
6. Submit a Pull Request

**Guidelines:**
- Use standard Hepburn romanization
- Common words only (not slang or rare terms)
- Include hiragana conversion
- Keep alphabetical order

### 💻 Submit Code

Ready to code? Awesome!

**Setup:**
```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/romaji-translator.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Test thoroughly

# Commit with clear message
git commit -m "Add feature: your feature description"

# Push to your fork
git push origin feature/your-feature-name

# Open a Pull Request
```

**Code Guidelines:**
- Follow existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update README if adding features
- Keep commits focused and atomic

**Testing Checklist:**
- [ ] Extension loads without errors
- [ ] Feature works as intended
- [ ] Doesn't break existing features
- [ ] Works on multiple websites
- [ ] Tested in Chrome (latest version)
- [ ] Console shows no errors

### 🎨 Design Improvements

Suggestions for UI/UX improvements:
- Better popup design
- Improved color schemes
- Animation ideas
- Accessibility improvements

Share mockups or screenshots!

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a PR with clear description

**PR Description Template:**
```markdown
## What does this PR do?
Brief description of changes

## Why?
Why is this change needed?

## How to test?
Steps to test this feature

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code tested locally
- [ ] No console errors
- [ ] README updated (if needed)
- [ ] Follows existing code style
```

## Code of Conduct

### Our Standards

**Be respectful:**
- Use welcoming and inclusive language
- Respect differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

**Be helpful:**
- Help newcomers
- Share knowledge
- Provide constructive feedback
- Celebrate others' contributions

**Not acceptable:**
- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing others' private information

## Questions?

- 💬 Open a [GitHub Discussion](https://github.com/p4ck3ts3nd3r/romaji-translator/discussions)

---

**Thanks for contributing! 🎌**
