// ============================================================================
// Romaji to Hiragana/English Translation Engine - Refined v2.0
// ============================================================================
// Key improvements:
// 1. Dictionary-based tokenization with longest-match algorithm
// 2. Context-aware particle detection
// 3. Long vowel standardization (ou → おう, macrons supported)
// 4. Ambiguity resolution with multiple meanings
// 5. Smarter API usage with caching and fallbacks
// ============================================================================

// ============================================================================
// SECTION 1: ROMAJI → HIRAGANA CONVERSION MAPS
// ============================================================================

// Comprehensive Romaji → Hiragana map (Hepburn + variants)
const ROMAJI_MAP = {
  // Vowels
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  
  // K-row
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  
  // G-row (voiced K)
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  
  // S-row
  'sa': 'さ', 'shi': 'し', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
  'sya': 'しゃ', 'syu': 'しゅ', 'syo': 'しょ',
  
  // Z-row (voiced S)
  'za': 'ざ', 'ji': 'じ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
  'jya': 'じゃ', 'jyu': 'じゅ', 'jyo': 'じょ',
  'zya': 'じゃ', 'zyu': 'じゅ', 'zyo': 'じょ',
  
  // T-row
  'ta': 'た', 'chi': 'ち', 'ti': 'ち', 'tsu': 'つ', 'tu': 'つ', 'te': 'て', 'to': 'と',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
  'tya': 'ちゃ', 'tyu': 'ちゅ', 'tyo': 'ちょ',
  
  // D-row (voiced T)
  'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'dya': 'ぢゃ', 'dyu': 'ぢゅ', 'dyo': 'ぢょ',
  
  // N-row
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'n': 'ん', 'nn': 'ん', "n'": 'ん',
  
  // H-row
  'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  
  // B-row (voiced H)
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  
  // P-row (half-voiced H)
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  
  // M-row
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  
  // Y-row
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  
  // R-row
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  
  // W-row
  'wa': 'わ', 'wi': 'ゐ', 'we': 'ゑ', 'wo': 'を',
  
  // Special combinations (less common)
  'fa': 'ふぁ', 'fi': 'ふぃ', 'fe': 'ふぇ', 'fo': 'ふぉ',
  'va': 'ゔぁ', 'vi': 'ゔぃ', 'vu': 'ゔ', 've': 'ゔぇ', 'vo': 'ゔぉ',
  'tsa': 'つぁ', 'tsi': 'つぃ', 'tse': 'つぇ', 'tso': 'つぉ',
  'ti': 'てぃ', 'di': 'でぃ',
  
  // Small kana
  'xa': 'ぁ', 'xi': 'ぃ', 'xu': 'ぅ', 'xe': 'ぇ', 'xo': 'ぉ',
  'xya': 'ゃ', 'xyu': 'ゅ', 'xyo': 'ょ',
  'xtu': 'っ', 'xtsu': 'っ', 'ltu': 'っ', 'ltsu': 'っ'
};

// Long vowel mappings (macrons → hiragana extensions)
const LONG_VOWEL_MAP = {
  'ā': 'あ', 'ī': 'い', 'ū': 'う', 'ē': 'い', 'ō': 'う',
  'â': 'あ', 'î': 'い', 'û': 'う', 'ê': 'い', 'ô': 'う'
};

// ============================================================================
// SECTION 1.5: KNOWN TITLES & PROPER NAMES DATABASE
// ============================================================================
// These are anime, manga, game titles, and character names that should NOT
// be literally translated but recognized as proper names/titles

