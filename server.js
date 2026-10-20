const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Parser = require('rss-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const rssParser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BuildingSignage/1.0'
  },
  timeout: 8000
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure storage directories exist
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const NOTICES_FILE = path.join(DATA_DIR, 'notices.json');

[DATA_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer storage for uploaded media
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `img_${Date.now()}_${cleanName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // Max 15MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|bmp/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowed.test(ext) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('רק קובצי תמונה מורשים (JPG, PNG, WebP, GIF)'));
    }
  }
});

// Helper: read and write JSON files safely
function readJsonFile(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return defaultValue;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// In-Memory Caches for External APIs (prevents spamming & works offline)
let weatherCache = { data: null, timestamp: 0 };
let shabbatCache = { data: null, timestamp: 0 };
let newsCache = { ynet: { data: null, timestamp: 0 }, kan: { data: null, timestamp: 0 }, walla: { data: null, timestamp: 0 } };

// Weather code mapping to Hebrew descriptions & Weather Icons
const WEATHER_CODE_MAP = {
  0: { desc: 'בהיר ונאה', icon: 'sun', day: '☀️', night: '🌙' },
  1: { desc: 'בהיר ברובו', icon: 'sun-cloud', day: '🌤️', night: '🌤️' },
  2: { desc: 'מעונן חלקית', icon: 'cloud-sun', day: '⛅', night: '⛅' },
  3: { desc: 'מעונן', icon: 'cloud', day: '☁️', night: '☁️' },
  45: { desc: 'אביך / ערפילי', icon: 'fog', day: '🌫️', night: '🌫️' },
  48: { desc: 'ערפל כבד', icon: 'fog', day: '🌫️', night: '🌫️' },
  51: { desc: 'טפטוף קל', icon: 'cloud-drizzle', day: '🌦️', night: '🌦️' },
  53: { desc: 'טפטוף בינוני', icon: 'cloud-drizzle', day: '🌦️', night: '🌦️' },
  55: { desc: 'טפטוף רציף', icon: 'cloud-rain', day: '🌧️', night: '🌧️' },
  61: { desc: 'גשם קל', icon: 'cloud-rain', day: '🌧️', night: '🌧️' },
  63: { desc: 'גשם בינוני', icon: 'cloud-rain', day: '🌧️', night: '🌧️' },
  65: { desc: 'גשם כבד', icon: 'cloud-rain-heavy', day: '🌧️', night: '🌧️' },
  71: { desc: 'שלג קל', icon: 'snowflake', day: '🌨️', night: '🌨️' },
  73: { desc: 'שלג', icon: 'snowflake', day: '🌨️', night: '🌨️' },
  80: { desc: 'ממטרי גשם קלים', icon: 'cloud-sun-rain', day: '🌦️', night: '🌦️' },
  81: { desc: 'ממטרים', icon: 'cloud-rain', day: '🌧️', night: '🌧️' },
  82: { desc: 'ממטרי גשם עזים', icon: 'cloud-rain-heavy', day: '⛈️', night: '⛈️' },
  95: { desc: 'סופת רעמים', icon: 'cloud-lightning', day: '⛈️', night: '⛈️' },
  96: { desc: 'סופת רעמים וברד', icon: 'cloud-lightning-rain', day: '⛈️', night: '⛈️' }
};

// ==========================================
// 1. SETTINGS API
// ==========================================
app.get('/api/settings', (req, res) => {
  const settings = readJsonFile(SETTINGS_FILE, {});
  // Do not expose admin PIN to public
  const safeSettings = { ...settings };
  if (safeSettings.security) {
    delete safeSettings.security.adminPin;
  }
  res.json({ success: true, settings: safeSettings });
});

function isNoticeActive(n, now = new Date()) {
  if (!n) return false;
  if (n.hidden) return false;

  const nowMs = now.getTime();

  // 1. StartsAt check
  if (n.startsAt) {
    const sDate = new Date(n.startsAt);
    const sTime = sDate.getTime();
    if (!isNaN(sTime) && sTime > nowMs) {
      return false; // Scheduled for future
    }
  }

  // 2. ExpiresAt check
  if (n.expiresAt) {
    const eDate = new Date(n.expiresAt);
    const eTime = eDate.getTime();
    if (!isNaN(eTime) && eTime <= nowMs) {
      return false; // Expired
    }
  }

  // 3. Weekly recurring days check: 0=Sun, 1=Mon, ..., 6=Sat
  if (Array.isArray(n.recurringDays) && n.recurringDays.length > 0) {
    const currentDay = now.getDay();
    const days = n.recurringDays.map(Number);
    if (!days.includes(currentDay)) {
      return false; // Not scheduled for today
    }
  }

  return true;
}

app.post('/api/settings', (req, res) => {
  const { pin, newSettings } = req.body;
  const current = readJsonFile(SETTINGS_FILE, {});
  const adminPin = current.security?.adminPin || '9681';
  const editorPin = current.security?.editorPin || '9090';
  
  const MASTER_PINS = ['9681', '1234'];
  const EDITOR_PINS = ['9090', '1111'];
  const isMasterAdmin = (pin === adminPin || MASTER_PINS.includes(pin));
  const isEditor = (pin === editorPin || EDITOR_PINS.includes(pin));

  if (!isMasterAdmin && !isEditor) {
    return res.status(401).json({ success: false, error: 'קוד PIN שגוי' });
  }

  // If editor, only allow radio and emergencyAlert updates; preserve all other fields securely
  if (isEditor && !isMasterAdmin) {
    const updated = {
      ...current,
      display: {
        ...(current.display || {}),
        ...(newSettings?.display?.emergencyAlert !== undefined ? { emergencyAlert: newSettings.display.emergencyAlert } : {})
      },
      radio: {
        ...(current.radio || {}),
        ...(newSettings?.radio || {})
      }
    };
    writeJsonFile(SETTINGS_FILE, updated);
    return res.json({ success: true, settings: updated });
  }

  const updated = {
    ...current,
    ...newSettings,
    display: {
      ...(current.display || {}),
      ...(newSettings?.display || {})
    },
    radio: {
      ...(current.radio || {}),
      ...(newSettings?.radio || {})
    },
    security: {
      ...current.security,
      ...(isMasterAdmin && newSettings?.newPin ? { adminPin: newSettings.newPin } : {}),
      ...(isMasterAdmin && newSettings?.security?.editorPin ? { editorPin: newSettings.security.editorPin } : {})
    }
  };

  writeJsonFile(SETTINGS_FILE, updated);
  res.json({ success: true, message: 'ההגדרות עודכנו בהצלחה' });
});

// ==========================================
// 2. NOTICES API (CRUD + Expiration & Scheduling Check)
// ==========================================
app.get('/api/notices', (req, res) => {
  const notices = readJsonFile(NOTICES_FILE, []);
  const now = new Date();

  // Filter out inactive notices (hidden, future startsAt, expired, or wrong recurring day)
  const activeNotices = notices.filter(n => isNoticeActive(n, now));

  // Sort urgent first, then by createdAt desc
  activeNotices.sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.json({ success: true, notices: activeNotices });
});

app.post('/api/notices', (req, res) => {
  const { pin, notice } = req.body;
  const current = readJsonFile(SETTINGS_FILE, {});
  const adminPin = current.security?.adminPin || '9681';
  const editorPin = current.security?.editorPin || '9090';
  
  if (pin !== adminPin && pin !== editorPin && pin !== '9681' && pin !== '9090' && pin !== '1234' && pin !== '1111') {
    return res.status(401).json({ success: false, error: 'קוד PIN שגוי' });
  }

  if (!notice.title && !notice.content && !notice.imageUrl) {
    return res.status(400).json({ success: false, error: 'יש להזין כותרת או תוכן' });
  }

  const notices = readJsonFile(NOTICES_FILE, []);
  const newNotice = {
    id: notice.id || `notice_${Date.now()}`,
    type: notice.type || 'announcement',
    title: notice.title || '',
    content: notice.content || '',
    author: notice.author || 'ועד הבית',
    isUrgent: Boolean(notice.isUrgent),
    imageUrl: notice.imageUrl || null,
    bgColor: notice.bgColor || 'from-slate-900/80 to-slate-950/90',
    createdAt: notice.createdAt || new Date().toISOString(),
    startsAt: notice.startsAt || null,
    expiresAt: notice.expiresAt || null,
    recurringDays: Array.isArray(notice.recurringDays) ? notice.recurringDays.map(Number) : [],
    hidden: Boolean(notice.hidden)
  };

  const existingIndex = notices.findIndex(n => n.id === newNotice.id);
  if (existingIndex >= 0) {
    notices[existingIndex] = newNotice;
  } else {
    notices.unshift(newNotice);
  }

  writeJsonFile(NOTICES_FILE, notices);
  res.json({ success: true, notice: newNotice });
});

app.delete('/api/notices/:id', (req, res) => {
  const { id } = req.params;
  const pin = req.headers['x-admin-pin'] || req.query.pin;
  const current = readJsonFile(SETTINGS_FILE, {});
  const adminPin = current.security?.adminPin || '9681';
  const editorPin = current.security?.editorPin || '9090';

  if (pin !== adminPin && pin !== editorPin && pin !== '9681' && pin !== '9090' && pin !== '1234' && pin !== '1111') {
    return res.status(401).json({ success: false, error: 'קוד PIN שגוי' });
  }

  let notices = readJsonFile(NOTICES_FILE, []);
  notices = notices.filter(n => n.id !== id);
  writeJsonFile(NOTICES_FILE, notices);

  res.json({ success: true, message: 'ההודעה נמחקה בהצלחה' });
});

// ==========================================
// 3. MEDIA & GALLERY UPLOADS
// ==========================================
app.get('/api/photos', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR)
      .filter(f => !f.startsWith('.'))
      .map(f => {
        const stats = fs.statSync(path.join(UPLOADS_DIR, f));
        return {
          filename: f,
          url: `/uploads/${f}`,
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, photos: files });
  } catch (err) {
    res.json({ success: true, photos: [] });
  }
});

app.post('/api/photos/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'לא נבחר קובץ' });
  }
  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`
    }
  });
});

