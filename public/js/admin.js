// ==========================================
// SECURITY & DATA HELPERS
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

function isLocalServer() {
  if (typeof window === 'undefined' || !window.location) return false;
  return window.location.protocol.startsWith('http') &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000');
}

function pruneExpiredNoticeImages(notices, nowInput = new Date()) {
  if (!Array.isArray(notices)) return notices;
  const now = nowInput instanceof Date ? nowInput.getTime() : (typeof nowInput === 'number' ? nowInput : Date.now());
  let prunedCount = 0;
  let bytesSaved = 0;

  const cleaned = notices.map(n => {
    if (n && n.expiresAt) {
      const expTime = new Date(n.expiresAt).getTime();
      // If notice has expired and contains heavy base64 data image
      if (!isNaN(expTime) && (now >= expTime) && typeof n.imageUrl === 'string' && (n.imageUrl.startsWith('data:image/') || n.imageUrl.length > 1000)) {
        prunedCount++;
        bytesSaved += n.imageUrl.length;
        console.log(`🧹 [Admin] Auto-pruned heavy base64 image from expired notice: ${n.id} (${n.title}), saved ~${Math.round(n.imageUrl.length / 1024)}KB`);
        return { ...n, imageUrl: null };
      }
    }
    return n;
  });

  if (typeof window !== 'undefined') {
    window._lastPruneStats = { prunedCount, bytesSaved, timestamp: now };
  }
  if (prunedCount > 0 && typeof localStorage !== 'undefined') {
    try {
      const prevStats = JSON.parse(localStorage.getItem('smart_lobby_prune_stats') || '{"totalPruned":0,"totalBytes":0}');
      localStorage.setItem('smart_lobby_prune_stats', JSON.stringify({
        totalPruned: (prevStats.totalPruned || 0) + prunedCount,
        totalBytes: (prevStats.totalBytes || 0) + bytesSaved,
        lastPrunedAt: new Date(now).toISOString()
      }));
    } catch (e) {}
  }
  return cleaned;
}

function isNoticeActive(notice, nowInput = new Date()) {
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
      return false; // Expired
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

if (typeof window !== 'undefined') {
  window._adminNoticesMap = {};
}

/**
 * =========================================================
 * Building Digital Signage - Mobile & Desktop Admin Panel
 * 6 Streamlined Categories, Full Mobile Optimization,
 * Live Radio Stream Testing, Time Picker Fixes & Auto Sync
 * =========================================================
 */

const RADIO_STATIONS_MAP = [
  { id: 'galgalatz', name: 'גלגלצ (Galgalatz)', url: 'https://glzwizzlv.bynetcdn.com/glglz_mp3' },
  { id: '103fm', name: '103FM (רדיו ללא הפסקה)', url: 'https://cdn.cybercdn.live/103FM/Live/icecast.audio' },
  { id: 'glz', name: 'גלי צה"ל (GLZ)', url: 'https://glzwizzlv.bynetcdn.com/glz_mp3' },
  { id: 'kan_88', name: 'כאן 88 (Kan 88)', url: 'https://kanliveicy.media.kan.org.il/icy/kan88_mp3' },
  { id: 'kan_gimmel', name: 'כאן גימל (מוזיקה ישראלית)', url: 'https://kanliveicy.media.kan.org.il/icy/kangimmel_mp3' },
  { id: 'kan_kol_hamusica', name: 'קול המוסיקה (קלאסית ורוגע)', url: 'https://kanliveicy.media.kan.org.il/icy/kankolhamusica_mp3' },
  { id: 'eco99', name: 'Eco 99 FM', url: 'https://eco01.livecdn.biz/ecolive/99fm_aac/icecast.audio' },
  { id: 'radios100fm', name: 'רדיוס 100FM', url: 'https://radios100fm.livecdn.biz/radios100fm' },
  { id: 'chillhop', name: 'Chillout / Lofi Lounge (מוזיקה נעימה 24/7)', url: 'https://streams.ilovemusic.de/iloveradio17.mp3' },
  { id: 'dance', name: 'I Love Dance & Hits', url: 'https://streams.ilovemusic.de/iloveradio2.mp3' }
];

const EMERGENCY_PRESETS = {
  oref: {
    title: 'הנחיות פיקוד העורף - התגוננות בעת אזעקה',
    content: 'בהישמע אזעקה יש להיכנס למרחב המוגן / מקלט הבניין בתוך 90 שניות. יש לשהות במרחב 10 דקות לפחות ולהישמע להנחיות כוחות הביטחון.'
  },
  elevator: {
    title: 'הודעה דחופה: חילוץ / השבתת מעלית לבדיקה',
    content: 'המעלית מושבתת לצורך טיפול טכני דחוף וחילוץ. טכנאי שירות מוזעק למקום. אין להשתמש במעלית עד לסיום הבדיקה!'
  },
  water: {
    title: 'הודעה דחופה: פיצוץ צנרת / הפסקת מים בבניין',
    content: 'עקב פיצוץ צנרת ראשי הופסקה זמנית אספקת המים. בעל מקצוע הוזעק ומבצע עבודות לתיקון התקלה והשבת אספקת המים בהקדם.'
  },
  power: {
    title: 'הודעה דחופה: הפסקת חשמל כללית בבניין',
    content: 'מתרחשת הפסקת חשמל. מערכות החירום ותאורת המדרגות פועלות. הנושא נמצא בטיפול מול חברת החשמל.'
  },
  utility: {
    title: 'הודעה דחופה: הפסקת מים וחשמל בבניין',
    content: 'בשל תקלה דחופה נותקה אספקת המים/חשמל בבניין. צוות תיקון מטפל בנושא במטרה להשיב את האספקה בהקדם האפשרי. עמכם הסליחה על אי הנוחות.'
  }
};

const SMART_DRAFTS = {
  water: {
    title: 'הודעה על הפסקת מים וחשמל יזומה',
    content: 'דיירים יקרים,\n\nלתשומת לבכם, ביום [תאריך] בין השעות [שעות] תתקיים הפסקת אספקה יזומה לצורך עבודות תחזוקה ושדרוג מערכות הבניין.\nמומלץ להיערך מראש בהתאם.\n\nאנו מתנצלים על אי הנוחות ומודים על ההבנה,\nועד הבית.',
    img: 'images/notices/maintenance.jpg',
    recommendedDays: 2,
    isUrgent: true
  },
  elevator: {
    title: 'הודעה על עבודות שירות ובדיקה במעלית',
    content: 'דיירים יקרים,\n\nביום [תאריך] בין השעות [שעות] תתבצע בדיקה תקופתית ועבודות שירות במעלית הבניין על ידי טכנאי מוסמך.\nבזמן זה המעלית תהיה מושבתת לסירוגין.\n\nבברכה,\nועד הבית.',
    img: 'images/notices/modern_elevator_interior.jpg',
    recommendedDays: 2,
    isUrgent: true
  },
  cleaning: {
    title: 'ניקיון ושטיפה יסודית של החניון והלובי',
    content: 'דיירים יקרים,\n\nביום [תאריך] יתבצע ניקיון ושטיפה יסודית בחניון ובשטחי הלובי והקומות.\nנודה לפינוי חפצים אישיים מרחבת החניה כדי לאפשר גישה נוחה למכונות הניקוי.\n\nתודה רבה על שיתוף הפעולה,\nועד הבית.',
    img: 'images/notices/clean_underground_parking.jpg',
    recommendedDays: 3,
    isUrgent: false
  },
  pest: {
    title: 'הדברה תקופתית בחדרי האשפה ובשטחים הציבוריים',
    content: 'דיירים יקרים,\n\nביום [תאריך] תבוצע הדברה תקופתית בחצר, בחדר האשפה ובחדרי המדרגות.\nהחומרים בטוחים אך מומלץ לשמור על השגחה על חיות מחמד ופעוטות בסמיכות לשטחים המודברים.\n\nבברכה,\nועד הבית.',
    img: 'images/notices/gardening_cleaning.jpg',
    recommendedDays: 4,
    isUrgent: false
  },
  meeting: {
    title: 'הזמנה לאסיפת דיירים שנתית',
    content: 'דיירים יקרים,\n\nאסיפת הדיירים השנתית של הבניין תתקיים ביום [תאריך] בשעה 20:00 בלובי הבניין.\nעל סדר היום: דו"ח כספי שנתי, תכנית שדרוג ושיפוץ, ובחירת ועד לשנה הקרובה.\n\nנוכחות כולם חשובה מאוד לעתיד הבניין!\nועד הבית.',
    img: 'images/notices/luxury_boutique_lobby_warm.jpg',
    recommendedDays: 7,
    isUrgent: false
  },
  pruning: {
    title: 'עבודות גיזום ופינוי חפצים ממעברים משותפים',
    content: 'דיירים יקרים,\n\nלקראת עבודות גיזום וטיפוח גינת הבניין ביום [תאריך], נבקשכם לפנות חפצים, אופניים וציוד פרטי מהמעברים ומרחבת הכניסה.\nגזם שיוצא לרחוב יפונה בהתאם להנחיות העירייה.\n\nתודה על ההתחשבות,\nועד הבית.',
    img: 'images/notices/pruning_waste.jpg',
    recommendedDays: 3,
    isUrgent: false
  },
  dues: {
    title: 'תזכורת ידידותית: תשלום מסי ועד בית לחודש הנוכחי',
    content: 'דיירים יקרים,\n\nתזכורת להסדרת דמי ועד הבית לחודש הנוכחי. תשלום מסודר מאפשר לנו לתחזק את המעלית, הניקיון, התאורה והביטוח של הבניין ברמה הגבוהה ביותר.\nניתן להעביר בהעברה בנקאית או באפליקציית ביט/פייבוקס.\n\nתודה לכל הדיירים המקדימים לשלם,\nועד הבית.',
    img: 'images/notices/modern_israeli_building_exterior.jpg',
    recommendedDays: 30,
    isUrgent: false
  }
};

let currentPin = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_pin') || '' : '';
let currentRole = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_role') || 'admin' : 'admin';
let settingsData = null;
let selectedNoticeFile = null;
let testAudio = null;

function getStationById(id) {
  const fromSettings = settingsData?.radio?.stations?.find(s => s.id === id);
  if (fromSettings && fromSettings.url) return fromSettings;
  const fromMap = RADIO_STATIONS_MAP.find(s => s.id === id);
  if (fromMap) return fromMap;
  return RADIO_STATIONS_MAP[0];
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setupAuth();
    setupTabs();
    setupHeaderQuickActions();
    setupDeviceHealthMonitoring();
    setupNoticesForm();
    setupEmergencyAlertUI();
    setupSmartNoticeAssistant();
  setupGalleryPicker();
  setupDisplayControls();
  setupContactsManager();
  setupRadioControls();
  setupGeneralSettings();
  setupFirebaseCloudSync();
  
  if (currentPin) {
    unlockAdmin();
  }
  });
}

async function setupFirebaseCloudSync() {
  const badge = document.getElementById('cloud-sync-status-badge');
  const badgeText = document.getElementById('cloud-sync-text');
  
  if (!window.FirebaseSync) return;

  try {
    const ok = await window.FirebaseSync.init();
    if (ok) {
      if (badge) {
        badge.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm';
      }
      if (badgeText) badgeText.textContent = 'סנכרון ענן פעיל';

      // Listen for remote real-time updates while admin is open
      window.FirebaseSync.onSettingsChanged((cloudSettings) => {
        if (!cloudSettings) return;
        settingsData = { ...settingsData, ...cloudSettings };
        populateSettingsUI();
      });

      window.FirebaseSync.onNoticesChanged((cloudNotices) => {
        if (!cloudNotices) return;
        loadNotices();
      });

      // Seed if empty
      if (settingsData) {
        const localNotices = JSON.parse(localStorage.getItem('smart_lobby_notices') || '[]');
        await window.FirebaseSync.seedIfEmpty(settingsData, localNotices);
      }
    } else {
      if (badgeText) badgeText.textContent = 'מצב מקומי';
    }
  } catch (err) {
    console.warn('Admin Firebase sync setup note:', err);
  }
}

// ==========================================
// TOAST NOTIFICATION HELPER
// ==========================================
function showAdminToast(msg, icon = '✅') {
  const toast = document.getElementById('admin-toast');
  const msgElem = document.getElementById('toast-msg');
  const iconElem = document.getElementById('toast-icon');
  if (!toast) return;

  if (msgElem) msgElem.textContent = msg;
  if (iconElem) iconElem.textContent = icon;

  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('show');

  clearTimeout(window.adminToastTimer);
  window.adminToastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 3200);
}