const KNOWN_TITLES = {
  // Anime/Manga Titles (romaji → { japanese, english, type })
  'sousou no frieren': { 
    japanese: '葬送のフリーレン', 
    english: 'Frieren: Beyond Journey\'s End',
    type: 'anime'
  },
  'frieren': {
    japanese: 'フリーレン',
    english: 'Frieren (character name)',
    type: 'name'
  },
  'shingeki no kyojin': {
    japanese: '進撃の巨人',
    english: 'Attack on Titan',
    type: 'anime'
  },
  'kimetsu no yaiba': {
    japanese: '鬼滅の刃',
    english: 'Demon Slayer',
    type: 'anime'
  },
  'jujutsu kaisen': {
    japanese: '呪術廻戦',
    english: 'Jujutsu Kaisen (Sorcery Fight)',
    type: 'anime'
  },
  'boku no hero academia': {
    japanese: '僕のヒーローアカデミア',
    english: 'My Hero Academia',
    type: 'anime'
  },
  'one piece': {
    japanese: 'ワンピース',
    english: 'One Piece',
    type: 'anime'
  },
  'naruto': {
    japanese: 'ナルト',
    english: 'Naruto',
    type: 'anime'
  },
  'naruto shippuden': {
    japanese: 'ナルト疾風伝',
    english: 'Naruto Shippuden',
    type: 'anime'
  },
  'boruto': {
    japanese: 'ボルト',
    english: 'Boruto',
    type: 'anime'
  },
  'dragon ball': {
    japanese: 'ドラゴンボール',
    english: 'Dragon Ball',
    type: 'anime'
  },
  'bleach': {
    japanese: 'ブリーチ',
    english: 'Bleach',
    type: 'anime'
  },
  'death note': {
    japanese: 'デスノート',
    english: 'Death Note',
    type: 'anime'
  },
  'fullmetal alchemist': {
    japanese: '鋼の錬金術師',
    english: 'Fullmetal Alchemist',
    type: 'anime'
  },
  'hagane no renkinjutsushi': {
    japanese: '鋼の錬金術師',
    english: 'Fullmetal Alchemist',
    type: 'anime'
  },
  'spy x family': {
    japanese: 'スパイファミリー',
    english: 'Spy x Family',
    type: 'anime'
  },
  'chainsaw man': {
    japanese: 'チェンソーマン',
    english: 'Chainsaw Man',
    type: 'anime'
  },
  'tokyo revengers': {
    japanese: '東京リベンジャーズ',
    english: 'Tokyo Revengers',
    type: 'anime'
  },
  'mob psycho': {
    japanese: 'モブサイコ',
    english: 'Mob Psycho 100',
    type: 'anime'
  },
  'one punch man': {
    japanese: 'ワンパンマン',
    english: 'One Punch Man',
    type: 'anime'
  },
  'steins gate': {
    japanese: 'シュタインズ・ゲート',
    english: 'Steins;Gate',
    type: 'anime'
  },
  'cowboy bebop': {
    japanese: 'カウボーイビバップ',
    english: 'Cowboy Bebop',
    type: 'anime'
  },
  'neon genesis evangelion': {
    japanese: '新世紀エヴァンゲリオン',
    english: 'Neon Genesis Evangelion',
    type: 'anime'
  },
  'evangelion': {
    japanese: 'エヴァンゲリオン',
    english: 'Evangelion',
    type: 'anime'
  },
  'sword art online': {
    japanese: 'ソードアート・オンライン',
    english: 'Sword Art Online',
    type: 'anime'
  },
  'konosuba': {
    japanese: 'このすば',
    english: 'KonoSuba: God\'s Blessing on This Wonderful World!',
    type: 'anime'
  },
  're zero': {
    japanese: 'リゼロ',
    english: 'Re:Zero − Starting Life in Another World',
    type: 'anime'
  },
  'mushoku tensei': {
    japanese: '無職転生',
    english: 'Mushoku Tensei: Jobless Reincarnation',
    type: 'anime'
  },
  'oshi no ko': {
    japanese: '推しの子',
    english: 'Oshi no Ko (My Star)',
    type: 'anime'
  },
  'bocchi the rock': {
    japanese: 'ぼっち・ざ・ろっく',
    english: 'Bocchi the Rock!',
    type: 'anime'
  },
  'solo leveling': {
    japanese: '俺だけレベルアップな件',
    english: 'Solo Leveling',
    type: 'anime'
  },
  'kaiju no 8': {
    japanese: '怪獣8号',
    english: 'Kaiju No. 8',
    type: 'anime'
  },
  'demon slayer': {
    japanese: '鬼滅の刃',
    english: 'Demon Slayer: Kimetsu no Yaiba',
    type: 'anime'
  },
  'violet evergarden': {
    japanese: 'ヴァイオレット・エヴァーガーデン',
    english: 'Violet Evergarden',
    type: 'anime'
  },
  'your name': {
    japanese: '君の名は',
    english: 'Your Name (Kimi no Na wa)',
    type: 'anime'
  },
  'kimi no na wa': {
    japanese: '君の名は',
    english: 'Your Name',
    type: 'anime'
  },
  'spirited away': {
    japanese: '千と千尋の神隠し',
    english: 'Spirited Away',
    type: 'anime'
  },
  'howls moving castle': {
    japanese: 'ハウルの動く城',
    english: 'Howl\'s Moving Castle',
    type: 'anime'
  },
  'totoro': {
    japanese: 'となりのトトロ',
    english: 'My Neighbor Totoro',
    type: 'anime'
  },
  'pokemon': {
    japanese: 'ポケモン',
    english: 'Pokémon',
    type: 'anime'
  },
  'pikachu': {
    japanese: 'ピカチュウ',
    english: 'Pikachu (Pokémon character)',
    type: 'name'
  },
  'genshin impact': {
    japanese: '原神',
    english: 'Genshin Impact',
    type: 'game'
  },
  'final fantasy': {
    japanese: 'ファイナルファンタジー',
    english: 'Final Fantasy',
    type: 'game'
  },
  'zelda': {
    japanese: 'ゼルダ',
    english: 'The Legend of Zelda',
    type: 'game'
  },
  'mario': {
    japanese: 'マリオ',
    english: 'Mario (Nintendo character)',
    type: 'name'
  },
  // Add more as needed...
};

/**
 * Check if text matches a known title (case-insensitive, flexible matching)
 * @param {string} text - Input text to check
 * @returns {Object|null} Title info or null if not found
 */
function checkKnownTitle(text) {
  if (!text) return null;
  
  // Normalize: lowercase, remove extra spaces, remove special chars
  const normalized = text.toLowerCase()
    .trim()
    .replace(/[:\-_]/g, ' ')
    .replace(/\s+/g, ' ');
  
  // Direct match
  if (KNOWN_TITLES[normalized]) {
    return KNOWN_TITLES[normalized];
  }
  
  // Try without "no" particle variations
  const withoutNo = normalized.replace(/ no /g, ' ');
  if (KNOWN_TITLES[withoutNo]) {
    return KNOWN_TITLES[withoutNo];
  }
  
  // Try partial matches (for cases like "Sousou no Frieren" when they just type "Frieren")
  for (const [key, value] of Object.entries(KNOWN_TITLES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      // Only return if it's a substantial match (not just "no" or short words)
      if (key.length > 5 || normalized.length > 5) {
        return value;
      }
    }
  }
  
  return null;
}

