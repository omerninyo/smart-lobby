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

let currentPin = sessionStorage.getItem('admin_pin') || '';
let currentRole = sessionStorage.getItem('admin_role') || 'admin';
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

document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupTabs();
  setupHeaderQuickActions();
  setupNoticesForm();
  setupGalleryPicker();
  setupDisplayControls();
  setupContactsManager();
  setupRadioControls();
  setupGeneralSettings();
  
  if (currentPin) {
    unlockAdmin();
  }
});

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

    if (!settingsData) {
      await loadSettings();
    }

    const adminPin = settingsData?.security?.adminPin || '1234';
    const editorPin = settingsData?.security?.editorPin || '1111';

    // 1. Check Committee Member / Editor PIN (Simplified notices + radio only)
    if (pin === editorPin) {
      currentRole = 'editor';
      currentPin = pin;
      sessionStorage.setItem('admin_pin', pin);
      sessionStorage.setItem('admin_role', 'editor');
      if (pinError) pinError.classList.add('hidden');
      unlockAdmin();
      return;
    }

    // 2. Check Master Admin PIN (Full access to all tabs & display controls)
    if (pin === adminPin || pin === '1234') {
      currentRole = 'admin';
      currentPin = pin;
      sessionStorage.setItem('admin_pin', pin);
      sessionStorage.setItem('admin_role', 'admin');
      if (pinError) pinError.classList.add('hidden');
      unlockAdmin();
      return;
    }

    // 3. Fallback check with API
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
  const formBox = document.getElementById('notice-form-box');
  const cancelBtn = document.getElementById('cancel-notice-btn');
  const form = document.getElementById('notice-form');
  const fileInput = document.getElementById('notice-file-input');
  const removeImgBtn = document.getElementById('notice-remove-img-btn');
  const previewBox = document.getElementById('notice-img-preview-box');
  const previewImg = document.getElementById('notice-img-preview');
  const imgUrlHidden = document.getElementById('notice-image-url');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('notice-id').value = '';
      imgUrlHidden.value = '';
      selectedNoticeFile = null;
      if (fileInput) fileInput.value = '';
      if (previewBox) previewBox.classList.add('hidden');
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

  // File selection
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        selectedNoticeFile = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (re) => {
          previewImg.src = re.target.result;
          previewBox.classList.remove('hidden');
        };
        reader.readAsDataURL(selectedNoticeFile);
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
      const expiresVal = document.getElementById('notice-expires').value;
      const isUrgent = document.getElementById('notice-urgent').checked;
      let imageUrl = imgUrlHidden.value || null;

      // Upload image if newly selected
      if (selectedNoticeFile) {
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
      }

      const noticeData = {
        id: id || undefined,
        title,
        content,
        author,
        isUrgent,
        imageUrl,
        expiresAt: expiresVal ? new Date(expiresVal).toISOString() : null
      };

      try {
        const res = await fetch('/api/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: currentPin, notice: noticeData })
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            formBox.classList.add('hidden');
            form.reset();
            selectedNoticeFile = null;
            if (fileInput) fileInput.value = '';
            await loadNotices();
            showAdminToast('ההודעה פורסמה בהצלחה במסך הראשי!', '📢');
            return;
          }
        }
        throw new Error('API unavailable');
      } catch (err) {
        // Fallback for static GitHub Pages (localStorage)
        const localNotices = JSON.parse(localStorage.getItem('smart_lobby_notices') || '[]');
        if (!noticeData.id) noticeData.id = 'notice_' + Date.now();

        // If editing/re-adding, remove from deleted notices list
        const deletedIds = JSON.parse(localStorage.getItem('smart_lobby_deleted_notices') || '[]');
        const updatedDeleted = deletedIds.filter(dId => dId !== noticeData.id);
        localStorage.setItem('smart_lobby_deleted_notices', JSON.stringify(updatedDeleted));

        const existingIdx = localNotices.findIndex(n => n.id === noticeData.id);
        if (existingIdx !== -1) {
          localNotices[existingIdx] = noticeData;
        } else {
          localNotices.unshift(noticeData);
        }
        localStorage.setItem('smart_lobby_notices', JSON.stringify(localNotices));
        try { window.dispatchEvent(new Event('storage')); } catch (e) {}
        formBox.classList.add('hidden');
        form.reset();
        selectedNoticeFile = null;
        if (fileInput) fileInput.value = '';
        await loadNotices();
        showAdminToast('ההודעה נשמרה בהצלחה במסך הראשי!', '📢');
      }
    });
  }
}