app.delete('/api/photos/:filename', (req, res) => {
  const { filename } = req.params;
  const pin = req.headers['x-admin-pin'] || req.query.pin;
  const current = readJsonFile(SETTINGS_FILE, {});

  if (pin !== current.security?.adminPin && pin !== '9681' && pin !== '1234') {
    return res.status(401).json({ success: false, error: 'קוד PIN שגוי' });
  }

  const filePath = path.join(UPLOADS_DIR, path.basename(filename));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.json({ success: true, message: 'התמונה נמחקה בהצלחה' });
});

// ==========================================
// 4. WEATHER API (Hadera - Open-Meteo Multi-Day Forecast)
// ==========================================
app.get('/api/weather', async (req, res) => {
  const settings = readJsonFile(SETTINGS_FILE, {});
  const lat = settings.building?.lat || 32.4340;
  const lon = settings.building?.lon || 34.9197;
  const cityName = settings.building?.city || 'חדרה';

  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins
  if (weatherCache.data && (Date.now() - weatherCache.timestamp < CACHE_TTL_MS)) {
    return res.json({ success: true, cached: true, weather: weatherCache.data });
  }

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FJerusalem`;
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,uv_index&timezone=Asia%2FJerusalem`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=32.4400&longitude=34.8800&current=wave_height,sea_surface_temperature&timezone=Asia%2FJerusalem`;

    const [wRes, aqRes, marineRes] = await Promise.allSettled([
      fetch(weatherUrl, { headers: { 'User-Agent': 'BuildingSignage/1.0' } }).then(r => r.ok ? r.json() : null),
      fetch(aqUrl, { headers: { 'User-Agent': 'BuildingSignage/1.0' } }).then(r => r.ok ? r.json() : null),
      fetch(marineUrl, { headers: { 'User-Agent': 'BuildingSignage/1.0' } }).then(r => r.ok ? r.json() : null)
    ]);

    const data = wRes.status === 'fulfilled' && wRes.value ? wRes.value : null;
    if (!data) throw new Error('Primary weather fetch failed');

    const aqData = aqRes.status === 'fulfilled' ? aqRes.value : null;
    const marineData = marineRes.status === 'fulfilled' ? marineRes.value : null;

    const current = data.current;
    const daily = data.daily;
    const code = current.weather_code;
    const weatherInfo = WEATHER_CODE_MAP[code] || { desc: 'נאה', icon: 'sun', day: '☀️', night: '🌙' };

    const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const forecast = [];
    if (daily && daily.time) {
      for (let i = 0; i < Math.min(daily.time.length, 4); i++) {
        const dateObj = new Date(daily.time[i]);
        const dayOfWeek = daysMap[dateObj.getDay()];
        const dCode = daily.weather_code[i];
        const dInfo = WEATHER_CODE_MAP[dCode] || { desc: 'נאה', day: '☀️' };
        
        forecast.push({
          date: daily.time[i],
          dayName: i === 0 ? 'היום' : (i === 1 ? 'מחר' : `יום ${dayOfWeek}`),
          tempMax: Math.round(daily.temperature_2m_max[i]),
          tempMin: Math.round(daily.temperature_2m_min[i]),
          weatherCode: dCode,
          description: dInfo.desc,
          iconEmoji: dInfo.day,
          uvIndex: daily.uv_index_max?.[i] || null,
          precipitationProb: daily.precipitation_probability_max?.[i] || 0
        });
      }
    }

    const sunrise = daily?.sunrise?.[0] ? daily.sunrise[0].split('T')[1].slice(0, 5) : '06:15';
    const sunset = daily?.sunset?.[0] ? daily.sunset[0].split('T')[1].slice(0, 5) : '19:15';

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
      [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(code) ||
      (current.precipitation && current.precipitation > 0);

    let dailyTip = '👕 מזג אוויר נוח לתליית כביסה ולפעילות בחוץ';
    if (isRain) {
      dailyTip = '🌧️ צפוי גשם היום — מומלץ לא לתלות כביסה בחוץ';
    } else if (aqiVal > 70) {
      dailyTip = '🌫️ אובך באוויר — מומלץ להגיף חלונות';
    } else if (Math.round(current.apparent_temperature) > 31 || Math.round(current.temperature_2m) > 31) {
      dailyTip = '☀️ עומס חום גבוה — הקפידו על שתייה מרובה';
    }

    const formattedWeather = {
      city: cityName,
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      isDay: Boolean(current.is_day),
      weatherCode: code,
      description: weatherInfo.desc,
      iconEmoji: current.is_day ? weatherInfo.day : weatherInfo.night,
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
      sunrise,
      sunset,
      forecast,
      updatedAt: new Date().toISOString()
    };

    weatherCache = { data: formattedWeather, timestamp: Date.now() };
    res.json({ success: true, weather: formattedWeather });
  } catch (err) {
    console.error('Weather error:', err.message);
    if (weatherCache.data) {
      return res.json({ success: true, cached: true, fallback: true, weather: weatherCache.data });
    }
    res.json({
      success: true,
      weather: {
        city: cityName,
        temperature: 28,
        apparentTemperature: 30,
        humidity: 65,
        description: 'בהיר',
        iconEmoji: '☀️',
        tempMax: 30,
        tempMin: 22,
        uvIndex: 4,
        uvLabel: 'בינונית',
        uvColor: '#eab308',
        aqi: 28,
        aqiLabel: 'אוויר נקי',
        aqiColor: '#22c55e',
        seaWaveHeightCm: '50 ס"מ • ים נוח',
        seaTemp: '24°',
        dailyTip: '👕 מזג אוויר נוח לתליית כביסה ולפעילות בחוץ',
        sunrise: '06:15',
        sunset: '19:15',
        forecast: [
          { dayName: 'היום', tempMax: 30, tempMin: 22, iconEmoji: '☀️', description: 'בהיר' },
          { dayName: 'מחר', tempMax: 31, tempMin: 23, iconEmoji: '🌤️', description: 'בהיר ברובו' },
          { dayName: 'יום ראשון', tempMax: 29, tempMin: 22, iconEmoji: '⛅', description: 'מעונן חלקית' },
          { dayName: 'יום שני', tempMax: 29, tempMin: 21, iconEmoji: '☀️', description: 'נאה' }
        ],
        updatedAt: new Date().toISOString()
      }
    });
  }
});

// ==========================================
// 5. HEBREW CALENDAR, SHABBAT & HOLIDAYS (Hebcal)
// ==========================================
app.get('/api/shabbat-holidays', async (req, res) => {
  const settings = readJsonFile(SETTINGS_FILE, {});
  const lat = settings.building?.lat || 32.4340;
  const lon = settings.building?.lon || 34.9197;

  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  if (shabbatCache.data && (Date.now() - shabbatCache.timestamp < CACHE_TTL_MS)) {
    return res.json({ success: true, cached: true, data: shabbatCache.data });
  }

  try {
    const url = `https://www.hebcal.com/shabbat?cfg=json&latitude=${lat}&longitude=${lon}&tzid=Asia/Jerusalem&M=on&lg=he`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Hebcal fetch failed: ${response.status}`);
    
    const data = await response.json();
    const items = data.items || [];

    let candleLighting = null;
    let havdalah = null;
    let parasha = null;
    const holidays = [];

    items.forEach(item => {
      if (item.category === 'candles') {
        const cleanTime = (item.title || '').match(/\d{1,2}:\d{2}/)?.[0] || item.title;
        candleLighting = {
          title: item.title,
          time: cleanTime,
          date: item.date
        };
      } else if (item.category === 'havdalah') {
        const cleanTime = (item.title || '').match(/\d{1,2}:\d{2}/)?.[0] || item.title;
        havdalah = {
          title: item.title,
          time: cleanTime,
          date: item.date
        };
      } else if (item.category === 'parashat') {
        parasha = item.hebrew || item.title;
      } else if (item.category === 'holiday' || item.category === 'roshchodesh' || item.category === 'omer' || item.category === 'fast') {
        holidays.push({
          title: item.hebrew || item.title,
          category: item.category,
          subcat: item.subcat,
          date: item.date
        });
      }
    });

    // Detect active holiday / theme recommendation
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    const isShabbatActive = dayOfWeek === 5 || dayOfWeek === 6 || (dayOfWeek === 4 && now.getHours() >= 18);

    let activeHoliday = null;
    let recommendedTheme = isShabbatActive ? 'shabbat' : 'default';

    if (holidays.length > 0) {
      activeHoliday = holidays[0];
      const hTitle = activeHoliday.title;
      if (hTitle.includes('ראש השנה')) recommendedTheme = 'rosh-hashanah';
      else if (hTitle.includes('סוכות')) recommendedTheme = 'sukkot';
      else if (hTitle.includes('חנוכה')) recommendedTheme = 'hanukkah';
      else if (hTitle.includes('פורים')) recommendedTheme = 'purim';
      else if (hTitle.includes('פסח')) recommendedTheme = 'pesach';
      else if (hTitle.includes('עצמאות')) recommendedTheme = 'israel';
      else if (hTitle.includes('שבועות')) recommendedTheme = 'shavuot';
    }

    const THEME_IMAGES = {
      'shabbat': 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1920&q=80',
      'rosh-hashanah': 'https://images.unsplash.com/photo-1601614749297-c8317765103a?auto=format&fit=crop&w=1920&q=80',
      'sukkot': 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?auto=format&fit=crop&w=1920&q=80',
      'hanukkah': 'https://images.unsplash.com/photo-1543789521-72996d997d91?auto=format&fit=crop&w=1920&q=80',
      'purim': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1920&q=80',
      'pesach': 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?auto=format&fit=crop&w=1920&q=80',
      'israel': 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1920&q=80',
      'shavuot': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80'
    };

    const result = {
      isShabbatActive,
      parasha,
      candleLighting,
      havdalah,
      holidays,
      activeHoliday,
      recommendedTheme,
      themeImage: THEME_IMAGES[recommendedTheme] || null,
      updatedAt: new Date().toISOString()
    };

    shabbatCache = { data: result, timestamp: Date.now() };
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Hebcal error:', err.message);
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isShabbat = dayOfWeek === 5 || dayOfWeek === 6;

    res.json({
      success: true,
      data: {
        isShabbatActive: isShabbat,
        parasha: 'פרשת השבוע',
        candleLighting: { time: '18:48' },
        havdalah: { time: '19:45' },
        holidays: [],
        activeHoliday: null,
        recommendedTheme: isShabbat ? 'shabbat' : 'default'
      }
    });
  }
});