// ============================================================================
// SECTION 2: WORD DICTIONARY FOR TOKENIZATION
// ============================================================================

// Common Japanese words (romaji → hiragana) for tokenization
// This enables word boundary detection for strings without spaces
const WORD_DICTIONARY = {
  // Pronouns
  'watashi': 'わたし', 'watakushi': 'わたくし', 'boku': 'ぼく', 'ore': 'おれ',
  'anata': 'あなた', 'kimi': 'きみ', 'kare': 'かれ', 'kanojo': 'かのじょ',
  'karera': 'かれら', 'watashitachi': 'わたしたち', 'bokutachi': 'ぼくたち',
  
  // Common verbs (dictionary form)
  'taberu': 'たべる', 'nomu': 'のむ', 'iku': 'いく', 'kuru': 'くる',
  'miru': 'みる', 'kiku': 'きく', 'hanasu': 'はなす', 'yomu': 'よむ',
  'kaku': 'かく', 'suru': 'する', 'aru': 'ある', 'iru': 'いる',
  'naru': 'なる', 'omou': 'おもう', 'shiru': 'しる', 'wakaru': 'わかる',
  
  // Common verb forms (masu, te, ta)
  'tabemasu': 'たべます', 'nomimasu': 'のみます', 'ikimasu': 'いきます',
  'kimasu': 'きます', 'mimasu': 'みます', 'kikimasu': 'ききます',
  'hanashimasu': 'はなします', 'yomimasu': 'よみます', 'kakimasu': 'かきます',
  'shimasu': 'します', 'arimasu': 'あります', 'imasu': 'います',
  'narimasu': 'なります', 'omoimasu': 'おもいます',
  'wakarimasu': 'わかります', 'shiteimasu': 'しています',
  'tabete': 'たべて', 'nonde': 'のんで', 'itte': 'いって', 'kite': 'きて',
  'mite': 'みて', 'kiite': 'きいて', 'hanashite': 'はなして',
  'tabeta': 'たべた', 'nonda': 'のんだ', 'itta': 'いった', 'kita': 'きた',
  
  // Copula and auxiliaries
  'desu': 'です', 'deshita': 'でした', 'masu': 'ます', 'mashita': 'ました',
  'masen': 'ません', 'dewa': 'では', 'janai': 'じゃない',
  'darou': 'だろう', 'deshou': 'でしょう',
  
  // Adjectives (common i-adjectives)
  'ookii': 'おおきい', 'chiisai': 'ちいさい', 'takai': 'たかい',
  'yasui': 'やすい', 'atarashii': 'あたらしい', 'furui': 'ふるい',
  'ii': 'いい', 'yoi': 'よい', 'warui': 'わるい', 'nagai': 'ながい',
  'mijikai': 'みじかい', 'hayai': 'はやい', 'osoi': 'おそい',
  'oishii': 'おいしい', 'mazui': 'まずい', 'tanoshii': 'たのしい',
  'kanashii': 'かなしい', 'ureshii': 'うれしい', 'kawaii': 'かわいい',
  'utsukushii': 'うつくしい', 'kirei': 'きれい', 'karei': 'かれい',
  
  // Na-adjectives (common)
  'kirei': 'きれい', 'shizuka': 'しずか', 'nigiyaka': 'にぎやか',
  'genki': 'げんき', 'benri': 'べんり', 'taisetsu': 'たいせつ',
  'daijoubu': 'だいじょうぶ', 'hontou': 'ほんとう', 'taihen': 'たいへん',
  
  // Nouns (common)
  'hito': 'ひと', 'mono': 'もの', 'koto': 'こと', 'tokoro': 'ところ',
  'toki': 'とき', 'hi': 'ひ', 'asa': 'あさ', 'hiru': 'ひる', 'yoru': 'よる',
  'ima': 'いま', 'kyou': 'きょう', 'ashita': 'あした', 'kinou': 'きのう',
  'gakusei': 'がくせい', 'sensei': 'せんせい', 'tomodachi': 'ともだち',
  'kazoku': 'かぞく', 'kodomo': 'こども', 'otona': 'おとな',
  'nihon': 'にほん', 'nihongo': 'にほんご', 'eigo': 'えいご',
  'namae': 'なまえ', 'denwa': 'でんわ', 'kuruma': 'くるま',
  'ie': 'いえ', 'uchi': 'うち', 'mise': 'みせ', 'eki': 'えき',
  'gakkou': 'がっこう', 'daigaku': 'だいがく', 'kaisha': 'かいしゃ',
  'shigoto': 'しごと', 'benkyou': 'べんきょう', 'ryokou': 'りょこう',
  'tabemono': 'たべもの', 'nomimono': 'のみもの', 'gohan': 'ごはん',
  'mizu': 'みず', 'ocha': 'おちゃ', 'sake': 'さけ',
  'neko': 'ねこ', 'inu': 'いぬ', 'sakana': 'さかな', 'tori': 'とり',
  'hana': 'はな', 'ki': 'き', 'yama': 'やま', 'kawa': 'かわ', 'umi': 'うみ',
  'sora': 'そら', 'ame': 'あめ', 'yuki': 'ゆき', 'kaze': 'かぜ',
  'joou': 'じょおう', 'ousama': 'おうさま', 'ouji': 'おうじ', 'ohime': 'おひめ',
  
  // Places and things
  'toukyou': 'とうきょう', 'tokyo': 'とうきょう',
  'oosaka': 'おおさか', 'osaka': 'おおさか',
  'kyouto': 'きょうと', 'kyoto': 'きょうと',
  
  // Greetings and phrases
  'konnichiwa': 'こんにちは', 'konbanwa': 'こんばんは',
  'ohayou': 'おはよう', 'ohayougozaimasu': 'おはようございます',
  'arigatou': 'ありがとう', 'arigatougozaimasu': 'ありがとうございます',
  'sumimasen': 'すみません', 'gomennasai': 'ごめんなさい',
  'sayounara': 'さようなら', 'oyasumi': 'おやすみ', 'oyasuminasai': 'おやすみなさい',
  'itadakimasu': 'いただきます', 'gochisousama': 'ごちそうさま',
  'hajimemashite': 'はじめまして', 'yoroshiku': 'よろしく',
  'yoroshikuonegaishimasu': 'よろしくおねがいします',
  
  // Question words
  'nani': 'なに', 'nan': 'なん', 'dare': 'だれ', 'doko': 'どこ',
  'itsu': 'いつ', 'naze': 'なぜ', 'doushite': 'どうして',
  'dou': 'どう', 'ikura': 'いくら', 'ikutsu': 'いくつ',
  
  // Demonstratives
  'kore': 'これ', 'sore': 'それ', 'are': 'あれ', 'dore': 'どれ',
  'kono': 'この', 'sono': 'その', 'ano': 'あの', 'dono': 'どの',
  'koko': 'ここ', 'soko': 'そこ', 'asoko': 'あそこ',
  'kochira': 'こちら', 'sochira': 'そちら', 'achira': 'あちら',
  
  // Numbers and counters
  'ichi': 'いち', 'ni': 'に', 'san': 'さん', 'shi': 'し', 'yon': 'よん',
  'go': 'ご', 'roku': 'ろく', 'shichi': 'しち', 'nana': 'なな',
  'hachi': 'はち', 'kyuu': 'きゅう', 'ku': 'く', 'juu': 'じゅう',
  'hyaku': 'ひゃく', 'sen': 'せん', 'man': 'まん',
  
  // Adverbs
  'totemo': 'とても', 'sugoku': 'すごく', 'chotto': 'ちょっと',
  'mou': 'もう', 'mada': 'まだ', 'itsumo': 'いつも', 'tokidoki': 'ときどき',
  'zenzen': 'ぜんぜん', 'amari': 'あまり', 'motto': 'もっと',
  'issho': 'いっしょ', 'hitori': 'ひとり', 'futari': 'ふたり',
  
  // Conjunctions and connectors
  'soshite': 'そして', 'dakara': 'だから', 'demo': 'でも', 'shikashi': 'しかし',
  'sorekara': 'それから', 'soreto': 'それと', 'mata': 'また',
  
  // Common suffixes and titles
  'san': 'さん', 'sama': 'さま', 'kun': 'くん', 'chan': 'ちゃん',
  'sensei': 'せんせい', 'senpai': 'せんぱい', 'kouhai': 'こうはい'
};

