/**
 * =========================================================
 * Building Digital Signage - Screen Core Logic
 * High-End Theme Engine, Shabbat Auto Detection, RSS, Weather,
 * Stage Carousel & Multi-Device Layout Support
 * =========================================================
 */

class SmartLobbyScreen {
  constructor() {
    this.settings = null;
    this.notices = [];
    this.photos = [];
    this.slides = [];
    this.currentSlideIndex = 0;
    this.slideTimer = null;
    this.isPaused = false;
    this.pauseTimeout = null;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.audioPlayer = null;
    this.adminClicksCount = 0;
    this.adminClickTimer = null;
    this.isAudioUnlocked = false;

    this.init();
  }

  async init() {
    this.setupAudio();
    await this.fetchSettings();
    await this.fetchNotices();
    await this.fetchPhotos();
    this.setupClockAndDate();
    this.setupWeather();
    this.setupShabbatStatus();
    this.setupNewsTicker();
    this.buildSlides();
    this.startCarousel();
    this.setupTouchInteractions();
    this.setupSecretAdminAccess();
    this.startPeriodicUpdates();
  }

  // =========================================================
  // 1. DATA FETCHING & LOCALSTORAGE CACHE
  // =========================================================
  async fetchSettings() {
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
      throw new Error('API unavailable');
    } catch (e) {
      try {
        const res = await fetch('data/settings.json');
        if (res.ok) {
          this.settings = await res.json();
        }
      } catch (fbErr) {}
    }

    try {
      const local = JSON.parse(localStorage.getItem('smart_lobby_settings') || 'null');
      if (local) {
        this.settings = { ...this.settings, ...local };
      }
    } catch (e) {}