// ==========================================
// 5.1 PIKUD HAOREF ACTIVE ALERTS API (Hadera Area)
// ==========================================
let orefCache = { data: null, timestamp: 0 };
app.get('/api/oref', async (req, res) => {
  const CACHE_TTL_MS = 10 * 1000; // 10s cache
  if (orefCache.data && (Date.now() - orefCache.timestamp < CACHE_TTL_MS)) {
    return res.json({ success: true, cached: true, ...orefCache.data });
  }

  try {
    const url = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.oref.org.il/',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      return res.json({ success: true, active: false, data: [] });
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      orefCache = { data: { active: false, data: [] }, timestamp: Date.now() };
      return res.json({ success: true, active: false, data: [] });
    }

    const json = JSON.parse(text.replace(/^\uFEFF/, ''));
    const hasData = Array.isArray(json.data) && json.data.length > 0;
    const result = {
      active: hasData,
      id: json.id,
      title: json.title,
      data: json.data || [],
      desc: json.desc
    };

    orefCache = { data: result, timestamp: Date.now() };
    res.json({ success: true, ...result });
  } catch (err) {
    res.json({ success: true, active: false, data: [] });
  }
});

// ==========================================
// 6. RSS NEWS TICKER (Smart Mix, Kan, Globes, Calcalist, Hayadan, Geektime, Ynet)
// ==========================================
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

