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

    // Touch counters
    this.clockTapCount = 0;
    this.clockTapTimer = null;
    this.touchStartX = 0;

    this.init();
  }

  async init() {
    console.log('🚀 Initializing Building Digital Signage Touchscreen Controller...');
    this.setupAudio();
    this.startClock();
    this.setupTouchInteractions();
    this.setupForceReloadListener();
    this.setupWatchdog();

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
  }

  // =========================================================
  // 1. CLOCK & SECRET ADMIN SHORTCUT (5-Tap)
  // =========================================================
  startClock() {
    const updateTime = () => {
      const now = new Date();
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const timeElem = document.getElementById('clock-time');
      if (timeElem) {
        timeElem.textContent = `${hours}:${minutes}:${seconds}`;
      }

      const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
      const months = ['בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני', 'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר'];
      
      const dayName = days[now.getDay()];
      const dayOfMonth = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();

      const gregDateElem = document.getElementById('clock-date-greg');
      if (gregDateElem) {
        gregDateElem.textContent = `${dayName}, ${dayOfMonth} ${monthName} ${year}`;
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
      radioIndicator.addEventListener('click', () => {
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
    if (!this.audioPlayer) return;
    if (this.audioPlayer.paused) {
      this.audioPlayer.play().then(() => {
        this.showTouchToast('מוזיקה ורדיו הופעלו', '🔊');
      }).catch(err => console.log('Audio error:', err));
    } else {
      this.audioPlayer.pause();
      this.showTouchToast('מוזיקת רקע הושתקה', '🔇');
    }
  }

  showOnScreenAdminPrompt() {
    const pin = prompt('הזן קוד PIN לניהול השילוט הדיגיטלי:');
    if (pin === '1234' || pin === this.settings?.security?.adminPin) {
      window.location.href = '/admin';
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

    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modal.classList.remove('hidden');
    this.pauseTemporarily(40000);
  }

  closeModal() {
    const modal = document.getElementById('interactive-modal');
    if (modal) modal.classList.add('hidden');
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

    this.openModal('🌤️ תחזית מזג אוויר מורחבת - חדרה', `
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

    this.openModal('🕯️ זמני שבת ופרשת השבוע - חדרה', `
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
          <span style="font-size: 1.8rem;">${c.icon || '📞'}</span>
          <div>
            <div style="font-weight: 700; color: #fff;">${c.name}</div>
            <div style="font-size: 0.78rem; color: #94a3b8;">${c.desc || ''}</div>
          </div>
        </div>
        <a href="tel:${c.phone.replace(/[^0-9*]/g, '')}" style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 800; color: #38bdf8; text-decoration: none; background: rgba(56,189,248,0.15); padding: 0.4rem 0.8rem; border-radius: 0.6rem;">
          ${c.phone}
        </a>
      </div>
    `).join('');

    this.openModal('📞 מדריך מספרי טלפון וחירום - הירדן 5', `
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
        <span style="font-size: 1.05rem; color: #f1f5f9; line-height: 1.4;">${item.title}</span>
      </div>
    `).join('');

    this.openModal('📰 מבזקי חדשות אחרונים (Ynet)', `
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

    // Advanced Layout - Header Clock & Weather Position (left / right)
    const clockPos = this.settings.display?.headerClockPosition || 'left';
    document.body.classList.toggle('header-clock-right', clockPos === 'right');

    // Advanced Layout - Header Brand Position (right / left / hidden)
    const brandPos = this.settings.display?.headerBrandPosition || 'right';
    document.body.classList.toggle('header-brand-hidden', brandPos === 'hidden');
    document.body.classList.toggle('header-brand-left', brandPos === 'left');

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
    this.slideDurationMs = durationSec * 1000;

    // Radio
    this.updateRadioState();
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
            this.weather = data.weather;
            this.renderWeather();
            this.buildSlides();
            return;
          }
        }
      } catch (e) {}
    }

    // Direct Open-Meteo Client Call for GitHub Pages
    try {
      const lat = this.settings?.building?.lat || 32.4340;
      const lon = this.settings?.building?.lon || 34.9197;
      const cityName = this.settings?.building?.city || 'חדרה';
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FJerusalem`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
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
        this.weather = {
          city: cityName,
          temperature: Math.round(current.temperature_2m),
          apparentTemperature: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          description: wInfo.desc,
          iconEmoji: current.is_day ? wInfo.day : wInfo.night,
          tempMax: daily?.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : null,
          tempMin: daily?.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : null,
          sunrise: daily?.sunrise?.[0] ? daily.sunrise[0].split('T')[1].slice(0, 5) : '06:15',
          sunset: daily?.sunset?.[0] ? daily.sunset[0].split('T')[1].slice(0, 5) : '19:15',
          forecast
        };
        this.renderWeather();
        this.buildSlides();
      }
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
    // Curated, verified, authentic Jewish holiday & Special Event photographic collections - STRICTLY NO PEOPLE
    const HOLIDAY_COLLECTIONS = {
      'shabbat': [
        'https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=85'
      ],
      'rosh-hashanah': [
        'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=85'
      ],
      'yom-kippur': [
        'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=85'
      ],
      'sukkot': [
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85'
      ],
      'simchat-torah': [
        'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=1920&q=85'
      ],
      'hanukkah': [
        'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=1920&q=85'
      ],
      'tu-bishvat': [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=1920&q=85'
      ],
      'purim': [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1920&q=85'
      ],
      'pesach': [
        'https://images.unsplash.com/photo-1587334274328-64186a80aeee?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=1920&q=85'
      ],
      'memorial': [
        'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1920&q=85'
      ],
      'israel': [
        'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85'
      ],
      'lag-baomer': [
        'https://images.unsplash.com/photo-1475724017904-b712052c192a?auto=format&fit=crop&w=1920&q=85'
      ],
      'jerusalem': [
        'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=85'
      ],
      'shavuot': [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85'
      ],
      'tu-baav': [
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1920&q=85'
      ],
      'back-to-school': [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1920&q=85'
      ],
      'new-year': [
        'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&q=85'
      ],
      'family-day': [
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1920&q=85'
      ],
      'elections': [
        'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1920&q=85'
      ],
      'default': [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=85',
        'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?auto=format&fit=crop&w=1920&q=85'
      ]
    };

    // Direct Hebcal Client Call
    try {
      const lat = this.settings?.building?.lat || 32.4340;
      const lon = this.settings?.building?.lon || 34.9197;
      const url = `https://www.hebcal.com/shabbat?cfg=json&latitude=${lat}&longitude=${lon}&tzid=Asia/Jerusalem&M=on&lg=he`;
      const resp = await fetch(url);
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
          } else if (item.category === 'holiday' || item.category === 'roshchodesh' || item.category === 'fast') {
            holidays.push({ title: item.hebrew || item.title, date: item.date });
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

        // 1. Match Jewish Holidays from Hebcal
        let jewishHolidayEvent = null;
        if (holidays.length > 0) {
          const hTitle = holidays[0].title;
          const hLower = hTitle.toLowerCase();

          if (hLower.includes('ראש השנה')) {
            recommendedTheme = 'rosh-hashanah';
            themeImages = HOLIDAY_COLLECTIONS['rosh-hashanah'];
            jewishHolidayEvent = { title: 'ראש השנה', customGreeting: 'שנה טובה ומתוקה!', subtitle: 'ועד הבית מאחל לכל הדיירים ובני ביתם שנה של שגשוג, בריאות, שלום והתחדשות', icon: '🍎' };
          } else if (hLower.includes('כיפור')) {
            recommendedTheme = 'yom-kippur';
            themeImages = HOLIDAY_COLLECTIONS['yom-kippur'];
            jewishHolidayEvent = { title: 'יום הכיפורים', customGreeting: 'גמר חתימה טובה!', subtitle: 'צום קל ומועיל לכל הדיירים והצמים • שנת סליחה ושלום', icon: '🕍' };
          } else if (hLower.includes('שמחת תורה') || hLower.includes('שמיני עצרת')) {
            recommendedTheme = 'simchat-torah';
            themeImages = HOLIDAY_COLLECTIONS['simchat-torah'];
            jewishHolidayEvent = { title: 'שמחת תורה', customGreeting: 'חג שמחת תורה שמח!', subtitle: 'מועדים לשמחה וחגים וזמנים לששון לכל דיירי הבניין', icon: '📜' };
          } else if (hLower.includes('סוכות') || hLower.includes('הושענא')) {
            recommendedTheme = 'sukkot';
            themeImages = HOLIDAY_COLLECTIONS['sukkot'];
            jewishHolidayEvent = { title: 'חג הסוכות', customGreeting: 'חג סוכות שמח!', subtitle: 'ועד הבית מאחל חג סוכות מבורך, שמחה ואושפיזין מבורכים', icon: '⛺' };
          } else if (hLower.includes('חנוכה')) {
            recommendedTheme = 'hanukkah';
            themeImages = HOLIDAY_COLLECTIONS['hanukkah'];
            jewishHolidayEvent = { title: 'חנוכה', customGreeting: 'חג חנוכה שמח ומאיר!', subtitle: 'חג של אור, שמחה, ניסים ונפלאות לכל המשפחות', icon: '🕎' };
          } else if (hLower.includes('ט״ו בשבט') || hLower.includes('טו בשבט')) {
            recommendedTheme = 'tu-bishvat';
            themeImages = HOLIDAY_COLLECTIONS['tu-bishvat'];
            jewishHolidayEvent = { title: 'ט"ו בשבט', customGreeting: 'חג לאילנות שמח!', subtitle: 'חג צמיחה, פריחה והתחדשות הטבע לכל דיירי הבניין', icon: '🌳' };
          } else if (hLower.includes('פורים') || hLower.includes('אסתר')) {
            recommendedTheme = 'purim';
            themeImages = HOLIDAY_COLLECTIONS['purim'];
            jewishHolidayEvent = { title: 'פורים', customGreeting: 'חג פורים שמח ומבדח!', subtitle: 'ליהודים הייתה אורה ושמחה וששון ויקר • חג מלא צהלה', icon: '🎭' };
          } else if (hLower.includes('פסח')) {
            recommendedTheme = 'pesach';
            themeImages = HOLIDAY_COLLECTIONS['pesach'];
            jewishHolidayEvent = { title: 'פסח', customGreeting: 'חג פסח כשר ושמח!', subtitle: 'חג אביב וחרות מלבלב, שקט ושלווה לכל דיירי הבניין', icon: '🍷' };
          } else if (hLower.includes('שואה')) {
            recommendedTheme = 'memorial';
            themeImages = HOLIDAY_COLLECTIONS['memorial'];
            jewishHolidayEvent = { title: 'יום הזיכרון לשואה ולגבורה', customGreeting: 'יום הזיכרון לשואה ולגבורה', subtitle: 'נזכור ולא נשכח • מרכינים ראש לזכר ששת המיליונים', icon: '🕯️' };
          } else if (hLower.includes('הזיכרון') || hLower.includes('חללי')) {
            recommendedTheme = 'memorial';
            themeImages = HOLIDAY_COLLECTIONS['memorial'];
            jewishHolidayEvent = { title: 'יום הזיכרון לחללי מערכות ישראל', customGreeting: 'יום הזיכרון לחללי מערכות ישראל ופעולות האיבה', subtitle: 'במותם ציוו לנו את החיים • יהי זכרם ברוך ונצור בליבנו תמיד', icon: '🇮🇱' };
          } else if (hLower.includes('עצמאות')) {
            recommendedTheme = 'israel';
            themeImages = HOLIDAY_COLLECTIONS['israel'];
            jewishHolidayEvent = { title: 'יום העצמאות', customGreeting: 'חג עצמאות שמח למדינת ישראל!', subtitle: 'חג שמח ומלא גאווה לאומית לכל דיירי הבניין ועם ישראל', icon: '🇮🇱' };
          } else if (hLower.includes('עומר') || hLower.includes('ל״ג')) {
            recommendedTheme = 'lag-baomer';
            themeImages = HOLIDAY_COLLECTIONS['lag-baomer'];
            jewishHolidayEvent = { title: 'ל"ג בעומר', customGreeting: 'ל"ג בעומר שמח!', subtitle: 'חג שמח ומאיר לכל המשפחות והילדים', icon: '🔥' };
          } else if (hLower.includes('ירושלים')) {
            recommendedTheme = 'jerusalem';
            themeImages = HOLIDAY_COLLECTIONS['jerusalem'];
            jewishHolidayEvent = { title: 'יום ירושלים', customGreeting: 'יום ירושלים שמח!', subtitle: 'שמחי ירושלים וגילו בה כל אוהביה', icon: '🦁' };
          } else if (hLower.includes('שבועות')) {
            recommendedTheme = 'shavuot';
            themeImages = HOLIDAY_COLLECTIONS['shavuot'];
            jewishHolidayEvent = { title: 'שבועות', customGreeting: 'חג שבועות שמח!', subtitle: 'חג מתן תורה, חג הקציר והביכורים לכל הדיירים', icon: '🌾' };
          } else if (hLower.includes('ט״ו באב') || hLower.includes('טו באב')) {
            recommendedTheme = 'tu-baav';
            themeImages = HOLIDAY_COLLECTIONS['tu-baav'];
            jewishHolidayEvent = { title: 'ט"ו באב', customGreeting: 'יום אהבה עברי שמח!', subtitle: 'שמחה, אהבה ואחווה בקרב כל משפחות הבניין', icon: '❤️' };
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
    let list = [];
    if (this.isLocalServer()) {
      try {
        const res = await fetch('/api/notices');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.notices) {
            list = data.notices;
          }
        }
      } catch (e) {}
    }

    // Static fallback: load data/notices.json
    if (list.length === 0) {
      try {
        const res = await fetch('data/notices.json?v=' + Date.now());
        if (res.ok) {
          list = await res.json();
        }
      } catch (fallbackErr) {
        console.warn('Notices load error:', fallbackErr);
      }
    }

    // Merge with any client-side localStorage notices & filter deleted
    try {
      const localNotices = JSON.parse(localStorage.getItem('smart_lobby_notices') || '[]');
      if (Array.isArray(localNotices) && localNotices.length > 0) {
        const localIds = new Set(localNotices.map(n => n.id));
        list = [...localNotices, ...list.filter(n => !localIds.has(n.id))];
      }
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
    this.wallpapers = [
      { id: 'wall-1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80' },
      { id: 'wall-2', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80' }
    ];
    this.buildSlides();
  }

  async fetchNews() {
    if (this.isLocalServer()) {
      try {
        const source = this.settings?.display?.newsSource || 'ynet';
        const res = await fetch(`/api/news?source=${source}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.items) {
            this.newsItems = data.items;
            this.renderNewsTicker();
            return;
          }
        }
      } catch (e) {}
    }

    // Client-side RSS proxy for GitHub Pages
    try {
      const proxyRes = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.ynet.co.il/Integration/StoryRss2.xml');
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.items && data.items.length > 0) {
          this.newsItems = data.items.slice(0, 10).map(i => ({ title: i.title }));
          this.renderNewsTicker();
          return;
        }
      }
    } catch (proxyErr) {}

    // Fallback Announcements Ticker
    this.newsItems = [
      { title: 'ועד הבית מברך את כל דיירי ואורחי הבניין בברכת שבת שלום וסוף שבוע נעים' },
      { title: 'נא לוודא כי דלת הלובי הראשית והשער נסגרים כראוי לאחר כניסה ויציאה' },
      { title: 'שמירה על ניקיון וסדר בשטחים המשותפים תורמת לאיכות החיים של כולנו' }
    ];
    this.renderNewsTicker();
  }

  renderNewsTicker() {
    const tickerContent = document.getElementById('ticker-content');
    if (!tickerContent) return;

    let itemsHtml = '';

    if (this.settings?.display?.customTickerText) {
      itemsHtml += `
        <span class="ticker-item" style="color: #fbbf24; font-weight: 800;">
          <span class="ticker-item-bullet">📢</span>
          ${this.settings.display.customTickerText}
        </span>
      `;
    }

    (this.newsItems || []).forEach(item => {
      itemsHtml += `
        <span class="ticker-item">
          <span class="ticker-item-bullet">●</span>
          ${item.title}
        </span>
      `;
    });

    tickerContent.innerHTML = itemsHtml;
  }

  // =========================================================
  // 4. SIDE COLUMN FEED (Touch-To-Jump)
  // =========================================================
  renderSideColumn() {
    const feedContainer = document.getElementById('side-notices-feed');
    const countBadge = document.getElementById('notices-count-badge');
    if (!feedContainer) return;

    if (countBadge) countBadge.textContent = `${this.notices.length} הודעות`;

    if (this.notices.length === 0) {
      feedContainer.innerHTML = `
        <div style="padding: 1.25rem 0.5rem; text-align: center; color: #94a3b8; font-size: 0.85rem;">
          <p>אין הודעות ועד מיוחדות כרגע</p>
          <p style="font-size: 0.72rem; margin-top: 0.2rem;">ועד הבית מאחל יום נעים!</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = this.notices.slice(0, 2).map((n, idx) => {
      const urgentClass = n.isUrgent ? 'urgent' : '';
      const badgeIcon = n.isUrgent ? '⚠️' : '📢';
      const imgIndicator = n.imageUrl ? '<span style="font-size: 0.72rem; color: #38bdf8;">🖼️ תמונה</span>' : '';

      return `
        <div class="mini-notice-item ${urgentClass}" onclick="window.signageApp.jumpToNotice('${n.id}')" title="לחץ לקריאה מלאה">
          <div class="mini-notice-title">
            <span>${badgeIcon} ${n.title}</span>
            <span style="font-size: 0.72rem; color: #94a3b8;">${n.author || 'ועד'}</span>
          </div>
          <div class="mini-notice-snippet">${n.content}</div>
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

  // =========================================================
  // 5. MAIN STAGE SLIDES (With Real Holiday Imagery)
  // =========================================================
  buildSlides() {
    this.slides = [];

    // 1. Committee Notice Slides
    this.notices.forEach(notice => {
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

    // 4. Building Directory & Emergency Contacts Slide
    const showContactsSlide = this.settings?.display?.showContactsSlide !== false;
    const activeContacts = (this.settings?.contacts || []).filter(c => c.enabled !== false);
    if (showContactsSlide && activeContacts.length > 0) {
      this.slides.push({
        type: 'contacts_directory',
        data: activeContacts
      });
    }

    // 5. Auto Holiday / Special Date / Shabbat Celebration Slide (With Real Photographic Visuals)
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

    // 6. Curated Fallback Wallpapers (if few slides)
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
          // Split Layout
          contentHtml = `
            <div class="stage-notice-split-layout">
              <div class="notice-attached-img-box">
                <img src="${n.imageUrl}" alt="תמונה מצורפת" loading="lazy" />
              </div>
              <div class="stage-notice-layout">
                <div class="notice-header-row">
                  <span class="notice-type-badge ${urgentClass}">${badgeText}</span>
                  <span class="notice-author-tag">${n.author || 'ועד הבית'}</span>
                </div>
                <div class="stage-notice-body">
                  <div class="stage-notice-title-row">
                    <span style="font-size: 2rem;">${typeIcon}</span>
                    <h2 class="stage-notice-title">${n.title}</h2>
                  </div>
                  <div class="stage-notice-content">${n.content}</div>
                </div>
                <div class="stage-notice-footer">
                  <span>הירדן 5, חדרה</span>
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
                <span class="notice-author-tag">${n.author || 'ועד הבית'}</span>
              </div>
              <div class="stage-notice-body">
                <div class="stage-notice-title-row">
                  <span style="font-size: 2.2rem;">${typeIcon}</span>
                  <h2 class="stage-notice-title">${n.title}</h2>
                </div>
                <div class="stage-notice-content">${n.content}</div>
              </div>
              <div class="stage-notice-footer">
                <span>הירדן 5, חדרה</span>
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
            <div class="stage-notice-footer">
              <span>טמפרטורה נוכחית: ${w.temperature}° | עומס חום: ${w.apparentTemperature}°</span>
              <span>Open-Meteo</span>
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
              <h4>${c.name}</h4>
              <div class="contact-phone">${c.phone}</div>
              <div class="contact-desc">${c.desc || ''}</div>
            </div>
          </div>
        `).join('');

        contentHtml = `
          <div class="contacts-slide-layout">
            <div class="forecast-title-row">
              <h2>📞 מספרי טלפון וחירום שימושיים לדיירים</h2>
              <span style="font-size: 0.9rem; color: #38bdf8; font-weight: 700;">הירדן 5</span>
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
            <img src="${slide.data.url}" alt="פלייר / תמונה" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 0.9rem; box-shadow: 0 12px 30px rgba(0,0,0,0.6);" loading="lazy" />
          </div>
        `;
      }
      // SLIDE TYPE 5: HOLIDAY CELEBRATION (With Photographic Hero)
      else if (slide.type === 'holiday_greeting') {
        const photoHero = slide.data.image ? `
          <div style="width: 100%; height: 12rem; border-radius: 1rem; overflow: hidden; margin-bottom: 1rem; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
            <img src="${slide.data.image}" alt="חג" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        ` : '';

        contentHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%; height: 100%; gap: 0.75rem;">
            ${photoHero}
            <div style="font-size: 3rem; animation: pulse-glow 3s infinite;">${slide.data.icon}</div>
            <h2 style="font-family: var(--font-heading); font-size: 2.4rem; font-weight: 900; color: #fbbf24; text-shadow: 0 4px 16px rgba(251,191,36,0.3);">${slide.data.title}</h2>
            <p style="font-size: 1.25rem; color: #f1f5f9; max-width: 85%; line-height: 1.4;">${slide.data.subtitle}</p>
          </div>
        `;
      }
      // SLIDE TYPE 6: HD SCENIC
      else if (slide.type === 'wallpaper') {
        contentHtml = `
          <div class="stage-notice-layout">
            <div class="notice-header-row">
              <span class="notice-type-badge">🌿 הירדן 5</span>
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

      card.innerHTML = contentHtml;
      container.appendChild(card);
    });
  }

  startSlideshow() {
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.progressTimer) clearInterval(this.progressTimer);
    if (this.slides.length <= 1) return;

    this.slideStartTime = Date.now();
    const progressFill = document.getElementById('stage-progress-fill');

    this.progressTimer = setInterval(() => {
      if (this.isPaused) return;
      const elapsed = Date.now() - this.slideStartTime;
      const pct = Math.min(100, (elapsed / this.slideDurationMs) * 100);
      if (progressFill) progressFill.style.width = `${pct}%`;
    }, 100);

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
    this.currentSlideIndex = (index + this.slides.length) % this.slides.length;
    this.slideStartTime = Date.now();

    const allCards = document.querySelectorAll('.slide-card');
    allCards.forEach((c, idx) => {
      if (idx === this.currentSlideIndex) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    this.rotateBackground();
  }

  rotateBackground() {
    const bgLayer = document.getElementById('background-layer');
    if (!bgLayer) return;

    // Use theme wallpapers collection if available
    const activeList = (this.shabbatData?.themeImages && this.shabbatData.themeImages.length > 0)
      ? this.shabbatData.themeImages.map((u, i) => ({ id: `th-${i}`, url: u }))
      : this.wallpapers;

    if (!activeList || activeList.length === 0) return;

    const wallIndex = this.currentSlideIndex % activeList.length;
    const nextWall = activeList[wallIndex];
    if (nextWall && nextWall.url) {
      bgLayer.style.backgroundImage = `url('${nextWall.url}')`;
      bgLayer.classList.toggle('zoom-effect');
    }
  }

  // =========================================================
  // 6. AUDIO & RADIO CONTROLS
  // =========================================================
  setupAudio() {
    this.audioPlayer = document.getElementById('radio-audio');
    const radioToggle = document.getElementById('radio-indicator');
    const unmutePrompt = document.getElementById('audio-unmute-prompt');

    if (radioToggle && this.audioPlayer) {
      radioToggle.addEventListener('click', () => {
        if (this.audioPlayer.paused) {
          this.audioPlayer.play().catch(e => console.log('Playback error:', e));
        } else {
          this.audioPlayer.pause();
        }
      });
    }

    if (unmutePrompt) {
      unmutePrompt.addEventListener('click', () => {
        this.unlockAudio();
      });
    }
  }

  unlockAudio() {
    const prompt = document.getElementById('audio-unmute-prompt');
    if (this.audioPlayer && this.settings?.radio?.enabled) {
      this.audioPlayer.play().then(() => {
        this.audioUnlocked = true;
        if (prompt) prompt.style.display = 'none';
      }).catch(err => {
        console.log('Audio unlock failed:', err);
      });
    }
  }

  updateRadioState() {
    if (!this.settings?.radio || !this.audioPlayer) return;

    const radio = this.settings.radio;
    const radioWidget = document.getElementById('radio-indicator');
    const stationNameElem = document.getElementById('radio-station-name');
    const unmutePrompt = document.getElementById('audio-unmute-prompt');

    if (!radio.enabled) {
      this.audioPlayer.pause();
      if (radioWidget) radioWidget.style.display = 'none';
      if (unmutePrompt) unmutePrompt.style.display = 'none';
      return;
    }

    if (radioWidget) radioWidget.style.display = 'flex';

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

    const currentSt = radio.stations?.find(s => s.id === radio.currentStation) 
      || fallbackStations.find(s => s.id === radio.currentStation) 
      || fallbackStations[0];

    if (currentSt) {
      if (stationNameElem) stationNameElem.textContent = currentSt.name.split(' ')[0];
      if (this.audioPlayer.src !== currentSt.url) {
        this.audioPlayer.src = currentSt.url;
      }
      this.audioPlayer.volume = radio.volume || 0.4;

      let startH = radio.startHour || '08:00';
      let endH = radio.endHour || '21:00';
      if (startH === '00:08') startH = '08:00';
      if (endH === '00:21') endH = '21:00';

      const now = new Date();
      const currentHour = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const inSchedule = (!radio.autoPlaySchedule) || (currentHour >= startH && currentHour <= endH);

      if (inSchedule) {
        this.audioPlayer.play().then(() => {
          if (unmutePrompt) unmutePrompt.style.display = 'none';
        }).catch(err => {
          console.log('Browser blocked autoplay:', err.message);
          if (unmutePrompt) unmutePrompt.style.display = 'flex';
        });
      } else {
        this.audioPlayer.pause();
        if (unmutePrompt) unmutePrompt.style.display = 'none';
      }
    }
  }

  // =========================================================
  // 7. AUTO REFRESH & WATCHDOG
  // =========================================================
  startPeriodicUpdates() {
    setInterval(async () => {
      await this.fetchSettings();
      await this.fetchNotices();
      await this.fetchPhotos();
      this.buildSlides();
    }, 45 * 1000);

    setInterval(() => {
      this.fetchWeather();
    }, 10 * 60 * 1000);

    setInterval(() => {
      this.fetchNews();
    }, 5 * 60 * 1000);

    setInterval(() => {
      this.fetchShabbatAndHolidays();
    }, 60 * 60 * 1000);
  }

  setupForceReloadListener() {
    let lastReloadTime = parseInt(localStorage.getItem('smart_lobby_force_reload') || '0', 10);

    window.addEventListener('storage', (e) => {
      if (e.key === 'smart_lobby_force_reload') {
        const time = parseInt(e.newValue || '0', 10);
        if (time > lastReloadTime) {
          console.log('🔄 Remote force reload triggered via storage event!');
          window.location.reload();
        }
      } else if (e.key === 'smart_lobby_settings') {
        console.log('⚙️ Remote settings update detected, applying settings...');
        this.fetchSettings();
      }
    });

    // Check periodically for force reload signals
    setInterval(() => {
      const current = parseInt(localStorage.getItem('smart_lobby_force_reload') || '0', 10);
      if (current > lastReloadTime) {
        lastReloadTime = current;
        console.log('🔄 Remote force reload triggered via interval poll!');
        window.location.reload();
      }
    }, 2500);
  }

  setupWatchdog() {
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 4 && now.getMinutes() === 0 && now.getSeconds() < 10) {
        console.log('🔄 Maintenance reload (04:00 AM)...');
        window.location.reload();
      }
    }, 10000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.signageApp = new BuildingSignageApp();
});