// Particles (separate for special handling)
const PARTICLES = {
  'wa': { hiragana: 'は', role: 'topic' },
  'ga': { hiragana: 'が', role: 'subject' },
  'wo': { hiragana: 'を', role: 'object' },
  'o': { hiragana: 'を', role: 'object' },
  'ni': { hiragana: 'に', role: 'location/time/target' },
  'de': { hiragana: 'で', role: 'location/means' },
  'to': { hiragana: 'と', role: 'and/with/quotation' },
  'he': { hiragana: 'へ', role: 'direction' },
  'e': { hiragana: 'へ', role: 'direction' },
  'no': { hiragana: 'の', role: 'possession/modifier' },
  'ka': { hiragana: 'か', role: 'question' },
  'mo': { hiragana: 'も', role: 'also/too' },
  'ya': { hiragana: 'や', role: 'and (non-exhaustive)' },
  'ne': { hiragana: 'ね', role: 'confirmation' },
  'yo': { hiragana: 'よ', role: 'emphasis' },
  'na': { hiragana: 'な', role: 'prohibition/na-adj' },
  'kara': { hiragana: 'から', role: 'from/because' },
  'made': { hiragana: 'まで', role: 'until/to' },
  'dake': { hiragana: 'だけ', role: 'only' },
  'shika': { hiragana: 'しか', role: 'only (with negative)' },
  'nado': { hiragana: 'など', role: 'etc.' },
  'bakari': { hiragana: 'ばかり', role: 'just/only' }
};

// ============================================================================
// SECTION 3: OFFLINE TRANSLATIONS (Common words/phrases)
// ============================================================================