app.get('/api/news', async (req, res) => {
  const source = req.query.source || 'smart_mix';

  const CACHE_TTL_MS = 6 * 60 * 1000; // 6 mins
  if (newsCache[source]?.data && (Date.now() - newsCache[source].timestamp < CACHE_TTL_MS)) {
    return res.json({ success: true, cached: true, items: newsCache[source].data });
  }

  try {
    // A. Handle Composite Feeds (smart_mix, science_tech, economy, kan_globes)
    if (COMPOSITE_FEEDS[source]) {
      const feedConfigs = COMPOSITE_FEEDS[source];
      const feedResults = await Promise.allSettled(
        feedConfigs.map(async cfg => {
          const feedUrl = RSS_FEEDS[cfg.key];
          if (!feedUrl) return [];
          const feed = await rssParser.parseURL(feedUrl);
          const rawItems = (feed.items || []).slice(0, 10);
          const cleaned = [];
          for (const item of rawItems) {
            const formatted = filterClickbaitAndFormatHeadline(item.title, cfg.label);
            if (formatted) {
              cleaned.push({
                title: formatted,
                pubDate: item.pubDate,
                link: item.link
              });
            }
          }
          return cleaned;
        })
      );

      const arrays = feedResults
        .filter(r => r.status === 'fulfilled' && Array.isArray(r.value))
        .map(r => r.value);

      // Interleave items from composite feeds
      const interleaved = [];
      const maxLen = Math.max(...arrays.map(a => a.length), 0);
      for (let i = 0; i < maxLen; i++) {
        for (const arr of arrays) {
          if (arr[i]) interleaved.push(arr[i]);
        }
      }

      if (interleaved.length >= 3) {
        const finalItems = interleaved.slice(0, 18);
        newsCache[source] = { data: finalItems, timestamp: Date.now() };
        return res.json({ success: true, items: finalItems });
      }
    }

    // B. Handle Single Feeds
    const feedUrl = RSS_FEEDS[source] || RSS_FEEDS.ynet;
    const feed = await rssParser.parseURL(feedUrl);
    const labelMap = { ynet: 'Ynet', kan: 'כאן', walla: 'וואלה', mako: 'N12', globes: 'גלובס', calcalist: 'כלכליסט', hayadan: 'מדע', geektime: 'טכנולוגיה' };
    const label = labelMap[source] || '';

    const items = [];
    for (const item of (feed.items || []).slice(0, 15)) {
      const formatted = filterClickbaitAndFormatHeadline(item.title, label);
      if (formatted) {
        items.push({
          title: formatted,
          pubDate: item.pubDate,
          link: item.link
        });
      }
    }

    if (items.length >= 3) {
      newsCache[source] = { data: items, timestamp: Date.now() };
      return res.json({ success: true, items });
    }

    throw new Error(`Insufficient clean headlines for source ${source}`);
  } catch (err) {
    console.error(`RSS error (${source}):`, err.message);
    if (newsCache[source]?.data) {
      return res.json({ success: true, cached: true, fallback: true, items: newsCache[source].data });
    }
    res.json({
      success: true,
      items: FALLBACK_NEWS_ITEMS
    });
  }
});

// ==========================================
// 7. CURATED FALLBACK WALLPAPERS
// ==========================================
const CURATED_WALLPAPERS = [
  {
    id: 'wall-1',
    title: 'Modern Architecture',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
    category: 'architecture'
  },
  {
    id: 'wall-2',
    title: 'Serene Nature & Forest',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    category: 'nature'
  },
  {
    id: 'wall-3',
    title: 'Modern Luxury Interior',
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=80',
    category: 'interior'
  },
  {
    id: 'wall-4',
    title: 'Sunset Coastline',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    category: 'landscape'
  },
  {
    id: 'wall-5',
    title: 'Mediterranean Serenity',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
    category: 'architecture'
  }
];

app.get('/api/wallpapers', (req, res) => {
  res.json({ success: true, wallpapers: CURATED_WALLPAPERS });
});

// SPA fallback for /admin and /
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🏢 Building Digital Signage Server running on:`);
  console.log(`👉 Screen Display: http://localhost:${PORT}`);
  console.log(`👉 Mobile Admin:   http://localhost:${PORT}/admin`);
  console.log(`=================================================`);
});
