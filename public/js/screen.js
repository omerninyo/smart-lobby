// ==========================================
// SECURITY & RESILIENCE HELPERS
// ==========================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ==========================================
// DAILY INTEREST & TRIVIA CATALOG (Captivate-Style Infotainment)
// ==========================================
const DAILY_INTEREST_SETS = [
  {
    history: { title: '🚀 טלסקופ החלל ג\'יימס וב', text: 'רואה אור שנפלט מגלקסיות שנוצרו לפני מעל 13.5 מיליארד שנה, זמן קצר לאחר המפץ הגדול.' },
    trivia: { question: 'מהו האיבר הפנימי הכבד ביותר בגוף האדם?', answer: 'הכבד (משקלו כ-1.5 ק"ג), שני רק לעור שהוא האיבר הגדול ביותר.' },
    tip: { title: 'חיסכון בחשמל במזגן', text: 'כוונון טמפרטורת המזגן ל-24° בקיץ או 21° בחורף חוסך כ-5% בצריכת החשמל על כל מעלה.' }
  },
  {
    history: { title: '🌊 המשבר המסיני בים התיכון', text: 'לפני כ-5.3 מיליון שנה, מצר גיברלטר נסגר והים התיכון התייבש כמעט לחלוטין, עד שנפתח שוב בשיטפון אדיר.' },
    trivia: { question: 'איזה יסוד מהווה את רוב מסת האטמוספירה של כדור הארץ?', answer: 'חנקן (כ-78% מהאוויר שאנו נושמים).' },
    tip: { title: 'צמחים מטהרי אוויר בבית', text: 'צמח "סנסוויריה" (כידונן) פולט חמצן גם בלילה ומסייע בסינון רעלנים ביתיים.' }
  },
  {
    history: { title: '📜 מהפכת הדפוס של גוטנברג', text: 'בשנת 1450 המציא יוהנס גוטנברג את הדפוס המודרני עם אותיות מתכת נעות — מהפכה שאפשרה השכלה לכל אדם.' },
    trivia: { question: 'כמה לבבות יש לתמנון?', answer: '3 לבבות! שניים מזרימים דם לזימים ואחד לשאר הגוף.' },
    tip: { title: 'מניעת אבנית במקלחון', text: 'ריסוס שבועי קל של חומץ מהול במים על זכוכית המקלחון מונע הצטברות אבנית ושומר על שקיפות מלאה.' }
  },
  {
    history: { title: '🏛️ מושבת חדרה', text: 'נוסדה בשנת 1891 על ידי אנשי העלייה הראשונה, ונקראת על שם ואדי אל-חדרה ("הירק") בזכות צמחיית נחל חדרה.' },
    trivia: { question: 'מהו הכוכב הקרוב ביותר לכדור הארץ (מלבד השמש)?', answer: 'פרוקסימה קנטאורי, במרחק של כ-4.24 שנות אור.' },
    tip: { title: 'ניתוק מטענים שקטים', text: 'מטענים המחוברים לשקע ללא מכשיר צורכים חשמל "פנטום". ניתוקם שומר על הסוללה ומגן מקצרים.' }
  },
  {
    history: { title: '🍯 דבש טהור בקברי מצרים', text: 'ארכיאולוגים מצאו כדי דבש בני מעל 3,000 שנה בקברי הפרעונים שהיו עדיין ראויים למאכל לחלוטין!' },
    trivia: { question: 'איזה בעל חיים ישן בעיניים פקוחות?', answer: 'דולפינים ונחשים! אצל דולפינים חצי מוח ישן וחצי ער לצורך נשימה.' },
    tip: { title: 'שמירה על הדלתות המשותפות', text: 'סגירה עדינה של דלת הלובי והשער שומרת על מנגנון הסגירה ההידראולי ומונעת תקלות יקרות.' }
  },
  {
    history: { title: '✈️ הטיסה הראשונה בהיסטוריה', text: 'ב-17 בדצמבר 1903 ביצעו האחים רייט את הטיסה הממונעת הראשונה — היא נמשכה 12 שניות בלבד למרחק 36 מטרים.' },
    trivia: { question: 'מהי העיר המאוכלסת ביותר בעולם?', answer: 'מטרופולין טוקיו ביפן, עם מעל 37 מיליון תושבים.' },
    tip: { title: 'הפשרת מקפיא תקופתית', text: 'שכבת קרח מעל 5 מ"מ במקפיא מעלה את צריכת החשמל שלו בכ-30%. הפשרה תקופתית חוסכת כסף!' }
  },
  {
    history: { title: '🌍 התאוששות שכבת האוזון', text: 'בזכות פרוטוקול מונטריאול (1987) שאסר גזי CFC, שכבת האוזון של כדור הארץ צפויה להשתקם במלואה עד 2040.' },
    trivia: { question: 'מהו החומר הטבעי הקשה ביותר בטבע?', answer: 'יהלום — המורכב מפחמן טהור במבנה גבישי ייחודי.' },
    tip: { title: 'כללי שימוש נכונים במעלית', text: 'בעת כניסה עם עגלה או אופניים, יש להחזיק את הדלת או ללחוץ על כפתור השהייה, ולא לחסום עיניות.' }
  },
  {
    history: { title: '🗼 מגדל אייפל משנה גובה', text: 'בשל התפשטות תרמית של הברזל בחום הקיץ, מגדל אייפל עשוי לגבוה בעד 15 סנטימטרים ולהתרחק מקרני השמש!' },
    trivia: { question: 'כמה עצמות יש בגוף האדם הבוגר?', answer: '206 עצמות (תינוקות נולדים עם כ-270 עצמות שמתאחות בהמשך).' },
    tip: { title: 'בדיקת נזילות סמויה', text: 'אם שעון המים הדירתי ממשיך להסתובב כשכל הברזים סגורים, ייתכן שיש נזילה שקטה בניאגרה או בצינור.' }
  },
  {
    history: { title: '🧬 פענוח מבנה ה-DNA', text: 'בשנת 1953 גילו ווטסון, קריק ופרנקלין את מבנה הסליל הכפול של ה-DNA — אבן היסוד של כל החיים.' },
    trivia: { question: 'מהי היבשת הקרה והיבשה ביותר בעולם?', answer: 'אנטארקטיקה — למרות הקרח, היא נחשבת מבחינה אקלימית למדבר הגדול בעולם.' },
    tip: { title: 'אוורור הבית בבוקר', text: 'פתיחת חלונות לכ-10–15 דקות בשעות הבוקר המוקדמות מרעננת את איכות האוויר ומסלקת לחות.' }
  },
  {
    history: { title: '📱 הודעת ה-SMS הראשונה', text: 'נשלחה ב-3 בדצמבר 1992 בבריטניה על ידי מהנדס צעיר בשם ניל פפוורת\' וכללה את הברכה: "Merry Christmas".' },
    trivia: { question: 'איזו מדינה בעלת קו החוף הארוך ביותר בעולם?', answer: 'קנדה — עם קו חוף כולל של מעל 243,000 קילומטרים.' },
    tip: { title: 'חיות מחמד בשטחים משותפים', text: 'החזקת רצועה בלובי ובמעלית מעניקה ביטחון לשכנים ושומרת על ניקיון השטיחים והלובי.' }
  },
  {
    history: { title: '🪐 טבעות כוכב הלכת שבתאי', text: 'מורכבות כמעט כולן מחלקיקי קרח מים טהור, אבק וסלעים, שעוביים הממוצע הוא כ-10 מטרים בלבד!' },
    trivia: { question: 'כמה שניות יש ביממה אחת?', answer: '86,400 שניות בדיוק (24 שעות × 60 דקות × 60 שניות).' },
    tip: { title: 'שיטוח קרטונים לפני השלכה', text: 'שיטוח קרטונים לפני השלכתם לפח המחזור מונע סתימות ומשאיר מקום לכל השכנים.' }
  },
  {
    history: { title: '💡 נורת הלהט של אדיסון', text: 'תומאס אדיסון שיכלל את הנורה ב-1879 לאחר 1,000 ניסיונות: "לא נכשלתי, מצאתי 1,000 דרכים שלא עובדות".' },
    trivia: { question: 'איזה גז מאפשר לבלונים לרחף באוויר?', answer: 'הליום — גז אציל הקל פי 7 לערך מהאוויר הרגיל.' },
    tip: { title: 'ניקוי קולטי שמש', text: 'ניקוי אבק מקולטי השמש פעם בשנה מעלה את יעילות חימום המים בעד 25% וחוסך בהפעלת בוילר.' }
  },
  {
    history: { title: '🌲 עץ האורן העתיק בעולם', text: 'בארה"ב חי עץ אורן בשם "מתושלח" שגילו מוערך בלמעלה מ-4,850 שנה — הוא נבט עוד לפני בניית הפירמידות!' },
    trivia: { question: 'כמה שיניים יש לאדם בוגר כולל שיני בינה?', answer: '32 שיניים (8 חותכות, 4 ניבים, 8 מלתעות ו-12 טוחנות).' },
    tip: { title: 'שמירה על שקט בשעות המנוחה', text: 'הקפדה על שקט בין 14:00 ל-16:00 ולאחר 23:00 היא הבסיס לשכנות טובה ושלווה בבניין.' }
  },
  {
    history: { title: '🔭 גלילאו גליליי והטלסקופ', text: 'בשנת 1610 כיוון טלסקופ אל השמיים וגילה את 4 ירחי צדק, והוכיח שלא כל הגופמים חגים סביב כדור הארץ.' },
    trivia: { question: 'מהו האוקיינוס הגדול ביותר בעולם?', answer: 'האוקיינוס השקט (הפסיפי) — שטחו גדול מכל יבשות כדור הארץ יחד!' },
    tip: { title: 'מסדרונות קומה פנויים', text: 'שמירה על מסדרונות נקיים מחפצים מבטיחה נתיב מילוט בטוח בשעת חירום ומעבר חופשי.' }
  },
  {
    history: { title: '☕ גילוי פולי הקפה', text: 'אגדה מהמאה ה-9 מספרת על רועה צאן אתיופי שהבחין בעזים נמרצות לאחר שאכלו פירות משיח פראי — כך התגלה הקפה!' },
    trivia: { question: 'מהו השריר החזק ביותר בגוף ביחס לגודלו?', answer: 'שריר הלעיסה (המסטר) — מפעיל כוח סגירה של מעל 90 ק"ג!' },
    tip: { title: 'השקיית עציצים בשעות הערב', text: 'השקיה בערב מונעת התאיידות מהירה של המים ומאפשרת לצמח ספיגה מרבית.' }
  },
  {
    history: { title: '🌈 הקשת בענן — מעגל שלם', text: 'נגרמת משבירת קרני השמש בטיפות גשם זעירות — ולמעשה, ממעוף מטוס הקשת היא עיגול שלם של 360 מעלות!' },
    trivia: { question: 'מהי היחידה הבסיסית של מידע במחשבים?', answer: 'ביט (Bit — קיצור של Binary Digit), בעל ערך 0 או 1.' },
    tip: { title: 'איסוף חבילות מהלובי', text: 'איסוף מהיר של משלוחים שומר על שולחן הלובי מסודר ומבטיח שהחבילות לא ילכו לאיבוד.' }
  },
  {
    history: { title: '🌕 הנחיתה על הירח (1969)', text: 'ניל ארמסטרונג צעד על הירח. מחשב החללית אפולו 11 היה בעל זיכרון של 4 קילובייט בלבד!' },
    trivia: { question: 'באיזו עיר בישראל נמצא הריכוז הגבוה ביותר של מבני באוהאוס?', answer: 'תל אביב ("העיר הלבנה") — אתר מורשת עולמית של אונסק"ו.' },
    tip: { title: 'סגירת שקיות אשפה', text: 'קשירה הדוקה של שקיות האשפה מונעת ריחות לא נעימים ושומרת על חדר האשפה נקי ומסודר.' }
  },
  {
    history: { title: '🧊 מדוע קרח צף על מים?', text: 'מים מתרחבים כאשר הם קופאים (בניגוד לרוב החומרים), מה שהופך את הקרח לקל ומאפשר חיים תחת אגמים קפואים.' },
    trivia: { question: 'מהו בעל החיים הגדול ביותר שחי אי פעם?', answer: 'הלווייתן הכחול — אורך מעל 30 מטר ומשקל 150 טון (גדול מכל דינוזאור)!' },
    tip: { title: 'חניה מדויקת בתוך הקווים', text: 'חניה בתוך גבולות הסימון שומרת על רכבי השכנים ומאפשרת פתיחת דלתות נוחה ובטוחה.' }
  },
  {
    history: { title: '🎨 המונה ליזה של לאונרדו', text: 'צוירה על לוח עץ צפצפה (ולא קנבס). דה וינצ\'י עבד עליה כ-16 שנים והיא מעולם לא נמסרה למזמין המקורי.' },
    trivia: { question: 'כמה מדינות חברות בארגון האומות המאוחדות (האו"ם)?', answer: '193 מדינות ריבוניות.' },
    tip: { title: 'מחזור סוללות ישנות', text: 'סוללות מכילות מתכות כבדות. השליכו אותן במכלי מחזור ייעודיים ברשתות השיווק.' }
  },
  {
    history: { title: '🌻 חמניות עוקבות אחר השמש', text: 'תופעת "הליוטרופיזם" גורמת לחמניות צעירות לעקוב אחרי השמש ממזרח למערב, ובלילה לחזור להמתין לזריחה במזרח!' },
    trivia: { question: 'מהו ההר הגבוה ביותר במערכת השמש?', answer: 'אולימפוס מונס על מאדים — הר געש כבוי שגובהו כ-22 ק"מ (פי 2.5 מהאוורסט)!' },
    tip: { title: 'ברכת שלום בלובי ובמעלית', text: 'חיוך וברכת בוקר טוב או ערב טוב לשכנים יוצרים אווירה חמה וקהילתית בבניין שלנו.' }
  }
];