const OFFLINE_TRANSLATIONS = {
  // Greetings
  'こんにちは': 'hello; good afternoon',
  'こんばんは': 'good evening',
  'おはよう': 'good morning (casual)',
  'おはようございます': 'good morning (polite)',
  'さようなら': 'goodbye',
  'おやすみ': 'good night (casual)',
  'おやすみなさい': 'good night (polite)',
  'ありがとう': 'thank you (casual)',
  'ありがとうございます': 'thank you very much (polite)',
  'すみません': 'excuse me; sorry',
  'ごめんなさい': 'I\'m sorry',
  'いただきます': 'let\'s eat (before meal)',
  'ごちそうさま': 'thank you for the meal',
  'ごちそうさまでした': 'thank you for the meal (polite)',
  'はじめまして': 'nice to meet you',
  'よろしく': 'please treat me well',
  'よろしくおねがいします': 'pleased to meet you; please help me',
  
  // Pronouns
  'わたし': 'I; me',
  'わたしは': 'I (topic)',
  'ぼく': 'I; me (masculine)',
  'ぼくは': 'I (topic, masculine)',
  'あなた': 'you',
  'かれ': 'he; him',
  'かのじょ': 'she; her; girlfriend',
  
  // Common phrases
  'です': 'is; am; are (copula)',
  'ます': 'polite verb ending',
  'ません': 'polite negative verb ending',
  'でした': 'was; were',
  'だいじょうぶ': 'okay; all right; fine',
  'だいじょうぶです': 'it\'s okay; I\'m fine',
  'わかりました': 'I understood; got it',
  'わかりません': 'I don\'t understand',
  'しりません': 'I don\'t know',
  
  // Places
  'とうきょう': 'Tokyo',
  'おおさか': 'Osaka',
  'きょうと': 'Kyoto',
  'にほん': 'Japan',
  
  // Common nouns
  'がくせい': 'student',
  'せんせい': 'teacher',
  'ともだち': 'friend',
  'かぞく': 'family',
  'にほんご': 'Japanese language',
  'えいご': 'English language',
  'たべもの': 'food',
  'のみもの': 'drink; beverage',
  'べんきょう': 'study',
  'しごと': 'work; job',
  'じょおう': 'queen',
  
  // Common adjectives
  'かわいい': 'cute',
  'きれい': 'beautiful; clean',
  'おいしい': 'delicious',
  'たのしい': 'fun; enjoyable',
  'うれしい': 'happy; glad',
  'かなしい': 'sad',
  'おおきい': 'big; large',
  'ちいさい': 'small; little',
  'あたらしい': 'new',
  'ふるい': 'old',
  'いい': 'good',
  'わるい': 'bad',
  
  // Common verbs
  'たべます': 'eat (polite)',
  'のみます': 'drink (polite)',
  'いきます': 'go (polite)',
  'きます': 'come (polite)',
  'します': 'do (polite)',
  'みます': 'see; watch (polite)',
  'ききます': 'listen; hear (polite)',
  'はなします': 'speak; talk (polite)',
  'よみます': 'read (polite)',
  'かきます': 'write (polite)',
  'わかります': 'understand (polite)',
  'しています': 'is doing (polite progressive)'
};

// ============================================================================
// SECTION 4: TRANSLATION CACHE
// ============================================================================

// In-memory cache for API responses (clears on page reload)
const translationCache = new Map();
const CACHE_MAX_SIZE = 200;

function getCachedTranslation(key) {
  return translationCache.get(key);
}

function setCachedTranslation(key, value) {
  // LRU-style: remove oldest if at capacity
  if (translationCache.size >= CACHE_MAX_SIZE) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
}

// ============================================================================
// SECTION 5: CORE CONVERSION FUNCTIONS
// ============================================================================

/**
 * Check if character is a vowel
 */
function isVowel(char) {
  return ['a', 'i', 'u', 'e', 'o'].includes(char?.toLowerCase());
}

/**
 * Check if character is a consonant
 */
function isConsonant(char) {
  return /^[bcdfghjklmnpqrstvwxyz]$/i.test(char);
}

/**
 * Normalize romaji text for consistent processing
 * - Converts to lowercase
 * - Normalizes long vowels (macrons → double vowels)
 * - Handles common romanization variants
 */
function normalizeRomaji(text) {
  if (!text) return '';
  
  let normalized = text.toLowerCase().trim();
  
  // Normalize long vowels (macrons to double vowels)
  normalized = normalized
    .replace(/ā/g, 'aa')
    .replace(/ī/g, 'ii')
    .replace(/ū/g, 'uu')
    .replace(/ē/g, 'ee')
    .replace(/ō/g, 'ou')  // Most common: ō → ou
    .replace(/â/g, 'aa')
    .replace(/î/g, 'ii')
    .replace(/û/g, 'uu')
    .replace(/ê/g, 'ee')
    .replace(/ô/g, 'ou');
  
  // Common romanization variants
  normalized = normalized
    .replace(/tch/g, 'cch')  // "ketchup" style → standard
    .replace(/m([bp])/g, 'n$1')  // "shimbun" → "shinbun" (either is valid, but standardize)
    .replace(/ou(?=[aeiou])/g, 'o');  // Handle "ou" before vowels carefully
  
  return normalized;
}

/**
 * Convert a single romaji segment to hiragana
 * Uses longest-match algorithm with the ROMAJI_MAP
 */