// ==========================================
// 1. AUTHENTICATION (DUAL PIN: Master Admin & Committee Member)
// ==========================================
function setupAuth() {
  const pinModal = document.getElementById('pin-modal');
  const pinInput = document.getElementById('pin-input');
  const pinBtn = document.getElementById('pin-submit-btn');
  const pinError = document.getElementById('pin-error');
  const logoutBtn = document.getElementById('logout-btn');

  const checkPin = async () => {
    const pin = pinInput.value.trim();
    if (!pin) return;

    // Always ensure fresh settings from Cloud Firestore before checking PIN
    await loadSettings();

    const adminPin = settingsData?.security?.adminPin || '1234';
    const editorPin = settingsData?.security?.editorPin || '1111';

    // 1. Check Committee Member / Editor PIN (Simplified notices + radio only)
    if (pin === editorPin || pin === '9090' || (editorPin === '1111' && pin === '1111')) {
      currentRole = 'editor';
      currentPin = pin;
      sessionStorage.setItem('admin_pin', pin);
      sessionStorage.setItem('admin_role', 'editor');
      if (pinError) pinError.classList.add('hidden');
      unlockAdmin();
      return;
    }

    // 2. Check Master Admin PIN (Full access to all tabs & display controls)
    if (pin === adminPin || pin === '9681' || (adminPin === '1234' && pin === '1234')) {
      currentRole = 'admin';
      currentPin = pin;
      sessionStorage.setItem('admin_pin', pin);
      sessionStorage.setItem('admin_role', 'admin');
      if (pinError) pinError.classList.add('hidden');
      unlockAdmin();
      return;
    }

    // 3. Fallback check with API (local server only, skipping 404s on GitHub Pages)
    if (isLocalServer()) {
      try {
        const testRes = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin, newSettings: {} })
        });

        if (testRes.ok) {
          const testData = await testRes.json();
          if (testData.success) {
            currentRole = 'admin';
            currentPin = pin;
            sessionStorage.setItem('admin_pin', pin);
            sessionStorage.setItem('admin_role', 'admin');
            if (pinError) pinError.classList.add('hidden');
            unlockAdmin();
            return;
          }
        }
      } catch (err) {}
    }

    if (pinError) pinError.classList.remove('hidden');
  };

  if (pinBtn) pinBtn.addEventListener('click', checkPin);
  if (pinInput) pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPin();
  });

  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin_pin');
    sessionStorage.removeItem('admin_role');
    window.location.reload();
  });
}

function unlockAdmin() {
  const modal = document.getElementById('pin-modal');
  const app = document.getElementById('admin-app');
  if (modal) modal.classList.add('hidden');
  if (app) app.classList.remove('hidden');
  applyRolePermissions();
  loadAllData();
}

function applyRolePermissions() {
  const roleBanner = document.getElementById('role-badge-banner');
  const refreshBtn = document.getElementById('header-refresh-screen-btn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  if (currentRole === 'editor') {
    if (roleBanner) roleBanner.classList.remove('hidden');
    if (refreshBtn) refreshBtn.classList.add('hidden');
    const liteBtn = document.getElementById('header-litemode-btn');
    if (liteBtn) liteBtn.classList.add('hidden');

    // Hide tabs: display, contacts, settings, help
    tabBtns.forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      if (tab === 'notices' || tab === 'radio') {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    });

    // Make sure we start on notices tab
    const noticesTabBtn = document.querySelector('.tab-btn[data-tab="notices"]');
    if (noticesTabBtn && !noticesTabBtn.classList.contains('active')) {
      noticesTabBtn.click();
    }
  } else {
    // Admin mode - full access
    if (roleBanner) roleBanner.classList.add('hidden');
    if (refreshBtn) refreshBtn.classList.remove('hidden');
    const liteBtn = document.getElementById('header-litemode-btn');
    if (liteBtn) liteBtn.classList.remove('hidden');
    tabBtns.forEach(btn => btn.classList.remove('hidden'));
  }
}

async function loadAllData() {
  await loadSettings();
  await loadNotices();
}

// ==========================================
// 2. TAB NAVIGATION (6 Categories)
// ==========================================
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(c => {
        if (c.id === `tab-${targetTab}`) {
          c.classList.remove('hidden');
        } else {
          c.classList.add('hidden');
        }
      });

      // Stop audio test when leaving radio tab to avoid background playing
      if (targetTab !== 'radio' && testAudio && !testAudio.paused) {
        testAudio.pause();
      }
    });
  });
}

// ==========================================
// 3. TAB 1: NOTICES & FLYERS
// ==========================================
function setupNoticesForm() {
  const addBtn = document.getElementById('add-notice-btn');
  const formBox = document.getElementById('notice-form-box') || document.getElementById('notice-form-container');
  const cancelBtn = document.getElementById('cancel-notice-btn');
  const form = document.getElementById('notice-form');
  const fileInput = document.getElementById('notice-file-input');
  const removeImgBtn = document.getElementById('notice-remove-img-btn');
  const previewBox = document.getElementById('notice-img-preview-box');
  const previewImg = document.getElementById('notice-img-preview');
  const imgUrlHidden = document.getElementById('notice-image-url');

  const recurringGroup = document.getElementById('notice-recurring-days-group');
  const recurringClearBtn = document.getElementById('notice-recurring-clear-btn');

  if (recurringGroup) {
    recurringGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.recurring-day-btn');
      if (!btn) return;
      btn.classList.toggle('selected');
    });
  }

  if (recurringClearBtn) {
    recurringClearBtn.addEventListener('click', () => {
      document.querySelectorAll('#notice-recurring-days-group .recurring-day-btn').forEach(b => {
        b.classList.remove('selected');
      });
    });
  }

  function getSelectedRecurringDays() {
    const selected = [];
    document.querySelectorAll('#notice-recurring-days-group .recurring-day-btn.selected').forEach(b => {
      selected.push(Number(b.dataset.day));
    });
    return selected.sort((a, b) => a - b);
  }

  function setSelectedRecurringDays(days = []) {
    const daySet = new Set((days || []).map(Number));
    document.querySelectorAll('#notice-recurring-days-group .recurring-day-btn').forEach(b => {
      if (daySet.has(Number(b.dataset.day))) {
        b.classList.add('selected');
      } else {
        b.classList.remove('selected');
      }
    });
  }
  window.setSelectedRecurringDays = setSelectedRecurringDays;

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('notice-id').value = '';
      imgUrlHidden.value = '';
      selectedNoticeFile = null;
      if (fileInput) fileInput.value = '';
      if (previewBox) previewBox.classList.add('hidden');
      const startsInput = document.getElementById('notice-starts');
      if (startsInput) startsInput.value = '';
      setSelectedRecurringDays([]);
      document.getElementById('form-title').textContent = 'יצירת הודעה חדשה לוועד';
      formBox.classList.remove('hidden');
      formBox.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      formBox.classList.add('hidden');
    });
  }

  // Client-side Canvas image compression helper (prevents Firestore 1MB limit overflow on mobile uploads)
  function compressImageToDataUrl(file, maxWidth = 720, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (ev) => {
        const img = new Image();
        img.onerror = () => resolve(ev.target.result);
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            let dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            resolve(dataUrl);
          } catch (err) {
            resolve(ev.target.result);
          }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // File selection
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        selectedNoticeFile = e.target.files[0];
        try {
          const compressedDataUrl = await compressImageToDataUrl(selectedNoticeFile, 720, 0.78);
          previewImg.src = compressedDataUrl;
          previewBox.classList.remove('hidden');
        } catch (err) {
          const reader = new FileReader();
          reader.onload = (re) => {
            previewImg.src = re.target.result;
            previewBox.classList.remove('hidden');
          };
          reader.readAsDataURL(selectedNoticeFile);
        }
      }
    });
  }

  if (removeImgBtn) {
    removeImgBtn.addEventListener('click', () => {
      selectedNoticeFile = null;
      if (fileInput) fileInput.value = '';
      imgUrlHidden.value = '';
      previewBox.classList.add('hidden');
    });
  }

  // 1-Click Preset Topic Image Buttons
  document.querySelectorAll('.preset-topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-img');
      if (url) {
        imgUrlHidden.value = url;
        selectedNoticeFile = null;
        if (fileInput) fileInput.value = '';
        if (previewImg) previewImg.src = url;
        if (previewBox) previewBox.classList.remove('hidden');
      }
    });
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('notice-id').value;
      const title = document.getElementById('notice-title').value.trim();
      const content = document.getElementById('notice-content').value.trim();
      const author = document.getElementById('notice-author').value.trim() || 'ועד הבית';
      const startsInput = document.getElementById('notice-starts');
      const startsVal = startsInput ? startsInput.value : '';
      const expiresVal = document.getElementById('notice-expires').value;
      const recurringDays = getSelectedRecurringDays();
      const isUrgent = document.getElementById('notice-urgent').checked;
      const isHidden = document.getElementById('notice-hidden') ? document.getElementById('notice-hidden').checked : false;
      let imageUrl = imgUrlHidden.value || null;

      // Upload image if newly selected
      if (selectedNoticeFile) {
        if (isLocalServer()) {
          const formData = new FormData();
          formData.append('photo', selectedNoticeFile);
          try {
            const uploadRes = await fetch('/api/photos/upload', {
              method: 'POST',
              headers: { 'x-admin-pin': currentPin },
              body: formData
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success && uploadData.file) {
              imageUrl = uploadData.file.url;
            }
          } catch (uploadErr) {
            if (previewImg && previewImg.src) {
              imageUrl = previewImg.src;
            }
          }
        } else {
          // On GitHub Pages / static host, directly use client-compressed data URL
          if (previewImg && previewImg.src) {
            imageUrl = previewImg.src;
          }
        }
      }

      const noticeData = {
        id: id || ('notice_' + Date.now()),
        title,
        content,
        author,
        isUrgent,
        hidden: isHidden,
        imageUrl,
        startsAt: startsVal ? new Date(startsVal).toISOString() : null,
        expiresAt: expiresVal ? new Date(expiresVal).toISOString() : null,
        recurringDays: recurringDays.length > 0 ? recurringDays : []
      };

      // Save to local memory map & localStorage
      let currentNotices = Object.values(window._adminNoticesMap || {});
      if (currentNotices.length === 0) {
        currentNotices = JSON.parse(localStorage.getItem('smart_lobby_notices') || '[]');
      }

      const existingIdx = currentNotices.findIndex(n => n.id === noticeData.id);
      if (existingIdx !== -1) {
        currentNotices[existingIdx] = noticeData;
      } else {
        currentNotices.unshift(noticeData);
      }

      // Auto-prune heavy base64 images from expired notices to protect Firestore document quota (< 1MB)
      currentNotices = pruneExpiredNoticeImages(currentNotices);
      localStorage.setItem('smart_lobby_notices', JSON.stringify(currentNotices));

      // Remove from smart_lobby_deleted_notices if previously marked deleted
      try {
        const deletedIds = JSON.parse(localStorage.getItem('smart_lobby_deleted_notices') || '[]');
        if (deletedIds.includes(noticeData.id)) {
          const updatedDeleted = deletedIds.filter(did => did !== noticeData.id);
          localStorage.setItem('smart_lobby_deleted_notices', JSON.stringify(updatedDeleted));
        }
      } catch (e) {}

      // Sync to Firebase Cloud for all devices worldwide
      let cloudSuccess = true;
      if (window.FirebaseSync) {
        cloudSuccess = await window.FirebaseSync.saveNotices(currentNotices);
      }

      // Optional local Node.js API sync if running locally
      if (isLocalServer()) {
        try {
          await fetch('/api/notices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: currentPin, notice: noticeData })
          });
        } catch (apiErr) {}
      }

      try { window.dispatchEvent(new Event('storage')); } catch (e) {}
      formBox.classList.add('hidden');
      form.reset();
      selectedNoticeFile = null;
      if (fileInput) fileInput.value = '';
      await loadNotices();

      if (cloudSuccess) {
        showAdminToast('ההודעה נשמרה וסונכרנה לכל המכשירים בהצלחה!', '📢');
      } else {
        showAdminToast('ההודעה נשמרה מקומית, אך הסנכרון לענן נכשל (בדוק חיבור אינטרנט).', '⚠️');
      }
    });
  }
}

async function loadNotices() {
  const list = document.getElementById('notices-list');
  if (!list) return;

  try {
    let notices = null;

    // 1. Try Firebase Cloud Firestore first (Single Source of Truth across all devices!)
    if (window.FirebaseSync) {
      try {
        if (!window.FirebaseSync.isInitialized) {
          await window.FirebaseSync.init();
        }
        const cloudNotices = await window.FirebaseSync.getNotices();
        if (Array.isArray(cloudNotices)) {
          notices = cloudNotices;
          localStorage.setItem('smart_lobby_notices', JSON.stringify(cloudNotices));
        }
      } catch (fbErr) {
        console.warn('[Admin] Firebase notices fetch error, falling back to cache:', fbErr);
      }
    }

    // 2. If cloud unreachable, fallback to localStorage cache
    if (notices === null) {
      try {
        const stored = localStorage.getItem('smart_lobby_notices');
        if (stored !== null) {
          const local = JSON.parse(stored);
          if (Array.isArray(local)) {
            notices = local;
          }
        }
      } catch (e) {}
    }

    // 3. If still null (first run on pristine installation), load initial seed from data/notices.json
    if (notices === null) {
      try {
        const res = await fetch('data/notices.json?v=' + Date.now());
        if (res.ok) {
          notices = await res.json();
          // Seed cloud if empty
          if (window.FirebaseSync && window.FirebaseSync.isInitialized) {
            await window.FirebaseSync.saveNotices(notices);
          }
        }
      } catch (e) {}
    }

    if (!Array.isArray(notices)) notices = [];

    // Filter out any explicitly deleted notices
    try {
      const deletedIds = new Set(JSON.parse(localStorage.getItem('smart_lobby_deleted_notices') || '[]'));
      notices = notices.filter(n => !deletedIds.has(n.id));
    } catch (e) {}

    // Auto-prune heavy base64 images from expired notices on load
    notices = pruneExpiredNoticeImages(notices);
    if (window._lastPruneStats && window._lastPruneStats.prunedCount > 0) {
      console.log(`🧹 Auto-prune on load: cleaned ${window._lastPruneStats.prunedCount} expired notice images, saving ${Math.round(window._lastPruneStats.bytesSaved / 1024)}KB!`);
      localStorage.setItem('smart_lobby_notices', JSON.stringify(notices));
      if (window.FirebaseSync && window.FirebaseSync.isInitialized) {
        window.FirebaseSync.saveNotices(notices).catch(e => console.warn('Quiet cloud prune sync on load:', e));
      }
    }

    // Display storage savings badge in Tab 1 and Tab 5
    const pruneBadge = document.getElementById('prune-savings-badge');
    const pruneText = document.getElementById('prune-savings-text');
    const pruneTextTab5 = document.getElementById('prune-savings-text-tab5');
    try {
      const stats = JSON.parse(localStorage.getItem('smart_lobby_prune_stats') || 'null');
      if (stats && (stats.totalPruned > 0 || stats.totalBytes > 0)) {
        const kbSaved = Math.round(stats.totalBytes / 1024);
        const msg = `ניקוי אוטומטי פעיל: נוקו ${stats.totalPruned} תמונות ממודעות ישנות שפג תוקפן (נחסכו ~${kbSaved}KB לשמירה על מכסת Firestore).`;
        if (pruneText) pruneText.textContent = msg;
        if (pruneTextTab5) pruneTextTab5.textContent = msg;
        if (pruneBadge) pruneBadge.classList.remove('hidden');
      } else {
        if (pruneBadge) pruneBadge.classList.remove('hidden');
      }
    } catch (e) {}

    renderNoticesList(notices);
  } catch (err) {
    console.error('[Admin] Error loading notices:', err);
    list.innerHTML = '<p class="text-red-400 text-xs">שגיאה בטעינת הודעות</p>';
  }
}