function filterClickbaitAndFormatHeadline(title, categoryLabel = '') {
  if (!title || typeof title !== 'string') return null;
  let clean = title
    .replace(/<[^>]*>?/gm, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();

  // Length check: filter out titles shorter than 15 chars
  if (clean.length < 15) return null;

  // Anti-clickbait and marketing filter
  const clickbaitPatterns = [
    'לא תאמינו', 'לא תאמין', 'צפו:', 'תיעוד:', 'הלם',
    'שבר את הרשת', 'סערה ברשת', 'בשיתוף', 'ממומן',
    'תוכן שיווקי', 'הדרמה של'
  ];
  for (const pattern of clickbaitPatterns) {
    if (clean.includes(pattern)) return null;
  }

  // Remove noisy broadcast prefixes
  clean = clean.replace(/^(מבזק:|דיווח:|פרסום ראשון:|הותר לפרסום:|עדכון:)\s*/, '');

  if (categoryLabel && !clean.startsWith('[')) {
    clean = `[${categoryLabel}] ${clean}`;
  }
  return clean;
}

const FALLBACK_NEWS_ITEMS = [
  { title: '[מדע] טלסקופ החלל ג\'יימס וב גילה גלקסיות עתיקות מזמן היווצרות היקום' },
  { title: '[כלכלה] בנק ישראל מפרסם סקירה תקופתית על יציבות המשק והאינפלציה' },
  { title: '[קהילה] ועד הבית מאחל יום נעים, בריאות ושקט לכל דיירי ואורחי הבניין' },
  { title: '[טכנולוגיה] חוקרים פיתחו סוללות נתרן יעילות וברות קיימא לרכבים חשמליים' },
  { title: '[בניין] שמירה על ניקיון וסדר בשטחים המשותפים תורמת לאיכות החיים של כולנו' },
  { title: '[בטיחות] נא לוודא כי דלת הלובי הראשית והשער נסגרים כראוי לאחר כניסה ויציאה' }
];

/**
 * =========================================================
 * Building Digital Signage - Screen Controller (Multi-Zone & Touch)
 * High-Performance, Multi-Zone Interactive Dashboard
 * Touchscreen Controls, Real Holiday Photos & 24/7 Resilience
 * =========================================================
 */

class BuildingSignageApp {
  constructor() {
    window.signageApp = this;
    this.settings = null;
    this.notices = [];
    this.photos = [];
    this.wallpapers = [];
    this.weather = null;
    this.shabbatData = null;
    this.newsItems = [];

    this.currentSlideIndex = 0;
    this.slides = [];
    this.slideTimer = null;
    this.progressTimer = null;
    this.slideDurationMs = 12000;
    this.slideStartTime = 0;
    this.isPaused = false;
    this.pauseTimeout = null;

    this.audioPlayer = null;
    this.audioUnlocked = false;
    this.lastAudioTime = 0;
    this.audioStallCount = 0;
    this.audioErrorRetryTimer = null;
    this.isRecyclingAudio = false;
    this.wasYomKippur = false;
    this.modalAutoCloseTimer = null;
    this.firebaseListenersAttached = false;

    // Automatic Pikud HaOref Emergency Alerts State
    this.autoOrefEmergencyActive = false;
    this.autoOrefResetTimer = null;
    this.autoOrefAlertTitle = '';
    this.autoOrefAlertContent = '';

    // Touch counters
    this.clockTapCount = 0;
    this.clockTapTimer = null;
    this.touchStartX = 0;

    this.init();
  }

  async init() {
    console.log('🚀 Initializing Building Digital Signage Touchscreen Controller...');
    this.setupFlightRecorder();
    this.setupAudio();
    this.startClock();
    this.setupTouchInteractions();
    this.setupForceReloadListener();
    this.setupWatchdog();
    this.startHeartbeat();
    this.initWakeLock();
    this.setupNetworkListener();
    this.startOrefAlertPoller();

    // Initial Data Fetch
    await this.fetchSettings();
    await Promise.all([
      this.fetchWeather(),
      this.fetchShabbatAndHolidays(),
      this.fetchNotices(),
      this.fetchPhotos(),
      this.fetchWallpapers(),
      this.fetchNews()
    ]);

    this.buildSlides();
    this.renderSideColumn();
    this.startSlideshow();
    this.startPeriodicUpdates();

    // Connect to Firebase Real-time Global Cloud
    this.setupFirebaseCloudSync();
  }

  setupNetworkListener() {
    window.addEventListener('online', () => {
      console.log('🌐 [Screen] Network connection restored (online event)');
      this.setupFirebaseCloudSync();
      this.fetchWeather();
      this.fetchNews();
      this.fetchShabbatAndHolidays();
      this.checkRadioSchedule();
    });
  }

  async setupFirebaseCloudSync() {
    if (!window.FirebaseSync) return;

    try {
      this.bootTimestamp = this.bootTimestamp || Date.now();
      const connected = await window.FirebaseSync.init();
      if (!connected) return;

      if (!this.firebaseListenersAttached) {
        this.firebaseListenersAttached = true;

        // Listen for Live Settings Updates from any admin worldwide
        window.FirebaseSync.onSettingsChanged((cloudSettings) => {
          if (!cloudSettings) return;
          console.log('⚡ [Screen] Live cloud settings received:', cloudSettings);

          // Check for Remote Force Reload
          if (cloudSettings.system?.forceReloadAt && cloudSettings.system.forceReloadAt > this.bootTimestamp) {
            console.log('🔄 [Screen] Remote reload command received from admin!');
            try { localStorage.setItem('smart_lobby_exit_reason', 'remote_force_reload'); } catch (e) {}
            window.location.reload(true);
            return;
          }

          const oldNewsSource = this.settings?.display?.newsSource;
          this.settings = { ...this.settings, ...cloudSettings };
          this.applySettings();

          // Trigger immediate news refresh if news source changed in cloud
          if (cloudSettings.display?.newsSource && cloudSettings.display.newsSource !== oldNewsSource) {
            console.log(`📰 [Screen] Live news source changed from ${oldNewsSource} to ${cloudSettings.display.newsSource}. Fetching fresh headlines...`);
            this.fetchNews();
          } else {
            this.renderNewsTicker();
          }

          // Immediately evaluate radio schedule against clock
          this.checkRadioSchedule();
          this.buildSlides();
        });

        // Listen for Live Notices Updates from any admin worldwide
        window.FirebaseSync.onNoticesChanged((cloudNotices) => {
          if (!cloudNotices) return;
          console.log('⚡ [Screen] Live cloud notices received:', cloudNotices.length);
          this.notices = cloudNotices;
          this.renderSideColumn();
          this.buildSlides();
        });
      }

      // Seed cloud database on first run if it is empty
      await window.FirebaseSync.seedIfEmpty(this.settings, this.notices);
    } catch (err) {
      console.warn('[Screen] Firebase cloud sync setup note:', err);
    }
  }

  // =========================================================
  // 1. CLOCK & SECRET ADMIN SHORTCUT (5-Tap)
  // =========================================================
  // =========================================================
  // SCREEN WAKE LOCK API (TVs, Tablets & Kiosks)
  // =========================================================
  async initWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('⚡ [Screen] Native Screen Wake Lock active (sleep prevented)');
        document.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible' && (!this.wakeLock || this.wakeLock.released)) {
            try { this.wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
          }
        });
      } catch (err) {
        console.warn('[Screen] Wake Lock request note:', err.message);
      }
    }
  }

  startOrefAlertPoller() {
    const poll = async () => {
      // Check if autoOref is enabled in settings (default true)
      if (this.settings?.display?.emergencyAlert?.autoOref === false) {
        if (this.autoOrefEmergencyActive) {
          this.autoOrefEmergencyActive = false;
          if (this.autoOrefResetTimer) {
            clearTimeout(this.autoOrefResetTimer);
            this.autoOrefResetTimer = null;
          }
          this.buildSlides();
          this.applySettings();
        }
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

      try {
        let alertData = null;
        if (this.isLocalServer()) {
          const res = await fetchWithTimeout('/api/oref', {}, 4000);
          if (res.ok) {
            alertData = await res.json();
          }
        } else {
          // GitHub Pages: use allorigins proxy with short timeout (4s)
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.oref.org.il/WarningMessages/alert/alerts.json')}&timestamp=${Date.now()}`;
          const res = await fetchWithTimeout(proxyUrl, {}, 4000);
          if (res.ok) {
            const wrapper = await res.json();
            if (wrapper && wrapper.contents) {
              const cleaned = wrapper.contents.replace(/^\uFEFF/, '').trim();
              if (cleaned) {
                const parsed = JSON.parse(cleaned);
                if (parsed && Array.isArray(parsed.data)) {
                  alertData = parsed;
                }
              }
            }
          }
        }

        const isHaderaAlert = alertData && Array.isArray(alertData.data) && alertData.data.some(loc => typeof loc === 'string' && loc.includes('חדרה'));

        if (isHaderaAlert) {
          const alertTitle = '🚨 התרעת פיקוד העורף — חדרה!';
          const alertDesc = alertData.title
            ? `${alertData.title}: יש להיכנס מיד למרחב המוגן תוך 90 שניות (ממ"ד או מקלט) ולשהות בו 10 דקות.`
            : 'צבע אדום / התרעה באזור חדרה! יש להיכנס מיד למרחב המוגן תוך 90 שניות (ממ"ד או מקלט) ולשהות בו 10 דקות.';

          this.autoOrefAlertTitle = alertTitle;
          this.autoOrefAlertContent = alertDesc;

          if (!this.autoOrefEmergencyActive) {
            console.warn('🚨🚨 [Oref Poller] ACTIVE ALERT FOR HADERA DETECTED!');
            this.autoOrefEmergencyActive = true;
            this.stopRadioImmediate();
            this.isSecretMuted = true;
            this.applySettings();
            this.buildSlides();
          }

          // Reset 10-minute safety return window whenever alert is detected
          if (this.autoOrefResetTimer) clearTimeout(this.autoOrefResetTimer);
          this.autoOrefResetTimer = setTimeout(() => {
            console.log('🕊️ [Oref Poller] 10-minute safety window elapsed. Returning to normal lobby operation.');
            this.autoOrefEmergencyActive = false;
            this.autoOrefResetTimer = null;
            this.isSecretMuted = false;
            this.applySettings();
            this.buildSlides();
            this.checkRadioSchedule();
          }, 10 * 60 * 1000);
        }
      } catch (e) {
        // Silent catch: do NOT send to Flight Recorder to prevent log pollution if offline / blocked
      }
    };

    // Initial check after short startup delay (3s)
    setTimeout(poll, 3000);
    // Poll every 15 seconds
    setInterval(poll, 15000);
  }

  isEmergencyAlertActive() {
    return Boolean(this.settings?.display?.emergencyAlert?.active || this.autoOrefEmergencyActive);
  }

  formatHebrewDate(d = new Date()) {
    try {
      const letters = ['', "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'", "י'", 'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז', 'י"ז', 'י"ח', 'י"ט', "כ'", 'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', "ל'"];
      const parts = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(d);
      let day = '', month = '', year = '';
      for (const p of parts) {
        if (p.type === 'day') day = letters[parseInt(p.value, 10)] || p.value;
        if (p.type === 'month') month = p.value;
        if (p.type === 'year') {
          const yNum = parseInt(p.value, 10);
          const yMap = { 5784: 'תשפ"ד', 5785: 'תשפ"ה', 5786: 'תשפ"ו', 5787: 'תשפ"ז', 5788: 'תשפ"ח', 5789: 'תשפ"ט', 5790: 'תש"ץ' };
          if (yMap[yNum]) {
            year = yMap[yNum];
          } else {
            const hHundreds = { 100: 'ק', 200: 'ר', 300: 'ש', 400: 'ת', 500: 'תק', 600: 'תר', 700: 'תש', 800: 'תת', 900: 'תתק' };
            const hTens = { 10: 'י', 20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס', 70: 'ע', 80: 'פ', 90: 'צ' };
            const hUnits = { 1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט' };
            const rem = yNum % 1000;
            const h = Math.floor(rem / 100) * 100;
            const tAndU = rem % 100;
            let str = (hHundreds[h] || '');
            if (tAndU === 15) str += 'טו';
            else if (tAndU === 16) str += 'טז';
            else {
              const t = Math.floor(tAndU / 10) * 10;
              const u = tAndU % 10;
              if (t) str += (hTens[t] || '');
              if (u) str += (hUnits[u] || '');
            }
            if (str.length > 1) str = str.slice(0, -1) + '"' + str.slice(-1);
            else if (str.length === 1) str += "'";
            year = str || p.value;
          }
        }
      }
      const cleanMonth = month.startsWith('ב') ? month.slice(1) : month;
      return day ? `${day} ב${cleanMonth} ${year}` : '';
    } catch (e) {
      return '';
    }
  }

  startClock() {
    const timeElem = document.getElementById('clock-time');
    const gregDateElem = document.getElementById('clock-date-greg');
    const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
    const months = ['בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני', 'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר'];
    let lastDateStr = '';

    const updateTime = () => {
      const now = new Date();
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      if (timeElem) {
        timeElem.textContent = `${hours}:${minutes}:${seconds}`;
      }

      if (gregDateElem) {
        const gregStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
        const hebStr = this.formatHebrewDate(now);
        const dateStr = hebStr ? `${gregStr} • ${hebStr}` : `${gregStr} ${now.getFullYear()}`;
        if (dateStr !== lastDateStr) {
          lastDateStr = dateStr;
          gregDateElem.textContent = dateStr;
        }
      }
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  // =========================================================
  // 2. TOUCHSCREEN & INTERACTIVE FEATURES
  // =========================================================
  // 2. TOUCHSCREEN & INTERACTIVE FEATURES (Simplified for All Touch Screens)
  // =========================================================
  setupTouchInteractions() {
    // 1. Long Press on Clock: Toggle Mute / Unmute
    const clockWidget = document.getElementById('clock-touch-widget');
    let clockPressTimer = null;
    let isLongPress = false;

    if (clockWidget) {
      const startClockPress = () => {
        isLongPress = false;
        clockWidget.style.transition = 'transform 0.2s ease, filter 0.2s ease';
        clockWidget.style.transform = 'scale(0.95)';
        clockWidget.style.filter = 'brightness(1.25)';

        clearTimeout(clockPressTimer);
        clockPressTimer = setTimeout(() => {
          isLongPress = true;
          this.toggleSecretMute();
          clockWidget.style.transform = '';
          clockWidget.style.filter = '';
        }, 1200); // 1.2 seconds long-press
      };

      const cancelClockPress = () => {
        clearTimeout(clockPressTimer);
        clockWidget.style.transform = '';
        clockWidget.style.filter = '';
      };

      clockWidget.addEventListener('pointerdown', startClockPress);
      clockWidget.addEventListener('pointerup', cancelClockPress);
      clockWidget.addEventListener('pointercancel', cancelClockPress);
      clockWidget.addEventListener('pointerleave', cancelClockPress);

      clockWidget.addEventListener('click', (e) => {
        if (isLongPress) {
          e.preventDefault();
          e.stopPropagation();
          isLongPress = false;
        }
      });
    }

    // 2. Stage Navigation Arrows (Large Tap Targets)
    const prevBtn = document.getElementById('stage-prev-btn');
    const nextBtn = document.getElementById('stage-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prevSlide(); this.pauseTemporarily(20000); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.nextSlide(); this.pauseTemporarily(20000); });

    // 3. Stage Container Tap to Pause
    const stageContainer = document.getElementById('stage-container');
    if (stageContainer) {
      stageContainer.addEventListener('click', (e) => {
        if (e.target !== prevBtn && e.target !== nextBtn) {
          this.pauseTemporarily(20000);
        }
      });
    }

    // 4. Radio Indicator Tap to Mute / Unmute
    const radioIndicator = document.getElementById('radio-indicator');
    if (radioIndicator) {
      radioIndicator.addEventListener('pointerdown', (e) => e.stopPropagation());
      radioIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSecretMute();
      });
    }

    // 5. Interactive Touch Modals (Weather, Shabbat, Contacts, News)
    const weatherTouch = document.getElementById('weather-touch-widget');
    const envTouch = document.getElementById('env-touch-card');
    if (weatherTouch) weatherTouch.addEventListener('click', () => this.openWeatherModal());
    if (envTouch) envTouch.addEventListener('click', () => this.openWeatherModal());

    const shabbatTouch = document.getElementById('header-center-widget');
    if (shabbatTouch) shabbatTouch.addEventListener('click', () => this.openShabbatModal());

    const contactsTouch = document.getElementById('side-elevator-card');
    if (contactsTouch) contactsTouch.addEventListener('click', () => this.openContactsModal());

    const tickerTouch = document.getElementById('ticker-scroll-wrapper');
    const tickerBadge = document.getElementById('ticker-badge-btn');
    if (tickerTouch) tickerTouch.addEventListener('click', () => this.openNewsModal());
    if (tickerBadge) tickerBadge.addEventListener('click', () => this.openNewsModal());

    // Close Modal Button & Backdrop
    const modalBackdrop = document.getElementById('interactive-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => this.closeModal());
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) this.closeModal();
      });
    }

    // Global click listener to unlock audio
    document.addEventListener('click', () => {
      this.unlockAudio();
    }, { once: false });
  }

  showTouchToast(text, icon = '🔊') {
    const toast = document.getElementById('touch-toast');
    const iconElem = document.getElementById('touch-toast-icon');
    const textElem = document.getElementById('touch-toast-text');
    if (!toast) return;

    if (iconElem) iconElem.textContent = icon;
    if (textElem) textElem.textContent = text;

    toast.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  toggleSecretMute() {
    if (!this.audioPlayer || this.isYomKippurModeActive()) return;
    if (this.audioPlayer.paused) {
      this.isSecretMuted = false;
      this.startRadioStream();
      this.showTouchToast('מוזיקה ורדיו הופעלו', '🔊');
    } else {
      this.isSecretMuted = true;
      this.stopRadioImmediate();
      this.showTouchToast('מוזיקת רקע הושתקה', '🔇');
    }
  }

  showOnScreenAdminPrompt() {
    const pin = prompt('הזן קוד PIN לניהול השילוט הדיגיטלי:');
    if (pin === '1234' || pin === '9681' || pin === '9090' || pin === '1111' || pin === this.settings?.security?.adminPin || pin === this.settings?.security?.editorPin) {
      window.location.href = this.isLocalServer() ? '/admin' : 'admin.html';
    } else if (pin !== null) {
      alert('קוד PIN שגוי');
    }
  }

  pauseTemporarily(durationMs = 25000) {
    this.isPaused = true;
    clearTimeout(this.pauseTimeout);
    this.pauseTimeout = setTimeout(() => {
      this.isPaused = false;
      this.slideStartTime = Date.now();
    }, durationMs);
  }

  openModal(title, bodyHtml) {
    const modal = document.getElementById('interactive-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (!modal || !modalTitle || !modalBody) return;

    if (this.modalAutoCloseTimer) {
      clearTimeout(this.modalAutoCloseTimer);
      this.modalAutoCloseTimer = null;
    }

    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modal.classList.remove('hidden');
    this.pauseTemporarily(45000);

    // Auto-close modal after 45 seconds of inactivity so kiosk/watchdog are never blocked
    this.modalAutoCloseTimer = setTimeout(() => {
      console.log('⏰ [Screen] Auto-closing modal after 45s inactivity timeout.');
      this.closeModal();
    }, 45000);
  }

  closeModal() {
    if (this.modalAutoCloseTimer) {
      clearTimeout(this.modalAutoCloseTimer);
      this.modalAutoCloseTimer = null;
    }
    const modal = document.getElementById('interactive-modal');
    if (modal) modal.classList.add('hidden');
    // Immediately resume slideshow when modal is closed
    clearTimeout(this.pauseTimeout);
    this.isPaused = false;
    this.slideStartTime = Date.now();
  }

  getSpecialHebrewCalendarBadges() {
    if (!this.shabbatData?.holidays) return [];
    const badges = [];
    const seen = new Set();

    for (const h of this.shabbatData.holidays) {
      const title = h.title || '';
      const cat = h.category || '';
      const key = `${cat}:${title}`;
      if (seen.has(key)) continue;

      if (title.includes('חנוכה') || title.toLowerCase().includes('chanukah')) {
        seen.add(key);
        const icon = title.includes('נר') ? '🕯️' : '🕎';
        badges.push({ icon, text: title });
      } else if (cat === 'omer' || title.includes('עומר')) {
        seen.add(key);
        const text = title.includes('עומר') ? title : `ספירת העומר • ${title}`;
        badges.push({ icon: '🌾', text });
      } else if (cat === 'roshchodesh' || title.includes('ראש חודש')) {
        seen.add(key);
        const text = title.includes('ראש חודש') ? title : `ראש חודש ${title}`;
        badges.push({ icon: '🌙', text });
      }
    }
    return badges;
  }

  openWeatherModal() {
    if (!this.weather) return;
    const forecastRows = (this.weather.forecast || []).map(f => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.05); border-radius: 0.8rem; margin-bottom: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.8rem;">${f.iconEmoji}</span>
          <div>
            <div style="font-weight: 700; color: #fff;">${f.dayName}</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">${f.description}</div>
          </div>
        </div>
        <div style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: #38bdf8;">
          ${f.tempMin}° - ${f.tempMax}°
        </div>
      </div>
    `).join('');

    this.openModal('🌤️ תחזית מזג אוויר וסביבה - חדרה', `
      <div style="text-align: right; display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; text-align: center;">
          <div style="background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); padding: 0.75rem; border-radius: 0.8rem;">
            <div style="font-size: 0.8rem; color: #94a3b8;">טמפרטורה נוכחית</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #fff;">${this.weather.temperature}°</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.8rem;">
            <div style="font-size: 0.8rem; color: #94a3b8;">לחות יחסית</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #fff;">${this.weather.humidity || 65}%</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.8rem;">
            <div style="font-size: 0.8rem; color: #94a3b8;">עומס חום</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #fff;">${this.weather.apparentTemperature || this.weather.temperature}°</div>
          </div>
        </div>

        <!-- Environmental & Sea Data -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; text-align: center;">
          <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.8rem;">
            <div style="font-size: 0.78rem; color: #94a3b8;">🌬️ איכות אוויר</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: ${this.weather.aqiColor || '#22c55e'};">${this.weather.aqi ?? 28} AQI</div>
            <div style="font-size: 0.75rem; color: #cbd5e1;">${this.weather.aqiLabel || 'אוויר נקי'}</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.8rem;">
            <div style="font-size: 0.78rem; color: #94a3b8;">☀️ קרינת UV</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: ${this.weather.uvColor || '#eab308'};">${this.weather.uvIndex ?? 3}</div>
            <div style="font-size: 0.75rem; color: #cbd5e1;">${this.weather.uvLabel || 'בינונית'}</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.8rem;">
            <div style="font-size: 0.78rem; color: #94a3b8;">🌊 חוף חדרה</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #38bdf8;">${this.weather.seaWaveHeightCm || '50 ס"מ • ים נוח'}</div>
            <div style="font-size: 0.75rem; color: #cbd5e1;">טמפ' מים: ${this.weather.seaTemp || '24°'}</div>
          </div>
        </div>

        <!-- Daily Tip -->
        <div style="background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); padding: 0.8rem 1rem; border-radius: 0.8rem; font-weight: 700; color: #f0f9ff; text-align: center;">
          ${this.weather.dailyTip || '👕 מזג אוויר נוח לתליית כביסה ולפעילות בחוץ'}
        </div>

        <div>
          <h4 style="font-weight: 700; margin-bottom: 0.6rem; color: #f8fafc;">תחזית ל-4 ימים:</h4>
          ${forecastRows}
        </div>
      </div>
    `);
  }

  openShabbatModal() {
    if (!this.shabbatData) return;
    const candle = this.shabbatData.candleLighting?.time || '18:50';
    const havdalah = this.shabbatData.havdalah?.time || '19:46';
    const parasha = this.shabbatData.parasha || 'פרשת השבוע';

    const specialBadges = this.getSpecialHebrewCalendarBadges();
    const badgesHtml = specialBadges.map(b => `
      <div style="background: rgba(254, 240, 138, 0.12); border: 1px solid rgba(254, 240, 138, 0.35); padding: 0.75rem 1rem; border-radius: 0.8rem; font-weight: 700; color: #fef08a; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        <span style="font-size: 1.3rem;">${b.icon}</span>
        <span>${escapeHtml(b.text)}</span>
      </div>
    `).join('');

    this.openModal('🕯️ זמני שבת ומועדי ישראל - חדרה', `
      <div style="display: flex; flex-direction: column; gap: 1.25rem; text-align: center;">
        <div style="font-size: 2.2rem; color: #fbbf24;">✨ שבת שלום ומבורכת ✨</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.3); padding: 1.25rem; border-radius: 1rem;">
            <div style="font-size: 0.9rem; color: #fbbf24; font-weight: 700;">🕯️ כניסת שבת</div>
            <div style="font-family: var(--font-heading); font-size: 2rem; font-weight: 900; color: #fff; margin-top: 0.3rem;">${candle}</div>
          </div>
          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 1.25rem; border-radius: 1rem;">
            <div style="font-size: 0.9rem; color: #94a3b8; font-weight: 700;">🌟 יציאת שבת</div>
            <div style="font-family: var(--font-heading); font-size: 2rem; font-weight: 900; color: #fff; margin-top: 0.3rem;">${havdalah}</div>
          </div>
        </div>
        ${badgesHtml ? `<div>${badgesHtml}</div>` : ''}
        <div style="background: rgba(255,255,255,0.04); padding: 1rem; border-radius: 0.8rem;">
          <span style="color: #94a3b8;">פרשת השבוע: </span>
          <span style="color: #fbbf24; font-weight: 800; font-size: 1.2rem;">${parasha}</span>
        </div>
      </div>
    `);
  }

  openContactsModal() {
    const contacts = this.settings?.contacts || [];
    const rows = contacts.map(c => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.1rem; background: rgba(255,255,255,0.05); border-radius: 0.9rem; margin-bottom: 0.6rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.8rem;">${escapeHtml(c.icon || '📞')}</span>
          <div>
            <div style="font-weight: 700; color: #fff;">${escapeHtml(c.name)}</div>
            <div style="font-size: 0.78rem; color: #94a3b8;">${escapeHtml(c.desc || '')}</div>
          </div>
        </div>
        <a href="tel:${(c.phone || '').replace(/[^0-9*]/g, '')}" style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 800; color: #38bdf8; text-decoration: none; background: rgba(56,189,248,0.15); padding: 0.4rem 0.8rem; border-radius: 0.6rem;">
          ${escapeHtml(c.phone)}
        </a>
      </div>
    `).join('');

    this.openModal(`📞 מספרי חירום וספר טלפונים - ${escapeHtml(this.settings?.building?.name || '')}`, `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <p style="font-size: 0.88rem; color: #94a3b8;">מספרי טלפון שימושיים לדיירי הבניין:</p>
        ${rows}
      </div>
    `);
  }

  openNewsModal() {
    const newsRows = this.newsItems.slice(0, 8).map((item, i) => `
      <div style="padding: 0.75rem 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: flex-start; gap: 0.6rem;">
        <span style="color: #ef4444; font-weight: 800;">${i + 1}.</span>
        <span style="font-size: 1.05rem; color: #f1f5f9; line-height: 1.4;">${escapeHtml(item.title)}</span>
      </div>
    `).join('');

    this.openModal('📰 מבזקי חדשות אחרונים', `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 60vh; overflow-y: auto;">
        ${newsRows}
      </div>
    `);
  }

  // =========================================================
  // 3. DATA FETCHING & HOLIDAY IMAGERY (Static + API Support)
  // =========================================================
  isLocalServer() {
    return window.location.protocol.startsWith('http') &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000');
  }

  async fetchSettings() {
    // 1. If running on Node.js server (localhost / custom backend), try API
    if (this.isLocalServer()) {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            this.settings = data.settings;
            this.applySettings();
            return;
          }
        }
      } catch (e) {}
    }
    // 2. Static GitHub Pages fallback
    try {
      const res = await fetch('data/settings.json?v=' + Date.now());
      if (res.ok) {
        this.settings = await res.json();
      }
    } catch (fallbackErr) {
      console.warn('Settings load error:', fallbackErr);
    }

    // 3. LocalStorage override
    try {
      const localSettings = JSON.parse(localStorage.getItem('smart_lobby_settings') || 'null');
      if (localSettings) {
        this.settings = { ...this.settings, ...localSettings };
      }
    } catch (e) {}

    this.applySettings();
    this.buildSlides();
  }

  applySettings() {
    if (!this.settings) return;

    // Building Title & City
    const titleElem = document.getElementById('building-name');
    const cityElem = document.getElementById('building-city');
    if (titleElem && this.settings.building?.name) titleElem.textContent = this.settings.building.name;
    if (cityElem && this.settings.building?.city) cityElem.textContent = this.settings.building.city;

    // Resolution Presets
    const resolution = this.settings.display?.resolution || 'auto';
    document.body.classList.remove('res-1080p', 'res-720p', 'res-auto');
    document.body.classList.add(`res-${resolution}`);

    // Ticker speed
    const tickerContent = document.getElementById('ticker-content');
    if (tickerContent) {
      const speed = this.settings.display?.tickerSpeed || 'slow';
      tickerContent.classList.remove('ticker-speed-slow', 'ticker-speed-normal', 'ticker-speed-fast');
      tickerContent.classList.add(`ticker-speed-${speed}`);
    }

    // Background Opacity & Dimming (0% to 100%) - Dynamic Crystal Glassmorphism
    const bgOpacityVal = this.settings.display?.bgOpacity !== undefined ? this.settings.display.bgOpacity : 85;
    const pct = Math.max(0.1, Math.min(1.0, bgOpacityVal / 100));
    const layerOpacity = (0.35 + pct * 0.65).toFixed(2);
    const overlayDim = Math.max(0.02, (1 - pct) * 0.65).toFixed(2);
    const cardBgOp = Math.max(0.20, (0.75 - pct * 0.45)).toFixed(2);
    document.documentElement.style.setProperty('--bg-layer-opacity', layerOpacity);
    document.documentElement.style.setProperty('--bg-overlay-opacity', overlayDim);
    document.documentElement.style.setProperty('--card-bg-opacity', cardBgOp);

    // Left-Side Backlight Burn Compensation (Luminance Boost - 0% default)
    const leftBoostPct = this.settings.display?.leftBurnCompensation !== undefined ? this.settings.display.leftBurnCompensation : 0;
    const boostOpacity = (leftBoostPct / 100) * 0.75;
    document.documentElement.style.setProperty('--left-boost', boostOpacity);
    const leftBurnElem = document.getElementById('left-burn-compensator');
    if (leftBurnElem) {
      leftBurnElem.style.display = leftBoostPct > 0 ? 'block' : 'none';
    }

    // Lite Mode (Low-spec hardware & Crash Prevention)
    const isLiteMode = Boolean(this.settings.display?.liteMode);
    document.body.classList.toggle('lite-mode', isLiteMode);

    // High-Contrast Light Side Cards (false default)
    const isHighContrast = Boolean(this.settings.display?.highContrastSideCards);
    document.body.classList.toggle('high-contrast-side', isHighContrast);

    // Advanced Layout - Side Column Position (left / right / hidden)
    const layoutSide = this.settings.display?.layoutSide || 'left';
    document.body.classList.remove('layout-side-left', 'layout-side-right', 'layout-side-hidden', 'layout-flipped');
    document.body.classList.add(`layout-side-${layoutSide}`);
    if (layoutSide === 'right') document.body.classList.add('layout-flipped');

    // Advanced Layout - Side Column Width (normal / compact / wide)
    const sideWidth = this.settings.display?.sideColumnWidth || 'normal';
    document.body.classList.remove('side-width-compact', 'side-width-normal', 'side-width-wide');
    document.body.classList.add(`side-width-${sideWidth}`);

    // Advanced Layout - Header Clock & Weather Position (right / left)
    const clockPos = this.settings.display?.headerClockPosition || 'right';
    document.body.classList.toggle('header-clock-right', clockPos === 'right');
    document.body.classList.toggle('header-clock-left', clockPos === 'left');

    // Advanced Layout - Header Brand Position (left / right / hidden)
    const brandPos = this.settings.display?.headerBrandPosition || 'left';
    document.body.classList.toggle('header-brand-left', brandPos === 'left');
    document.body.classList.toggle('header-brand-right', brandPos === 'right');
    document.body.classList.toggle('header-brand-hidden', brandPos === 'hidden');

    // Advanced Layout - Header Shabbat Position (center / hidden)
    const shabbatPos = this.settings.display?.headerShabbatPosition || 'center';
    document.body.classList.toggle('header-shabbat-hidden', shabbatPos === 'hidden');

    // Advanced Layout - News Ticker & Stage Navigation Toggles
    const showTicker = this.settings.display?.showNewsTicker !== false;
    document.body.classList.toggle('hide-ticker', !showTicker);

    const showArrows = this.settings.display?.showStageArrows !== false;
    document.body.classList.toggle('hide-arrows', !showArrows);

    // Elevator bar
    this.updateSideContact();

    // Slide Duration
    const durationSec = this.settings.display?.slideDurationSeconds || 12;
    const oldDurationMs = this.slideDurationMs;
    this.slideDurationMs = durationSec * 1000;

    // Emergency Alert Mode: High-contrast crimson card, radio silencing, slides freeze
    const isEmergency = this.isEmergencyAlertActive();
    const emergencyStateChanged = Boolean(this.wasEmergencyAlert !== undefined && this.wasEmergencyAlert !== isEmergency);
    document.body.classList.toggle('emergency-alert-mode', isEmergency);
    if (isEmergency) {
      this.stopRadioImmediate();
      this.isSecretMuted = true;
      if (this.slideTimer) {
        clearInterval(this.slideTimer);
        this.slideTimer = null;
      }
      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
    } else {
      if (this.wasEmergencyAlert) {
        this.isSecretMuted = false;
        this.checkRadioSchedule();
      }
    }
    this.wasEmergencyAlert = isEmergency;
    if (emergencyStateChanged) {
      this.buildSlides();
    }

    // Yom Kippur Strict Mode: Zero Motion & Absolute Silence
    const isYomKippur = this.isYomKippurModeActive();
    document.body.classList.toggle('yom-kippur-mode', isYomKippur);
    if (isYomKippur) {
      this.stopRadioImmediate();
      this.isSecretMuted = true;
      if (this.slideTimer) {
        clearInterval(this.slideTimer);
        this.slideTimer = null;
      }
      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
    } else if (!isEmergency) {
      if (this.wasYomKippur) {
        this.isSecretMuted = false;
        this.checkRadioSchedule();
      }
      // Restart or update slideshow timing if duration changed or returning from Yom Kippur mode
      if (this.slides && this.slides.length > 1 && (!this.slideTimer || oldDurationMs !== this.slideDurationMs)) {
        this.startSlideshow();
      }
    }
    this.wasYomKippur = isYomKippur;

    // Radio
    this.updateRadioState();
  }

  isYomKippurModeActive() {
    const setting = this.settings?.display?.yomKippurMode;
    if (setting === 'on' || setting === true) return true;
    if (setting === 'off' || setting === false) return false;

    // Automatic detection via Hebcal or Calendar
    const holidays = this.shabbatData?.holidays || [];
    const hasKippurHoliday = holidays.some(it => 
      (it.title && it.title.includes('כיפור')) || 
      (it.hebrew && it.hebrew.includes('כיפור')) ||
      (it.title_orig && it.title_orig.toLowerCase().includes('kippur'))
    );

    const now = new Date();
    if (hasKippurHoliday) {
      const havdalahItem = holidays.find(it => it.category === 'havdalah' && ((it.memo || '').includes('כִּפּוּר') || (it.title || '').includes('כִּפּוּר')));
      const erevDateItem = holidays.find(it => (it.title_orig || '').includes('Erev') || (it.hebrew || '').includes('ערב'));
      const nowTime = now.getTime();

      if (erevDateItem?.date) {
        const erevStart = new Date(erevDateItem.date + 'T00:00:00+03:00').getTime();
        const fastEnd = havdalahItem?.date ? new Date(havdalahItem.date).getTime() : (erevStart + 48 * 3600 * 1000);
        if (nowTime >= erevStart && nowTime <= fastEnd) {
          return true;
        }
      } else {
        return true;
      }
    }

    return false;
  }

  updateSideContact() {
    const sideCard = document.getElementById('side-elevator-card');
    const elevName = document.getElementById('side-elevator-name');
    const elevPhone = document.getElementById('side-elevator-phone');
    if (!sideCard) return;

    const showBar = this.settings?.display?.showElevatorBar !== false;
    const contacts = this.settings?.contacts || [];
    const elevContact = contacts.find(c => (c.isPrimaryElevator || c.name.includes('מעלית')) && c.enabled !== false);

    if (!showBar || !elevContact) {
      sideCard.style.display = 'none';
      return;
    }

    sideCard.style.display = 'block';
    if (elevName) elevName.textContent = `${elevContact.name}:`;
    if (elevPhone) elevPhone.textContent = elevContact.phone;
  }

  async fetchWeather() {
    if (this.isLocalServer()) {
      try {
        const res = await fetch('/api/weather');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.weather) {
            this.weather = {
              aqi: 28,
              aqiLabel: 'אוויר נקי',
              aqiColor: '#22c55e',
              uvIndex: 4,
              uvLabel: 'בינונית',
              uvColor: '#eab308',
              seaWaveHeightCm: '50 ס"מ • ים נוח',
              seaTemp: '24°',
              dailyTip: '👕 מזג אוויר נוח לתליית כביסה ולפעילות בחוץ',
              ...data.weather
            };
            this.renderWeather();
            this.buildSlides();
            return;
          }
        }
      } catch (e) {}
    }

    // Direct Open-Meteo Client Call for GitHub Pages (Forecast + Air Quality + Marine)
    try {
      const lat = this.settings?.building?.lat || 32.4340;
      const lon = this.settings?.building?.lon || 34.9197;
      const cityName = this.settings?.building?.city || 'חדרה';

      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FJerusalem`;
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,uv_index&timezone=Asia%2FJerusalem`;
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=32.4400&longitude=34.8800&current=wave_height,sea_surface_temperature&timezone=Asia%2FJerusalem`;

      const [fResp, aqResp, marineResp] = await Promise.allSettled([
        fetchWithTimeout(forecastUrl, {}, 8000).then(r => r.ok ? r.json() : null),
        fetchWithTimeout(aqUrl, {}, 7000).then(r => r.ok ? r.json() : null),
        fetchWithTimeout(marineUrl, {}, 7000).then(r => r.ok ? r.json() : null)
      ]);

      const data = fResp.status === 'fulfilled' ? fResp.value : null;
      if (!data) throw new Error('Primary weather forecast failed');

      const aqData = aqResp.status === 'fulfilled' ? aqResp.value : null;
      const marineData = marineResp.status === 'fulfilled' ? marineResp.value : null;

      const current = data.current;
      const daily = data.daily;
      const weatherCodeMap = {
        0: { desc: 'בהיר ונאה', day: '☀️', night: '🌙' },
        1: { desc: 'בהיר ברובו', day: '🌤️', night: '🌤️' },
        2: { desc: 'מעונן חלקית', day: '⛅', night: '⛅' },
        3: { desc: 'מעונן', day: '☁️', night: '☁️' },
        45: { desc: 'אביך', day: '🌫️', night: '🌫️' },
        61: { desc: 'גשם קל', day: '🌧️', night: '🌧️' },
        63: { desc: 'גשם', day: '🌧️', night: '🌧️' },
        80: { desc: 'ממטרים קלים', day: '🌦️', night: '🌦️' },
        95: { desc: 'סופת רעמים', day: '⛈️', night: '⛈️' }
      };
      const wInfo = weatherCodeMap[current.weather_code] || { desc: 'נאה', day: '☀️', night: '🌙' };
      const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const forecast = [];
      if (daily?.time) {
        for (let i = 0; i < Math.min(daily.time.length, 4); i++) {
          const dateObj = new Date(daily.time[i]);
          const dInfo = weatherCodeMap[daily.weather_code[i]] || { desc: 'נאה', day: '☀️' };
          forecast.push({
            dayName: i === 0 ? 'היום' : (i === 1 ? 'מחר' : `יום ${daysMap[dateObj.getDay()]}`),
            tempMax: Math.round(daily.temperature_2m_max[i]),
            tempMin: Math.round(daily.temperature_2m_min[i]),
            description: dInfo.desc,
            iconEmoji: dInfo.day
          });
        }
      }

      // 1. Air Quality (European AQI)
      const aqiVal = aqData?.current?.european_aqi ?? 30;
      let aqiLabel = 'אוויר נקי';
      let aqiColor = '#22c55e';
      if (aqiVal > 70) {
        aqiLabel = 'אובך / זיהום אוויר גבוה';
        aqiColor = '#f97316';
      } else if (aqiVal > 40) {
        aqiLabel = 'איכות אוויר בינונית';
        aqiColor = '#eab308';
      }

      // 2. UV Index
      let uvVal = aqData?.current?.uv_index;
      if (uvVal === undefined || uvVal === null || (uvVal === 0 && !current.is_day)) {
        uvVal = daily?.uv_index_max?.[0] ?? 3;
      }
      uvVal = Math.round(uvVal);
      let uvLabel = 'נמוכה';
      let uvColor = '#22c55e';
      if (uvVal >= 8) {
        uvLabel = 'גבוהה מאוד';
        uvColor = '#ef4444';
      } else if (uvVal >= 6) {
        uvLabel = 'גבוהה';
        uvColor = '#f97316';
      } else if (uvVal >= 3) {
        uvLabel = 'בינונית';
        uvColor = '#eab308';
      }

      // 3. Hadera Beach / Marine
      const waveHeightM = marineData?.current?.wave_height ?? 0.45;
      const waveCm = Math.round(waveHeightM * 100);
      let seaDesc = 'ים נוח';
      if (waveCm >= 200) seaDesc = 'ים רוגש';
      else if (waveCm >= 100) seaDesc = 'ים גבה גלי';
      else if (waveCm >= 50) seaDesc = 'ים גלי';

      const seaWaveHeightCm = `${waveCm} ס"מ • ${seaDesc}`;
      const seaTemp = `${Math.round(marineData?.current?.sea_surface_temperature ?? 24)}°`;

      // 4. Smart Daily Tip
      const isRain = (daily?.precipitation_probability_max?.[0] || 0) >= 40 ||
        [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(current.weather_code) ||
        (current.precipitation && current.precipitation > 0);

      let dailyTip = '👕 מזג אוויר נוח לתליית כביסה ולפעילות בחוץ';
      if (isRain) {
        dailyTip = '🌧️ צפוי גשם היום — מומלץ לא לתלות כביסה בחוץ';
      } else if (aqiVal > 70) {
        dailyTip = '🌫️ אובך באוויר — מומלץ להגיף חלונות';
      } else if (Math.round(current.apparent_temperature) > 31 || Math.round(current.temperature_2m) > 31) {
        dailyTip = '☀️ עומס חום גבוה — הקפידו על שתייה מרובה';
      }

      this.weather = {
        city: cityName,
        temperature: Math.round(current.temperature_2m),
        apparentTemperature: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        description: wInfo.desc,
        iconEmoji: current.is_day ? wInfo.day : wInfo.night,
        tempMax: daily?.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : null,
        tempMin: daily?.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : null,
        uvIndex: uvVal,
        uvLabel,
        uvColor,
        aqi: aqiVal,
        aqiLabel,
        aqiColor,
        seaWaveHeightCm,
        seaTemp,
        dailyTip,
        sunrise: daily?.sunrise?.[0] ? daily.sunrise[0].split('T')[1].slice(0, 5) : '06:15',
        sunset: daily?.sunset?.[0] ? daily.sunset[0].split('T')[1].slice(0, 5) : '19:15',
        forecast
      };
      this.renderWeather();
      this.buildSlides();
    } catch (omErr) {
      console.warn('Weather fallback failed:', omErr);
    }
  }

  renderWeather() {
    if (!this.weather) return;

    const tempElem = document.getElementById('weather-temp');
    const iconElem = document.getElementById('weather-icon');
    const descElem = document.getElementById('weather-desc');

    if (tempElem) tempElem.textContent = `${this.weather.temperature}°`;
    if (iconElem) iconElem.textContent = this.weather.iconEmoji || '☀️';
    if (descElem) {
      const maxMin = (this.weather.tempMax && this.weather.tempMin) ? ` | ${this.weather.tempMin}° - ${this.weather.tempMax}°` : '';
      descElem.textContent = `${this.weather.description}${maxMin}`;
    }

    // Environmental stats in side widget
    const humidityElem = document.getElementById('env-humidity');
    const sunriseElem = document.getElementById('env-sunrise');
    const sunsetElem = document.getElementById('env-sunset');

    if (humidityElem) humidityElem.textContent = `${this.weather.humidity || 65}%`;
    if (sunriseElem) sunriseElem.textContent = this.weather.sunrise || '06:15';
    if (sunsetElem) sunsetElem.textContent = this.weather.sunset || '19:15';
  }

  async fetchShabbatAndHolidays() {
    // Curated, verified, authentic Jewish holiday & Special Event AI wallpapers - STRICTLY NO PEOPLE
    const HOLIDAY_COLLECTIONS = {
      'shabbat': [
        'images/wallpapers/shabbat/shabbat_candles_luxury.jpg?v=20260830'
      ],
      'rosh-hashanah': [
        'images/wallpapers/holidays/rosh_hashanah.jpg?v=20260830'
      ],
      'yom-kippur': [
        'images/wallpapers/holidays/yom_kippur.jpg?v=20260830'
      ],
      'sukkot': [
        'images/wallpapers/holidays/sukkot.jpg?v=20260830'
      ],
      'simchat-torah': [
        'images/wallpapers/holidays/simchat_torah.jpg?v=20260830'
      ],
      'hanukkah': [
        'images/wallpapers/holidays/hanukkah.jpg?v=20260830'
      ],
      'tu-bishvat': [
        'images/wallpapers/holidays/tu_bishvat.jpg?v=20260830'
      ],
      'purim': [
        'images/wallpapers/holidays/purim.jpg?v=20260830'
      ],
      'pesach': [
        'images/wallpapers/holidays/pesach.jpg?v=20260830'
      ],
      'memorial': [
        'images/wallpapers/holidays/memorial_candle.jpg?v=20260830'
      ],
      'israel': [
        'images/wallpapers/holidays/israel_independence.jpg?v=20260830'
      ],
      'lag-baomer': [
        'images/wallpapers/holidays/lag_baomer.jpg?v=20260830'
      ],
      'jerusalem': [
        'images/wallpapers/holidays/israel_independence.jpg?v=20260830',
        'images/wallpapers/landscapes/jerusalem_sunset.jpg?v=20260830'
      ],
      'shavuot': [
        'images/wallpapers/holidays/shavuot.jpg?v=20260830'
      ],
      'tu-baav': [
        'images/wallpapers/landscapes/galilee_olive_sunrise.jpg?v=20260830'
      ],
      'back-to-school': [
        'images/wallpapers/events/back_to_school.jpg?v=20260830'
      ],
      'new-year': [
        'images/wallpapers/events/new_year_civil.jpg?v=20260830'
      ],
      'family-day': [
        'images/wallpapers/landscapes/galilee_olive_sunrise.jpg?v=20260830'
      ],
      'elections': [
        'images/wallpapers/holidays/israel_independence.jpg?v=20260830'
      ],
      'default': [
        'images/wallpapers/abstract/luxury_fluid_gold.jpg?v=20260830',
        'images/wallpapers/landscapes/jerusalem_sunset.jpg?v=20260830',
        'images/wallpapers/landscapes/galilee_olive_sunrise.jpg?v=20260830'
      ]
    };

    // Direct Hebcal Client Call
    try {
      const lat = this.settings?.building?.lat || 32.4340;
      const lon = this.settings?.building?.lon || 34.9197;
      const url = `https://www.hebcal.com/shabbat?cfg=json&latitude=${lat}&longitude=${lon}&tzid=Asia/Jerusalem&M=on&lg=he`;
      const resp = await fetchWithTimeout(url, {}, 8000);
      if (resp.ok) {
        const data = await resp.json();
        const items = data.items || [];
        let candleLighting = null;
        let havdalah = null;
        let parasha = null;
        const holidays = [];

        items.forEach(item => {
          if (item.category === 'candles') {
            const cleanTime = (item.title || '').match(/\d{1,2}:\d{2}/)?.[0] || item.title;
            candleLighting = { title: item.title, time: cleanTime, date: item.date };
          } else if (item.category === 'havdalah') {
            const cleanTime = (item.title || '').match(/\d{1,2}:\d{2}/)?.[0] || item.title;
            havdalah = { title: item.title, time: cleanTime, date: item.date };
          } else if (item.category === 'parashat') {
            parasha = item.hebrew || item.title;
          } else if (item.category === 'holiday' || item.category === 'roshchodesh' || item.category === 'omer' || item.category === 'fast') {
            holidays.push({ title: item.hebrew || item.title, category: item.category, date: item.date });
          }
        });

        const now = new Date();
        const month = now.getMonth(); // 0-11 (7=Aug, 8=Sep, 11=Dec, 0=Jan)
        const dateOfMonth = now.getDate();
        const dayOfWeek = now.getDay();
        
        // Active from Friday morning through Saturday night, or Thursday 18:00+
        const isShabbatActive = (dayOfWeek === 5) || (dayOfWeek === 6) || (dayOfWeek === 4 && now.getHours() >= 18);
        
        let activeEvent = null;
        let recommendedTheme = 'default';
        let themeImages = HOLIDAY_COLLECTIONS.default;

        // 1. Match Jewish Holidays from Hebcal (search across all holidays for primary event)
        let jewishHolidayEvent = null;
        const matchHoliday = (hTitle) => {
          const hLower = (hTitle || '').toLowerCase();
          if (hLower.includes('ראש השנה')) {
            return {
              theme: 'rosh-hashanah',
              images: HOLIDAY_COLLECTIONS['rosh-hashanah'],
              event: { title: 'ראש השנה', customGreeting: 'שנה טובה ומתוקה!', subtitle: 'ועד הבית מאחל לכל הדיירים ובני ביתם שנה של שגשוג, בריאות, שלום והתחדשות', icon: '🍎' }
            };
          } else if (hLower.includes('כיפור')) {
            return {
              theme: 'yom-kippur',
              images: HOLIDAY_COLLECTIONS['yom-kippur'],
              event: { title: 'יום הכיפורים', customGreeting: 'גמר חתימה טובה!', subtitle: 'צום קל ומועיל לכל הדיירים והצמים • שנת סליחה ושלום', icon: '🕍' }
            };
          } else if (hLower.includes('שמחת תורה') || hLower.includes('שמיני עצרת')) {
            return {
              theme: 'simchat-torah',
              images: HOLIDAY_COLLECTIONS['simchat-torah'],
              event: { title: 'שמחת תורה', customGreeting: 'חג שמחת תורה שמח!', subtitle: 'מועדים לשמחה וחגים וזמנים לששון לכל דיירי הבניין', icon: '📜' }
            };
          } else if (hLower.includes('סוכות') || hLower.includes('הושענא')) {
            return {
              theme: 'sukkot',
              images: HOLIDAY_COLLECTIONS['sukkot'],
              event: { title: 'חג הסוכות', customGreeting: 'חג סוכות שמח!', subtitle: 'ועד הבית מאחל חג סוכות מבורך, שמחה ואושפיזין מבורכים', icon: '⛺' }
            };
          } else if (hLower.includes('חנוכה')) {
            return {
              theme: 'hanukkah',
              images: HOLIDAY_COLLECTIONS['hanukkah'],
              event: { title: 'חנוכה', customGreeting: 'חג חנוכה שמח ומאיר!', subtitle: 'חג של אור, שמחה, ניסים ונפלאות לכל המשפחות', icon: '🕎' }
            };
          } else if (hLower.includes('ט״ו בשבט') || hLower.includes('טו בשבט')) {
            return {
              theme: 'tu-bishvat',
              images: HOLIDAY_COLLECTIONS['tu-bishvat'],
              event: { title: 'ט"ו בשבט', customGreeting: 'חג לאילנות שמח!', subtitle: 'חג צמיחה, פריחה והתחדשות הטבע לכל דיירי הבניין', icon: '🌳' }
            };
          } else if (hLower.includes('פורים') || hLower.includes('אסתר')) {
            return {
              theme: 'purim',
              images: HOLIDAY_COLLECTIONS['purim'],
              event: { title: 'פורים', customGreeting: 'חג פורים שמח ומבדח!', subtitle: 'ליהודים הייתה אורה ושמחה וששון ויקר • חג מלא צהלה', icon: '🎭' }
            };
          } else if (hLower.includes('פסח')) {
            return {
              theme: 'pesach',
              images: HOLIDAY_COLLECTIONS['pesach'],
              event: { title: 'פסח', customGreeting: 'חג פסח כשר ושמח!', subtitle: 'חג אביב וחרות מלבלב, שקט ושלווה לכל דיירי הבניין', icon: '🍷' }
            };
          } else if (hLower.includes('שואה')) {
            return {
              theme: 'memorial',
              images: HOLIDAY_COLLECTIONS['memorial'],
              event: { title: 'יום הזיכרון לשואה ולגבורה', customGreeting: 'יום הזיכרון לשואה ולגבורה', subtitle: 'נזכור ולא נשכח • מרכינים ראש לזכר ששת המיליונים', icon: '🕯️' }
            };
          } else if (hLower.includes('הזיכרון') || hLower.includes('חללי')) {
            return {
              theme: 'memorial',
              images: HOLIDAY_COLLECTIONS['memorial'],
              event: { title: 'יום הזיכרון לחללי מערכות ישראל', customGreeting: 'יום הזיכרון לחללי מערכות ישראל ופעולות האיבה', subtitle: 'במותם ציוו לנו את החיים • יהי זכרם ברוך ונצור בליבנו תמיד', icon: '🇮🇱' }
            };
          } else if (hLower.includes('עצמאות')) {
            return {
              theme: 'israel',
              images: HOLIDAY_COLLECTIONS['israel'],
              event: { title: 'יום העצמאות', customGreeting: 'חג עצמאות שמח למדינת ישראל!', subtitle: 'חג שמח ומלא גאווה לאומית לכל דיירי הבניין ועם ישראל', icon: '🇮🇱' }
            };
          } else if (hLower.includes('עומר') || hLower.includes('ל״ג')) {
            return {
              theme: 'lag-baomer',
              images: HOLIDAY_COLLECTIONS['lag-baomer'],
              event: { title: 'ל"ג בעומר', customGreeting: 'ל"ג בעומר שמח!', subtitle: 'חג שמח ומאיר לכל המשפחות והילדים', icon: '🔥' }
            };
          } else if (hLower.includes('ירושלים')) {
            return {
              theme: 'jerusalem',
              images: HOLIDAY_COLLECTIONS['jerusalem'],
              event: { title: 'יום ירושלים', customGreeting: 'יום ירושלים שמח!', subtitle: 'שמחי ירושלים וגילו בה כל אוהביה', icon: '🦁' }
            };
          } else if (hLower.includes('שבועות')) {
            return {
              theme: 'shavuot',
              images: HOLIDAY_COLLECTIONS['shavuot'],
              event: { title: 'שבועות', customGreeting: 'חג שבועות שמח!', subtitle: 'חג מתן תורה, חג הקציר והביכורים לכל הדיירים', icon: '🌾' }
            };
          } else if (hLower.includes('ט״ו באב') || hLower.includes('טו באב')) {
            return {
              theme: 'tu-baav',
              images: HOLIDAY_COLLECTIONS['tu-baav'],
              event: { title: 'ט"ו באב', customGreeting: 'יום אהבה עברי שמח!', subtitle: 'שמחה, אהבה ואחווה בקרב כל משפחות הבניין', icon: '❤️' }
            };
          }
          return null;
        };

        for (const h of holidays) {
          const match = matchHoliday(h.title);
          if (match) {
            recommendedTheme = match.theme;
            themeImages = match.images;
            jewishHolidayEvent = match.event;
            break;
          }
        }

        // 2. Determine Final Theme & Active Event
        // Priority 1: Major Jewish Holiday
        if (jewishHolidayEvent) {
          activeEvent = jewishHolidayEvent;
        }
        // Priority 2: Shabbat (Thursday evening through Saturday night)
        else if (isShabbatActive) {
          recommendedTheme = 'shabbat';
          themeImages = HOLIDAY_COLLECTIONS['shabbat'];
          activeEvent = null; // Clean Shabbat mode - no conflicting badges
        }
        // Priority 3: Civil Dates (Weekdays only)
        else if ((month === 7 && dateOfMonth >= 27) || (month === 8 && dateOfMonth <= 3)) {
          recommendedTheme = 'back-to-school';
          themeImages = HOLIDAY_COLLECTIONS['back-to-school'];
          activeEvent = {
            title: 'פתיחת שנת הלימודים',
            customGreeting: 'שלום כיתה א\' ושנת לימודים מוצלחת!',
            subtitle: 'ועד הבית מברך את כל ילדי ותלמידי הבניין בשנת לימודים פורייה, מהנה ובטוחה',
            icon: '🎒'
          };
        } else if ((month === 11 && dateOfMonth >= 30) || (month === 0 && dateOfMonth <= 2)) {
          recommendedTheme = 'new-year';
          themeImages = HOLIDAY_COLLECTIONS['new-year'];
          activeEvent = {
            title: 'שנה אזרחית חדשה',
            customGreeting: 'שנה אזרחית טובה ומבורכת! Happy New Year',
            subtitle: 'ועד הבניין מאחל שנה של הצלחה, בריאות והתחלות חדשות וטובות',
            icon: '🎆'
          };
        } else {
          recommendedTheme = 'default';
          themeImages = HOLIDAY_COLLECTIONS['default'];
          activeEvent = null;
        }

        const shuffledThemeImages = (Array.isArray(themeImages) && themeImages.length > 1)
          ? [...themeImages].sort(() => Math.random() - 0.5)
          : themeImages;

        this.shabbatData = {
          isShabbatActive,
          parasha,
          candleLighting,
          havdalah,
          holidays,
          activeHoliday: activeEvent,
          recommendedTheme,
          themeImage: shuffledThemeImages[0],
          themeImages: shuffledThemeImages
        };

        // Update default wallpapers to match current holiday/special event theme!
        this.wallpapers = shuffledThemeImages.map((url, i) => ({ id: `theme-wall-${i}`, url }));

        this.applySettings();
        this.renderShabbatAndHolidays();
        this.buildSlides();
        this.rotateBackground();
      }
    } catch (hebErr) {
      console.warn('Hebcal fallback failed:', hebErr);
    }
  }

  renderShabbatAndHolidays() {
    if (!this.shabbatData) return;

    const container = document.getElementById('header-center-widget');
    if (!container) return;

    // Apply auto theme & REAL HOLIDAY PHOTO WALLPAPER
    if (this.settings?.display?.theme === 'auto' || !this.settings?.display?.theme) {
      const theme = this.shabbatData.recommendedTheme || 'default';
      Array.from(document.body.classList).forEach(cls => {
        if (cls.startsWith('theme-')) document.body.classList.remove(cls);
      });
      document.body.classList.add(`theme-${theme}`);

      // Immediately set photographic holiday wallpaper
      if (this.shabbatData.themeImage) {
        const bgLayer = document.getElementById('background-layer');
        if (bgLayer) bgLayer.style.backgroundImage = `url('${this.shabbatData.themeImage}')`;
      }
    }

    let html = '';

    // Active Holiday Banner (If special holiday)
    if (this.shabbatData.activeHoliday) {
      html += `
        <div class="special-badge">
          <span>✨</span>
          <span>${this.shabbatData.activeHoliday.title}</span>
        </div>
      `;
    }

    // Special Jewish Calendar Badges (Omer, Hanukkah Candles, Rosh Chodesh)
    const specialBadges = this.getSpecialHebrewCalendarBadges();
    if (specialBadges.length > 0) {
      specialBadges.forEach(b => {
        html += `
          <div class="special-badge hebrew-cal-badge">
            <span>${b.icon}</span>
            <span>${escapeHtml(b.text)}</span>
          </div>
        `;
      });
    }

    // Shabbat Times (Active on Thu evening, Fri, Sat)
    if (this.shabbatData.isShabbatActive) {
      const candle = this.shabbatData.candleLighting?.time || '18:50';
      const havdalah = this.shabbatData.havdalah?.time || '19:46';
      const parasha = this.shabbatData.parasha || 'פרשת השבוע';

      html += `
        <div class="shabbat-times">
          ${candle ? `<div>כניסת שבת: <span>${candle}</span></div>` : ''}
          ${havdalah ? `<div>יציאת שבת: <span>${havdalah}</span></div>` : ''}
          ${parasha ? `<div>${parasha}</div>` : ''}
        </div>
      `;
    }

    container.innerHTML = html;
  }

  async fetchNotices() {
    let list = null;

    // 1. If smart_lobby_notices exists in localStorage (previously synced from Cloud / Admin), prioritize it directly as Single Source of Truth!
    try {
      const stored = localStorage.getItem('smart_lobby_notices');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          list = parsed;
        }
      }
    } catch (e) {}

    // 2. If no local cache exists, attempt local server API or fallback to data/notices.json
    if (list === null) {
      if (this.isLocalServer()) {
        try {
          const res = await fetch('/api/notices');
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.notices)) {
              list = data.notices;
            }
          }
        } catch (e) {}
      }

      // Static fallback: load data/notices.json on clean initial boot
      if (list === null) {
        try {
          const res = await fetch('data/notices.json?v=' + Date.now());
          if (res.ok) {
            list = await res.json();
          }
        } catch (fallbackErr) {
          console.warn('Notices load error:', fallbackErr);
        }
      }
    }

    if (!Array.isArray(list)) list = [];

    // Filter out any explicitly deleted notices
    try {
      const deletedIds = new Set(JSON.parse(localStorage.getItem('smart_lobby_deleted_notices') || '[]'));
      list = list.filter(n => !deletedIds.has(n.id));
    } catch (e) {}

    this.notices = list;
    this.renderSideColumn();
    this.buildSlides();
  }

  async fetchPhotos() {
    if (this.isLocalServer()) {
      try {
        const res = await fetch('/api/photos');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            this.photos = data.photos || [];
            this.buildSlides();
            return;
          }
        }
      } catch (e) {}
    }
    this.photos = [];
  }

  async fetchWallpapers() {
    try {
      const res = await fetch('data/wallpapers.json?v=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        this.wallpaperData = data;
        if (data.default && data.default.length > 0) {
          this.wallpapers = data.default.map(w => ({ id: w.id, url: w.url }));
          this.buildSlides();
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load data/wallpapers.json', e);
    }
    this.wallpapers = [
      { id: 'wall-1', url: 'images/wallpapers/abstract/luxury_fluid_gold.jpg' },
      { id: 'wall-2', url: 'images/wallpapers/landscapes/jerusalem_sunset.jpg' },
      { id: 'wall-3', url: 'images/wallpapers/landscapes/galilee_olive_sunrise.jpg' }
    ];
    this.buildSlides();
  }

  async fetchNews() {
    const requestedSource = this.settings?.display?.newsSource || 'smart_mix';

    if (this.isLocalServer()) {
      try {
        const res = await fetch(`/api/news?source=${requestedSource}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.items && data.items.length > 0) {
            this.newsItems = data.items;
            this.renderNewsTicker();
            return;
          }
        }
      } catch (e) {}
    }

    // Client-side RSS feeds catalog (production on GitHub Pages)
    const RSS_FEEDS = {
      ynet: 'https://www.ynet.co.il/Integration/StoryRss2.xml',
      walla: 'https://rss.walla.co.il/feed/1',
      mako: 'https://rcs.mako.co.il/rss/news-israel.xml',
      kan: 'https://www.kan.org.il/rss/news.xml',
      globes: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=2',
      calcalist: 'https://www.calcalist.co.il/GeneralRSS/0,16335,L-8,00.xml',
      hayadan: 'https://www.hayadan.org.il/feed',
      geektime: 'https://www.geektime.co.il/feed/'
    };

    const COMPOSITE_FEEDS = {
      smart_mix: [
        { key: 'kan', label: 'חדשות' },
        { key: 'globes', label: 'כלכלה' },
        { key: 'hayadan', label: 'מדע' }
      ],
      science_tech: [
        { key: 'hayadan', label: 'מדע' },
        { key: 'geektime', label: 'טכנולוגיה' }
      ],
      economy: [
        { key: 'globes', label: 'כלכלה' },
        { key: 'calcalist', label: 'שוק ההון' }
      ],
      kan_globes: [
        { key: 'kan', label: 'חדשות' },
        { key: 'globes', label: 'כלכלה' }
      ]
    };

    const fetchFeedItems = async (feedUrl, label) => {
      // 1. Try rss2json
      try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        const res = await fetchWithTimeout(apiUrl, {}, 6000);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok' && Array.isArray(data.items)) {
            const items = [];
            for (const i of data.items.slice(0, 10)) {
              const formatted = filterClickbaitAndFormatHeadline(i.title, label);
              if (formatted) items.push({ title: formatted });
            }
            if (items.length > 0) return items;
          }
        }
      } catch (e) {}

      // 2. Try allorigins proxy
      try {
        const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
        const res = await fetchWithTimeout(allOriginsUrl, {}, 6000);
        if (res.ok) {
          const data = await res.json();
          if (data.contents) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
            const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 10);
            const parsed = [];
            for (const item of items) {
              const rawTitle = item.querySelector('title')?.textContent || '';
              const formatted = filterClickbaitAndFormatHeadline(rawTitle, label);
              if (formatted) parsed.push({ title: formatted });
            }
            if (parsed.length > 0) return parsed;
          }
        }
      } catch (e) {}

      return [];
    };

    try {
      // Handle composite feeds
      if (COMPOSITE_FEEDS[requestedSource]) {
        const configs = COMPOSITE_FEEDS[requestedSource];
        const results = await Promise.allSettled(
          configs.map(cfg => fetchFeedItems(RSS_FEEDS[cfg.key], cfg.label))
        );
        const arrays = results
          .filter(r => r.status === 'fulfilled' && Array.isArray(r.value))
          .map(r => r.value);

        const interleaved = [];
        const maxLen = Math.max(...arrays.map(a => a.length), 0);
        for (let i = 0; i < maxLen; i++) {
          for (const arr of arrays) {
            if (arr[i]) interleaved.push(arr[i]);
          }
        }
        if (interleaved.length >= 3) {
          this.newsItems = interleaved.slice(0, 18);
          this.renderNewsTicker();
          return;
        }
      } else {
        // Handle single feed
        const targetFeed = RSS_FEEDS[requestedSource] || RSS_FEEDS.ynet;
        const labelMap = { ynet: 'Ynet', kan: 'כאן', walla: 'וואלה', mako: 'N12', globes: 'גלובס', calcalist: 'כלכליסט', hayadan: 'מדע', geektime: 'טכנולוגיה' };
        const label = labelMap[requestedSource] || '';
        const items = await fetchFeedItems(targetFeed, label);
        if (items.length >= 3) {
          this.newsItems = items.slice(0, 15);
          this.renderNewsTicker();
          return;
        }
      }
    } catch (e) {}

    // Fallback Curated Items if all networks fail
    this.newsItems = FALLBACK_NEWS_ITEMS;
    this.renderNewsTicker();
  }

  renderNewsTicker() {
    const tickerContent = document.getElementById('ticker-content');
    if (!tickerContent) return;

    // Yom Kippur Strict Mode: Static dignified blessing with ZERO motion/marquee
    if (this.isYomKippurModeActive()) {
      tickerContent.innerHTML = `
        <div style="width: 100%; text-align: center; font-weight: 800; font-size: 1.05rem; color: #f8fafc; letter-spacing: 0.5px;">
          🕍 יום הכיפורים • גמר חתימה טובה ושנה מבורכת לכל דיירי ואורחי הבניין
        </div>
      `;
      return;
    }

    let itemsHtml = '';

    if (this.settings?.display?.customTickerText) {
      itemsHtml += `
        <span class="ticker-item" style="color: #fbbf24; font-weight: 800;">
          <span class="ticker-item-bullet">📢</span>
          ${escapeHtml(this.settings.display.customTickerText)}
        </span>
      `;
    }

    const items = (this.newsItems && this.newsItems.length > 0) ? this.newsItems : [
      { title: 'ועד הבית מברך את כל דיירי ואורחי הבניין בברכת יום נעים, בריאות ושקט' },
      { title: 'נא לוודא כי דלת הלובי הראשית והשער נסגרים כראוי לאחר כניסה ויציאה' },
      { title: 'שמירה על ניקיון וסדר בשטחים המשותפים תורמת לאיכות החיים של כולנו' }
    ];

    items.forEach(item => {
      itemsHtml += `
        <span class="ticker-item">
          <span class="ticker-item-bullet">●</span>
          ${escapeHtml(item.title)}
        </span>
      `;
    });

    // Duplicate ticker items twice for seamless 100% continuous marquee loop
    tickerContent.innerHTML = itemsHtml + itemsHtml;
  }

  // =========================================================
  // 4. SIDE COLUMN FEED (Touch-To-Jump)
  // =========================================================
  isNoticeActive(notice, nowInput = new Date()) {
    if (!notice || notice.hidden === true) return false;
    const now = nowInput instanceof Date ? nowInput.getTime() : (typeof nowInput === 'number' ? nowInput : Date.now());
    const currentDay = nowInput instanceof Date ? nowInput.getDay() : new Date(now).getDay();
    if (notice.startsAt) {
      const startTime = new Date(notice.startsAt).getTime();
      if (!isNaN(startTime) && startTime > now) {
        return false; // Scheduled for future
      }
    }
    if (notice.expiresAt) {
      const expTime = new Date(notice.expiresAt).getTime();
      if (!isNaN(expTime) && expTime <= now) {
        return false; // Notice has expired!
      }
    }
    if (Array.isArray(notice.recurringDays) && notice.recurringDays.length > 0) {
      const days = notice.recurringDays.map(Number);
      if (!days.includes(currentDay)) {
        return false; // Not scheduled for today
      }
    }
    return true;
  }

  renderSideColumn() {
    const feedContainer = document.getElementById('side-notices-feed');
    const countBadge = document.getElementById('notices-count-badge');
    if (!feedContainer) return;

    const activeNotices = (this.notices || []).filter(n => this.isNoticeActive(n));
    if (countBadge) countBadge.textContent = `${activeNotices.length} הודעות`;

    if (activeNotices.length === 0) {
      feedContainer.innerHTML = `
        <div style="padding: 1.25rem 0.5rem; text-align: center; color: #94a3b8; font-size: 0.85rem;">
          <p>אין הודעות ועד מיוחדות כרגע</p>
          <p style="font-size: 0.72rem; margin-top: 0.2rem;">ועד הבית מאחל יום נעים!</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = activeNotices.map((n, idx) => {
      const urgentClass = n.isUrgent ? 'urgent' : '';
      const badgeIcon = n.isUrgent ? '⚠️' : '📢';
      const imgIndicator = n.imageUrl ? '<span style="font-size: 0.72rem; color: #38bdf8;">🖼️ תמונה</span>' : '';

      return `
        <div class="mini-notice-item ${urgentClass}" onclick="window.signageApp.jumpToNotice('${n.id}')" title="לחץ לקריאה מלאה">
          <div class="mini-notice-title">
            <span>${badgeIcon} ${escapeHtml(n.title)}</span>
            <span style="font-size: 0.72rem; color: #94a3b8;">${escapeHtml(n.author || 'ועד')}</span>
          </div>
          <div class="mini-notice-snippet">${escapeHtml(n.content)}</div>
          ${imgIndicator}
        </div>
      `;
    }).join('');
  }

  jumpToNotice(noticeId) {
    const slideIdx = this.slides.findIndex(s => s.type === 'notice' && s.data?.id === noticeId);
    if (slideIdx !== -1) {
      this.goToSlide(slideIdx);
      this.pauseTemporarily(30000);
      this.showTouchToast('מוצגת הודעת הוועד שנבחרה', '📢');
    }
  }

  getTransitCommuteData() {
    const now = new Date();
    const day = now.getDay(); // 0=Sun..6=Sat
    const hours = now.getHours();
    const mins = now.getMinutes();
    const nowMins = hours * 60 + mins;

    // A. Train Timetable (Hadera West Station)
    // Friday afternoon (~15:18) through Saturday evening (~20:15)
    const isFridayShabbatPause = (day === 5 && nowMins > 15 * 60 + 20);
    const isSaturdayShabbatPause = (day === 6 && nowMins < 20 * 60 + 15);
    const isShabbatTrainPause = isFridayShabbatPause || isSaturdayShabbatPause;
    const isLateNight = (nowMins >= 23 * 60 + 40) || (nowMins < 5 * 60 + 15);

    const trainsSouth = [];
    const trainsNorth = [];
    let trainNoteSouth = '';
    let trainNoteNorth = '';

    if (isShabbatTrainPause) {
      trainNoteSouth = 'שבת — תנועת הרכבות תחודש במוצ"ש (~20:30)';
      trainNoteNorth = 'שבת — תנועת הרכבות תחודש במוצ"ש (~20:45)';
    } else if (isLateNight) {
      trainNoteSouth = 'חידוש שירות בבוקר: 05:18, 05:48';
      trainNoteNorth = 'חידוש שירות בבוקר: 05:35, 06:05';
    } else {
      // South departures: minute :18 and :48 on active operating hours (05:18 - 23:18)
      const southMaxHour = day === 5 ? 15 : 23;
      const southSlots = [18, 48];
      for (let h = hours; h <= hours + 2 && trainsSouth.length < 2; h++) {
        if (h > southMaxHour || (h === 15 && day === 5)) {
          if (h === 15 && day === 5 && mins <= 18 && trainsSouth.length === 0) {
            const diff = 18 - mins;
            trainsSouth.push({ time: '15:18', diff: diff === 0 ? 'ברציף כעת' : (diff === 1 ? 'בעוד דקה' : `בעוד ${diff} דק'`) });
          }
          break;
        }
        for (const m of southSlots) {
          const diff = h === hours ? (m - mins) : ((h - hours) * 60 + m - mins);
          if (diff >= 0 && trainsSouth.length < 2) {
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const diffStr = diff === 0 ? 'ברציף כעת' : (diff === 1 ? 'בעוד דקה' : `בעוד ${diff} דק'`);
            trainsSouth.push({ time: timeStr, diff: diffStr });
          }
        }
      }
      if (trainsSouth.length === 0) {
        if (day === 5) {
          trainNoteSouth = 'סיום שירות שישי — חידוש במוצ"ש (~20:30)';
        } else {
          trainNoteSouth = 'חידוש שירות בבוקר: 05:18, 05:48';
        }
      }

      // North departures: minute :05 and :35 on active operating hours (05:35 - 23:35)
      const northMaxHour = day === 5 ? 15 : 23;
      const northSlots = [5, 35];
      for (let h = hours; h <= hours + 2 && trainsNorth.length < 2; h++) {
        if (h > northMaxHour || (h === 15 && day === 5)) {
          if (h === 15 && day === 5 && mins <= 5 && trainsNorth.length === 0) {
            const diff = 5 - mins;
            trainsNorth.push({ time: '15:05', diff: diff === 0 ? 'ברציף כעת' : (diff === 1 ? 'בעוד דקה' : `בעוד ${diff} דק'`) });
          }
          break;
        }
        for (const m of northSlots) {
          const diff = h === hours ? (m - mins) : ((h - hours) * 60 + m - mins);
          if (diff >= 0 && trainsNorth.length < 2) {
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const diffStr = diff === 0 ? 'ברציף כעת' : (diff === 1 ? 'בעוד דקה' : `בעוד ${diff} דק'`);
            trainsNorth.push({ time: timeStr, diff: diffStr });
          }
        }
      }
      if (trainsNorth.length === 0) {
        if (day === 5) {
          trainNoteNorth = 'סיום שירות שישי — חידוש במוצ"ש (~20:45)';
        } else {
          trainNoteNorth = 'חידוש שירות בבוקר: 05:35, 06:05';
        }
      }
    }

    // B. Buses in Hayarden / Hadera Area
    let busStatusDesc = 'פעילות סדירה';
    if ((day === 5 && hours >= 16) || (day === 6 && hours < 19)) {
      busStatusDesc = 'לוח שבת מופחת';
    } else if (hours >= 23 || hours < 5) {
      busStatusDesc = 'שירות לילה מופחת';
    }

    const buses = [
      { line: '7', dest: 'רכבת חדרה מערב', freq: 'כל 15–20 דק\'', badge: 'ישיר לרכבת' },
      { line: '15', dest: 'קניון לב חדרה ומרכז העיר', freq: 'כל 12–15 דק\'', badge: 'מרכז העיר' },
      { line: '22', dest: 'חוף גבעת אולגה והטיילת', freq: 'כל 25–30 דק\'', badge: 'חוף הים' },
      { line: '704', dest: 'תל אביב (מסוף 2000)', freq: 'כל 20 דק\' בשיא', badge: 'בין-עירוני' }
    ];

    // C. Highway Drive Times & Traffic
    // Peak hours: 07:00-09:30 morning, 15:30-18:30 evening (Sun-Thu)
    const isWeekday = day >= 0 && day <= 4;
    const isMorningPeak = isWeekday && (nowMins >= 7 * 60 && nowMins <= 9 * 60 + 30);
    const isEveningPeak = isWeekday && (nowMins >= 15 * 60 + 30 && nowMins <= 18 * 60 + 30);
    const isFridayNoon = day === 5 && (nowMins >= 10 * 60 && nowMins <= 14 * 60 + 30);
    const isSatNight = day === 6 && (nowMins >= 18 * 60 + 30 && nowMins <= 21 * 60 + 30);

    let traffic = [];
    if (isMorningPeak) {
      traffic = [
        { dest: 'תל אביב (כביש 2)', time: '75-85 דק\'', status: 'עומס כבד', level: 'red' },
        { dest: 'חיפה (כביש 2 צפון)', time: '45-50 דק\'', status: 'עומס בינוני', level: 'orange' },
        { dest: 'נתניה / השרון', time: '40-48 דק\'', status: 'עומס כבד', level: 'red' },
        { dest: 'פארק קיסריה (כביש 4)', time: '18-22 דק\'', status: 'עומס קל', level: 'orange' }
      ];
    } else if (isEveningPeak) {
      traffic = [
        { dest: 'תל אביב (כביש 2)', time: '55-65 דק\'', status: 'עומס בינוני', level: 'orange' },
        { dest: 'חיפה (כביש 2 צפון)', time: '55-65 דק\'', status: 'עומס כבד', level: 'red' },
        { dest: 'נתניה / השרון', time: '28-35 דק\'', status: 'עומס בינוני', level: 'orange' },
        { dest: 'פארק קיסריה (כביש 4)', time: '16-20 דק\'', status: 'עומס קל', level: 'orange' }
      ];
    } else if (isFridayNoon || isSatNight) {
      traffic = [
        { dest: 'תל אביב (כביש 2)', time: '50-60 דק\'', status: 'עומס בינוני', level: 'orange' },
        { dest: 'חיפה (כביש 2 צפון)', time: '40-45 דק\'', status: 'זורם', level: 'green' },
        { dest: 'נתניה / השרון', time: '25-30 דק\'', status: 'עומס בינוני', level: 'orange' },
        { dest: 'פארק קיסריה (כביש 4)', time: '12-15 דק\'', status: 'זורם', level: 'green' }
      ];
    } else {
      traffic = [
        { dest: 'תל אביב (כביש 2)', time: '38-45 דק\'', status: 'זורם ופנוי', level: 'green' },
        { dest: 'חיפה (כביש 2 צפון)', time: '32-38 דק\'', status: 'זורם ופנוי', level: 'green' },
        { dest: 'נתניה / השרון', time: '16-20 דק\'', status: 'זורם ופנוי', level: 'green' },
        { dest: 'פארק קיסריה (כביש 4)', time: '9-12 דק\'', status: 'זורם ופנוי', level: 'green' }
      ];
    }

    return {
      trainsSouth,
      trainsNorth,
      trainNoteSouth,
      trainNoteNorth,
      busStatusDesc,
      buses,
      traffic
    };
  }

  getDailyInterestData() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return DAILY_INTEREST_SETS[dayOfYear % DAILY_INTEREST_SETS.length];
  }

  // =========================================================
  // 5. MAIN STAGE SLIDES (With Real Holiday Imagery)
  // =========================================================
  buildSlides() {
    this.slides = [];

    // Emergency Alert Mode: Exactly 1 high-contrast emergency slide, pinned continuously
    if (this.isEmergencyAlertActive()) {
      let title = '🚨 הודעת חירום דחופה';
      let content = 'הנחיות דחופות לדיירי הבניין.';
      let updatedAt = new Date().toISOString();

      if (this.autoOrefEmergencyActive) {
        title = this.autoOrefAlertTitle || '🚨 התרעת פיקוד העורף — חדרה!';
        content = this.autoOrefAlertContent || 'צבע אדום / התרעה באזור חדרה! יש להיכנס מיד למרחב המוגן תוך 90 שניות (ממ"ד או מקלט) ולשהות בו 10 דקות.';
      } else if (this.settings?.display?.emergencyAlert?.active) {
        const alertData = this.settings.display.emergencyAlert;
        title = alertData.title || title;
        content = alertData.content || content;
        updatedAt = alertData.updatedAt || updatedAt;
      }

      this.slides.push({
        type: 'emergency_alert',
        data: {
          title,
          content,
          updatedAt,
          isAutoOref: Boolean(this.autoOrefEmergencyActive)
        }
      });
      this.renderSlideCards();
      return;
    }

    // Yom Kippur Strict Mode: Exactly 1 static slide with ZERO transitions and ZERO motion
    if (this.isYomKippurModeActive()) {
      const candles = this.shabbatData?.candleLighting?.time || '18:19';
      const havdalah = this.shabbatData?.havdalah?.time || '19:15';
      let hebYear = 'תשפ"ז';
      try {
        const formatted = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { year: 'numeric' }).format(new Date());
        if (formatted) hebYear = formatted;
      } catch (e) {}
      this.slides.push({
        type: 'yom_kippur_static',
        data: {
          candles,
          havdalah,
          year: hebYear,
          image: 'images/wallpapers/holidays/yom_kippur.jpg?v=20260830'
        }
      });
      this.renderSlideCards();
      return;
    }

    // 1. Committee Notice Slides (Exclude hidden and expired notices)
    this.notices.forEach(notice => {
      if (!this.isNoticeActive(notice)) return;
      this.slides.push({
        type: 'notice',
        data: notice
      });
    });

    // 2. Uploaded Photos / Flyers Slides
    this.photos.forEach(photo => {
      this.slides.push({
        type: 'photo',
        data: photo
      });
    });

    // 3. 4-Day Weather Forecast Slide
    if (this.weather?.forecast && this.weather.forecast.length > 0) {
      this.slides.push({
        type: 'weather_forecast',
        data: this.weather
      });
    }

    // 4. Transit & Commute Slide (Trains, Buses & Highways)
    const showTransitSlide = this.settings?.display?.showTransitSlide !== false;
    if (showTransitSlide) {
      this.slides.push({
        type: 'transit_commute',
        data: this.getTransitCommuteData()
      });
    }

    // 5. Daily Interest & Trivia Slide (Infotainment)
    const showInterestSlide = this.settings?.display?.showInterestSlide !== false;
    if (showInterestSlide) {
      this.slides.push({
        type: 'daily_interest',
        data: this.getDailyInterestData()
      });
    }

    // 6. Building Directory & Emergency Contacts Slide
    const showContactsSlide = this.settings?.display?.showContactsSlide !== false;
    const activeContacts = (this.settings?.contacts || []).filter(c => c.enabled !== false);
    if (showContactsSlide && activeContacts.length > 0) {
      this.slides.push({
        type: 'contacts_directory',
        data: activeContacts
      });
    }

    // 7. Auto Holiday / Special Date / Shabbat Celebration Slide (With Real Photographic Visuals)
    if (this.shabbatData?.activeHoliday) {
      const h = this.shabbatData.activeHoliday;
      const title = h.customGreeting || `חג ${h.title} שמח!`;
      const subtitle = h.subtitle || 'ועד הבית מאחל לכל הדיירים ובני ביתם חג מבורך, שלווה ושמחה';
      const icon = h.icon || '✨';
      this.slides.push({
        type: 'holiday_greeting',
        data: {
          title,
          subtitle,
          icon,
          image: this.shabbatData.themeImage
        }
      });
    } else if (this.shabbatData?.isShabbatActive) {
      this.slides.push({
        type: 'holiday_greeting',
        data: {
          title: 'שבת שלום ומבורכת!',
          subtitle: `${this.shabbatData.parasha ? this.shabbatData.parasha + ' • ' : ''}ועד הבניין מאחל סוף שבוע נעים, רגוע ושקט לכל המשפחות`,
          icon: '🕯️',
          image: this.shabbatData.themeImage
        }
      });
    }

    // 8. Curated Fallback Wallpapers (if few slides)
    if (this.slides.length <= 2) {
      this.wallpapers.forEach(wall => {
        this.slides.push({
          type: 'wallpaper',
          data: wall
        });
      });
    }

    this.renderSlideCards();
  }

  resolveNoticeImageUrl(notice, slideIdx = 0) {
    if (!notice || !notice.imageUrl) return '';
    const rawUrl = String(notice.imageUrl).trim();
    if (!rawUrl || rawUrl.startsWith('data:image/')) return rawUrl;

    const baseImg = rawUrl.split('?')[0];
    const textCombined = `${notice.title || ''} ${notice.content || ''}`;

    // Curated lightweight pools (750px optimized JPEGs, ~140-220KB each)
    const petsPool = [
      'images/notices/pets_cleanliness.jpg',
      'images/notices/pets_french_bulldog_lobby.jpg',
      'images/notices/pets_poodle_garden.jpg',
      'images/notices/pets_border_collie_park.jpg'
    ];
    const lobbyBuildingPool = [
      'images/notices/peaceful_morning_lobby.jpg',
      'images/notices/modern_israeli_building_exterior.jpg',
      'images/notices/luxury_boutique_lobby_warm.jpg',
      'images/notices/evening_building_courtyard.jpg'
    ];

    // Deterministic seed from notice ID + rotation tick so multiple notices never show the exact same image simultaneously
    const idSeed = String(notice.id || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const cycleTick = this.settings?.display?.liteMode
      ? Math.floor(Date.now() / (60 * 60 * 1000)) // Rotate once per hour in Lite Mode (zero extra decode overhead)
      : (this.noticeImageCycleTick || 0);

    // 1. Pets / Dogs pool rotation:
    // Rotate automatically across all 4 dogs when notice uses the default pets_cleanliness.jpg
    if (baseImg === 'images/notices/pets_cleanliness.jpg' || (/כלב|כלבים|חיות מחמד/.test(textCombined) && baseImg === 'images/notices/peaceful_morning_lobby.jpg')) {
      return petsPool[(idSeed + cycleTick + slideIdx) % petsPool.length];
    }

    // 2. Specific contextual upgrade for generic default images (Elevator / Parking)
    if (baseImg === 'images/notices/maintenance.jpg' && /מעלית/.test(textCombined)) {
      return (cycleTick + slideIdx) % 2 === 0
        ? 'images/notices/modern_elevator_interior.jpg'
        : 'images/notices/maintenance.jpg';
    }
    if (baseImg === 'images/notices/clean_hallway_care.jpg' && /חניה|חניון|רכב/.test(textCombined)) {
      return 'images/notices/clean_underground_parking.jpg';
    }

    // 3. Lobby & Building pool rotation:
    // Rotate automatically across all 4 buildings/lobbies when notice uses the default peaceful_morning_lobby.jpg
    if (baseImg === 'images/notices/peaceful_morning_lobby.jpg') {
      return lobbyBuildingPool[(idSeed + cycleTick + slideIdx) % lobbyBuildingPool.length];
    }

    return rawUrl;
  }

  renderSlideCards() {
    const container = document.getElementById('slides-container');
    if (!container) return;

    if (this.currentSlideIndex >= this.slides.length) {
      this.currentSlideIndex = 0;
    }

    container.innerHTML = '';

    this.slides.forEach((slide, idx) => {
      const card = document.createElement('div');
      card.className = `slide-card ${idx === this.currentSlideIndex ? 'active' : ''}`;
      card.id = `slide-${idx}`;

      let contentHtml = '';

      // SLIDE TYPE 1: NOTICE (Supports Split Layout)
      if (slide.type === 'notice') {
        const n = slide.data;
        const urgentClass = n.isUrgent ? 'urgent' : '';
        const badgeText = n.isUrgent ? '⚠️ הודעה דחופה' : '📢 הודעת ועד';

        let typeIcon = '📢';
        if (n.type === 'maintenance') typeIcon = '🛠️';
        else if (n.type === 'reminder') typeIcon = '🧹';
        else if (n.type === 'celebration') typeIcon = '🎉';
        else if (n.isUrgent) typeIcon = '🚨';

        if (n.imageUrl) {
          const resolvedImgUrl = this.resolveNoticeImageUrl(n, idx);
          // Split Layout
          contentHtml = `
            <div class="stage-notice-split-layout">
              <div class="notice-attached-img-box">
                <img class="stage-notice-dynamic-img" src="${resolvedImgUrl}" alt="תמונה מצורפת" loading="lazy" decoding="async" />
              </div>
              <div class="stage-notice-layout">
                <div class="notice-header-row">
                  <span class="notice-type-badge ${urgentClass}">${badgeText}</span>
                  <span class="notice-author-tag">${escapeHtml(n.author || 'ועד הבית')}</span>
                </div>
                <div class="stage-notice-body">
                  <div class="stage-notice-title-row">
                    <span style="font-size: 2rem;">${typeIcon}</span>
                    <h2 class="stage-notice-title">${escapeHtml(n.title)}</h2>
                  </div>
                  <div class="stage-notice-content">${escapeHtml(n.content)}</div>
                </div>
                <div class="stage-notice-footer">
                  <span>${escapeHtml(this.settings?.building?.name || "הבניין")}, ${escapeHtml(this.settings?.building?.city || "לוח דיגיטלי")}</span>
                  <span>לוח מודעות דיגיטלי</span>
                </div>
              </div>
            </div>
          `;
        } else {
          contentHtml = `
            <div class="stage-notice-layout">
              <div class="notice-header-row">
                <span class="notice-type-badge ${urgentClass}">${badgeText}</span>
                <span class="notice-author-tag">${escapeHtml(n.author || 'ועד הבית')}</span>
              </div>
              <div class="stage-notice-body">
                <div class="stage-notice-title-row">
                  <span style="font-size: 2.2rem;">${typeIcon}</span>
                  <h2 class="stage-notice-title">${escapeHtml(n.title)}</h2>
                </div>
                <div class="stage-notice-content">${escapeHtml(n.content)}</div>
              </div>
              <div class="stage-notice-footer">
                <span>${escapeHtml(this.settings?.building?.name || "הבניין")}, ${escapeHtml(this.settings?.building?.city || "לוח דיגיטלי")}</span>
                <span>לוח מודעות דיגיטלי</span>
              </div>
            </div>
          `;
        }
      } 
      // SLIDE TYPE 2: 4-DAY WEATHER FORECAST
      else if (slide.type === 'weather_forecast') {
        const w = slide.data;
        const forecastCards = (w.forecast || []).map((f, i) => `
          <div class="forecast-day-card ${i === 0 ? 'today' : ''}">
            <span class="forecast-day-name">${f.dayName}</span>
            <span class="forecast-icon">${f.iconEmoji}</span>
            <div class="forecast-temps">
              <span class="forecast-temp-max">${f.tempMax}°</span>
              <span class="forecast-temp-min">${f.tempMin}°</span>
            </div>
            <span class="forecast-desc">${f.description}</span>
          </div>
        `).join('');

        contentHtml = `
          <div class="forecast-slide-layout">
            <div class="forecast-title-row">
              <h2>🌤️ תחזית מזג אוויר ל-4 הימים הקרובים</h2>
              <span style="font-size: 0.9rem; color: #38bdf8; font-weight: 700;">חדרה והסביבה</span>
            </div>
            <div class="forecast-cards-grid">
              ${forecastCards}
            </div>
            <div class="forecast-env-grid">
              <div class="forecast-env-card">
                <div class="env-card-icon">🌬️</div>
                <div class="env-card-info">
                  <span class="env-card-title">איכות אוויר בחדרה</span>
                  <span class="env-card-val" style="color: ${w.aqiColor || '#22c55e'};">${w.aqi ?? 28} AQI • ${w.aqiLabel || 'אוויר נקי'}</span>
                </div>
              </div>
              <div class="forecast-env-card">
                <div class="env-card-icon">☀️</div>
                <div class="env-card-info">
                  <span class="env-card-title">קרינת UV</span>
                  <span class="env-card-val" style="color: ${w.uvColor || '#eab308'};">${w.uvIndex ?? 3} • ${w.uvLabel || 'בינונית'}</span>
                </div>
              </div>
              <div class="forecast-env-card">
                <div class="env-card-icon">🌊</div>
                <div class="env-card-info">
                  <span class="env-card-title">חוף חדרה (גלים וטמפ' מים)</span>
                  <span class="env-card-val">${w.seaWaveHeightCm || '50 ס"מ • ים נוח'} • מים ${w.seaTemp || '24°'}</span>
                </div>
              </div>
              <div class="forecast-env-card forecast-env-tip">
                <div class="env-card-icon">💡</div>
                <div class="env-card-info">
                  <span class="env-card-title">המלצת היום לדיירים</span>
                  <span class="env-card-val tip-text">${escapeHtml(w.dailyTip || '👕 מזג אוויר נוח לתליית כביסה ולפעילות בחוץ')}</span>
                </div>
              </div>
            </div>
            <div class="stage-notice-footer">
              <span>טמפרטורה נוכחית: ${w.temperature}° | עומס חום: ${w.apparentTemperature}°</span>
              <span>Open-Meteo</span>
            </div>
          </div>
        `;
      }
      // SLIDE TYPE: TRANSIT & COMMUTE
      else if (slide.type === 'transit_commute') {
        const t = slide.data || this.getTransitCommuteData();

        const renderTrains = (list, note) => {
          if (note) {
            return `<div class="transit-note">${escapeHtml(note)}</div>`;
          }
          if (!list || list.length === 0) {
            return `<div class="transit-note">אין רכבות קרובות בשעות אלו</div>`;
          }
          return list.map(item => `
            <div class="train-time-pill">
              <span class="train-time">${escapeHtml(item.time)}</span>
              <span class="train-diff">${escapeHtml(item.diff)}</span>
            </div>
          `).join('');
        };

        const busesHtml = (t.buses || []).map(b => `
          <div class="transit-bus-row">
            <span class="transit-bus-line">${escapeHtml(b.line)}</span>
            <div class="transit-bus-info">
              <span class="transit-bus-dest">${escapeHtml(b.dest)}</span>
              <span class="transit-bus-freq">${escapeHtml(b.freq)}</span>
            </div>
            <span class="transit-bus-badge">${escapeHtml(b.badge)}</span>
          </div>
        `).join('');

        const trafficHtml = (t.traffic || []).map(tr => {
          const badgeClass = tr.level === 'red' ? 'traffic-red' : (tr.level === 'orange' ? 'traffic-orange' : 'traffic-green');
          return `
            <div class="traffic-row">
              <span class="traffic-dest">${escapeHtml(tr.dest)}</span>
              <span class="traffic-time">${escapeHtml(tr.time)}</span>
              <span class="traffic-badge ${badgeClass}">${escapeHtml(tr.status)}</span>
            </div>
          `;
        }).join('');

        contentHtml = `
          <div class="transit-slide-layout">
            <div class="forecast-title-row">
              <h2>🚆 יוצאים מהבניין — תחבורה, רכבת ודרכים</h2>
              <span style="font-size: 0.9rem; color: #38bdf8; font-weight: 700;">עדכון חי • חדרה</span>
            </div>
            <div class="transit-grid">
              <div class="transit-card">
                <div class="transit-card-header">
                  <span class="transit-card-icon">🚆</span>
                  <h3>רכבת ישראל — חדרה מערב</h3>
                </div>
                <div class="transit-train-section">
                  <div class="train-dir-title">לכיוון תל אביב ודרום:</div>
                  <div class="train-pills-row">
                    ${renderTrains(t.trainsSouth, t.trainNoteSouth)}
                  </div>
                </div>
                <div class="transit-train-section" style="margin-top: 0.75rem;">
                  <div class="train-dir-title">לכיוון חיפה וצפון:</div>
                  <div class="train-pills-row">
                    ${renderTrains(t.trainsNorth, t.trainNoteNorth)}
                  </div>
                </div>
              </div>

              <div class="transit-card">
                <div class="transit-card-header">
                  <span class="transit-card-icon">🚌</span>
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <h3>קווים מרכזיים באזור</h3>
                    <span style="font-size: 0.75rem; color: #94a3b8;">${escapeHtml(t.busStatusDesc || 'פעילות סדירה')}</span>
                  </div>
                </div>
                <div class="transit-buses-list">
                  ${busesHtml}
                </div>
              </div>

              <div class="transit-card">
                <div class="transit-card-header">
                  <span class="transit-card-icon">🚗</span>
                  <h3>זמני נסיעה ועומסים ביציאה</h3>
                </div>
                <div class="traffic-list">
                  ${trafficHtml}
                </div>
              </div>
            </div>
            <div class="stage-notice-footer">
              <span>הערכות זמן ותדירויות מבוססות שעות שיא ולוחות זמנים רשמיים</span>
              <span>נסיעה בטוחה!</span>
            </div>
          </div>
        `;
      }
      // SLIDE TYPE: DAILY INTEREST & TRIVIA
      else if (slide.type === 'daily_interest') {
        const d = slide.data || this.getDailyInterestData();
        contentHtml = `
          <div class="interest-slide-layout">
            <div class="forecast-title-row">
              <h2>🧠 רגע של עניין במעלית — ידע, טריוויה וקהילה</h2>
              <span style="font-size: 0.9rem; color: #c084fc; font-weight: 700;">פינה יומית לדיירים</span>
            </div>
            <div class="interest-cards-grid">
              <div class="interest-card interest-card-history">
                <div class="interest-card-header">
                  <span class="interest-card-icon">📅</span>
                  <div class="interest-card-titles">
                    <span class="interest-card-tag">${escapeHtml(d.history?.tag || 'הידעת?')}</span>
                    <h3>${escapeHtml(d.history?.title || 'היום בהיסטוריה')}</h3>
                  </div>
                </div>
                <p class="interest-card-text">${escapeHtml(d.history?.text || '')}</p>
              </div>

              <div class="interest-card interest-card-trivia">
                <div class="interest-card-header">
                  <span class="interest-card-icon">🧠</span>
                  <div class="interest-card-titles">
                    <span class="interest-card-tag">${escapeHtml(d.trivia?.category || 'טריוויה')}</span>
                    <h3>חידת היום</h3>
                  </div>
                </div>
                <p class="interest-card-text trivia-question">${escapeHtml(d.trivia?.question || '')}</p>
                <div class="trivia-answer-box">
                  <span class="trivia-answer-label">תשובה:</span>
                  <span class="trivia-answer-text">${escapeHtml(d.trivia?.answer || '')}</span>
                </div>
              </div>

              <div class="interest-card interest-card-tip">
                <div class="interest-card-header">
                  <span class="interest-card-icon">${d.tip?.icon || '💡'}</span>
                  <div class="interest-card-titles">
                    <span class="interest-card-tag">טיפ ירוק וקהילתי</span>
                    <h3>${escapeHtml(d.tip?.title || 'טיפ היום לבית')}</h3>
                  </div>
                </div>
                <p class="interest-card-text">${escapeHtml(d.tip?.text || '')}</p>
              </div>
            </div>
            <div class="stage-notice-footer">
              <span>מתעדכן מדי יום בלובי • למידה והנאה משותפת</span>
              <span>ועד הבית • ${escapeHtml(this.settings?.building?.name || "הבניין")}</span>
            </div>
          </div>
        `;
      }
      // SLIDE TYPE 3: CONTACTS DIRECTORY
      else if (slide.type === 'contacts_directory') {
        const contacts = slide.data;
        const contactsCards = contacts.map(c => `
          <div class="contact-pill-card">
            <div class="contact-icon">${c.icon || '📞'}</div>
            <div class="contact-details">
              <h4>${escapeHtml(c.name)}</h4>
              <div class="contact-phone">${escapeHtml(c.phone)}</div>
              <div class="contact-desc">${escapeHtml(c.desc || '')}</div>
            </div>
          </div>
        `).join('');

        contentHtml = `
          <div class="contacts-slide-layout">
            <div class="forecast-title-row">
              <h2>📞 מספרי טלפון וחירום שימושיים לדיירים</h2>
              <span style="font-size: 0.9rem; color: #38bdf8; font-weight: 700;">${escapeHtml(this.settings?.building?.name || "לוח דיגיטלי")}</span>
            </div>
            <div class="contacts-grid">
              ${contactsCards}
            </div>
            <div class="stage-notice-footer">
              <span>לפניות שוטפות לוועד יש לפנות בוואטסאפ הבניין</span>
              <span>שירות וסיוע לדיירים</span>
            </div>
          </div>
        `;
      }
      // SLIDE TYPE 4: FULL FLYER / PHOTO SHOWCASE
      else if (slide.type === 'photo') {
        contentHtml = `
          <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border-radius: 1rem; overflow: hidden;">
            <img src="${slide.data.url}" alt="פלייר / תמונה" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 0.9rem; box-shadow: 0 12px 30px rgba(0,0,0,0.6);" loading="lazy" decoding="async" />
          </div>
        `;
      }
      // SLIDE TYPE 5: HOLIDAY CELEBRATION (With Grand Photographic Hero)
      else if (slide.type === 'holiday_greeting') {
        const photoHero = slide.data.image ? `
          <div class="holiday-grand-hero-box">
            <img src="${slide.data.image}" alt="חג" class="holiday-grand-hero-img" decoding="async" />
            <div class="holiday-hero-gradient"></div>
            <div class="holiday-hero-overlay-content">
              <div class="holiday-hero-icon">${slide.data.icon}</div>
              <h2 class="holiday-hero-title">${slide.data.title}</h2>
            </div>
          </div>
        ` : `
          <div style="font-size: 3.5rem; animation: pulse-glow 3s infinite; margin-bottom: 0.5rem;">${slide.data.icon}</div>
          <h2 style="font-family: var(--font-heading); font-size: 2.8rem; font-weight: 900; color: #fbbf24;">${slide.data.title}</h2>
        `;

        contentHtml = `
          <div class="holiday-slide-grand-layout">
            ${photoHero}
            <div class="holiday-slide-body">
              <p class="holiday-slide-subtitle">${slide.data.subtitle}</p>
            </div>
            <div class="stage-notice-footer">
              <span>${escapeHtml(this.settings?.building?.name || "הבניין")}, ${escapeHtml(this.settings?.building?.city || "לוח דיגיטלי")}</span>
              <span>שבת ומועדי ישראל</span>
            </div>
          </div>
        `;
      }
      // SLIDE TYPE 6: HD SCENIC
      else if (slide.type === 'wallpaper') {
        contentHtml = `
          <div class="stage-notice-layout">
            <div class="notice-header-row">
              <span class="notice-type-badge">🌿 ${escapeHtml(this.settings?.building?.name || "הבניין")}</span>
              <span class="notice-author-tag">ועד הבית</span>
            </div>
            <div class="stage-notice-body" style="text-align: center; align-items: center;">
              <h2 class="stage-notice-title">בית חם וקהילה נעימה</h2>
              <p class="stage-notice-content" style="text-align: center;">שמירה על סדר, ניקיון וכבוד הדדי יוצרת איכות חיים לכולנו.</p>
            </div>
            <div class="stage-notice-footer">
              <span>חדרה</span>
              <span>שילוט דיגיטלי חכם</span>
            </div>
          </div>
        `;
      }

      // SLIDE TYPE 7: YOM KIPPUR DEDICATED STATIC CARD (100% Zero-Motion)
      else if (slide.type === 'yom_kippur_static') {
        const d = slide.data;
        contentHtml = `
          <div class="yom-kippur-card">
            <div style="font-size: 3.2rem; margin-bottom: 0.6rem;">🕍</div>
            <h2 style="font-size: 2.6rem; font-weight: 900; color: #ffffff; margin-bottom: 0.4rem; letter-spacing: -0.5px;">יום הכיפורים ${d.year}</h2>
            <p style="font-size: 1.45rem; font-weight: 800; color: #facc15; margin-bottom: 1.8rem;">גמר חתימה טובה • צום קל ומועיל</p>

            <div style="display: flex; gap: 1.5rem; justify-content: center; margin-bottom: 2rem; width: 100%; max-width: 580px;">
              <div style="flex: 1; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(250, 204, 21, 0.5); border-radius: 16px; padding: 1.1rem; text-align: center;">
                <span style="display: block; font-size: 0.95rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">🕯️ כניסת הצום והדלקת נרות</span>
                <span style="font-size: 2.1rem; font-weight: 900; color: #ffffff; font-family: monospace;">${d.candles}</span>
              </div>
              <div style="flex: 1; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.5); border-radius: 16px; padding: 1.1rem; text-align: center;">
                <span style="display: block; font-size: 0.95rem; color: #cbd5e1; margin-bottom: 0.35rem; font-weight: 600;">✨ צאת הצום והבדלה</span>
                <span style="font-size: 2.1rem; font-weight: 900; color: #ffffff; font-family: monospace;">${d.havdalah}</span>
              </div>
            </div>

            <div style="max-width: 600px; background: rgba(30, 41, 59, 0.65); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 1.1rem 1.6rem; text-align: center;">
              <p style="font-size: 1.05rem; color: #f1f5f9; line-height: 1.6; margin-bottom: 0.6rem; font-weight: 600;">
                ועד הבית מאחל לכל הדיירים, המשפחות והאורחים שנת סליחה, בריאות, שלום ובשורות טובות.
              </p>
              <p style="font-size: 0.95rem; color: #94a3b8; font-weight: 500;">
                נא לשמור על קדושת היום ועל השקט המוחלט בלובי, במעליות ובשטחים הציבוריים.
              </p>
            </div>
          </div>
        `;
      }

      // SLIDE TYPE 8: EMERGENCY ALERT (חידוש #4)
      else if (slide.type === 'emergency_alert') {
        const alert = slide.data;
        let formattedTime = '';
        try {
          const d = new Date(alert.updatedAt);
          if (!isNaN(d.getTime())) {
            formattedTime = `${d.toLocaleDateString('he-IL')} • ${d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
          }
        } catch (e) {}

        contentHtml = `
          <div class="emergency-alert-stage-card">
            <div class="emergency-alert-banner">
              <span class="emergency-icon-pulse">🚨</span>
              <span class="emergency-badge-text">התרעת חירום מיידית • ועד הבניין</span>
              <span class="emergency-icon-pulse">🚨</span>
            </div>
            <div class="emergency-alert-stage-body">
              <h1 class="emergency-alert-title">${escapeHtml(alert.title)}</h1>
              <div class="emergency-alert-content">${escapeHtml(alert.content)}</div>
            </div>
            <div class="emergency-alert-footer">
              <span class="emergency-alert-time">עודכן: ${formattedTime || 'עכשיו'}</span>
              <span class="emergency-alert-tag">${escapeHtml(this.settings?.building?.name || 'הירדן 5')}, ${escapeHtml(this.settings?.building?.city || 'חדרה')} • שידור חירום</span>
            </div>
          </div>
        `;
      }

      card.innerHTML = contentHtml;
      container.appendChild(card);
    });

    if (this.slides.length <= 1) {
      if (this.slideTimer) {
        clearInterval(this.slideTimer);
        this.slideTimer = null;
      }
      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
    } else if (!this.isYomKippurModeActive() && !this.isEmergencyAlertActive() && !this.slideTimer) {
      this.startSlideshow();
    }
  }

  startSlideshow() {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    if (this.isYomKippurModeActive() || this.slides.length <= 1) return;

    this.slideStartTime = Date.now();
    const progressFill = document.getElementById('stage-progress-fill');

    const progressStepMs = this.settings?.display?.liteMode ? 400 : 100;
    this.progressTimer = setInterval(() => {
      if (this.isPaused) return;
      const elapsed = Date.now() - this.slideStartTime;
      const pct = Math.min(100, (elapsed / this.slideDurationMs) * 100);
      if (progressFill) progressFill.style.width = `${pct}%`;
    }, progressStepMs);

    this.slideTimer = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, this.slideDurationMs);
  }

  nextSlide() {
    if (this.slides.length <= 1) return;
    const nextIdx = (this.currentSlideIndex + 1) % this.slides.length;
    this.goToSlide(nextIdx);
  }

  prevSlide() {
    if (this.slides.length <= 1) return;
    const prevIdx = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIdx);
  }

  goToSlide(index) {
    if (this.slides.length === 0) return;
    const prevIdx = this.currentSlideIndex;
    this.currentSlideIndex = (index + this.slides.length) % this.slides.length;
    this.slideStartTime = Date.now();

    // Advance notice image variety pool on full deck wrap-around (when not in Lite Mode)
    if (this.currentSlideIndex === 0 && prevIdx > 0 && !this.settings?.display?.liteMode) {
      this.noticeImageCycleTick = (this.noticeImageCycleTick || 0) + 1;
    }

    const allCards = document.querySelectorAll('.slide-card');
    allCards.forEach((c, idx) => {
      if (idx === this.currentSlideIndex) {
        c.classList.add('active');
        // Refresh only the single active slide's notice image if rotating through the pool
        const activeSlide = this.slides[idx];
        if (activeSlide && activeSlide.type === 'notice' && activeSlide.data?.imageUrl) {
          const imgEl = c.querySelector('.stage-notice-dynamic-img');
          const nextUrl = this.resolveNoticeImageUrl(activeSlide.data, idx);
          if (imgEl && nextUrl && imgEl.getAttribute('src') !== nextUrl) {
            imgEl.setAttribute('src', nextUrl);
          }
        }
      } else {
        c.classList.remove('active');
      }
    });

    this.rotateBackground();
  }

  rotateBackground() {
    const bgLayer = document.getElementById('background-layer');
    if (!bgLayer) return;

    if (this.isYomKippurModeActive()) {
      const ykUrl = 'images/wallpapers/holidays/yom_kippur.jpg?v=20260830';
      if (bgLayer.dataset.activeWallUrl !== ykUrl) {
        bgLayer.style.backgroundImage = `url('${ykUrl}')`;
        bgLayer.dataset.activeWallUrl = ykUrl;
      }
      bgLayer.classList.remove('zoom-effect');
      return;
    }

    // Use theme wallpapers collection if available
    const activeList = (this.shabbatData?.themeImages && this.shabbatData.themeImages.length > 0)
      ? this.shabbatData.themeImages.map((u, i) => ({ id: `th-${i}`, url: u }))
      : this.wallpapers;

    if (!activeList || activeList.length === 0) return;

    // In Lite Mode: lock to a single static wallpaper per theme to eliminate 12s GPU texture churn on rk3368
    if (this.settings?.display?.liteMode) {
      const staticUrl = activeList[0]?.url;
      if (staticUrl && bgLayer.dataset.activeWallUrl !== staticUrl) {
        bgLayer.style.backgroundImage = `url('${staticUrl}')`;
        bgLayer.dataset.activeWallUrl = staticUrl;
      }
      bgLayer.classList.remove('zoom-effect');
      return;
    }

    const wallIndex = this.currentSlideIndex % activeList.length;
    const nextWall = activeList[wallIndex];
    if (nextWall && nextWall.url) {
      if (bgLayer.dataset.activeWallUrl !== nextWall.url) {
        bgLayer.style.backgroundImage = `url('${nextWall.url}')`;
        bgLayer.dataset.activeWallUrl = nextWall.url;
      }
      bgLayer.classList.toggle('zoom-effect');
    }
  }

  // =========================================================
  // 6. AUDIO & RADIO CONTROLS
  // =========================================================
  attachAudioErrorListener() {
    if (!this.audioPlayer || this.audioErrorListenerAttached) return;
    this.audioErrorListenerAttached = true;
    this.audioPlayer.addEventListener('error', (e) => {
      // Ignore errors caused during intentional buffer recycle / src clearance
      if (this.isRecyclingAudio || !this.audioPlayer || !this.audioPlayer.getAttribute('src')) return;
      console.warn('⚠️ [Radio] Audio player error encountered:', e);
      if (this.isRadioInSchedule() && !this.isSecretMuted && !this.isYomKippurModeActive()) {
        if (this.audioErrorRetryTimer) clearTimeout(this.audioErrorRetryTimer);
        this.audioErrorRetryTimer = setTimeout(() => {
          this.audioErrorRetryTimer = null;
          if (this.isRadioInSchedule() && !this.isSecretMuted && !this.isYomKippurModeActive()) {
            console.log('🔄 [Radio] Attempting stream recovery after error...');
            this.recycleAudioBuffer(true);
          }
        }, 3000);
      }
    });
  }

  setupAudio() {
    this.audioPlayer = document.getElementById('radio-audio');
    const unmutePrompt = document.getElementById('audio-unmute-prompt');

    if (unmutePrompt) {
      unmutePrompt.addEventListener('click', () => {
        if (this.isYomKippurModeActive()) return;
        this.unlockAudio();
      });
    }

    this.attachAudioErrorListener();

    // Unlock audio smoothly on ANY screen touch if waiting for user gesture
    document.addEventListener('pointerdown', () => {
      if (this.isYomKippurModeActive()) return;
      if (this.audioPlayer && this.audioPlayer.paused && this.isRadioInSchedule() && !this.isSecretMuted) {
        this.startRadioStream();
      }
    }, { passive: true });

    // High-frequency radio schedule watchdog (every 15 seconds):
    // - Halts audio immediately at 23:00:00 (or configured endHour)
    // - Forcefully attempts to start audio at 06:30:00 (or configured startHour)
    setInterval(() => {
      this.checkRadioSchedule();
    }, 15000);

    // Cycle audio stream buffer every 30 minutes during playback to prevent native WebView memory bloat
    setInterval(() => {
      this.recycleAudioBuffer();
    }, 30 * 60 * 1000);
  }

  unlockAudio() {
    if (this.isYomKippurModeActive()) return;
    const prompt = document.getElementById('audio-unmute-prompt');
    if (this.audioPlayer && this.isRadioInSchedule() && !this.isSecretMuted) {
      this.startRadioStream();
      this.audioUnlocked = true;
      if (prompt) prompt.style.display = 'none';
    }
  }

  isRadioInSchedule() {
    if (this.isYomKippurModeActive()) return false;
    if (!this.settings?.radio?.enabled) return false;
    if (!this.settings.radio.autoPlaySchedule) return true;

    let startStr = this.settings.radio.startHour || '06:30';
    let endStr = this.settings.radio.endHour || '23:00';
    if (startStr === '00:08') startStr = '08:00';
    if (endStr === '00:21') endStr = '21:00';

    let [sh, sm] = startStr.split(':').map(Number);
    let [eh, em] = endStr.split(':').map(Number);
    if (isNaN(sh)) sh = 6;
    if (isNaN(sm)) sm = 30;
    if (isNaN(eh)) eh = 23;
    if (isNaN(em)) em = 0;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    if (startMinutes <= endMinutes) {
      // Daytime window (e.g. 06:30 to 23:00):
      // Precisely at 23:00:00 (currentMinutes === endMinutes) it evaluates to false!
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight window (e.g. 22:00 to 02:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  getCurrentRadioStation() {
    const radio = this.settings?.radio;
    if (!radio) return null;

    const fallbackStations = [
      { id: 'galgalatz', name: 'גלגלצ', url: 'https://glzwizzlv.bynetcdn.com/glglz_mp3' },
      { id: '103fm', name: '103FM', url: 'https://cdn.cybercdn.live/103FM/Live/icecast.audio' },
      { id: 'glz', name: 'גלי צה"ל', url: 'https://glzwizzlv.bynetcdn.com/glz_mp3' },
      { id: 'kan_88', name: 'כאן 88', url: 'https://kanliveicy.media.kan.org.il/icy/kan88_mp3' },
      { id: 'kan_gimmel', name: 'כאן גימל', url: 'https://kanliveicy.media.kan.org.il/icy/kangimmel_mp3' },
      { id: 'kan_kol_hamusica', name: 'קול המוסיקה', url: 'https://kanliveicy.media.kan.org.il/icy/kankolhamusica_mp3' },
      { id: 'eco99', name: 'Eco 99', url: 'https://eco01.livecdn.biz/ecolive/99fm_aac/icecast.audio' },
      { id: 'radios100fm', name: '100FM', url: 'https://radios100fm.livecdn.biz/radios100fm' },
      { id: 'chillhop', name: 'Chillout Lounge', url: 'https://streams.ilovemusic.de/iloveradio17.mp3' },
      { id: 'dance', name: 'Dance Hits', url: 'https://streams.ilovemusic.de/iloveradio2.mp3' }
    ];

    return radio.stations?.find(s => s.id === radio.currentStation) 
      || fallbackStations.find(s => s.id === radio.currentStation) 
      || fallbackStations[0];
  }

  stopRadioImmediate() {
    if (!this.audioPlayer) return;
    this.isRecyclingAudio = true;
    this.lastAudioTime = 0;
    this.audioStallCount = 0;
    if (this.audioErrorRetryTimer) {
      clearTimeout(this.audioErrorRetryTimer);
      this.audioErrorRetryTimer = null;
    }
    this.audioPlayer.pause();
    if (this.audioPlayer.src) {
      this.audioPlayer.removeAttribute('src');
      this.audioPlayer.load();
    }
    this.isRecyclingAudio = false;
    const radioWidget = document.getElementById('radio-indicator');
    const unmutePrompt = document.getElementById('audio-unmute-prompt');
    if (radioWidget) radioWidget.style.display = 'none';
    if (unmutePrompt) unmutePrompt.style.display = 'none';
  }

  startRadioStream() {
    if (this.isYomKippurModeActive() || this.isEmergencyAlertActive()) {
      this.stopRadioImmediate();
      return;
    }
    if (!this.audioPlayer || !this.isRadioInSchedule() || this.isSecretMuted) return;

    const radio = this.settings?.radio;
    const currentSt = this.getCurrentRadioStation();
    if (!currentSt) return;

    const radioWidget = document.getElementById('radio-indicator');
    const stationNameElem = document.getElementById('radio-station-name');
    const unmutePrompt = document.getElementById('audio-unmute-prompt');

    if (radioWidget) radioWidget.style.display = 'flex';
    if (stationNameElem) stationNameElem.textContent = currentSt.name.split(' ')[0];

    this.audioPlayer.volume = radio?.volume !== undefined ? radio.volume : 0.4;

    if (this.audioPlayer.src !== currentSt.url) {
      this.audioPlayer.src = currentSt.url;
    }

    if (this.audioPlayer.paused) {
      const playPromise = this.audioPlayer.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (unmutePrompt) unmutePrompt.style.display = 'none';
        }).catch(err => {
          console.log('[Radio] Autoplay policy note:', err.message);
          // Show tap prompt only if we are in schedule and still paused
          if (this.isRadioInSchedule() && unmutePrompt && !this.isEmergencyAlertActive()) {
            unmutePrompt.style.display = 'flex';
          }
        });
      }
    }
  }

  recycleAudioBuffer(force = false) {
    if (this.isYomKippurModeActive() || this.isEmergencyAlertActive() || !this.isRadioInSchedule() || !this.audioPlayer || this.isSecretMuted) return;
    if (!force && this.audioPlayer.paused) return;
    console.log(`♻️ [Radio] Recycling live audio stream buffer (force=${force}) to prevent stall / memory bloat...`);
    const currentSt = this.getCurrentRadioStation();
    if (!currentSt) return;

    this.isRecyclingAudio = true;
    this.lastAudioTime = 0;
    this.audioStallCount = 0;
    if (this.audioErrorRetryTimer) {
      clearTimeout(this.audioErrorRetryTimer);
      this.audioErrorRetryTimer = null;
    }

    this.audioPlayer.pause();
    this.audioPlayer.removeAttribute('src');
    this.audioPlayer.load();

    setTimeout(() => {
      this.isRecyclingAudio = false;
      if (this.isRadioInSchedule() && !this.isSecretMuted && this.audioPlayer && !this.isYomKippurModeActive() && !this.isEmergencyAlertActive()) {
        this.startRadioStream();
      }
    }, 400);
  }

  checkRadioSchedule() {
    if (this.isYomKippurModeActive() || this.isEmergencyAlertActive()) {
      this.stopRadioImmediate();
      return;
    }
    const inSchedule = this.isRadioInSchedule();
    const unmutePrompt = document.getElementById('audio-unmute-prompt');

    // Ensure error listener is attached if audioPlayer was loaded dynamically
    this.attachAudioErrorListener();

    if (!inSchedule) {
      this.lastAudioTime = 0;
      this.audioStallCount = 0;
      if (this.audioErrorRetryTimer) {
        clearTimeout(this.audioErrorRetryTimer);
        this.audioErrorRetryTimer = null;
      }
      // Outside permitted hours -> stop radio and ensure prompt is hidden
      if (unmutePrompt) unmutePrompt.style.display = 'none';
      if (this.audioPlayer && (!this.audioPlayer.paused || this.audioPlayer.src)) {
        console.log('🔇 [Radio] Outside permitted hours -> stopping radio immediately and freeing audio engine.');
        this.stopRadioImmediate();
      }
    } else {
      // Inside permitted hours -> forcefully assert stream playback if not user-muted
      if (this.audioPlayer && this.audioPlayer.paused && !this.isSecretMuted) {
        this.startRadioStream();
      } else if (inSchedule && !this.isSecretMuted && this.audioPlayer && !this.audioPlayer.paused) {
        // Track currentTime to detect buffer stalls (e.g. icecast stream freeze)
        const curTime = this.audioPlayer.currentTime;
        if (curTime > 0 && curTime === this.lastAudioTime) {
          this.audioStallCount = (this.audioStallCount || 0) + 1;
          console.warn(`⚠️ [Radio] Audio stream buffer stall detected (${this.audioStallCount}/2): currentTime=${curTime}`);
          if (this.audioStallCount >= 2) {
            console.warn('🔄 [Radio] Stream stalled for 30s. Triggering forced buffer recycle...');
            this.audioStallCount = 0;
            this.recycleAudioBuffer(true);
          }
        } else {
          this.lastAudioTime = curTime;
          this.audioStallCount = 0;
        }
      }
    }
  }

  updateRadioState() {
    this.checkRadioSchedule();
  }

  // =========================================================
  // 7. AUTO REFRESH & WATCHDOG
  // =========================================================
  startPeriodicUpdates() {
    setInterval(async () => {
      // In Lite Mode: skip aggressive periodic rebuilding to protect low RAM. Firebase pushes updates live!
      if (this.settings?.display?.liteMode) return;
      await this.fetchSettings();
      await this.fetchNotices();
      await this.fetchPhotos();
      this.buildSlides();
    }, 120 * 1000);

    setInterval(() => {
      this.fetchWeather();
    }, 10 * 60 * 1000);

    setInterval(() => {
      this.fetchNews();
    }, 10 * 60 * 1000);

    setInterval(() => {
      this.fetchShabbatAndHolidays();
    }, 60 * 60 * 1000);

    // Check notice status every 60 seconds (scheduled start, expiration, recurring day change)
    const computeActiveNoticeKey = () => {
      const activeIds = (this.notices || [])
        .filter(n => this.isNoticeActive(n))
        .map(n => n.id || n.title)
        .sort()
        .join(',');
      return `${activeIds}:${new Date().getDay()}`;
    };
    let lastActiveNoticeKey = computeActiveNoticeKey();
    setInterval(() => {
      const currentKey = computeActiveNoticeKey();
      if (lastActiveNoticeKey !== '' && currentKey !== lastActiveNoticeKey) {
        console.log('📢 [Screen] Notice active status change detected. Updating side column and slides...');
        this.renderSideColumn();
        this.buildSlides();
      }
      lastActiveNoticeKey = currentKey;
    }, 60 * 1000);
  }

  setupForceReloadListener() {
    let lastReloadTime = parseInt(localStorage.getItem('smart_lobby_force_reload') || '0', 10);

    window.addEventListener('storage', (e) => {
      if (e.key === 'smart_lobby_force_reload') {
        const time = parseInt(e.newValue || '0', 10);
        if (time > lastReloadTime) {
          lastReloadTime = time;
          console.log('🔄 Remote force reload triggered via storage event!');
          try { localStorage.setItem('smart_lobby_exit_reason', 'remote_force_reload'); } catch (e) {}
          window.location.reload();
        }
      } else if (e.key === 'smart_lobby_settings') {
        console.log('⚙️ Remote settings update detected, applying settings...');
        this.fetchSettings();
      } else if (e.key === 'smart_lobby_notices' || !e.key) {
        console.log('📢 Remote notices update detected, applying notices...');
        this.fetchNotices();
      }
    });
  }

  setupWatchdog() {
    // Smart Maintenance Watchdog:
    // Full hard reload (window.location.reload) at deep night:
    // 1. 23:05 - Clean reload 5 minutes after radio shutoff at 23:00. Flushes audio engine,
    //    DOM nodes, and GPU buffers accumulated during the day. Zero autoplay prompt risk!
    // 2. 04:00 AM - Second deep night clean reload before morning broadcast.
    // During daytime radio hours (10:00, 16:00), we NEVER hard-reload the page to avoid triggering
    // the browser's Autoplay audio block ("גע במסך"). Instead, we perform an in-memory soft sweep!
    setInterval(() => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentS = now.getSeconds();

      // Deep night full reloads (23:05 and 04:00 AM) - radio is off, zero audio interruption
      const isNightCleanTime = (currentH === 23 && currentM === 5) || (currentH === 4 && currentM === 0);
      if (isNightCleanTime && currentS < 12) {
        const modal = document.getElementById('interactive-modal');
        const isModalOpen = modal && !modal.classList.contains('hidden');
        if (!this.isPaused && !isModalOpen) {
          console.log(`🔄 [Watchdog] Scheduled clean night reload at ${currentH}:${String(currentM).padStart(2, '0')} (radio is off)...`);
          try { localStorage.setItem('smart_lobby_exit_reason', `watchdog_scheduled_${currentH}:${String(currentM).padStart(2, '0')}`); } catch (e) {}
          window.location.reload();
        }
      }

      // Daytime memory sweeps (10:00, 16:00) - in-memory cleanup WITHOUT reloading the window
      if ([10, 16].includes(currentH) && currentM === 0 && currentS < 12) {
        this.performDaytimeSoftMemorySweep();
      }
    }, 10000);
  }

  performDaytimeSoftMemorySweep() {
    console.log('🧹 [Watchdog] Performing in-memory soft sweep (preserving uninterrupted audio playback)...');
    // 1. Recycle radio buffer without reloading page
    if (this.isRadioInSchedule()) {
      this.recycleAudioBuffer();
    }
    // 2. Clear old cached elements and force garbage collection of hidden canvas/images
    if (window.gc) {
      try { window.gc(); } catch (e) {}
    }
  }

  // =========================================================
  // 8. BLACKBOX FLIGHT RECORDER & CRASH TRACKING
  // =========================================================
  setupFlightRecorder() {
    let lastExitReason = null;
    let lastAlivePing = 0;
    try {
      lastExitReason = localStorage.getItem('smart_lobby_exit_reason');
      lastAlivePing = parseInt(localStorage.getItem('smart_lobby_last_alive') || '0', 10);
    } catch (e) {}

    const now = Date.now();
    let bootType = 'fresh_start';
    let summary = 'הפעלת מערכת שגרתית';
    let isCrash = false;

    if (lastExitReason) {
      if (lastExitReason.startsWith('watchdog_scheduled')) {
        bootType = 'clean_watchdog_reload';
        const timeStr = lastExitReason.replace('watchdog_scheduled_', '');
        summary = `רענון שגרתי מתוזמן ע"י ה-Watchdog (${timeStr}) לניקוי זיכרון`;
      } else if (lastExitReason === 'remote_force_reload') {
        bootType = 'remote_force_reload';
        summary = 'רענון יזום מרחוק ע"י מנהל המערכת (Admin Remote Reload)';
      } else if (lastExitReason === 'manual_user_reload') {
        bootType = 'manual_reload';
        summary = 'רענון ידני ע"י משתמש / מפתח';
      } else if (lastExitReason === 'running') {
        isCrash = true;
        bootType = 'unclean_crash_restart';
        const gapMins = lastAlivePing ? Math.round((now - lastAlivePing) / 60000) : null;
        summary = (gapMins !== null && gapMins > 0)
          ? `התאוששות מקריסה / כיבוי פתאומי. אות חיים אחרון לפני כ-${gapMins} דקות (סגירה בלתי נקייה של Webview Kiosk / מערכת ההפעלה)`
          : 'התאוששות מקריסה / סגירה פתאומית של הדפדפן ללא רענון יזום';
      }
    } else {
      bootType = 'initial_boot';
      summary = 'הפעלה ראשונית של לוח השילוט';
    }

    try {
      localStorage.setItem('smart_lobby_exit_reason', 'running');
      localStorage.setItem('smart_lobby_last_alive', now.toString());
    } catch (e) {}

    // Send boot / crash log to Firebase once initialized
    setTimeout(async () => {
      if (window.FirebaseSync) {
        let heapMB = null;
        if (window.performance && window.performance.memory) {
          heapMB = Math.round(window.performance.memory.usedJSHeapSize / 1048576 * 10) / 10;
        }
        await window.FirebaseSync.logDeviceEvent({
          type: isCrash ? 'crash' : 'boot',
          bootType,
          summary,
          heapUsedMB: heapMB,
          screenResolution: `${window.innerWidth}x${window.innerHeight}`,
          userAgent: navigator.userAgent
        });
      }
    }, 4500);

    // High frequency alive ticker in localStorage every 30s
    setInterval(() => {
      try {
        if (localStorage.getItem('smart_lobby_exit_reason') === 'running') {
          localStorage.setItem('smart_lobby_last_alive', Date.now().toString());
        }
      } catch (e) {}
    }, 30000);

    // Mark manual reload on user navigation
    window.addEventListener('beforeunload', () => {
      try {
        if (localStorage.getItem('smart_lobby_exit_reason') === 'running') {
          localStorage.setItem('smart_lobby_exit_reason', 'manual_user_reload');
        }
      } catch (e) {}
    });

    // Error telemetry rate-limiter & session circuit breaker (max 1 error per 60s, max 10 per session)
    let errorReportCount = 0;
    let lastErrorReportTime = 0;
    const MAX_ERRORS_PER_SESSION = 10;
    const ERROR_COOLDOWN_MS = 60000;

    const shouldReportError = () => {
      const currentTime = Date.now();
      if (errorReportCount >= MAX_ERRORS_PER_SESSION) {
        if (errorReportCount === MAX_ERRORS_PER_SESSION) {
          errorReportCount++;
          console.warn('🛑 [FlightRecorder] Maximum session error report quota reached (10). Circuit breaker engaged.');
        }
        return false;
      }
      if (currentTime - lastErrorReportTime < ERROR_COOLDOWN_MS) {
        console.warn('⏳ [FlightRecorder] Error report suppressed by rate-limit (max 1 per 60s).');
        return false;
      }
      lastErrorReportTime = currentTime;
      errorReportCount++;
      return true;
    };

    // Uncaught JS Exception Listener
    window.addEventListener('error', (event) => {
      try {
        if (!window.FirebaseSync) return;
        const msg = event.message || 'שגיאת JavaScript לא מזוהה';
        if (msg.includes('Script error.') && !event.filename) return;
        if (!shouldReportError()) return;

        window.FirebaseSync.logDeviceEvent({
          type: 'js_error',
          summary: `שגיאת קוד: ${msg} (${event.filename ? event.filename.split('/').pop() : 'inline'}:${event.lineno})`,
          errorMsg: msg,
          filename: event.filename,
          lineno: event.lineno,
          stack: event.error?.stack ? event.error.stack.slice(0, 400) : null
        });
      } catch (e) {}
    });

    // Unhandled Promise Rejection Listener
    window.addEventListener('unhandledrejection', (event) => {
      try {
        if (!window.FirebaseSync) return;
        if (!shouldReportError()) return;
        const reason = event.reason;
        const msg = reason?.message || String(reason || 'Promise rejected');
        window.FirebaseSync.logDeviceEvent({
          type: 'unhandled_rejection',
          summary: `דחיית Promise לא מטופלת: ${msg}`,
          errorMsg: msg,
          stack: reason?.stack ? reason.stack.slice(0, 400) : null
        });
      } catch (e) {}
    });
  }

  // =========================================================
  // 8. DEVICE HEALTH & CLOUD TELEMETRY
  // =========================================================
  startHeartbeat() {
    const reportHealth = async () => {
      if (!window.FirebaseSync) return;

      let heap = null;
      if (window.performance && window.performance.memory) {
        heap = {
          usedMB: Math.round(window.performance.memory.usedJSHeapSize / 1048576 * 10) / 10,
          totalMB: Math.round(window.performance.memory.totalJSHeapSize / 1048576 * 10) / 10,
          limitMB: Math.round(window.performance.memory.jsHeapSizeLimit / 1048576 * 10) / 10
        };
      }

      const uptimeMinutes = Math.floor((Date.now() - (this.bootTimestamp || Date.now())) / 60000);
      const isRadioPlaying = Boolean(this.audioPlayer && !this.audioPlayer.paused && this.audioPlayer.src);

      const health = {
        lastSeen: Date.now(),
        uptimeMinutes,
        heap,
        screenResolution: `${window.innerWidth}x${window.innerHeight}`,
        radio: {
          playing: isRadioPlaying,
          station: this.settings?.radio?.currentStation || 'unknown',
          inSchedule: this.isRadioInSchedule()
        },
        online: navigator.onLine,
        liteMode: Boolean(this.settings?.display?.liteMode),
        currentSlide: this.currentSlideIndex,
        totalSlides: this.slides.length
      };

      await window.FirebaseSync.reportDeviceHealth(health);
    };

    // First report after 5 seconds, then every 3 minutes
    setTimeout(reportHealth, 5000);
    setInterval(reportHealth, 3 * 60 * 1000);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.signageApp = new BuildingSignageApp();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BuildingSignageApp };
}