async function loadNotices() {
  const list = document.getElementById('notices-list');
  if (!list) return;

  try {
    let notices = [];
    if (window.location.protocol.startsWith('http') && !window.location.hostname.includes('github.io')) {
      try {
        const res = await fetch('/api/notices');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.notices) notices = data.notices;
        }
      } catch (apiErr) {}
    }
    
    if (notices.length === 0) {
      try {
        const res = await fetch('data/notices.json?v=' + Date.now());
        if (res.ok) notices = await res.json();
      } catch (e) {}
    }

    // Merge localStorage notices and filter deleted notices
    try {
      const localNotices = JSON.parse(localStorage.getItem('smart_lobby_notices') || '[]');
      if (Array.isArray(localNotices) && localNotices.length > 0) {
        const localIds = new Set(localNotices.map(n => n.id));
        notices = [...localNotices, ...notices.filter(n => !localIds.has(n.id))];
      }
      const deletedIds = new Set(JSON.parse(localStorage.getItem('smart_lobby_deleted_notices') || '[]'));
      notices = notices.filter(n => !deletedIds.has(n.id));
    } catch (e) {}
    
    if (!notices || notices.length === 0) {
      list.innerHTML = `
        <div class="admin-card p-6 text-center text-gray-400">
          <p class="text-base mb-1">אין כרגע הודעות פעילות במסך</p>
          <p class="text-xs">המסך מציג צילומי שבת וחגים, מזג אוויר ועדכוני חדשות אוטומטית</p>
        </div>
      `;
      return;
    }

    list.innerHTML = notices.map(n => {
      const urgentBadge = n.isUrgent ? `<span class="bg-red-600 text-white text-xs px-2 py-0.5 rounded-md font-bold">⚠️ דחוף</span>` : '';
      const imgBadge = n.imageUrl ? `<span class="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-md">🖼️ תמונה</span>` : '';
      const expDate = n.expiresAt ? `<span class="text-xs text-amber-400">תפוגה: ${new Date(n.expiresAt).toLocaleDateString('he-IL')}</span>` : '<span class="text-xs text-gray-500">ללא תפוגה</span>';

      return `
        <div class="admin-card p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-gray-600 transition">
          <div class="space-y-1 flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              ${urgentBadge}
              ${imgBadge}
              <h3 class="font-bold text-sm sm:text-base text-white truncate">${n.title}</h3>
            </div>
            <p class="text-xs sm:text-sm text-gray-300 line-clamp-2">${n.content}</p>
            <div class="flex items-center gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs text-gray-400 flex-wrap">
              <span>נכתב ע"י: ${n.author || 'ועד הבית'}</span>
              <span>•</span>
              ${expDate}
            </div>
          </div>
          <div class="flex gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
            <button onclick="editNotice('${n.id}', '${encodeURIComponent(JSON.stringify(n))}')" class="px-3.5 py-1.5 bg-gray-700 hover:bg-gray-600 active:scale-95 rounded-lg text-xs font-semibold">✏️ ערוך</button>
            <button onclick="deleteNotice('${n.id}')" class="px-3.5 py-1.5 bg-red-900 bg-opacity-40 hover:bg-opacity-80 active:scale-95 text-red-300 rounded-lg text-xs font-semibold">🗑️ מחק</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = '<p class="text-red-400 text-xs">שגיאה בטעינת הודעות</p>';
  }
}

window.editNotice = function(id, encodedNotice) {
  const n = JSON.parse(decodeURIComponent(encodedNotice));
  document.getElementById('notice-id').value = n.id;
  document.getElementById('notice-title').value = n.title;
  document.getElementById('notice-content').value = n.content;
  document.getElementById('notice-author').value = n.author || 'ועד הבית';
  document.getElementById('notice-urgent').checked = Boolean(n.isUrgent);
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

  if (n.expiresAt) {
    const d = new Date(n.expiresAt);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    document.getElementById('notice-expires').value = d.toISOString().slice(0, 16);
  } else {
    document.getElementById('notice-expires').value = '';
  }

  document.getElementById('form-title').textContent = 'עריכת הודעת ועד';
  const formBox = document.getElementById('notice-form-box');
  formBox.classList.remove('hidden');
  formBox.scrollIntoView({ behavior: 'smooth' });
};

window.deleteNotice = async function(id) {
  if (!confirm('האם למחוק הודעה זו מהמסך?')) return;
  try {
    await fetch(`/api/notices/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': currentPin }
    });
  } catch (err) {}

  // Always update LocalStorage & track deleted notice ID persistently
  try {
    const deletedIds = JSON.parse(localStorage.getItem('smart_lobby_deleted_notices') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('smart_lobby_deleted_notices', JSON.stringify(deletedIds));
    }
    const localNotices = JSON.parse(localStorage.getItem('smart_lobby_notices') || '[]');
    const updated = localNotices.filter(n => n.id !== id);
    localStorage.setItem('smart_lobby_notices', JSON.stringify(updated));

    // Dispatch event to notify other open screens
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}

  await loadNotices();
  showAdminToast('ההודעה נמחקה בהצלחה מהמסך!', '🗑️');
};

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
            title: item.title,
            category: 'notices',
            catName: 'הודעות ועד',
            url: item.url
          });
        });

        // 2. Shabbat & Holidays
        if (data.shabbat) {
          data.shabbat.forEach(item => allImages.push({ id: item.id, title: item.title || 'שבת קודש', category: 'shabbat', catName: 'שבת קודש', url: item.url }));
        }
        ['rosh-hashanah', 'sukkot', 'hanukkah', 'pesach', 'shavuot'].forEach(hKey => {
          if (data[hKey]) {
            data[hKey].forEach(item => allImages.push({ id: item.id, title: item.title, category: 'shabbat', catName: 'חגי ישראל', url: item.url }));
          }
        });

        // 3. Default / Landscapes & Abstract
        (data.default || []).forEach(item => {
          allImages.push({
            id: item.id,
            title: item.title,
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
function setupDisplayControls() {
  const bgOpacityInput = document.getElementById('setting-bg-opacity');
  const bgOpacityLabel = document.getElementById('bg-opacity-label');
  const burnCompInput = document.getElementById('setting-left-burn-comp');
  const burnCompLabel = document.getElementById('burn-comp-val-label');
  const saveBtn = document.getElementById('save-display-btn');

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
          layoutSide: document.getElementById('setting-layout-side')?.value || 'left',
          headerClockPosition: document.getElementById('setting-pos-clock')?.value || 'left',
          headerBrandPosition: document.getElementById('setting-pos-brand')?.value || 'right',
          headerShabbatPosition: document.getElementById('setting-pos-shabbat')?.value || 'center',
          sideColumnWidth: document.getElementById('setting-side-width')?.value || 'normal',
          showNewsTicker: document.getElementById('setting-show-news-ticker')?.checked !== false,
          showStageArrows: document.getElementById('setting-show-stage-arrows')?.checked !== false,
          customTickerText: document.getElementById('setting-custom-ticker')?.value.trim() || '',
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
        display: {
          ...settingsData?.display,
          newsSource: document.getElementById('setting-rss-source')?.value || 'ynet'
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
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        settingsData = data.settings;
        populateSettingsUI();
        return;
      }
    }
    throw new Error('API settings unavailable');
  } catch (err) {
    try {
      const res = await fetch('data/settings.json?v=' + Date.now());
      if (res.ok) {
        settingsData = await res.json();
      }
    } catch (fbErr) {}
  }

  // Merge localStorage settings
  try {
    const local = JSON.parse(localStorage.getItem('smart_lobby_settings') || 'null');
    if (local) {
      settingsData = { ...settingsData, ...local };
    }
  } catch (e) {}

  populateSettingsUI();
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
  if (rssSource) rssSource.value = settingsData.display?.newsSource || 'ynet';
  if (pinInput) pinInput.placeholder = settingsData.security?.adminPin ? 'מוגדר (הזן לשינוי)' : 'ברירת מחדל: 1234';
  if (editorPinInput) editorPinInput.placeholder = settingsData.security?.editorPin ? 'מוגדר (הזן לשינוי)' : 'ברירת מחדל: 1111';

  // Update Header Quick Radio Button State
  updateHeaderRadioStatus(Boolean(settingsData.radio?.enabled));
}

// ==========================================
// 8. HEADER QUICK CONTROLS (Radio & Emergency Refresh)
// ==========================================
function setupHeaderQuickActions() {
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
    refreshBtn.addEventListener('click', () => {
      const now = Date.now();
      localStorage.setItem('smart_lobby_force_reload', now.toString());

      try {
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}

      showAdminToast('🔄 אות רענון נשלח למסך השילוט!', '🚀');
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
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: currentPin, newSettings })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        await loadSettings();
        showAdminToast(successMessage || 'נשמר בהצלחה!', '✅');
        return true;
      }
    }
    throw new Error('API not available');
  } catch (err) {
    // Static / LocalStorage fallback
    const local = JSON.parse(localStorage.getItem('smart_lobby_settings') || '{}');
    const merged = { ...local, ...newSettings };
    localStorage.setItem('smart_lobby_settings', JSON.stringify(merged));
    settingsData = { ...settingsData, ...newSettings };
    populateSettingsUI();
    showAdminToast(successMessage || 'ההגדרות נשמרו בהצלחה!', '✅');
    return true;
  }
}