    this.applySettings();
  }

  async fetchNotices() {
    try {
      let fetched = [];
      try {
        const res = await fetch('/api/notices');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.notices) fetched = data.notices;
        }
      } catch (e) {}

      if (fetched.length === 0) {
        try {
          const res = await fetch('data/notices.json');
          if (res.ok) fetched = await res.json();
        } catch (e) {}
      }

      try {
        const local = JSON.parse(localStorage.getItem('smart_lobby_notices') || '[]');
        if (Array.isArray(local) && local.length > 0) {
          const localIds = new Set(local.map(n => n.id));
          fetched = [...local, ...fetched.filter(n => !localIds.has(n.id))];
        }
      } catch (e) {}

      const now = new Date();
      this.notices = fetched.filter(n => {
        if (!n.expiresAt) return true;
        return new Date(n.expiresAt) > now;
      });

      this.renderSidebarNotices();
    } catch (err) {
      console.error('Error fetching notices:', err);
    }
  }

  async fetchPhotos() {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.photos) {
          this.photos = data.photos;
        }
      }
    } catch (e) {
      this.photos = [];
    }
  }

  // =========================================================
  // 2. THEME & SETTINGS APPLICATION
  // =========================================================
  applySettings() {
    if (!this.settings) return;

    const display = this.settings.display || {};
    const bld = this.settings.building || {};

    // Building Title & Subtitle
    const titleElem = document.getElementById('building-name');
    const subtitleElem = document.getElementById('building-subtitle');
    if (titleElem && bld.name) titleElem.textContent = bld.name;
    if (subtitleElem && bld.city) subtitleElem.textContent = `${bld.city} • ${bld.subtitle || 'לוח דיגיטלי'}`;

    // Resolution & Orientation
    document.body.className = document.body.className
      .replace(/res-[a-z0-9]+/g, '')
      .replace(/orient-[a-z0-9]+/g, '')
      .trim();

    document.body.classList.add(`res-${display.resolution || 'auto'}`);
    document.body.classList.add(`orient-${display.orientation || 'landscape'}`);

    // Left Burn Compensation
    const burnComp = display.leftBurnCompensation !== undefined ? display.leftBurnCompensation : 45;
    document.documentElement.style.setProperty('--left-burn-comp', `${burnComp}%`);

    // High Contrast Cards on Left Side
    if (display.highContrastSideCards) {
      document.body.classList.add('high-contrast-side');
    } else {
      document.body.classList.remove('high-contrast-side');
    }

    // Dynamic Layout Customization Classes
    document.body.classList.remove(
      'layout-side-left', 'layout-side-right', 'layout-side-hidden',
      'side-width-compact', 'side-width-normal', 'side-width-wide',
      'header-clock-left', 'header-brand-right', 'header-brand-hidden',
      'header-shabbat-hidden', 'hide-ticker', 'hide-arrows'
    );

    if (display.layoutSide === 'right') {
      document.body.classList.add('layout-side-right');
    } else if (display.layoutSide === 'hidden') {
      document.body.classList.add('layout-side-hidden');
    } else {
      document.body.classList.add('layout-side-left');
    }

    if (display.sideColumnWidth === 'compact') {
      document.body.classList.add('side-width-compact');
    } else if (display.sideColumnWidth === 'wide') {
      document.body.classList.add('side-width-wide');
    }

    if (display.headerClockPosition === 'left') {
      document.body.classList.add('header-clock-left');
    }
    if (display.headerBrandPosition === 'right') {
      document.body.classList.add('header-brand-right');
    } else if (display.headerBrandPosition === 'hidden') {
      document.body.classList.add('header-brand-hidden');
    }
    if (display.headerShabbatPosition === 'hidden') {
      document.body.classList.add('header-shabbat-hidden');
    }

    if (display.showNewsTicker === false) {
      document.body.classList.add('hide-ticker');
    }
    if (display.showStageArrows === false) {
      document.body.classList.add('hide-arrows');
    }

    // Background Opacity & Brightness Slider
    const bgOpacity = display.bgOpacity !== undefined ? display.bgOpacity : 85;
    const bgElem = document.getElementById('bg-overlay');
    if (bgElem) {
      bgElem.style.opacity = (bgOpacity / 100).toString();
    }

    // Theme Evaluation
    this.evaluateCurrentTheme();

    // Elevator bar toggle
    const elevBar = document.getElementById('elevator-status-bar');
    if (elevBar) {
      elevBar.style.display = (display.showElevatorBar !== false) ? 'flex' : 'none';
    }

    // Radio
    this.updateRadioState();
  }

  evaluateCurrentTheme() {
    const display = this.settings?.display || {};
    const themeMode = display.theme || 'auto';
    let chosenTheme = display.customTheme || 'modern-dark';

    if (themeMode === 'auto') {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      // Shabbat Auto Detect (Friday 13:00 to Saturday 21:00)
      const isShabbatTime = (day === 5 && hour >= 13) || (day === 6 && hour <= 21);
      if (isShabbatTime) {
        chosenTheme = 'shabbat';
      } else {
        chosenTheme = 'modern-dark';
      }
    }

    document.body.setAttribute('data-theme', chosenTheme);
  }

  // =========================================================
  // 3. CLOCK & HEBREW CALENDAR
  // =========================================================
  setupClockAndDate() {
    const update = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const clockElem = document.getElementById('header-clock');
      const secElem = document.getElementById('header-seconds');
      if (clockElem) clockElem.textContent = `${hours}:${minutes}`;
      if (secElem) secElem.textContent = `:${seconds}`;

      const daysHe = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת קודש'];
      const monthsHe = ['בינואר', 'בפברואר', 'במרץ', 'באפריל', 'במאי', 'ביוני', 'ביולי', 'באוגוסט', 'בספטמבר', 'באוקטובר', 'בנובמבר', 'בדצמבר'];

      const dateStr = `${daysHe[now.getDay()]}, ${now.getDate()} ${monthsHe[now.getMonth()]} ${now.getFullYear()}`;
      const dateElem = document.getElementById('header-date');
      if (dateElem) dateElem.textContent = dateStr;
    };

    update();
    setInterval(update, 1000);
  }

  // =========================================================
  // 4. WEATHER & OPEN-METEO INTEGRATION
  // =========================================================
  async setupWeather() {
    const fetchWeather = async () => {
      try {
        const lat = this.settings?.building?.lat || 32.434;
        const lon = this.settings?.building?.lon || 34.9197;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        if (data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const humidity = data.current.relative_humidity_2m;
          const code = data.current.weather_code;

          const tempElem = document.getElementById('weather-temp');
          const iconElem = document.getElementById('weather-icon');
          const descElem = document.getElementById('weather-desc');

          if (tempElem) tempElem.textContent = `${temp}°`;
          if (descElem) descElem.textContent = this.getWeatherDescription(code);
          if (iconElem) iconElem.textContent = this.getWeatherIcon(code);
        }
      } catch (err) {
        console.log('Weather fetch failed, retaining cache:', err);
      }
    };

    await fetchWeather();
    setInterval(fetchWeather, 10 * 60 * 1000);
  }

  getWeatherDescription(code) {
    if (code === 0) return 'בהיר ונאה';
    if (code >= 1 && code <= 3) return 'מעונן חלקית';
    if (code >= 45 && code <= 48) return 'ערפילי';
    if (code >= 51 && code <= 67) return 'גשם קל';
    if (code >= 71 && code <= 77) return 'שלג קל';
    if (code >= 80 && code <= 82) return 'ממטרים';
    if (code >= 95 && code <= 99) return 'סופת רעמים';
    return 'נאה';
  }

  getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '🌤️';
  }

  // =========================================================
  // 5. SHABBAT STATUS (Hebcal API)
  // =========================================================
  async setupShabbatStatus() {
    const fetchShabbat = async () => {
      try {
        const url = 'https://www.hebcal.com/shabbat?cfg=json&geonameid=294942&M=on'; // Hadera
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        const candleItem = data.items?.find(i => i.category === 'candles');
        const havdalahItem = data.items?.find(i => i.category === 'havdalah');
        const parashaItem = data.items?.find(i => i.category === 'parashat');

        const candleTime = candleItem ? candleItem.title.split(': ')[1] : '18:45';
        const havdalahTime = havdalahItem ? havdalahItem.title.split(': ')[1] : '19:42';
        const parashaName = parashaItem ? parashaItem.hebrew : 'פרשת השבוע';

        const candleElem = document.getElementById('shabbat-candle-time');
        const havdalahElem = document.getElementById('shabbat-havdalah-time');
        const parashaElem = document.getElementById('shabbat-parasha-name');

        if (candleElem) candleElem.textContent = candleTime;
        if (havdalahElem) havdalahElem.textContent = havdalahTime;
        if (parashaElem) parashaElem.textContent = parashaName;
      } catch (err) {
        console.log('Shabbat data fetch fallback:', err);
      }
    };

    await fetchShabbat();
    setInterval(fetchShabbat, 60 * 60 * 1000);
  }

  // =========================================================
  // 6. NEWS TICKER & RSS
  // =========================================================
  async setupNewsTicker() {
    const fetchNews = async () => {
      try {
        let items = [];
        try {
          const res = await fetch('/api/news');
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.news) items = data.news;
          }
        } catch (e) {}

        if (items.length === 0) {
          items = [
            'ברוכים הבאים לבניין הירדן 5 חדרה • ועד הבית מאחל יום נעים ובטוח לכל הדיירים והאורחים',
            'נא לשמור על ניקיון השטחים המשותפים, הלובי וחדרי המדרגות',
            'חניה במקומות המסומנים בלבד לרווחת כלל דיירי הבניין'
          ];
        }

        const tickerTextElem = document.getElementById('news-ticker-text');
        if (tickerTextElem) {
          const custom = this.settings?.display?.customTickerText;
          const allItems = custom ? [custom, ...items] : items;
          tickerTextElem.innerHTML = allItems.map(t => `<span class="ticker-item">🔹 ${t}</span>`).join(' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ');
        }
      } catch (err) {
        console.log('Ticker fetch error:', err);
      }
    };

    await fetchNews();
    setInterval(fetchNews, 5 * 60 * 1000);
  }

  // =========================================================
  // 7. SIDEBAR NOTICES LIST
  // =========================================================
  renderSidebarNotices() {
    const container = document.getElementById('sidebar-notices-container');
    if (!container) return;

    if (!this.notices || this.notices.length === 0) {
      container.innerHTML = `
        <div class="empty-notice-card">
          <p class="font-bold text-white mb-1">אין הודעות חדשות</p>
          <p class="text-xs text-slate-400">לוח המודעות פעיל ומעודכן</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.notices.map((n, idx) => {
      const isUrgentClass = n.isUrgent ? 'urgent-card' : '';
      const badge = n.isUrgent ? '<span class="badge-urgent">⚠️ דחוף</span>' : '';
      return `
        <div class="sidebar-notice-item touch-interactive ${isUrgentClass}" onclick="window.screenApp.jumpToNotice(${idx})">
          <div class="flex items-center justify-between gap-1 mb-1">
            <h4 class="font-bold text-sm text-white truncate">${n.title}</h4>
            ${badge}
          </div>
          <p class="text-xs text-slate-300 line-clamp-2">${n.content}</p>
        </div>
      `;
    }).join('');
  }

  jumpToNotice(idx) {
    this.currentSlideIndex = idx;
    this.renderCurrentSlide();
    this.pauseTemporarily(20);
  }

  // =========================================================
  // 8. MAIN STAGE SLIDESHOW ENGINE
  // =========================================================
  buildSlides() {
    this.slides = [];

    // Notice Slides
    this.notices.forEach(n => {
      this.slides.push({
        type: 'notice',
        data: n
      });
    });

    // Shabbat / Atmosphere Slide
    this.slides.push({
      type: 'shabbat-atmosphere',
      data: {
        title: 'שבת שלום ומבורכת',
        subtitle: 'לכל דיירי ואורחי הירדן 5 חדרה'
      }
    });

    // Emergency Contacts Slide
    if (this.settings?.display?.showContactsSlide !== false) {
      this.slides.push({
        type: 'contacts',
        data: this.settings?.contacts || []
      });
    }

    this.renderCurrentSlide();
  }

  renderCurrentSlide() {
    const stage = document.getElementById('main-stage');
    if (!stage || this.slides.length === 0) return;

    const slide = this.slides[this.currentSlideIndex % this.slides.length];

    if (slide.type === 'notice') {
      const n = slide.data;
      const urgentBanner = n.isUrgent ? '<div class="slide-urgent-header">⚠️ הודעת ועד דחופה</div>' : '';
      
      if (n.imageUrl) {
        stage.innerHTML = `
          <div class="slide-container slide-split">
            <div class="slide-img-side">
              <img src="${n.imageUrl}" alt="${n.title}" class="slide-flyer-img" />
            </div>
            <div class="slide-text-side">
              ${urgentBanner}
              <h2 class="slide-title">${n.title}</h2>
              <div class="slide-body-scroll">
                <p class="slide-text">${n.content}</p>
              </div>
              <div class="slide-footer">
                <span>חתימה: ${n.author || 'ועד הבית'}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        stage.innerHTML = `
          <div class="slide-container slide-full-text">
            ${urgentBanner}
            <h2 class="slide-title">${n.title}</h2>
            <div class="slide-body-scroll">
              <p class="slide-text">${n.content}</p>
            </div>
            <div class="slide-footer">
              <span>חתימה: ${n.author || 'ועד הבית'}</span>
            </div>
          </div>
        `;
      }
    } else if (slide.type === 'shabbat-atmosphere') {
      stage.innerHTML = `
        <div class="slide-container slide-shabbat-lux">
          <div class="shabbat-candles-icon">🕯️🕯️</div>
          <h2 class="shabbat-slide-title">שבת שלום ומבורכת</h2>
          <p class="shabbat-slide-sub">הירדן 5, חדרה • שלווה, בריאות ושמחה לכל הדיירים</p>
          <div class="shabbat-blessing-box">
            <span>"וּפְרוֹשׂ עָלֵינוּ סֻכַּת שְׁלוֹמֶךָ"</span>
          </div>
        </div>
      `;
    } else if (slide.type === 'contacts') {
      const contacts = slide.data;
      const listHtml = contacts.map(c => `
        <div class="contact-card-item">
          <span class="contact-icon">${c.icon || '📞'}</span>
          <div class="min-w-0">
            <h4 class="font-bold text-sm text-white">${c.name}</h4>
            <span class="text-xs text-slate-400 block">${c.desc || ''}</span>
          </div>
          <a href="tel:${c.phone}" class="contact-phone font-mono">${c.phone}</a>
        </div>
      `).join('');

      stage.innerHTML = `
        <div class="slide-container slide-contacts-hub">
          <h2 class="contacts-slide-title">📋 מדריך מספרי חירום ושירותי בניין</h2>
          <div class="contacts-grid-layout">
            ${listHtml}
          </div>
        </div>
      `;
    }

    // Update dots indicator if present
    this.updatePaginationDots();
  }

  nextSlide() {
    if (this.slides.length <= 1) return;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
    this.renderCurrentSlide();
  }

  prevSlide() {
    if (this.slides.length <= 1) return;
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
    this.renderCurrentSlide();
  }

  startCarousel() {
    if (this.slideTimer) clearInterval(this.slideTimer);
    const duration = (this.settings?.display?.slideDurationSeconds || 12) * 1000;
    this.slideTimer = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, duration);
  }

  pauseTemporarily(seconds = 20) {
    this.isPaused = true;
    clearTimeout(this.pauseTimeout);
    this.pauseTimeout = setTimeout(() => {
      this.isPaused = false;
    }, seconds * 1000);
  }

  updatePaginationDots() {
    const dotsContainer = document.getElementById('stage-dots');
    if (!dotsContainer || this.slides.length <= 1) return;

    dotsContainer.innerHTML = this.slides.map((_, i) => `
      <span class="pagination-dot ${i === (this.currentSlideIndex % this.slides.length) ? 'active' : ''}"></span>
    `).join('');
  }

  // =========================================================
  // 9. TOUCH INTERACTIONS & GESTURES
  // =========================================================
  setupTouchInteractions() {
    const stage = document.getElementById('main-stage');
    if (!stage) return;

    stage.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.pauseTemporarily(20);
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    // Stage Next/Prev Arrows
    const nextBtn = document.getElementById('stage-next-btn');
    const prevBtn = document.getElementById('stage-prev-btn');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextSlide();
        this.pauseTemporarily(20);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.prevSlide();
        this.pauseTemporarily(20);
      });
    }

    // Double tap on building brand to mute/unmute
    const brand = document.getElementById('header-brand-box');
    let lastTap = 0;
    if (brand) {
      brand.addEventListener('click', () => {
        const cur = Date.now();
        if (cur - lastTap < 400) {
          this.toggleAudioMute();
        }
        lastTap = cur;
      });
    }
  }

  handleSwipe() {
    const diff = this.touchEndX - this.touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped right (in RTL: previous slide)
        this.prevSlide();
      } else {
        // Swiped left (in RTL: next slide)
        this.nextSlide();
      }
    }
  }

  toggleAudioMute() {
    if (!this.audioPlayer) return;
    this.audioPlayer.muted = !this.audioPlayer.muted;
    const toast = document.createElement('div');
    toast.className = 'audio-toast';
    toast.textContent = this.audioPlayer.muted ? '🔇 המוזיקה הושתקה' : '🔊 המוזיקה הופעלה';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // =========================================================
  // 10. SECRET ADMIN ACCESS (5 Taps on Clock)
  // =========================================================
  setupSecretAdminAccess() {
    const clockBox = document.getElementById('header-clock-box');
    if (!clockBox) return;

    clockBox.addEventListener('click', () => {
      this.adminClicksCount++;
      clearTimeout(this.adminClickTimer);

      if (this.adminClicksCount >= 5) {
        this.adminClicksCount = 0;
        window.location.href = 'admin.html';
      } else {
        this.adminClickTimer = setTimeout(() => {
          this.adminClicksCount = 0;
        }, 1500);
      }
    });
  }

  // =========================================================
  // 11. BACKGROUND AUDIO & RADIO PLAYER
  // =========================================================
  setupAudio() {
    this.audioPlayer = document.getElementById('bg-audio-player');
    if (!this.audioPlayer) {
      this.audioPlayer = document.createElement('audio');
      this.audioPlayer.id = 'bg-audio-player';
      this.audioPlayer.preload = 'none';
      document.body.appendChild(this.audioPlayer);
    }

    const unlock = () => {
      if (!this.isAudioUnlocked) {
        this.isAudioUnlocked = true;
        this.updateRadioState();
        document.removeEventListener('click', unlock);
        document.removeEventListener('touchstart', unlock);
      }
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
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
  // 12. AUTO REFRESH & WATCHDOG
  // =========================================================
  startPeriodicUpdates() {
    setInterval(async () => {
      await this.fetchSettings();
      await this.fetchNotices();
      await this.fetchPhotos();
      this.buildSlides();
    }, 45 * 1000);

    // Watchdog night refresh at 04:00 AM
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 4 && now.getMinutes() === 0 && now.getSeconds() < 10) {
        window.location.reload();
      }
    }, 10 * 1000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.screenApp = new SmartLobbyScreen();
});