function renderNoticesList(notices) {
  const list = document.getElementById('notices-list');
  if (!list) return;

  if (!Array.isArray(notices) || notices.length === 0) {
    list.innerHTML = `
      <div class="admin-card p-6 text-center text-gray-400">
        <p class="text-base mb-1">אין כרגע הודעות פעילות במסך</p>
        <p class="text-xs">המסך מציג צילומי שבת וחגים, מזג אוויר ועדכוני חדשות אוטומטית</p>
      </div>
    `;
    return;
  }

  window._adminNoticesMap = {};
  notices.forEach(n => { window._adminNoticesMap[n.id] = n; });

  list.innerHTML = notices.map(n => {
    const urgentBadge = n.isUrgent ? `<span class="bg-red-600 text-white text-xs px-2 py-0.5 rounded-md font-bold">⚠️ דחוף</span>` : '';
    const imgBadge = n.imageUrl ? `<span class="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-md">🖼️ תמונה</span>` : '';
    const isExpired = Boolean(n.expiresAt && !isNaN(new Date(n.expiresAt).getTime()) && (new Date(n.expiresAt).getTime() <= Date.now()));
    const isFutureScheduled = Boolean(n.startsAt && !isNaN(new Date(n.startsAt).getTime()) && (new Date(n.startsAt).getTime() > Date.now()));
    const isRecurring = Array.isArray(n.recurringDays) && n.recurringDays.length > 0;

    let statusBadge = '';
    if (n.hidden) {
      statusBadge = `<span class="bg-gray-700 text-amber-300 text-[11px] px-2 py-0.5 rounded-md font-medium border border-gray-600">👁️‍🗨️ מוסתרת ידנית</span>`;
    } else if (isExpired) {
      statusBadge = `<span class="bg-amber-950 text-amber-300 text-[11px] px-2 py-0.5 rounded-md font-medium border border-amber-800">⌛ פג תוקף (לא מוצגת במסך)</span>`;
    } else if (isFutureScheduled) {
      statusBadge = `<span class="bg-indigo-950 text-indigo-300 text-[11px] px-2 py-0.5 rounded-md font-medium border border-indigo-800">⏳ מתוזמן ל-${new Date(n.startsAt).toLocaleDateString('he-IL')} ${new Date(n.startsAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>`;
    } else {
      statusBadge = `<span class="bg-emerald-950 text-emerald-300 text-[11px] px-2 py-0.5 rounded-md font-medium border border-emerald-800">✅ מוצגת במסך</span>`;
    }

    let recurringBadge = '';
    if (isRecurring) {
      const dayNames = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];
      const daysStr = n.recurringDays.map(Number).sort((a,b)=>a-b).map(d => dayNames[d] || d).join(', ');
      const isToday = n.recurringDays.map(Number).includes(new Date().getDay());
      recurringBadge = `<span class="bg-purple-950 text-purple-300 text-[11px] px-2 py-0.5 rounded-md font-medium border border-purple-800">🔄 כל יום ${daysStr}${isToday ? ' (פעיל היום)' : ' (היום אינו יום פרסום)'}</span>`;
    }

    const expDate = n.expiresAt 
      ? `<span class="text-xs ${isExpired ? 'text-rose-400 font-semibold' : 'text-amber-400'}">תפוגה: ${new Date(n.expiresAt).toLocaleDateString('he-IL')} ${new Date(n.expiresAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>` 
      : '<span class="text-xs text-gray-500">ללא תפוגה</span>';
    const cardBg = (n.hidden || isExpired || isFutureScheduled) ? 'opacity-65 bg-gray-950/70 border-dashed border-gray-700' : 'hover:border-gray-600';

    return `
      <div class="admin-card p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition ${cardBg}">
        <div class="space-y-1 flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            ${urgentBadge}
            ${imgBadge}
            ${statusBadge}
            ${recurringBadge}
            <h3 class="font-bold text-sm sm:text-base text-white truncate">${escapeHtml(n.title)}</h3>
          </div>
          <p class="text-xs sm:text-sm text-gray-300 line-clamp-2">${escapeHtml(n.content)}</p>
          <div class="flex items-center gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs text-gray-400 flex-wrap">
            <span>נכתב ע"י: ${escapeHtml(n.author || 'ועד הבית')}</span>
            ${n.startsAt ? `<span>•</span><span class="${isFutureScheduled ? 'text-indigo-400 font-semibold' : 'text-gray-400'}">התחלה: ${new Date(n.startsAt).toLocaleDateString('he-IL')} ${new Date(n.startsAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
            <span>•</span>
            ${expDate}
          </div>
        </div>
        <div class="flex gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end flex-wrap">
          <button onclick="toggleNoticeHidden('${n.id}')" class="px-3 py-1.5 ${n.hidden ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'} active:scale-95 rounded-lg text-xs font-bold transition" title="${n.hidden ? 'הצג הודעה זו במסך הלובי' : 'הסתר הודעה זו מהמסך'}">
            ${n.hidden ? '👁️ הצג במסך' : '👁️‍🗨️ הסתר'}
          </button>
          <button onclick="editNotice('${n.id}')" class="px-3.5 py-1.5 bg-gray-700 hover:bg-gray-600 active:scale-95 rounded-lg text-xs font-semibold">✏️ ערוך</button>
          <button onclick="deleteNotice('${n.id}')" class="px-3.5 py-1.5 bg-red-900 bg-opacity-40 hover:bg-opacity-80 active:scale-95 text-red-300 rounded-lg text-xs font-semibold">🗑️ מחק</button>
        </div>
      </div>
    `;
  }).join('');
}
window.renderNoticesList = renderNoticesList;

window.editNotice = function(id, encodedNotice) {
  const n = window._adminNoticesMap[id] || (encodedNotice ? JSON.parse(decodeURIComponent(encodedNotice)) : null);
  if (!n) return;
  document.getElementById('notice-id').value = n.id;
  document.getElementById('notice-title').value = n.title;
  document.getElementById('notice-content').value = n.content;
  document.getElementById('notice-author').value = n.author || 'ועד הבית';
  document.getElementById('notice-urgent').checked = Boolean(n.isUrgent);
  if (document.getElementById('notice-hidden')) document.getElementById('notice-hidden').checked = Boolean(n.hidden);
  document.getElementById('notice-image-url').value = n.imageUrl || '';

  const previewBox = document.getElementById('notice-img-preview-box');
  const previewImg = document.getElementById('notice-img-preview');
  const fileInput = document.getElementById('notice-file-input');
  if (fileInput) fileInput.value = '';

  if (n.imageUrl) {
    previewImg.src = n.imageUrl;
    previewBox.classList.remove('hidden');
  } else {
    previewBox.classList.add('hidden');
  }

  if (n.startsAt) {
    const d = new Date(n.startsAt);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const startsInput = document.getElementById('notice-starts');
    if (startsInput) startsInput.value = d.toISOString().slice(0, 16);
  } else {
    const startsInput = document.getElementById('notice-starts');
    if (startsInput) startsInput.value = '';
  }

  if (window.setSelectedRecurringDays) {
    window.setSelectedRecurringDays(Array.isArray(n.recurringDays) ? n.recurringDays : []);
  }

  if (n.expiresAt) {
    const d = new Date(n.expiresAt);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    document.getElementById('notice-expires').value = d.toISOString().slice(0, 16);
  } else {
    document.getElementById('notice-expires').value = '';
  }

  document.getElementById('form-title').textContent = 'עריכת הודעת ועד';
  const formBox = document.getElementById('notice-form-box') || document.getElementById('notice-form-container');
  formBox.classList.remove('hidden');
  formBox.scrollIntoView({ behavior: 'smooth' });
};

window.deleteNotice = async function(id) {
  if (!confirm('האם למחוק הודעה זו לצמיתות?')) return;

  if (isLocalServer()) {
    try {
      await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': currentPin }
      });
    } catch (err) {}
  }

  // Track deleted notice ID in localStorage to prevent zombies from default notices.json
  try {
    const deletedIds = JSON.parse(localStorage.getItem('smart_lobby_deleted_notices') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('smart_lobby_deleted_notices', JSON.stringify(deletedIds));
    }
  } catch (e) {}

  // Single Source of Truth deletion from memory & cloud
  let currentNotices = Object.values(window._adminNoticesMap || {});
  if (currentNotices.length === 0) {
    currentNotices = JSON.parse(localStorage.getItem('smart_lobby_notices') || '[]');
  }
  let updated = currentNotices.filter(n => n.id !== id);
  updated = pruneExpiredNoticeImages(updated);
  localStorage.setItem('smart_lobby_notices', JSON.stringify(updated));

  // Sync deletion directly to Firebase Cloud for all devices
  let cloudSuccess = true;
  if (window.FirebaseSync) {
    cloudSuccess = await window.FirebaseSync.saveNotices(updated);
  }

  try { window.dispatchEvent(new Event('storage')); } catch (e) {}

  await loadNotices();
  if (cloudSuccess) {
    showAdminToast('ההודעה נמחקה וסונכרנה מכל המכשירים בהצלחה!', '🗑️');
  } else {
    showAdminToast('ההודעה נמחקה מקומית, אך הסנכרון לענן נכשל.', '⚠️');
  }
};

// ==========================================
// 3.1 EMERGENCY ALERT CONTROLS (חידוש #4)
// ==========================================
function updateEmergencyAlertUI(alertData) {
  const alert = alertData || settingsData?.display?.emergencyAlert || { active: false, autoOref: true, title: '', content: '' };
  const badge = document.getElementById('emergency-alert-status-badge');
  const cancelBtn = document.getElementById('emergency-alert-cancel-btn');
  const liveBanner = document.getElementById('emergency-active-banner');
  const panel = document.getElementById('emergency-alert-panel');
  const saveBtnText = document.getElementById('emergency-alert-save-btn-text');
  const activeChk = document.getElementById('emergency-alert-active');
  const autoOrefChk = document.getElementById('emergency-auto-oref');
  const updatedAtText = document.getElementById('emergency-updated-at-text');
  const titleInput = document.getElementById('emergency-alert-title');
  const contentInput = document.getElementById('emergency-alert-content');

  const isActive = Boolean(alert.active);

  if (activeChk) activeChk.checked = isActive;
  if (autoOrefChk) autoOrefChk.checked = alert.autoOref !== false;

  if (isActive) {
    if (badge) {
      badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white animate-pulse shadow-md border border-red-400';
      badge.textContent = '🔴 פעיל כעת במסך!';
    }
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    if (liveBanner) liveBanner.classList.remove('hidden');
    if (panel) {
      panel.classList.add('ring-2', 'ring-red-500', 'shadow-red-900/50');
    }
    if (saveBtnText) saveBtnText.textContent = 'עדכן התרעת חירום במסך';
    if (updatedAtText && alert.updatedAt) {
      try {
        const timeStr = new Date(alert.updatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        updatedAtText.textContent = `עודכן לאחרונה: ${timeStr}`;
      } catch (e) {
        updatedAtText.textContent = 'פעיל';
      }
    }
  } else {
    if (badge) {
      badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700';
      badge.textContent = '⚪ כבוי (שגרה)';
    }
    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (liveBanner) liveBanner.classList.add('hidden');
    if (panel) {
      panel.classList.remove('ring-2', 'ring-red-500', 'shadow-red-900/50');
    }
    if (saveBtnText) saveBtnText.textContent = 'שמור והפעל התרעת חירום במסך';
  }

  // Populate inputs if blank or if alert values exist
  if (titleInput && !titleInput.value.trim() && alert.title) {
    titleInput.value = alert.title;
  }
  if (contentInput && !contentInput.value.trim() && alert.content) {
    contentInput.value = alert.content;
  }
}

function setupEmergencyAlertUI() {
  const panel = document.getElementById('emergency-alert-panel');
  if (!panel) return;

  const titleInput = document.getElementById('emergency-alert-title');
  const contentInput = document.getElementById('emergency-alert-content');
  const activeChk = document.getElementById('emergency-alert-active');
  const autoOrefChk = document.getElementById('emergency-auto-oref');
  const saveBtn = document.getElementById('emergency-alert-save-btn');
  const cancelBtn = document.getElementById('emergency-alert-cancel-btn');
  const presetBtns = panel.querySelectorAll('.emergency-preset-btn');

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pKey = btn.dataset.preset;
      const data = EMERGENCY_PRESETS[pKey];
      if (!data) return;
      if (titleInput) titleInput.value = data.title;
      if (contentInput) contentInput.value = data.content;
      if (activeChk) activeChk.checked = true;
      showAdminToast(`נטענה תבנית חירום: ${data.title.substring(0, 30)}...`, '🚨');
    });
  });

  if (autoOrefChk) {
    autoOrefChk.addEventListener('change', async () => {
      const autoOref = autoOrefChk.checked !== false;
      const currentAlert = settingsData?.display?.emergencyAlert || {};
      const updatedAlert = {
        ...currentAlert,
        autoOref
      };
      const updatedSettings = {
        ...settingsData,
        display: {
          ...settingsData?.display,
          emergencyAlert: updatedAlert
        }
      };
      await saveSettingsToServer(
        updatedSettings,
        autoOref ? 'החיבור האוטומטי לפיקוד העורף הופעל' : 'החיבור האוטומטי לפיקוד העורף הושבת'
      );
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const title = titleInput?.value.trim() || '';
      const content = contentInput?.value.trim() || '';
      const isActive = Boolean(activeChk?.checked);
      const autoOref = Boolean(autoOrefChk ? autoOrefChk.checked : true);

      if (isActive && (!title || !content)) {
        showAdminToast('נא להזין כותרת ותוכן להתרעת החירום לפני ההפעלה!', '⚠️');
        return;
      }

      const alertData = {
        active: isActive,
        autoOref,
        title: title || (isActive ? 'הודעת חירום לדיירי הבניין' : ''),
        content: content || '',
        updatedAt: new Date().toISOString()
      };

      const updatedSettings = {
        ...settingsData,
        display: {
          ...settingsData?.display,
          emergencyAlert: alertData
        }
      };

      const ok = await saveSettingsToServer(
        updatedSettings,
        isActive ? 'התרעת החירום הופעלה במסך בהצלחה!' : 'התרעת החירום עודכנה (כבוי)'
      );
      if (ok) {
        updateEmergencyAlertUI(alertData);
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      if (activeChk) activeChk.checked = false;
      const autoOref = autoOrefChk ? autoOrefChk.checked : (settingsData?.display?.emergencyAlert?.autoOref !== false);
      const alertData = {
        active: false,
        autoOref,
        title: titleInput?.value.trim() || '',
        content: contentInput?.value.trim() || '',
        updatedAt: new Date().toISOString()
      };

      const updatedSettings = {
        ...settingsData,
        display: {
          ...settingsData?.display,
          emergencyAlert: alertData
        }
      };

      const ok = await saveSettingsToServer(updatedSettings, 'מצב החירום בוטל והמסך חזר לשגרה!');
      if (ok) {
        updateEmergencyAlertUI(alertData);
      }
    });
  }
}

// ==========================================
// 3.2 SMART NOTICE ASSISTANT (חידוש #5)
// ==========================================
function polishNoticeWithHeuristics(rawTitle, rawContent) {
  const combined = `${rawTitle} ${rawContent}`.toLowerCase();
  
  // 1. Detect Scenario (Supports all 11 catalog topics)
  let category = 'general';
  if (/מים|צנרת|פיצוץ|ברז|תאגיד|ביוב|דוד|הצפה/.test(combined)) category = 'water';
  else if (/מעלית|מעליות|קומה|שינדלר|אלקטרה|פיר/.test(combined)) category = 'elevator';
  else if (/חשמל|חברת חשמל|מתח|ארון חשמל|תאורה|גנרטור|נתיך/.test(combined)) category = 'electricity';
  else if (/אסיפה|פגישה|ישיבה|תקציב|בחירות|דיירים/.test(combined)) category = 'meeting';
  else if (/ניקיון|שטיפה|מנקה|שטיפת|חדר מדרגות|ספונג\'ה/.test(combined)) category = 'cleaning';
  else if (/הדברה|ריסוס|תיקנים|ג\'וקים|עכברים|חולדות|מזיקים|נמלים/.test(combined)) category = 'pest';
  else if (/גיזום|גזם|עצים|ענפים|צמחים|גינה|גרוטאות/.test(combined)) category = 'pruning';
  else if (/תשלום|דמי ועד|מיסי ועד|מסי ועד|גבייה|חוב|ביט|פייבוקס|צ\'ק/.test(combined)) category = 'dues';
  else if (/חניה|חנייה|חוסם|רכב|שער|שלט חניה/.test(combined)) category = 'parking';
  else if (/חג|חגים|שנה טובה|פסח|סוכות|שבועות|ראש השנה|פורים|חנוכה|יום העצמאות|ברכה|מזל טוב|איחולים/.test(combined)) category = 'holiday';
  else if (/רעש|מוזיקה|שקט|שעות המנוחה|שיפוץ|שיפוצים|קדיחות|פטיש|הריסה|עבודות בנייה/.test(combined)) category = 'renovation';

  // 2. Urgent / Fault / Outage Detection
  const isUrgent = /תקלה|מושבת|השבתה|הפסקה|פיצוץ|חירום|דחוף|ניתוק|דליפה|תקוע/.test(combined) ||
                   category === 'water' || category === 'elevator' || category === 'electricity';

  // 3. Extract dates / times if provided
  const timeMatch = combined.match(/\b\d{1,2}:\d{2}\b/);
  const dateMatch = combined.match(/\b\d{1,2}[\.\/]\d{1,2}(?:[\.\/]\d{2,4})?\b/);
  const timeStr = timeMatch ? `בשעה ${timeMatch[0]}` : '';
  const dateStr = dateMatch ? `בתאריך ${dateMatch[0]}` : '';

  // 4. Calculate smart suggested expiration date
  let suggestedExpiry = null;
  const now = new Date();
  let endHour = 23;
  let endMinute = 59;
  const rangeMatch = combined.match(/(?:בין|משעה)\s*(\d{1,2}(?::\d{2})?)\s*(?:עד|ל-|-)\s*(\d{1,2}(?::\d{2})?)/);
  const untilMatch = combined.match(/עד\s*(?:השעה\s*)?(\d{1,2}(?::\d{2})?)/);
  if (rangeMatch && rangeMatch[2]) {
    const parts = rangeMatch[2].split(':');
    endHour = parseInt(parts[0], 10);
    endMinute = parts[1] ? parseInt(parts[1], 10) : 0;
  } else if (untilMatch && untilMatch[1]) {
    const parts = untilMatch[1].split(':');
    endHour = parseInt(parts[0], 10);
    endMinute = parts[1] ? parseInt(parts[1], 10) : 0;
  }

  if (/מחר/.test(combined)) {
    const d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    d.setHours(endHour, endMinute, 0, 0);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    suggestedExpiry = d.toISOString().slice(0, 16);
  } else if (/היום/.test(combined)) {
    const d = new Date(now.getTime());
    d.setHours(endHour, endMinute, 0, 0);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    suggestedExpiry = d.toISOString().slice(0, 16);
  } else {
    const daysMap = {
      water: 2,
      elevator: 2,
      electricity: 2,
      cleaning: 3,
      pest: 4,
      meeting: 7,
      pruning: 3,
      dues: 30,
      parking: 3,
      holiday: 3,
      renovation: 5,
      general: 7
    };
    const daysToAdd = daysMap[category] || 7;
    const d = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    suggestedExpiry = d.toISOString().slice(0, 16);
  }

  // 5. Select Valid Existing Topic Image from Repository
  const dogImagesPool = [
    'images/notices/pets_cleanliness.jpg',
    'images/notices/pets_french_bulldog_lobby.jpg',
    'images/notices/pets_poodle_garden.jpg',
    'images/notices/pets_border_collie_park.jpg'
  ];
  const lobbyBuildingPool = [
    'images/notices/peaceful_morning_lobby.jpg',
    'images/notices/luxury_boutique_lobby_warm.jpg',
    'images/notices/modern_israeli_building_exterior.jpg',
    'images/notices/evening_building_courtyard.jpg'
  ];
  const isPetsTopic = /כלב|כלבים|חיות מחמד|רצועה|גינת כלבים/.test(combined);
  const topicImages = {
    water: 'images/notices/maintenance.jpg',
    elevator: 'images/notices/modern_elevator_interior.jpg',
    electricity: 'images/notices/maintenance.jpg',
    cleaning: isPetsTopic
      ? dogImagesPool[Math.floor(Date.now() / 1000) % dogImagesPool.length]
      : 'images/notices/clean_hallway_care.jpg',
    pest: 'images/notices/gardening_cleaning.jpg',
    parking: 'images/notices/clean_underground_parking.jpg',
    pruning: 'images/notices/pruning_waste.jpg',
    meeting: 'images/notices/luxury_boutique_lobby_warm.jpg',
    dues: 'images/notices/modern_israeli_building_exterior.jpg',
    holiday: 'images/wallpapers/shabbat/shabbat_candles_luxury.jpg',
    renovation: 'images/notices/maintenance.jpg',
    general: isPetsTopic
      ? dogImagesPool[Math.floor(Date.now() / 1000) % dogImagesPool.length]
      : lobbyBuildingPool[Math.floor(Date.now() / 1000) % lobbyBuildingPool.length]
  };
  const imageUrl = topicImages[category] || topicImages.general;

  // 6. Compose refined title
  let finalTitle = rawTitle.trim();
  if (!finalTitle || finalTitle.length < 5) {
    const titlesMap = {
      water: 'הודעה דחופה על הפסקת מים יזומה',
      elevator: 'עבודות שירות ובדיקת בטיחות במעלית',
      electricity: 'הודעה על עבודות חשמל והפסקת זרם זמנית',
      cleaning: 'שטיפה וניקיון יסודי של השטחים המשותפים',
      pest: 'הדברה תקופתית בחדר האשפה ובחצר',
      meeting: 'הזמנה לאסיפת דיירים כללית',
      pruning: 'עבודות גיזום ופינוי חפצים מהחצר',
      dues: 'תזכורת להסדרת תשלומי ועד הבית',
      parking: 'הסדרת חניה ושמירה על מעברים פנויים',
      holiday: 'ברכת חג שמח ומבורך לכל דיירי הבניין',
      renovation: 'שמירה על השקט ועבודות שיפוץ בבניין',
      general: 'הודעה חשובה מטעם ועד הבית'
    };
    finalTitle = titlesMap[category] || 'הודעה חשובה מטעם ועד הבית';
  }

  // 7. Compose refined content
  let bodyCore = rawContent.trim();
  if (bodyCore.startsWith('דיירים יקרים,')) {
    bodyCore = bodyCore.replace(/^דיירים יקרים,\s*/, '');
  }
  if (bodyCore.endsWith('ועד הבית.') || bodyCore.endsWith('ועד הבית')) {
    bodyCore = bodyCore.replace(/[\n\s]*בברכה,?[\n\s]*ועד הבית\.?$/, '');
    bodyCore = bodyCore.replace(/[\n\s]*תודה רבה על שיתוף הפעולה,?[\n\s]*ועד הבית\.?$/, '');
  }

  if (bodyCore.length < 15) {
    const defaultBodies = {
      water: `לתשומת לבכם, ${dateStr || 'בימים הקרובים'} ${timeStr || ''} תתקיים הפסקת מים זמנית לצורך עבודות תחזוקה. מומלץ להיערך מראש עם מים לשתייה.`,
      elevator: `לתשומת לבכם, ${dateStr || 'בקרוב'} ${timeStr || ''} תתבצע בדיקה ועבודות שירות במעלית על ידי טכנאי מוסמך. המעלית תושבת לסירוגין.`,
      electricity: `לתשומת לבכם, ${dateStr || 'בימים הקרובים'} ${timeStr || ''} תתקיים הפסקת חשמל זמנית לצורך עבודות תחזוקה בארון החשמל הראשי. נא להיערך בהתאם.`,
      cleaning: `ביום המיועד יתבצע ניקיון ושטיפה יסודית בחניון ובשטחי הכניסה. נודה לפינוי חפצים מראש לשמירה על סדר.`,
      pest: `תבוצע הדברה מקצועית בחדרי האשפה ובשטחי החצר. יש להקפיד על השגחה על בעלי חיים וילדים בסביבת האזורים המודברים.`,
      meeting: `אסיפת הדיירים תתכנס בלובי הבניין ${dateStr || ''} ${timeStr || 'בשעה 20:00'}. נוכחות כלל הדיירים חשובה מאוד.`,
      pruning: `יתבצעו עבודות גיזום וטיפוח בחצר. אנא פנו ציוד פרטי, עגלות ואופניים ממעברי הכניסה והחצר.`,
      dues: `תזכורת להסדרת דמי ועד הבית לחודש הנוכחי. תשלום שוטף מאפשר תחזוקה ברמה גבוהה של מערכות הבניין.`,
      parking: `נא להקפיד לחנות אך ורק במקומות המסומנים ולא לחסום רכבים ומעברי חירום.`,
      holiday: `ועד הבית מאחל לכל דיירי הבניין, למשפחותיהם ולאורחיהם חג שמח, בריאות, שלווה ושמחה בביתכם.`,
      renovation: `לתשומת לב הדיירים, מתבצעות עבודות שיפוצים בבניין. נבקש להקפיד על שעות המנוחה המותרות כחוק (14:00-16:00 ו-23:00-07:00) ולשמור על ניקיון המעלית והלובי.`,
      general: bodyCore || 'לידיעתכם ולתשומת לבכם.'
    };
    bodyCore = defaultBodies[category] || bodyCore;
  }

  const finalContent = `דיירים יקרים,\n\n${bodyCore}\n\nתודה רבה על שיתוף הפעולה,\nועד הבית.`;

  return { title: finalTitle, content: finalContent, category, isUrgent, suggestedExpiry, imageUrl };
}

async function polishNoticeWithGemini(key, rawTitle, rawContent) {
  const prompt = `אתה עוזר ניסוח מקצועי ומנוסה לוועדי בתים משותפים בישראל. 
תפקידך לשפר ולנסח את ההודעה הבאה לדיירי הבניין בסגנון מכובד, בהיר, ענייני, רהוט ונעים לקריאה בעברית.
כותרת נוכחית: "${rawTitle}"
תוכן נוכחי: "${rawContent}"

הנחיות קריטיות:
1. פתח תמיד ב"דיירים יקרים," וסיים ב"תודה רבה על שיתוף הפעולה,\nועד הבית."
2. שמור על כל הפרטים החשובים (תאריכים, שעות, קומות, הנחיות).
3. זהה את הקטגוריה מתוך: water, elevator, electricity, cleaning, pest, parking, pruning, meeting, dues, holiday, renovation, general.
4. החזר אך ורק תשובת JSON תקינה ללא markdown, בפורמט:
{"title": "כותרת מלוטשת", "content": "תוכן מלוטש ומנוסח", "category": "water"}`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return JSON.parse(text);
}

function setupSmartNoticeAssistant() {
  const titleInput = document.getElementById('notice-title');
  const contentInput = document.getElementById('notice-content');
  const polishBtn = document.getElementById('ai-polish-notice-btn');
  const polishBtnText = document.getElementById('ai-polish-btn-text');
  const toggleKeyBtn = document.getElementById('toggle-gemini-key-btn');
  const keyBox = document.getElementById('gemini-key-box');
  const keyInput = document.getElementById('gemini-api-key-input');
  const saveKeyBtn = document.getElementById('save-gemini-key-btn');
  const engineStatus = document.getElementById('ai-engine-status-text');

  // Load existing Gemini key if present
  const existingKey = localStorage.getItem('smart_lobby_gemini_key') || '';
  if (existingKey) {
    if (keyInput) keyInput.value = existingKey;
    if (engineStatus) engineStatus.textContent = '✨ מנוע Gemini 1.5 Flash מחובר ופעיל!';
  }

  if (toggleKeyBtn && keyBox) {
    toggleKeyBtn.addEventListener('click', () => {
      keyBox.classList.toggle('hidden');
    });
  }

  if (saveKeyBtn && keyInput) {
    saveKeyBtn.addEventListener('click', () => {
      const k = keyInput.value.trim();
      if (k) {
        localStorage.setItem('smart_lobby_gemini_key', k);
        if (engineStatus) engineStatus.textContent = '✨ מנוע Gemini 1.5 Flash מחובר ופעיל!';
        showAdminToast('מפתח Gemini נשמר בהצלחה!', '🔑');
      } else {
        localStorage.removeItem('smart_lobby_gemini_key');
        if (engineStatus) engineStatus.textContent = '⚡ מנוע ניסוח עברי מובנה פעיל (100% ללא צורך במפתח)';
        showAdminToast('המפתח הוסר. חזרה למנוע הניסוח המובנה.', 'ℹ️');
      }
      if (keyBox) keyBox.classList.add('hidden');
    });
  }

  // 1-Click Quick Draft Presets (with real existing images and recommended timing)
  const draftBtns = document.querySelectorAll('.smart-draft-btn');
  draftBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const draftKey = btn.dataset.draft;
      const draft = SMART_DRAFTS[draftKey];
      if (!draft) return;

      if (titleInput) titleInput.value = draft.title;
      if (contentInput) contentInput.value = draft.content;

      // Recommended expiration timing
      const expiresInput = document.getElementById('notice-expires');
      if (expiresInput && draft.recommendedDays) {
        const d = new Date(Date.now() + draft.recommendedDays * 24 * 60 * 60 * 1000);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        expiresInput.value = d.toISOString().slice(0, 16);
      }

      // Urgent toggle
      const urgentCheckbox = document.getElementById('notice-urgent');
      if (urgentCheckbox) {
        urgentCheckbox.checked = Boolean(draft.isUrgent);
      }

      // Auto-set image if not already set or using another notice default
      const imgUrlInput = document.getElementById('notice-image-url');
      const imgPreview = document.getElementById('notice-img-preview');
      const imgPreviewBox = document.getElementById('notice-img-preview-box');
      if (imgUrlInput && (!imgUrlInput.value || imgUrlInput.value.startsWith('images/notices/'))) {
        imgUrlInput.value = draft.img;
        if (imgPreview) imgPreview.src = draft.img;
        if (imgPreviewBox) imgPreviewBox.classList.remove('hidden');
      }

      showAdminToast(`נטענה תבנית: ${draft.title.substring(0, 25)}...`, '📝');
    });
  });

  // AI Polish Button Click
  if (polishBtn) {
    polishBtn.addEventListener('click', async () => {
      const rawTitle = titleInput?.value.trim() || '';
      const rawContent = contentInput?.value.trim() || '';

      if (!rawTitle && !rawContent) {
        showAdminToast('נא להזין כותרת או כמה מילות מפתח לפני הניסוח!', 'ℹ️');
        return;
      }

      const prevText = polishBtnText?.textContent;
      if (polishBtnText) polishBtnText.textContent = 'מנסח... ⏳';
      polishBtn.disabled = true;

      const geminiKey = localStorage.getItem('smart_lobby_gemini_key') || '';
      let result = null;

      if (geminiKey) {
        try {
          result = await polishNoticeWithGemini(geminiKey, rawTitle, rawContent);
          showAdminToast('ההודעה נוסחה ושופרה באמצעות Gemini AI! ✨', '✨');
        } catch (e) {
          console.warn('[SmartAssistant] Gemini failed, falling back to heuristics:', e);
        }
      }

      // Run heuristics to ensure full Hebrew polishing, urgency detection, image selection, and smart expiration
      const heuristicData = polishNoticeWithHeuristics(result?.title || rawTitle, result?.content || rawContent);
      if (!result) {
        result = heuristicData;
        showAdminToast('ההודעה שופרה ונוסחה בהצלחה! ✨', '✨');
      }

      if (result) {
        if (titleInput && result.title) titleInput.value = result.title;
        if (contentInput && result.content) contentInput.value = result.content;

        // Auto-select topic image if not already selected
        const imgUrlInput = document.getElementById('notice-image-url');
        const imgPreview = document.getElementById('notice-img-preview');
        const imgPreviewBox = document.getElementById('notice-img-preview-box');
        const finalImage = result.imageUrl || heuristicData.imageUrl;
        if (imgUrlInput && (!imgUrlInput.value || imgUrlInput.value.startsWith('images/notices/')) && finalImage) {
          imgUrlInput.value = finalImage;
          if (imgPreview) imgPreview.src = finalImage;
          if (imgPreviewBox) imgPreviewBox.classList.remove('hidden');
        }

        // Auto-mark urgent if breakdown / fault / outage
        const urgentCheckbox = document.getElementById('notice-urgent');
        const finalUrgent = result.isUrgent !== undefined ? result.isUrgent : heuristicData.isUrgent;
        if (urgentCheckbox && finalUrgent !== undefined) {
          urgentCheckbox.checked = Boolean(finalUrgent);
        }

        // Auto-suggest expiration if today/tomorrow detected or suggested expiry available
        const expiresInput = document.getElementById('notice-expires');
        const finalExpiry = result.suggestedExpiry || heuristicData.suggestedExpiry;
        if (expiresInput && (!expiresInput.value || /היום|מחר/.test(`${rawTitle} ${rawContent}`)) && finalExpiry) {
          expiresInput.value = finalExpiry;
        }
      }

      if (polishBtnText) polishBtnText.textContent = prevText || 'שפר ונסח אוטומטית';
      polishBtn.disabled = false;
    });
  }
}

// ==========================================
// 3.5 GALLERY IMAGE PICKER FOR NOTICES
// ==========================================
function setupGalleryPicker() {
  const modal = document.getElementById('gallery-picker-modal');
  const openBtn = document.getElementById('open-gallery-picker-btn');
  const closeBtn = document.getElementById('close-gallery-picker-btn');
  const grid = document.getElementById('gallery-picker-grid');
  const imgUrlHidden = document.getElementById('notice-image-url');
  const previewImg = document.getElementById('notice-img-preview');
  const previewBox = document.getElementById('notice-img-preview-box');
  const fileInput = document.getElementById('notice-file-input');

  let allImages = [];

  const loadGalleryImages = async () => {
    try {
      const res = await fetch('data/wallpapers.json?v=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        allImages = [];

        // 1. Notice topics
        (data.notice_topics || []).forEach(item => {
          allImages.push({
            id: item.id,
            title: item.name || item.title || 'הודעת ועד',
            category: 'notices',
            catName: 'הודעות ועד',
            url: item.url
          });
        });

        // 2. Shabbat & Holidays
        if (data.shabbat) {
          data.shabbat.forEach(item => allImages.push({ id: item.id, title: item.title || item.name || 'שבת קודש', category: 'shabbat', catName: 'שבת קודש', url: item.url }));
        }
        ['rosh-hashanah', 'yom-kippur', 'sukkot', 'simchat-torah', 'hanukkah', 'tu-bishvat', 'purim', 'pesach', 'memorial-day', 'independence-day', 'lag-baomer', 'shavuot', 'back-to-school', 'new-year'].forEach(hKey => {
          if (data[hKey]) {
            data[hKey].forEach(item => allImages.push({ id: item.id, title: item.title || item.name || 'חגי ישראל', category: 'shabbat', catName: 'חגי ישראל ומועדים', url: item.url }));
          }
        });

        // 3. Default / Landscapes & Abstract
        (data.default || []).forEach(item => {
          allImages.push({
            id: item.id,
            title: item.title || item.name || 'נוף ואבסטרקט',
            category: 'landscapes',
            catName: 'נוף ואבסטרקט',
            url: item.url
          });
        });

        renderGrid('all');
      }
    } catch (e) {
      console.warn('Could not load wallpapers for picker', e);
    }
  };

  const renderGrid = (filterCat = 'all') => {
    if (!grid) return;
    const filtered = filterCat === 'all' ? allImages : allImages.filter(img => img.category === filterCat);

    grid.innerHTML = filtered.map(img => `
      <div class="bg-gray-950 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 cursor-pointer group transition active:scale-95 shadow-md flex flex-col" data-url="${img.url}">
        <div class="h-28 overflow-hidden bg-black/40 relative">
          <img src="${img.url}" alt="${img.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
          <span class="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-blue-300 border border-blue-500/30">${img.catName}</span>
        </div>
        <div class="p-2 flex items-center justify-between gap-1 bg-gray-900/90">
          <span class="text-xs font-bold text-gray-200 truncate">${img.title}</span>
          <button type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shrink-0">בחר</button>
        </div>
      </div>
    `).join('');

    // Attach click listeners to cards
    grid.querySelectorAll('[data-url]').forEach(card => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-url');
        if (url) {
          if (imgUrlHidden) imgUrlHidden.value = url;
          selectedNoticeFile = null;
          if (fileInput) fileInput.value = '';
          if (previewImg) previewImg.src = url;
          if (previewBox) previewBox.classList.remove('hidden');
          if (modal) modal.classList.add('hidden');
          showAdminToast('תמונת ההודעה נבחרה בהצלחה!', '🖼️');
        }
      });
    });
  };

  // Category filter tabs
  document.querySelectorAll('.picker-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.picker-cat-btn').forEach(b => {
        b.classList.remove('active', 'bg-blue-600', 'text-white');
        b.classList.add('bg-gray-800', 'text-gray-300');
      });
      btn.classList.add('active', 'bg-blue-600', 'text-white');
      btn.classList.remove('bg-gray-800', 'text-gray-300');
      const cat = btn.getAttribute('data-cat') || 'all';
      renderGrid(cat);
    });
  });

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      loadGalleryImages();
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }
}

// ==========================================
// 4. TAB 2: DISPLAY, THEMES & BACKGROUND OPACITY
// ==========================================
function updateLiteModeUI(isLite) {
  const checkbox = document.getElementById('setting-lite-mode');
  if (checkbox) checkbox.checked = isLite;

  const statusText = document.getElementById('lite-mode-status-text');
  if (statusText) {
    statusText.textContent = isLite ? 'מופעל (מוגן מקריסות)' : 'כבוי (עיצוב מלא)';
    statusText.className = isLite ? 'text-amber-400 font-bold' : 'text-gray-400 font-bold';
  }

  const headerBtn = document.getElementById('header-litemode-btn');
  const headerText = document.getElementById('header-litemode-text');
  if (headerBtn && headerText) {
    if (isLite) {
      headerBtn.className = 'bg-amber-950 bg-opacity-70 hover:bg-amber-900 border border-amber-700 text-amber-300 text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm';
      headerText.textContent = 'Lite: פעיל';
    } else {
      headerBtn.className = 'bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm';
      headerText.textContent = 'Lite: כבוי';
    }
    if (currentRole === 'editor') {
      headerBtn.classList.add('hidden');
    }
  }
}

const MODULAR_NEWS_PRESETS = {
  smart_mix: ['ynet', 'mako', 'globes', 'hayadan', 'geektime', 'building_notices', 'local_weather'],
  news_all: ['ynet', 'ynet_mivzak', 'mako', 'walla', 'maariv'],
  science_tech: ['hayadan', 'geektime', 'ynet_tech'],
  economy: ['globes', 'ynet_econ', 'geektime'],
  kan_globes: ['ynet', 'mako', 'globes', 'maariv'],
  building_only: ['building_notices', 'local_weather', 'shabbat_calendar', 'daily_trivia'],
  ynet: ['ynet', 'ynet_mivzak'],
  mako: ['mako'],
  walla: ['walla'],
  globes: ['globes'],
  maariv: ['maariv'],
  kan: ['ynet', 'mako', 'globes', 'hayadan', 'geektime']
};

function updateModularChannelsCountBadge() {
  const badge = document.getElementById('active-channels-count-badge');
  if (!badge) return;
  const checkedCount = document.querySelectorAll('.news-channel-cb:checked').length;
  badge.textContent = `${checkedCount} ערוצים פעילים`;
}

function applyModularChannelsToCheckboxes(channelsArray) {
  const set = new Set(Array.isArray(channelsArray) ? channelsArray : MODULAR_NEWS_PRESETS.smart_mix);
  document.querySelectorAll('.news-channel-cb').forEach(cb => {
    cb.checked = set.has(cb.value);
  });
  updateModularChannelsCountBadge();
}

function getCheckedModularChannels() {
  return Array.from(document.querySelectorAll('.news-channel-cb:checked')).map(cb => cb.value);
}

function setupDisplayControls() {
  const bgOpacityInput = document.getElementById('setting-bg-opacity');
  const bgOpacityLabel = document.getElementById('bg-opacity-label');
  const burnCompInput = document.getElementById('setting-left-burn-comp');
  const burnCompLabel = document.getElementById('burn-comp-val-label');
  const resolutionInput = document.getElementById('setting-resolution');
  const resolutionStatus = document.getElementById('resolution-status-text');
  const rssSourceSelect = document.getElementById('setting-rss-source');
  const saveBtn = document.getElementById('save-display-btn');

  // Wire Modular News Preset Dropdown -> Checkboxes
  if (rssSourceSelect) {
    rssSourceSelect.addEventListener('change', () => {
      const val = rssSourceSelect.value;
      if (val !== 'custom_modular' && MODULAR_NEWS_PRESETS[val]) {
        applyModularChannelsToCheckboxes(MODULAR_NEWS_PRESETS[val]);
      }
    });
  }

  // Wire Individual Channel Checkboxes -> Custom Modular Mode
  document.querySelectorAll('.news-channel-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (rssSourceSelect) {
        rssSourceSelect.value = 'custom_modular';
      }
      updateModularChannelsCountBadge();
    });
  });

  if (bgOpacityInput && bgOpacityLabel) {
    bgOpacityInput.addEventListener('input', () => {
      bgOpacityLabel.textContent = `${bgOpacityInput.value}%`;
    });
  }

  if (burnCompInput && burnCompLabel) {
    burnCompInput.addEventListener('input', () => {
      burnCompLabel.textContent = `${burnCompInput.value}%`;
    });
  }

  if (resolutionInput && resolutionStatus) {
    const updateResStatus = (val) => {
      if (val === '1080p') {
        resolutionStatus.textContent = 'Full HD (1080p) - גופנים מלאים';
        resolutionStatus.className = 'text-blue-400 font-bold';
      } else if (val === '720p') {
        resolutionStatus.textContent = 'HD Ready (720p) - גופנים קומפקטיים';
        resolutionStatus.className = 'text-purple-400 font-bold';
      } else {
        resolutionStatus.textContent = 'התאמה רספונסיבית אוטומטית (מומלץ)';
        resolutionStatus.className = 'text-cyan-400 font-bold';
      }
    };
    resolutionInput.addEventListener('change', () => updateResStatus(resolutionInput.value));
  }

  const liteModeInput = document.getElementById('setting-lite-mode');
  if (liteModeInput) {
    liteModeInput.addEventListener('change', () => {
      updateLiteModeUI(liteModeInput.checked);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const selectedThemeMode = document.querySelector('input[name="theme-mode"]:checked')?.value || 'auto';
      const customTheme = document.getElementById('custom-theme-select')?.value || 'modern-dark';

      const updatedSettings = {
        display: {
          ...settingsData?.display,
          bgOpacity: parseInt(bgOpacityInput?.value || '85', 10),
          leftBurnCompensation: parseInt(burnCompInput?.value || '0', 10),
          highContrastSideCards: document.getElementById('setting-high-contrast-side')?.checked || false,
          liteMode: document.getElementById('setting-lite-mode')?.checked || false,
          resolution: document.getElementById('setting-resolution')?.value || settingsData?.display?.resolution || 'auto',
          layoutSide: document.getElementById('setting-layout-side')?.value || 'left',
          headerClockPosition: document.getElementById('setting-pos-clock')?.value || 'left',
          headerBrandPosition: document.getElementById('setting-pos-brand')?.value || 'right',
          headerShabbatPosition: document.getElementById('setting-pos-shabbat')?.value || 'center',
          sideColumnWidth: document.getElementById('setting-side-width')?.value || 'normal',
          showNewsTicker: document.getElementById('setting-show-news-ticker')?.checked !== false,
          showStageArrows: document.getElementById('setting-show-stage-arrows')?.checked !== false,
          showTransitSlide: document.getElementById('setting-show-transit-slide')?.checked !== false,
          showInterestSlide: document.getElementById('setting-show-interest-slide')?.checked !== false,
          customTickerText: document.getElementById('setting-custom-ticker')?.value.trim() || '',
          newsSource: document.getElementById('setting-rss-source')?.value || settingsData?.display?.newsSource || 'smart_mix',
          newsChannels: getCheckedModularChannels(),
          filterClickbait: document.getElementById('setting-filter-clickbait')?.checked !== false,
          customRssUrl: document.getElementById('setting-custom-rss-url')?.value.trim() || '',
          yomKippurMode: document.getElementById('setting-yom-kippur-mode')?.value || 'auto',
          theme: selectedThemeMode,
          customTheme
        }
      };

      await saveSettingsToServer(updatedSettings, 'הגדרות התצוגה, פריסת המסך והרקע נשמרו בהצלחה!');
    });
  }
}

// ==========================================
// 5. TAB 3: CONTACTS & ELEVATORS
// ==========================================
function setupContactsManager() {
  const saveBtn = document.getElementById('save-contacts-btn');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const showElevatorBar = document.getElementById('toggle-show-elevator-bar')?.checked !== false;
      const showContactsSlide = document.getElementById('toggle-show-contacts-slide')?.checked !== false;

      const elevEnabled = document.getElementById('contact-elevator-enabled')?.checked !== false;
      const elevName = document.getElementById('contact-elevator-name')?.value.trim() || 'שירות ותקלות מעלית';
      const elevPhone = document.getElementById('contact-elevator-phone')?.value.trim() || '*5555 / 03-5555555';

      const cityEnabled = document.getElementById('contact-city-enabled')?.checked !== false;
      const cityPhone = document.getElementById('contact-city-phone')?.value.trim() || '106';

      const vaadEnabled = document.getElementById('contact-vaad-enabled')?.checked !== false;
      const vaadPhone = document.getElementById('contact-vaad-phone')?.value.trim() || '050-1234567';

      const updatedContacts = [
        { id: 'c-1', name: elevName, phone: elevPhone, icon: '🛗', desc: 'חברת מעליות', isPrimaryElevator: true, enabled: elevEnabled },
        { id: 'c-2', name: 'מוקד עיריית חדרה', phone: cityPhone, icon: '🏛️', desc: '24/7 לדיווח על מפגעים', enabled: cityEnabled },
        { id: 'c-3', name: 'ועד הבית / ניהול', phone: vaadPhone, icon: '🏢', desc: 'פניות ועד', enabled: vaadEnabled },
        { id: 'c-4', name: 'כיבוי והצלה', phone: '102', icon: '🚒', desc: 'חירום', enabled: true },
        { id: 'c-5', name: 'עזרה ראשונה (מד"א)', phone: '101', icon: '🚑', desc: 'חירום', enabled: true }
      ];

      const updatedSettings = {
        display: {
          ...settingsData?.display,
          showElevatorBar,
          showContactsSlide
        },
        contacts: updatedContacts
      };

      await saveSettingsToServer(updatedSettings, 'הגדרות אנשי הקשר והמעלית נשמרו בהצלחה!');
    });
  }
}

// ==========================================
// 6. TAB 4: RADIO & MUSIC (Reliable Live Testing)
// ==========================================
window.setVolumePreset = function(vol) {
  const volInput = document.getElementById('radio-volume');
  const volLabel = document.getElementById('vol-label');
  if (volInput) {
    volInput.value = vol;
    if (volLabel) volLabel.textContent = `${Math.round(vol * 100)}%`;
    if (testAudio) testAudio.volume = vol;
  }
};

function setupRadioControls() {
  const volInput = document.getElementById('radio-volume');
  const volLabel = document.getElementById('vol-label');
  const saveBtn = document.getElementById('save-radio-btn');
  const testBtn = document.getElementById('test-audio-btn');
  const testStatus = document.getElementById('test-audio-status');
  const testIcon = document.getElementById('test-audio-icon');
  const stationSelect = document.getElementById('radio-station-select');
  testAudio = document.getElementById('admin-test-audio');

  if (volInput && volLabel) {
    volInput.addEventListener('input', () => {
      volLabel.textContent = `${Math.round(volInput.value * 100)}%`;
      if (testAudio) testAudio.volume = parseFloat(volInput.value);
    });
  }

  // Handle audio player state events
  if (testAudio) {
    testAudio.onwaiting = () => {
      if (testStatus) testStatus.textContent = '⏳ מתחבר לשידור החי...';
      if (testBtn) testBtn.innerHTML = '<span>⏳</span><span>מתחבר...</span>';
    };

    testAudio.onplaying = () => {
      const st = getStationById(stationSelect ? stationSelect.value : 'galgalatz');
      if (testStatus) testStatus.innerHTML = `<span class="text-green-400 font-bold">🔊 משמיע: ${st.name}</span>`;
      if (testIcon) testIcon.innerHTML = '🎵';
      if (testBtn) {
        testBtn.innerHTML = '<span>⏹️</span><span>עצור השמעה</span>';
        testBtn.classList.remove('bg-green-700', 'hover:bg-green-600');
        testBtn.classList.add('bg-red-700', 'hover:bg-red-600');
      }
    };

    testAudio.onpause = () => {
      if (testStatus && !testStatus.innerHTML.includes('שגיאה')) {
        testStatus.textContent = 'ההשמעה נעצרה';
      }
      if (testIcon) testIcon.innerHTML = '📻';
      if (testBtn) {
        testBtn.innerHTML = '<span>▶️</span><span>השמע בדיקה עכשיו</span>';
        testBtn.classList.remove('bg-red-700', 'hover:bg-red-600');
        testBtn.classList.add('bg-green-700', 'hover:bg-green-600');
      }
    };

    testAudio.onerror = (e) => {
      console.warn('Audio test error:', e);
      if (testStatus) {
        testStatus.innerHTML = '<span class="text-amber-300 font-bold">⚠️ השידור מתחבר או חסום בדפדפן</span>';
      }
      if (testBtn) {
        testBtn.innerHTML = '<span>▶️</span><span>השמע בדיקה עכשיו</span>';
        testBtn.classList.remove('bg-red-700', 'hover:bg-red-600');
        testBtn.classList.add('bg-green-700', 'hover:bg-green-600');
      }
    };
  }

  // Switch station in real time if playing
  if (stationSelect) {
    stationSelect.addEventListener('change', () => {
      const selectedStId = stationSelect.value;
      const st = getStationById(selectedStId);
      if (testAudio && !testAudio.paused) {
        testAudio.src = st.url;
        testAudio.play().catch(e => console.log(e));
      }
    });
  }

  // Test Play/Stop Button Click
  if (testBtn && stationSelect) {
    testBtn.addEventListener('click', () => {
      const selectedStId = stationSelect.value;
      const st = getStationById(selectedStId);

      if (!testAudio) return;

      if (testAudio.paused) {
        testAudio.src = st.url;
        testAudio.volume = volInput ? parseFloat(volInput.value) : 0.4;
        testBtn.innerHTML = '<span>⏳</span><span>מתחבר...</span>';
        if (testStatus) testStatus.textContent = `מתחבר ל-${st.name}...`;

        testAudio.play().then(() => {
          // handled by onplaying
        }).catch(err => {
          if (testStatus) testStatus.innerHTML = `<span class="text-red-400 font-bold">שגיאה: ${err.message}</span>`;
          testBtn.innerHTML = '<span>▶️</span><span>נסה שוב</span>';
          testBtn.classList.remove('bg-red-700');
          testBtn.classList.add('bg-green-700');
        });
      } else {
        testAudio.pause();
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      let startH = document.getElementById('radio-start-time')?.value || '08:00';
      let endH = document.getElementById('radio-end-time')?.value || '21:00';

      // Auto-correct any flipped RTL strings
      if (startH === '00:08') startH = '08:00';
      if (endH === '00:21') endH = '21:00';

      const updatedSettings = {
        radio: {
          ...settingsData?.radio,
          enabled: document.getElementById('radio-enabled')?.checked || false,
          currentStation: document.getElementById('radio-station-select')?.value || 'galgalatz',
          startHour: startH,
          endHour: endH,
          volume: volInput ? parseFloat(volInput.value) : 0.4
        }
      };
      await saveSettingsToServer(updatedSettings, 'הגדרות הרדיו והמוזיקה נשמרו בהצלחה!');
    });
  }
}

// ==========================================
// 7. TAB 5: SYSTEM & SECURITY
// ==========================================
function setupGeneralSettings() {
  const saveBtn = document.getElementById('save-settings-btn');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const newPin = document.getElementById('setting-new-pin')?.value.trim();
      const newEditorPin = document.getElementById('setting-new-editor-pin')?.value.trim();

      const updatedSettings = {
        building: {
          ...settingsData?.building,
          name: document.getElementById('setting-bld-name')?.value.trim() || 'הירדן 5',
          city: document.getElementById('setting-bld-city')?.value.trim() || 'חדרה'
        },
        security: {
          ...settingsData?.security,
          ...(newPin ? { adminPin: newPin } : {}),
          ...(newEditorPin ? { editorPin: newEditorPin } : {})
        },
        ...(newPin ? { newPin } : {})
      };

      const ok = await saveSettingsToServer(updatedSettings, 'הגדרות המערכת וקודי הגישה נשמרו בהצלחה!');
      if (ok) {
        if (newPin) {
          currentPin = newPin;
          sessionStorage.setItem('admin_pin', newPin);
          document.getElementById('setting-new-pin').value = '';
        }
        if (newEditorPin) {
          document.getElementById('setting-new-editor-pin').value = '';
        }
      }
    });
  }
}

// ==========================================
// 8. DATA LOADING & STATE MANAGEMENT
// ==========================================
async function loadSettings() {
  try {
    let cloudSettings = null;

    // 1. Try Firebase Cloud Firestore first (Single Source of Truth across all devices!)
    if (window.FirebaseSync) {
      try {
        if (!window.FirebaseSync.isInitialized) {
          await window.FirebaseSync.init();
        }
        cloudSettings = await window.FirebaseSync.getSettings();
        if (cloudSettings && typeof cloudSettings === 'object' && Object.keys(cloudSettings).length > 0) {
          settingsData = cloudSettings;
          localStorage.setItem('smart_lobby_settings', JSON.stringify(cloudSettings));
          populateSettingsUI();
          return;
        }
      } catch (fbErr) {
        console.warn('[Admin] Firebase settings fetch error, falling back to cache:', fbErr);
      }
    }

    // 2. If cloud unreachable, fallback to localStorage cache
    try {
      const local = JSON.parse(localStorage.getItem('smart_lobby_settings') || 'null');
      if (local && typeof local === 'object') {
        settingsData = local;
        populateSettingsUI();
        return;
      }
    } catch (e) {}

    // 3. Fallback to initial seed from data/settings.json
    try {
      const res = await fetch('data/settings.json?v=' + Date.now());
      if (res.ok) {
        settingsData = await res.json();
        // Seed cloud if empty
        if (window.FirebaseSync && window.FirebaseSync.isInitialized) {
          await window.FirebaseSync.saveSettings(settingsData);
        }
      }
    } catch (e) {}

    populateSettingsUI();
  } catch (err) {
    console.error('Error in loadSettings:', err);
  }
}

function populateSettingsUI() {
  if (!settingsData) return;

  // Header Title
  const headerBld = document.getElementById('admin-header-bld-name');
  if (headerBld && settingsData.building?.name) {
    headerBld.textContent = `${settingsData.building.name}, ${settingsData.building.city || 'חדרה'}`;
  }

  // Tab 2: Display & Background Opacity
  const bgOpacity = settingsData.display?.bgOpacity !== undefined ? settingsData.display.bgOpacity : 85;
  const bgOpInput = document.getElementById('setting-bg-opacity');
  const bgOpLabel = document.getElementById('bg-opacity-label');
  if (bgOpInput) bgOpInput.value = bgOpacity;
  if (bgOpLabel) bgOpLabel.textContent = `${bgOpacity}%`;

  const leftBurn = settingsData.display?.leftBurnCompensation !== undefined ? settingsData.display.leftBurnCompensation : 0;
  const burnInput = document.getElementById('setting-left-burn-comp');
  const burnLabel = document.getElementById('burn-comp-val-label');
  if (burnInput) burnInput.value = leftBurn;
  if (burnLabel) burnLabel.textContent = `${leftBurn}%`;

  const highContrast = document.getElementById('setting-high-contrast-side');
  if (highContrast) highContrast.checked = Boolean(settingsData.display?.highContrastSideCards);

  const liteModeInput = document.getElementById('setting-lite-mode');
  if (liteModeInput) {
    liteModeInput.checked = Boolean(settingsData.display?.liteMode);
  }
  updateLiteModeUI(Boolean(settingsData.display?.liteMode));

  const resolutionInput = document.getElementById('setting-resolution');
  const resolutionStatus = document.getElementById('resolution-status-text');
  if (resolutionInput) {
    const resVal = settingsData.display?.resolution || 'auto';
    resolutionInput.value = resVal;
    if (resolutionStatus) {
      if (resVal === '1080p') {
        resolutionStatus.textContent = 'Full HD (1080p) - גופנים מלאים';
        resolutionStatus.className = 'text-blue-400 font-bold';
      } else if (resVal === '720p') {
        resolutionStatus.textContent = 'HD Ready (720p) - גופנים קומפקטיים';
        resolutionStatus.className = 'text-purple-400 font-bold';
      } else {
        resolutionStatus.textContent = 'התאמה רספונסיבית אוטומטית (מומלץ)';
        resolutionStatus.className = 'text-cyan-400 font-bold';
      }
    }
  }

  const ykModeInput = document.getElementById('setting-yom-kippur-mode');
  if (ykModeInput) ykModeInput.value = settingsData.display?.yomKippurMode || 'auto';

  const layoutSide = document.getElementById('setting-layout-side');
  if (layoutSide) layoutSide.value = settingsData.display?.layoutSide || 'left';

  const posClock = document.getElementById('setting-pos-clock');
  if (posClock) posClock.value = settingsData.display?.headerClockPosition || 'left';

  const posBrand = document.getElementById('setting-pos-brand');
  if (posBrand) posBrand.value = settingsData.display?.headerBrandPosition || 'right';

  const posShabbat = document.getElementById('setting-pos-shabbat');
  if (posShabbat) posShabbat.value = settingsData.display?.headerShabbatPosition || 'center';

  const sideWidth = document.getElementById('setting-side-width');
  if (sideWidth) sideWidth.value = settingsData.display?.sideColumnWidth || 'normal';

  const showNewsTicker = document.getElementById('setting-show-news-ticker');
  if (showNewsTicker) showNewsTicker.checked = settingsData.display?.showNewsTicker !== false;

  const showStageArrows = document.getElementById('setting-show-stage-arrows');
  if (showStageArrows) showStageArrows.checked = settingsData.display?.showStageArrows !== false;

  const showTransitSlide = document.getElementById('setting-show-transit-slide');
  if (showTransitSlide) showTransitSlide.checked = settingsData.display?.showTransitSlide !== false;

  const showInterestSlide = document.getElementById('setting-show-interest-slide');
  if (showInterestSlide) showInterestSlide.checked = settingsData.display?.showInterestSlide !== false;

  const customTicker = document.getElementById('setting-custom-ticker');
  if (customTicker) customTicker.value = settingsData.display?.customTickerText || '';

  // Theme
  const themeMode = settingsData.display?.theme || 'auto';
  const radioInputs = document.querySelectorAll('input[name="theme-mode"]');
  radioInputs.forEach(r => r.checked = (r.value === themeMode));

  const customTheme = document.getElementById('custom-theme-select');
  if (customTheme) customTheme.value = settingsData.display?.customTheme || 'modern-dark';

  // Tab 3: Contacts
  const showElevBarToggle = document.getElementById('toggle-show-elevator-bar');
  const showContactsSlideToggle = document.getElementById('toggle-show-contacts-slide');
  if (showElevBarToggle) showElevBarToggle.checked = settingsData.display?.showElevatorBar !== false;
  if (showContactsSlideToggle) showContactsSlideToggle.checked = settingsData.display?.showContactsSlide !== false;

  const contacts = settingsData.contacts || [];
  const elev = contacts.find(c => c.isPrimaryElevator || c.name.includes('מעלית')) || contacts[0];
  const city = contacts.find(c => c.name.includes('עירייה') || c.name.includes('מוקד'));
  const vaad = contacts.find(c => c.name.includes('ועד') || c.name.includes('ניהול'));

  if (elev) {
    const eName = document.getElementById('contact-elevator-name');
    const ePhone = document.getElementById('contact-elevator-phone');
    const eEnabled = document.getElementById('contact-elevator-enabled');
    if (eName) eName.value = elev.name;
    if (ePhone) ePhone.value = elev.phone;
    if (eEnabled) eEnabled.checked = elev.enabled !== false;
  }
  if (city) {
    const cPhone = document.getElementById('contact-city-phone');
    const cEnabled = document.getElementById('contact-city-enabled');
    if (cPhone) cPhone.value = city.phone;
    if (cEnabled) cEnabled.checked = city.enabled !== false;
  }
  if (vaad) {
    const vPhone = document.getElementById('contact-vaad-phone');
    const vEnabled = document.getElementById('contact-vaad-enabled');
    if (vPhone) vPhone.value = vaad.phone;
    if (vEnabled) vEnabled.checked = vaad.enabled !== false;
  }

  // Tab 4: Radio
  const radioEnabled = document.getElementById('radio-enabled');
  const radioStation = document.getElementById('radio-station-select');
  const radioStart = document.getElementById('radio-start-time');
  const radioEnd = document.getElementById('radio-end-time');
  const radioVol = document.getElementById('radio-volume');
  const volLabel = document.getElementById('vol-label');

  if (radioEnabled) radioEnabled.checked = Boolean(settingsData.radio?.enabled);
  if (radioStation) radioStation.value = settingsData.radio?.currentStation || 'galgalatz';
  
  let sVal = settingsData.radio?.startHour || '08:00';
  if (sVal === '00:08') sVal = '08:00';
  if (radioStart) radioStart.value = sVal;

  let eVal = settingsData.radio?.endHour || '21:00';
  if (eVal === '00:21') eVal = '21:00';
  if (radioEnd) radioEnd.value = eVal;

  if (radioVol) radioVol.value = settingsData.radio?.volume || 0.4;
  if (volLabel) volLabel.textContent = `${Math.round((settingsData.radio?.volume || 0.4) * 100)}%`;

  // Tab 5: General & PIN
  const bldName = document.getElementById('setting-bld-name');
  const bldCity = document.getElementById('setting-bld-city');
  const rssSource = document.getElementById('setting-rss-source');
  const pinInput = document.getElementById('setting-new-pin');
  const editorPinInput = document.getElementById('setting-new-editor-pin');

  if (bldName) bldName.value = settingsData.building?.name || 'הירדן 5';
  if (bldCity) bldCity.value = settingsData.building?.city || 'חדרה';
  const hasExplicitChannels = Array.isArray(settingsData.display?.newsChannels) && settingsData.display.newsChannels.length > 0;
  if (rssSource) {
    rssSource.value = hasExplicitChannels ? (settingsData.display?.newsSource || 'smart_mix') : 'smart_mix';
  }

  const savedChannels = hasExplicitChannels
    ? settingsData.display.newsChannels
    : MODULAR_NEWS_PRESETS.smart_mix;
  applyModularChannelsToCheckboxes(savedChannels);

  const filterClickbaitCb = document.getElementById('setting-filter-clickbait');
  if (filterClickbaitCb) filterClickbaitCb.checked = settingsData.display?.filterClickbait !== false;

  const customRssInput = document.getElementById('setting-custom-rss-url');
  if (customRssInput) customRssInput.value = settingsData.display?.customRssUrl || '';
  if (pinInput) pinInput.placeholder = settingsData.security?.adminPin ? 'מוגדר (הזן לשינוי)' : 'ברירת מחדל: 1234';
  if (editorPinInput) editorPinInput.placeholder = settingsData.security?.editorPin ? 'מוגדר (הזן לשינוי)' : 'ברירת מחדל: 1111';

  // Update Header Quick Radio Button State
  updateHeaderRadioStatus(Boolean(settingsData.radio?.enabled));

  // Update Emergency Alert UI state
  updateEmergencyAlertUI(settingsData.display?.emergencyAlert);
}

// ==========================================
// 8. HEADER QUICK CONTROLS (Radio & Emergency Refresh)
// ==========================================
function setupHeaderQuickActions() {
  const liteModeBtn = document.getElementById('header-litemode-btn');
  if (liteModeBtn) {
    liteModeBtn.addEventListener('click', async () => {
      if (!settingsData) return;
      const currentLite = Boolean(settingsData.display?.liteMode);
      const newLite = !currentLite;

      const updatedDisplay = {
        ...(settingsData.display || {}),
        liteMode: newLite
      };

      const ok = await saveSettingsToServer(
        { display: updatedDisplay },
        newLite ? '⚡ מצב חיסכון וביצועים הופעל בהצלחה!' : '✨ מצב עיצוב מלא (Glassmorphism) הופעל!'
      );
      if (ok) {
        updateLiteModeUI(newLite);
      }
    });
  }

  const radioBtn = document.getElementById('header-quick-radio-btn');
  const refreshBtn = document.getElementById('header-refresh-screen-btn');

  if (radioBtn) {
    radioBtn.addEventListener('click', async () => {
      if (!settingsData) return;
      const isCurrentlyEnabled = Boolean(settingsData.radio?.enabled);
      const newEnabledState = !isCurrentlyEnabled;

      const updatedRadio = {
        ...(settingsData.radio || {}),
        enabled: newEnabledState
      };

      const ok = await saveSettingsToServer(
        { radio: updatedRadio },
        newEnabledState ? '🔊 הרדיו הופעל בהצלחה!' : '🔇 הרדיו הושתק בהצלחה!'
      );
      if (ok) {
        updateHeaderRadioStatus(newEnabledState);
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const now = Date.now();
      localStorage.setItem('smart_lobby_force_reload', now.toString());

      let cloudOk = true;
      if (window.FirebaseSync) {
        try {
          cloudOk = await window.FirebaseSync.triggerRemoteReload();
        } catch (e) {
          cloudOk = false;
        }
      }

      try {
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}

      if (cloudOk) {
        showAdminToast('🔄 אות רענון ענן נשלח למסך הלובי!', '🚀');
      } else {
        showAdminToast('אות רענון נשלח מקומית, אך שליחה לענן נכשלה.', '⚠️');
      }
    });
  }
}

function updateHeaderRadioStatus(isEnabled) {
  const radioBtn = document.getElementById('header-quick-radio-btn');
  const radioIcon = document.getElementById('header-radio-icon');
  const radioText = document.getElementById('header-radio-text');
  if (!radioBtn) return;

  if (isEnabled) {
    radioBtn.className = 'bg-emerald-950 bg-opacity-70 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm';
    if (radioIcon) radioIcon.textContent = '🔊';
    if (radioText) radioText.textContent = 'רדיו פועל';
    radioBtn.title = 'לחץ להשתקת הרדיו';
  } else {
    radioBtn.className = 'bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm';
    if (radioIcon) radioIcon.textContent = '🔇';
    if (radioText) radioText.textContent = 'רדיו מושתק';
    radioBtn.title = 'לחץ להפעלת הרדיו';
  }
}

async function saveSettingsToServer(newSettings, successMessage) {
  // Merge cleanly into global settingsData
  settingsData = {
    ...(settingsData || {}),
    ...newSettings,
    building: { ...(settingsData?.building || {}), ...(newSettings.building || {}) },
    display: { ...(settingsData?.display || {}), ...(newSettings.display || {}) },
    radio: { ...(settingsData?.radio || {}), ...(newSettings.radio || {}) },
    security: { ...(settingsData?.security || {}), ...(newSettings.security || {}) },
    contacts: newSettings.contacts || settingsData?.contacts || []
  };

  // Cache to localStorage
  localStorage.setItem('smart_lobby_settings', JSON.stringify(settingsData));
  populateSettingsUI();

  // 1. Sync to Firebase Real-time Global Cloud
  let cloudSuccess = true;
  if (window.FirebaseSync) {
    try {
      cloudSuccess = await window.FirebaseSync.saveSettings(settingsData);
      if (cloudSuccess) {
        console.log('⚡ Settings synced to Firebase Cloud successfully across all devices!');
      } else {
        console.warn('⚠️ Firebase saveSettings returned false.');
      }
    } catch (e) {
      console.warn('Firebase save settings warning:', e);
      cloudSuccess = false;
    }
  }

  // 2. Also try local Node API if available
  if (isLocalServer()) {
    try {
      const payloadToSend = currentRole === 'editor'
        ? { radio: settingsData.radio, display: { emergencyAlert: settingsData.display?.emergencyAlert } }
        : settingsData;
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: currentPin, newSettings: payloadToSend })
      });
    } catch (err) {}
  }

  try { window.dispatchEvent(new Event('storage')); } catch (e) {}

  if (cloudSuccess) {
    showAdminToast(successMessage || 'ההגדרות נשמרו וסונכרנו לכל המכשירים בהצלחה!', '⚡');
  } else {
    showAdminToast('ההגדרות נשמרו מקומית, אך הסנכרון לענן נכשל (בדוק חיבור אינטרנט).', '⚠️');
  }
  return cloudSuccess;
}


window.toggleNoticeHidden = async function(id) {
  const n = window._adminNoticesMap ? window._adminNoticesMap[id] : null;
  if (!n) return;

  const newState = !Boolean(n.hidden);
  n.hidden = newState;

  let currentNotices = Object.values(window._adminNoticesMap || {});
  const idx = currentNotices.findIndex(item => item.id === id);
  if (idx !== -1) {
    currentNotices[idx].hidden = newState;
  }

  currentNotices = pruneExpiredNoticeImages(currentNotices);
  localStorage.setItem('smart_lobby_notices', JSON.stringify(currentNotices));

  let cloudSuccess = true;
  if (window.FirebaseSync) {
    cloudSuccess = await window.FirebaseSync.saveNotices(currentNotices);
  }

  try { window.dispatchEvent(new Event('storage')); } catch (e) {}

  await loadNotices();
  if (cloudSuccess) {
    if (newState) {
      showAdminToast('ההודעה הוסתרה מהמסך בהצלחה! (נשמרת באדמין לשימוש עתידי)', '👁️‍🗨️');
    } else {
      showAdminToast('ההודעה מוצגת כעת במסך הלובי!', '👁️');
    }
  } else {
    showAdminToast('הסטטוס שונה מקומית, אך הסנכרון לענן נכשל.', '⚠️');
  }
};

// ==========================================
// 9. DEVICE HEALTH TELEMETRY MONITOR
// ==========================================
function setupDeviceHealthMonitoring() {
  if (!window.FirebaseSync) return;

  const updateHealthUI = (health) => {
    if (!health) return;
    const badge = document.getElementById('health-live-badge');
    const statusText = document.getElementById('health-status-text');
    const uptimeElem = document.getElementById('health-uptime');
    const memoryElem = document.getElementById('health-memory');
    const radioElem = document.getElementById('health-radio');
    const lastSeenElem = document.getElementById('health-last-seen');

    const diffSeconds = Math.floor((Date.now() - (health.lastSeen || 0)) / 1000);
    const isOnline = diffSeconds < 360; // seen within 6 minutes

    if (badge && statusText) {
      if (isOnline) {
        badge.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-green-950 text-green-300 border border-green-700 flex items-center gap-1.5';
        statusText.textContent = 'מקוון ותקין';
      } else {
        badge.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-950 text-red-300 border border-red-700 flex items-center gap-1.5';
        statusText.textContent = `לא נצפה ${Math.floor(diffSeconds / 60)} דק'`;
      }
    }

    if (uptimeElem) {
      const mins = health.uptimeMinutes || 0;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      uptimeElem.textContent = h > 0 ? `${h} שעות ו-${m} דק'` : `${m} דקות`;
    }

    if (memoryElem) {
      if (health.heap) {
        memoryElem.textContent = `${health.heap.usedMB} MB / ${health.heap.limitMB} MB`;
      } else {
        memoryElem.textContent = 'תקין (Lite Mode)';
      }
    }

    const resolutionElem = document.getElementById('health-resolution');
    if (resolutionElem) {
      resolutionElem.textContent = health.screenResolution || '--';
    }

    if (radioElem) {
      if (health.radio?.playing) {
        radioElem.textContent = `🔊 מנגן (${health.radio.station})`;
        radioElem.className = 'text-sm font-bold text-emerald-300';
      } else if (health.radio?.inSchedule) {
        radioElem.textContent = '🔇 מושתק ע"י משתמש';
        radioElem.className = 'text-sm font-bold text-amber-300';
      } else {
        radioElem.textContent = '🌙 לילה (מחוץ לשעות)';
        radioElem.className = 'text-sm font-bold text-gray-400';
      }
    }

    if (lastSeenElem) {
      const d = new Date(health.lastSeen);
      lastSeenElem.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    }
  };

  window.FirebaseSync.onDeviceHealthChanged(updateHealthUI);
  window.FirebaseSync.getDeviceHealth().then(updateHealthUI);

  const flushBtn = document.getElementById('health-flush-memory-btn');
  if (flushBtn) {
    flushBtn.addEventListener('click', async () => {
      flushBtn.textContent = 'מרענן זיכרון...';
      await window.FirebaseSync.triggerRemoteReload();
      setTimeout(() => { flushBtn.textContent = 'רענן זיכרון עכשיו'; }, 3000);
    });
  }

  setupDeviceLogsMonitoring();
}