function romajiSegmentToHiragana(romaji) {
  if (!romaji) return '';
  
  let hiragana = '';
  let remaining = romaji.toLowerCase();
  
  while (remaining.length > 0) {
    let matched = false;
    
    // Try longest matches first (4 chars down to 1)
    for (let len = Math.min(4, remaining.length); len >= 1; len--) {
      const chunk = remaining.substring(0, len);
      
      if (ROMAJI_MAP[chunk]) {
        hiragana += ROMAJI_MAP[chunk];
        remaining = remaining.substring(len);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      const char = remaining[0];
      const nextChar = remaining[1] || '';
      
      // Double consonant → small tsu (っ)
      // e.g., "kk" in "gakkou", "tt" in "matte"
      if (isConsonant(char) && char === nextChar && char !== 'n') {
        hiragana += 'っ';
        remaining = remaining.substring(1);
        continue;
      }
      
      // Standalone 'n' before consonant or at end → ん
      if (char === 'n') {
        const afterNext = remaining[2] || '';
        // n + consonant (except y) or n at end
        if (remaining.length === 1 || 
            (isConsonant(nextChar) && nextChar !== 'y') ||
            nextChar === "'" || nextChar === ' ') {
          hiragana += 'ん';
          remaining = remaining.substring(1);
          continue;
        }
      }
      
      // Long vowel markers
      if (LONG_VOWEL_MAP[char]) {
        hiragana += LONG_VOWEL_MAP[char];
        remaining = remaining.substring(1);
        continue;
      }
      
      // "ou" → おう (long o sound)
      if (char === 'o' && nextChar === 'u') {
        hiragana += 'おう';
        remaining = remaining.substring(2);
        continue;
      }
      
      // "uu" → うう
      if (char === 'u' && nextChar === 'u') {
        hiragana += 'うう';
        remaining = remaining.substring(2);
        continue;
      }
      
      // "ii" → いい
      if (char === 'i' && nextChar === 'i') {
        hiragana += 'いい';
        remaining = remaining.substring(2);
        continue;
      }
      
      // "ei" → えい (long e sound in many words)
      if (char === 'e' && nextChar === 'i') {
        hiragana += 'えい';
        remaining = remaining.substring(2);
        continue;
      }
      
      // Unknown character - preserve as-is (punctuation, spaces, etc.)
      hiragana += char;
      remaining = remaining.substring(1);
    }
  }
  
  return hiragana;
}

// ============================================================================
// SECTION 6: TOKENIZATION (Word Boundary Detection)
// ============================================================================

/**
 * Tokenize romaji text into words using dictionary-based longest match
 * with backtracking for optimal segmentation
 * 
 * @param {string} text - Romaji text (may or may not have spaces)
 * @returns {Array} Array of token objects
 */
function tokenizeRomaji(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const normalized = normalizeRomaji(text);
  
  // If text has spaces, use them as initial word boundaries
  // but still try to detect particles within each segment
  if (normalized.includes(' ')) {
    return tokenizeSpacedText(normalized);
  }
  
  // No spaces - use dictionary-based segmentation
  return tokenizeUnspacedText(normalized);
}

/**
 * Tokenize text that already has spaces
 */
function tokenizeSpacedText(text) {
  const segments = text.split(/\s+/).filter(s => s.length > 0);
  const tokens = [];
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isFirst = i === 0;
    
    // Check if this segment is a known particle
    if (PARTICLES[segment] && !isFirst) {
      tokens.push({
        romaji: segment,
        hiragana: PARTICLES[segment].hiragana,
        isParticle: true,
        particleRole: PARTICLES[segment].role,
        confidence: 0.95
      });
    }
    // Check if segment is in word dictionary
    else if (WORD_DICTIONARY[segment]) {
      tokens.push({
        romaji: segment,
        hiragana: WORD_DICTIONARY[segment],
        isParticle: false,
        confidence: 0.9
      });
    }
    // Convert directly
    else {
      tokens.push({
        romaji: segment,
        hiragana: romajiSegmentToHiragana(segment),
        isParticle: false,
        confidence: 0.7
      });
    }
  }
  
  return tokens;
}

/**
 * Tokenize text without spaces using dictionary-based segmentation
 * Uses dynamic programming with backtracking
 */
function tokenizeUnspacedText(text) {
  const n = text.length;
  if (n === 0) return [];
  
  // Build combined dictionary: words + particles
  const allWords = { ...WORD_DICTIONARY };
  for (const [key, val] of Object.entries(PARTICLES)) {
    allWords[key] = val.hiragana;
  }
  
  // Get sorted word list by length (descending) for longest-match preference
  const wordList = Object.keys(allWords).sort((a, b) => b.length - a.length);
  
  // Dynamic programming: dp[i] = best tokenization ending at position i
  const dp = new Array(n + 1).fill(null);
  dp[0] = { tokens: [], score: 0 };
  
  for (let i = 0; i < n; i++) {
    if (dp[i] === null) continue;
    
    let foundMatch = false;
    
    // Try all dictionary words starting at position i
    for (const word of wordList) {
      if (i + word.length <= n && text.substring(i, i + word.length) === word) {
        const isParticle = PARTICLES.hasOwnProperty(word) && dp[i].tokens.length > 0;
        const newScore = dp[i].score + (isParticle ? 2 : word.length * 1.5);
        
        if (dp[i + word.length] === null || dp[i + word.length].score < newScore) {
          const token = {
            romaji: word,
            hiragana: isParticle ? PARTICLES[word].hiragana : allWords[word],
            isParticle: isParticle,
            particleRole: isParticle ? PARTICLES[word].role : undefined,
            confidence: 0.9
          };
          
          dp[i + word.length] = {
            tokens: [...dp[i].tokens, token],
            score: newScore
          };
        }
        foundMatch = true;
      }
    }
    
    // Fallback: take single character or minimum viable segment
    // This handles unknown words or partial matches
    if (!foundMatch || dp[i + 1] === null || dp[i + 1].score < dp[i].score - 0.5) {
      // Try to find the next valid stopping point
      let endPos = i + 1;
      while (endPos < n && !isValidBreakpoint(text, endPos, allWords)) {
        endPos++;
      }
      
      const segment = text.substring(i, endPos);
      const newScore = dp[i].score + segment.length * 0.5; // Lower score for unknown segments
      
      if (dp[endPos] === null || dp[endPos].score < newScore) {
        dp[endPos] = {
          tokens: [...dp[i].tokens, {
            romaji: segment,
            hiragana: romajiSegmentToHiragana(segment),
            isParticle: false,
            confidence: 0.5
          }],
          score: newScore
        };
      }
    }
  }
  
  // Return best tokenization or fallback
  if (dp[n]) {
    return dp[n].tokens;
  }
  
  // Ultimate fallback: single token
  return [{
    romaji: text,
    hiragana: romajiSegmentToHiragana(text),
    isParticle: false,
    confidence: 0.3
  }];
}

