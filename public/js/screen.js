/**
 * =========================================================
 * Building Digital Signage - Screen Controller (Multi-Zone & Touch)
 * High-Performance, Multi-Zone Interactive Dashboard
 * Touchscreen Controls, Real Holiday Photos & 24/7 Resilience
 * =========================================================
 */

class BuildingSignageApp {
  constructor() {
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

      const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'שישי', 'שבת'];
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
  setupTouchInteractions() {
    // 1. Secret Mute: Double-tap on Building Logo
    const brandSecret = document.getElementById('brand-secret-mute');
    let lastBrandTap = 0;
    if (brandSecret) {
      brandSecret.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastBrandTap < 400) {
          // Double Tap Detected!
          this.toggleSecretMute();
        }
        lastBrandTap = now;
      });
    }

    // 2. Secret 5-Tap on Clock for On-Screen Admin
    const clockWidget = document.getElementById('clock-touch-widget');
    if (clockWidget) {
      clockWidget.addEventListener('click', () => {
        this.clockTapCount++;
        clearTimeout(this.clockTapTimer);
        this.clockTapTimer = setTimeout(() => { this.clockTapCount = 0; }, 2500);

        if (this.clockTapCount >= 5) {
          this.clockTapCount = 0;
          this.showOnScreenAdminPrompt();
        }
      });
    }

    // 3. Stage Navigation Arrows
    const prevBtn = document.getElementById('stage-prev-btn');
    const nextBtn = document.getElementById('stage-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prevSlide(); this.pauseTemporarily(20000); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.nextSlide(); this.pauseTemporarily(20000); });

    // 4. Swipe Gestures on Stage
    const stageContainer = document.getElementById('stage-container');
    if (stageContainer) {
      stageContainer.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      stageContainer.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - this.touchStartX;
        if (diff > 50) {
          this.prevSlide(); // Swipe Right
          this.pauseTemporarily(20000);
        } else if (diff < -50) {
          this.nextSlide(); // Swipe Left
          this.pauseTemporarily(20000);
        }
      }, { passive: true });
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
  // 3. DATA FETCHING & HOLIDAY IMAGERY
  // =========================================================
  async fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        this.settings = data.settings;
        this.applySettings();
      }
    } catch (err) {
      console.warn('Could not fetch settings:', err);
    }
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

    // Left-Side Backlight Burn Compensation (Luminance Boost)
    const leftBoostPct = this.settings.display?.leftBurnCompensation !== undefined ? this.settings.display.leftBurnCompensation : 40;
    const boostOpacity = (leftBoostPct / 100) * 0.75;
    document.documentElement.style.setProperty('--left-boost', boostOpacity);

    // High-Contrast Light Side Cards
    const isHighContrast = Boolean(this.settings.display?.highContrastSideCards);
    document.body.classList.toggle('high-contrast-side', isHighContrast);

    // Layout Flip (Side column on left or right)
    const isFlipped = this.settings.display?.layoutSide === 'right';
    document.body.classList.toggle('layout-flipped', isFlipped);

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
    try {
      const res = await fetch('/api/weather');
      const data = await res.json();
      if (data.success && data.weather) {
        this.weather = data.weather;
        this.renderWeather();
        this.buildSlides();
      }
    } catch (err) {
      console.warn('Weather fetch error:', err);
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
    try {
      const res = await fetch('/api/shabbat-holidays');
      const data = await res.json();
      if (data.success && data.data) {
        this.shabbatData = data.data;
        this.renderShabbatAndHolidays();
        this.buildSlides();
      }
    } catch (err) {
      console.warn('Shabbat fetch error:', err);
    }
  }

  renderShabbatAndHolidays() {
    if (!this.shabbatData) return;

    const container = document.getElementById('header-center-widget');
    if (!container) return;

    // Apply auto theme & REAL HOLIDAY PHOTO WALLPAPER
    if (this.settings?.display?.theme === 'auto') {
      const theme = this.shabbatData.recommendedTheme || 'default';
      Array.from(document.body.classList).forEach(cls => {
        if (cls.startsWith('theme-')) document.body.classList.remove(cls);
      });
      document.body.classList.add(`theme-${theme}`);

      // Set photographic holiday wallpaper if available
      if (this.shabbatData.themeImage) {
        const bgLayer = document.getElementById('background-layer');
        if (bgLayer) bgLayer.style.backgroundImage = `url('${this.shabbatData.themeImage}')`;
      }
    }

    let html = '';

    // Active Holiday Banner
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
      const candle = this.shabbatData.candleLighting?.time;
      const havdalah = this.shabbatData.havdalah?.time;
      const parasha = this.shabbatData.parasha;

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
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      if (data.success) {
        this.notices = data.notices || [];
        this.renderSideColumn();
        this.buildSlides();
      }
    } catch (err) {
      console.warn('Notices fetch error:', err);
    }
  }

  async fetchPhotos() {
    try {
      const res = await fetch('/api/photos');
      const data = await res.json();
      if (data.success) {
        this.photos = data.photos || [];
        this.buildSlides();
      }
    } catch (err) {
      console.warn('Photos fetch error:', err);
    }
  }

  async fetchWallpapers() {
    try {
      const res = await fetch('/api/wallpapers');
      const data = await res.json();
      if (data.success) {
        this.wallpapers = data.wallpapers || [];
        this.buildSlides();
      }
    } catch (err) {
      console.warn('Wallpapers fetch error:', err);
    }
  }

  async fetchNews() {
    try {
      const source = this.settings?.display?.newsSource || 'ynet';
      const res = await fetch(`/api/news?source=${source}`);
      const data = await res.json();
      if (data.success && data.items) {
        this.newsItems = data.items;
        this.renderNewsTicker();
      }
    } catch (err) {
      console.warn('News fetch error:', err);
    }
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

    this.newsItems.forEach(item => {
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

    // 5. Auto Holiday / Shabbat Celebration Slide (With Real Photographic Visuals)
    if (this.shabbatData?.activeHoliday) {
      this.slides.push({
        type: 'holiday_greeting',
        data: {
          title: `חג ${this.shabbatData.activeHoliday.title} שמח!`,
          subtitle: 'ועד הבית מאחל לכל הדיירים ובני ביתם חג מבורך, שלווה ושמחה',
          icon: '✨',
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

    // If auto theme holiday image is active, prioritize it
    if (this.shabbatData?.themeImage && this.settings?.display?.theme === 'auto') {
      bgLayer.style.backgroundImage = `url('${this.shabbatData.themeImage}')`;
      return;
    }

    if (this.wallpapers.length === 0) return;
    const wallIndex = this.currentSlideIndex % this.wallpapers.length;
    const nextWall = this.wallpapers[wallIndex];
    if (nextWall) {
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

    const currentSt = radio.stations?.find(s => s.id === radio.currentStation) || radio.stations?.[0];
    if (currentSt) {
      if (stationNameElem) stationNameElem.textContent = currentSt.name.split(' ')[0];
      if (this.audioPlayer.src !== currentSt.url) {
        this.audioPlayer.src = currentSt.url;
      }
      this.audioPlayer.volume = radio.volume || 0.4;

      const now = new Date();
      const currentHour = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const inSchedule = (!radio.autoPlaySchedule) || (currentHour >= (radio.startHour || '08:00') && currentHour <= (radio.endHour || '21:00'));

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