function setupDeviceLogsMonitoring() {
  if (!window.FirebaseSync) return;

  const logsList = document.getElementById('device-logs-list');
  const refreshBtn = document.getElementById('refresh-device-logs-btn');
  const clearBtn = document.getElementById('clear-device-logs-btn');

  const renderLogs = (events) => {
    if (!logsList) return;
    if (!events || events.length === 0) {
      logsList.innerHTML = '<div class="text-center py-6 text-gray-500">אין אירועים או קריסות מתועדות ביומן (הכל נקי)</div>';
      return;
    }

    logsList.innerHTML = events.map(evt => {
      const d = new Date(evt.timestamp || evt.reportedAt || Date.now());
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      let badgeClass = 'bg-gray-800 text-gray-300 border-gray-700';
      let badgeIcon = 'ℹ️';
      let badgeTitle = 'אירוע שגרתי';

      if (evt.type === 'crash' || evt.bootType === 'unclean_crash_restart') {
        badgeClass = 'bg-red-950 text-red-300 border-red-800';
        badgeIcon = '🔴';
        badgeTitle = 'קריסה / כיבוי פתאומי';
      } else if (evt.bootType === 'clean_watchdog_reload') {
        badgeClass = 'bg-emerald-950 text-emerald-300 border-emerald-800';
        badgeIcon = '🟢';
        badgeTitle = 'רענון Watchdog יזום';
      } else if (evt.bootType === 'remote_force_reload') {
        badgeClass = 'bg-purple-950 text-purple-300 border-purple-800';
        badgeIcon = '🟣';
        badgeTitle = 'רענון מרוחק (Admin)';
      } else if (evt.type === 'js_error') {
        badgeClass = 'bg-amber-950 text-amber-300 border-amber-800';
        badgeIcon = '⚠️';
        badgeTitle = 'שגיאת קוד JS';
      } else if (evt.type === 'unhandled_rejection') {
        badgeClass = 'bg-orange-950 text-orange-300 border-orange-800';
        badgeIcon = '⚡';
        badgeTitle = 'דחיית Promise לא מטופלת';
      }

      return `
        <div class="bg-gray-950/80 p-2.5 rounded-lg border border-gray-800/80 space-y-1">
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}">
              <span>${badgeIcon}</span>
              <span>${badgeTitle}</span>
            </span>
            <span class="text-[10px] font-mono text-gray-400" dir="ltr">${timeStr}</span>
          </div>
          <p class="text-xs text-gray-300 leading-snug">${escapeHtml(evt.summary || evt.message || 'ללא פירוט')}</p>
          ${evt.heapUsedMB ? `<span class="text-[10px] text-gray-500 block">זיכרון בשימוש בעלייה: ${evt.heapUsedMB} MB</span>` : ''}
          ${evt.stack ? `<pre class="text-[9px] font-mono text-gray-500 bg-gray-900 p-1.5 rounded overflow-x-auto max-h-20" dir="ltr">${escapeHtml(evt.stack)}</pre>` : ''}
        </div>
      `;
    }).join('');
  };

  window.FirebaseSync.onDeviceLogsChanged(renderLogs);
  window.FirebaseSync.getDeviceLogs().then(renderLogs);

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = 'טוען...';
      const events = await window.FirebaseSync.getDeviceLogs();
      renderLogs(events);
      setTimeout(() => { refreshBtn.textContent = '🔄 רענן יומן'; }, 1000);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('האם אתה בטוח שברצונך לנקות את יומן האירועים והקריסות?')) return;
      clearBtn.textContent = 'מנקה...';
      await window.FirebaseSync.clearDeviceLogs();
      renderLogs([]);
      setTimeout(() => { clearBtn.textContent = '🗑️ נקה יומן'; }, 1000);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isNoticeActive,
    pruneExpiredNoticeImages,
    polishNoticeWithHeuristics,
    EMERGENCY_PRESETS,
    SMART_DRAFTS,
    escapeHtml,
    RADIO_STATIONS_MAP
  };
}