/**
 * Check if position is a valid word break point
 */
function isValidBreakpoint(text, pos, dictionary) {
  if (pos >= text.length) return true;
  
  // Check if any dictionary word starts at this position
  for (const word of Object.keys(dictionary)) {
    if (text.substring(pos).startsWith(word)) {
      return true;
    }
  }
  
  // Check if this could be start of particle
  for (const particle of Object.keys(PARTICLES)) {
    if (text.substring(pos).startsWith(particle)) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// SECTION 7: API INTEGRATION
// ============================================================================

/**
 * Query Jisho.org API for translation
 * Handles the request via background script to avoid CORS
 */
async function queryJishoAPI(query) {
  // Check cache first
  const cached = getCachedTranslation(query);
  if (cached) {
    return cached;
  }
  
  try {
    // Send request to background script
    const response = await chrome.runtime.sendMessage({
      action: "fetchTranslation",
      query: query
    });
    
    if (response && response.success) {
      const result = response.data;
      setCachedTranslation(query, result);
      return result;
    } else {
      throw new Error(response?.error || "Translation failed");
    }
  } catch (error) {
    console.error("Jisho API error:", error);
    return null;
  }
}

/**
 * Format Jisho API results into readable translation
 * Includes multiple meanings for ambiguous words
 */
function formatJishoResults(data, maxMeanings = 3) {
  if (!data || !data.length) {
    return null;
  }
  
  const results = [];
  const seenMeanings = new Set();
  
  for (const entry of data.slice(0, maxMeanings)) {
    const meanings = [];
    
    for (const sense of entry.senses?.slice(0, 2) || []) {
      const defs = sense.english_definitions?.join(', ');
      if (defs && !seenMeanings.has(defs)) {
        seenMeanings.add(defs);
        meanings.push(defs);
      }
    }
    
    if (meanings.length > 0) {
      results.push({
        reading: entry.japanese?.[0]?.reading || '',
        word: entry.japanese?.[0]?.word || '',
        meanings: meanings,
        isCommon: entry.is_common || false,
        jlpt: entry.jlpt || [],
        partsOfSpeech: entry.senses?.[0]?.parts_of_speech || []
      });
    }
  }
  
  return results;
}

/**
 * Translate hiragana to English
 * Strategy:
 * 1. Check offline dictionary
 * 2. Try full phrase via API
 * 3. If no results, try word-by-word
 */
async function translateToEnglish(hiragana, tokens = []) {
  // 1. Check offline dictionary for exact match
  const offlineResult = OFFLINE_TRANSLATIONS[hiragana];
  if (offlineResult) {
    return {
      translation: offlineResult,
      source: 'offline',
      confidence: 0.85,
      alternatives: []
    };
  }
  
  // 2. Try full phrase via API
  const apiResult = await queryJishoAPI(hiragana);
  if (apiResult && apiResult.length > 0) {
    const formatted = formatJishoResults(apiResult);
    if (formatted && formatted.length > 0) {
      const primary = formatted[0];
      const alternatives = formatted.slice(1).map(f => f.meanings.join('; '));
      
      return {
        translation: primary.meanings.join('; '),
        source: 'api',
        confidence: primary.isCommon ? 0.9 : 0.75,
        alternatives: alternatives,
        isCommon: primary.isCommon,
        partsOfSpeech: primary.partsOfSpeech
      };
    }
  }
  
  // 3. Word-by-word fallback
  if (tokens.length > 1) {
    const wordTranslations = [];
    
    for (const token of tokens) {
      if (token.isParticle) {
        wordTranslations.push(`[${token.particleRole || 'particle'}]`);
        continue;
      }
      
      // Check offline first
      const offline = OFFLINE_TRANSLATIONS[token.hiragana];
      if (offline) {
        wordTranslations.push(offline.split(';')[0].trim());
        continue;
      }
      
      // Try API for individual word
      const wordResult = await queryJishoAPI(token.hiragana);
      if (wordResult && wordResult.length > 0) {
        const defs = wordResult[0].senses?.[0]?.english_definitions;
        if (defs && defs.length > 0) {
          wordTranslations.push(defs[0]);
          continue;
        }
      }
      
      // Unknown word
      wordTranslations.push(`[${token.romaji}?]`);
    }
    
    return {
      translation: wordTranslations.join(' '),
      source: 'word-by-word',
      confidence: 0.5,
      alternatives: []
    };
  }
  
  // 4. No translation found
  return {
    translation: `Unable to translate: ${hiragana}`,
    source: 'none',
    confidence: 0,
    alternatives: []
  };
}

// ============================================================================
// SECTION 8: MAIN TRANSLATION FUNCTION
// ============================================================================

/**
 * Main entry point for translation
 * @param {string} romajiText - Romaji text to translate
 * @returns {Object} Complete translation result
 */
async function translateRomaji(romajiText) {
  // Handle empty input
  if (!romajiText || romajiText.trim().length === 0) {
    return {
      romaji: '',
      hiragana: '',
      english: 'No text to translate',
      tokens: [],
      confidence: 0,
      source: 'none'
    };
  }
  
  const normalizedInput = romajiText.trim();
  
  // =========================================================================
  // STEP 1: Check if this is a known title/proper name FIRST
  // =========================================================================
  const knownTitle = checkKnownTitle(normalizedInput);
  if (knownTitle) {
    return {
      romaji: normalizedInput,
      hiragana: knownTitle.japanese,
      english: knownTitle.english,
      tokens: [],
      confidence: 1.0,
      source: 'known-title',
      titleType: knownTitle.type
    };
  }
  
  // =========================================================================
  // STEP 2: Check for capitalization (likely a proper name)
  // =========================================================================
  const hasCapitalization = /[A-Z]/.test(romajiText);
  const looksLikeTitle = hasCapitalization && romajiText.split(/\s+/).some(word => 
    word.length > 0 && word[0] === word[0].toUpperCase()
  );
  
  // =========================================================================
  // STEP 3: Normal tokenization and translation
  // =========================================================================
  const tokens = tokenizeRomaji(normalizedInput);
  
  // Build full hiragana string
  const fullHiragana = tokens.map(t => t.hiragana).join('');
  
  // Calculate average confidence
  const avgConfidence = tokens.length > 0
    ? tokens.reduce((sum, t) => sum + (t.confidence || 0.5), 0) / tokens.length
    : 0;
  
  // Prepare initial result
  const result = {
    romaji: normalizedInput,
    hiragana: fullHiragana,
    english: "Translating...",
    tokens: tokens,
    confidence: avgConfidence,
    source: 'pending'
  };
  
  // If it looks like a proper name/title but isn't in our database,
  // add a note about it possibly being a name
  if (looksLikeTitle) {
    result.possibleProperName = true;
  }
  
  // Get English translation
  try {
    const translation = await translateToEnglish(fullHiragana, tokens);
    
    // If it looks like a title and we got a weird translation, note it
    if (looksLikeTitle && translation.source !== 'known-title') {
      result.english = translation.translation;
      result.note = "This may be a proper name/title. Showing literal translation.";
      result.source = translation.source;
      result.confidence = Math.min(avgConfidence, translation.confidence) * 0.7; // Lower confidence for potential names
    } else {
      result.english = translation.translation;
      result.source = translation.source;
      result.confidence = Math.min(avgConfidence, translation.confidence);
    }
    
    // Add alternatives if available
    if (translation.alternatives && translation.alternatives.length > 0) {
      result.alternatives = translation.alternatives;
    }
    
    // Add parts of speech if available
    if (translation.partsOfSpeech) {
      result.partsOfSpeech = translation.partsOfSpeech;
    }
    
  } catch (error) {
    console.error("Translation error:", error);
    result.english = "Translation failed - please try again";
    result.source = 'error';
    result.confidence = 0;
  }
  
  return result;
}

// ============================================================================
// SECTION 9: UTILITY EXPORTS
// ============================================================================

/**
 * Quick romaji to hiragana conversion (no API call)
 */
function quickRomajiToHiragana(romaji) {
  const tokens = tokenizeRomaji(romaji);
  return tokens.map(t => t.hiragana).join('');
}

/**
 * Check if text appears to be romaji (vs English or other)
 */
function isLikelyRomaji(text) {
  if (!text) return false;
  
  const normalized = text.toLowerCase().trim();
  
  // Check for common Japanese patterns
  const japanesePatterns = [
    /desu$/, /masu$/, /kudasai/, /arigatou/, /konnichiwa/,
    /shi(?!t|p)/, /chi/, /tsu/, /[^c]hu/, /[^s]ha/
  ];
  
  for (const pattern of japanesePatterns) {
    if (pattern.test(normalized)) return true;
  }
  
  // Check dictionary hits
  const words = normalized.split(/\s+/);
  let japaneseWordCount = 0;
  
  for (const word of words) {
    if (WORD_DICTIONARY[word] || PARTICLES[word]) {
      japaneseWordCount++;
    }
  }
  
  // More than half the words are Japanese → likely romaji
  return japaneseWordCount > words.length / 2;
}

// Export for use in content script and testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    translateRomaji,
    tokenizeRomaji,
    quickRomajiToHiragana,
    romajiSegmentToHiragana,
    isLikelyRomaji,
    normalizeRomaji,
    WORD_DICTIONARY,
    PARTICLES,
    OFFLINE_TRANSLATIONS
  };
}
