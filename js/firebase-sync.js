/**
 * Firebase Real-time Global Cloud Sync Module
 * Project: Smart Digital Signage - הירדן 5 חדרה
 * Production URL: https://lobby.ninyo.co
 */

(function(window) {
  "use strict";

  const defaultFirebaseConfig = {
    apiKey: "AIzaSyAj6G1ur6BK4OLiId1K2ABi2-_UtRAsEfY",
    authDomain: "smart-lobby-yarden.firebaseapp.com",
    projectId: "smart-lobby-yarden",
    storageBucket: "smart-lobby-yarden.firebasestorage.app",
    messagingSenderId: "183421780763",
    appId: "1:183421780763:web:406f212c8efe8dc5f309be",
    measurementId: "G-RPM140HVZD"
  };

  const firebaseConfig = (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && !window.FIREBASE_CONFIG.apiKey.startsWith('YOUR_'))
    ? window.FIREBASE_CONFIG
    : defaultFirebaseConfig;

  class FirebaseSyncManager {
    constructor() {
      this.app = null;
      this.db = null;
      this.isInitialized = false;
      this.settingsListeners = [];
      this.noticesListeners = [];
      this.initPromise = null;
    }

    async init() {
      if (this.initPromise) return this.initPromise;

      this.initPromise = new Promise(async (resolve) => {
        try {
          if (typeof firebase === "undefined") {
            console.warn("[FirebaseSync] Firebase SDK not loaded on window.");
            resolve(false);
            return;
          }

          if (!firebase.apps.length) {
            this.app = firebase.initializeApp(firebaseConfig);
          } else {
            this.app = firebase.app();
          }

          this.db = firebase.firestore();

          // Try enabling offline persistence where supported
          try {
            await this.db.enablePersistence({ synchronizeTabs: true });
          } catch (persistErr) {
            // Unimplemented or multiple tabs open - safe to continue
          }

          this.isInitialized = true;
          console.log("[FirebaseSync] 🟢 Connected to Firebase Cloud Firestore successfully!");

          // Start listening to real-time changes
          this.startRealtimeSubscriptions();
          resolve(true);
        } catch (err) {
          console.error("[FirebaseSync] ⚠️ Firebase initialization error:", err);
          this.isInitialized = false;
          resolve(false);
        }
      });

      return this.initPromise;
    }

    startRealtimeSubscriptions() {
      if (!this.db) return;

      // 1. Listen to Settings changes
      try {
        this.db.collection("smart_lobby").doc("settings").onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            console.log("[FirebaseSync] ⚡ Live Settings update received from cloud:", data);
            
            // Save to LocalStorage cache
            try {
              localStorage.setItem("smart_lobby_settings", JSON.stringify(data));
            } catch (e) {}

            // Notify all registered listeners
            this.settingsListeners.forEach(fn => {
              try { fn(data); } catch (e) { console.error(e); }
            });
          }
        }, (err) => {
          console.warn("[FirebaseSync] Settings snapshot listener warning:", err.message);
        });
      } catch (e) {
        console.warn("[FirebaseSync] Could not attach settings listener:", e);
      }

      // 2. Listen to Notices changes
      try {
        this.db.collection("smart_lobby").doc("notices").onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            const notices = data.items || [];
            console.log("[FirebaseSync] ⚡ Live Notices update received from cloud:", notices.length, "notices");
            
            // Save to LocalStorage cache
            try {
              localStorage.setItem("smart_lobby_notices", JSON.stringify(notices));
            } catch (e) {}

            // Notify all registered listeners
            this.noticesListeners.forEach(fn => {
              try { fn(notices); } catch (e) { console.error(e); }
            });
          }
        }, (err) => {
          console.warn("[FirebaseSync] Notices snapshot listener warning:", err.message);
        });
      } catch (e) {
        console.warn("[FirebaseSync] Could not attach notices listener:", e);
      }
    }

    // Register callback for settings updates
    onSettingsChanged(callback) {
      if (typeof callback === "function") {
        this.settingsListeners.push(callback);
      }
    }

    // Register callback for notices updates
    onNoticesChanged(callback) {
      if (typeof callback === "function") {
        this.noticesListeners.push(callback);
      }
    }

    // Fetch Settings from cloud once
    async getSettings() {
      if (!this.db) await this.init();
      if (!this.db) return null;

      try {
        const doc = await this.db.collection("smart_lobby").doc("settings").get();
        if (doc.exists) {
          const data = doc.data();
          try { localStorage.setItem("smart_lobby_settings", JSON.stringify(data)); } catch (e) {}
          return data;
        }
      } catch (err) {
        console.warn("[FirebaseSync] getSettings error, falling back to local:", err);
      }
      return null;
    }

    // Save Settings to cloud
    async saveSettings(settingsData) {
      if (!this.db) await this.init();
      if (!this.db) return false;

      try {
        await this.db.collection("smart_lobby").doc("settings").set(settingsData, { merge: true });
        console.log("[FirebaseSync] 💾 Settings successfully saved to Firebase Cloud!");
        return true;
      } catch (err) {
        console.error("[FirebaseSync] ❌ Error saving settings to cloud:", err);
        return false;
      }
    }

    // Fetch Notices from cloud once
    async getNotices() {
      if (!this.db) await this.init();
      if (!this.db) return null;

      try {
        const doc = await this.db.collection("smart_lobby").doc("notices").get();
        if (doc.exists) {
          const data = doc.data();
          const items = data.items || [];
          try { localStorage.setItem("smart_lobby_notices", JSON.stringify(items)); } catch (e) {}
          return items;
        }
      } catch (err) {
        console.warn("[FirebaseSync] getNotices error, falling back to local:", err);
      }
      return null;
    }

    // Save Notices Array to cloud
    async saveNotices(noticesArray) {
      if (!this.db) await this.init();
      if (!this.db) return false;

      try {
        await this.db.collection("smart_lobby").doc("notices").set({
          items: noticesArray,
          updatedAt: new Date().toISOString()
        });
        console.log("[FirebaseSync] 💾 Notices list saved to Firebase Cloud!");
        return true;
      } catch (err) {
        console.error("[FirebaseSync] ❌ Error saving notices to cloud:", err);
        return false;
      }
    }

    // Automatically seeds default JSON files into Firestore if cloud collection is currently empty
    async seedIfEmpty(defaultSettings, defaultNotices) {
      if (!this.db) await this.init();
      if (!this.db) return;

      try {
        const settingsDoc = await this.db.collection("smart_lobby").doc("settings").get();
        if (!settingsDoc.exists && defaultSettings) {
          console.log("[FirebaseSync] 🚀 Seeding initial settings to Firebase Cloud...");
          await this.saveSettings(defaultSettings);
        }

        const noticesDoc = await this.db.collection("smart_lobby").doc("notices").get();
        if (!noticesDoc.exists && defaultNotices) {
          console.log("[FirebaseSync] 🚀 Seeding initial notices to Firebase Cloud...");
          await this.saveNotices(defaultNotices);
        }
      } catch (e) {
        console.warn("[FirebaseSync] Seeding check note:", e);
      }
    }
  }

  window.FirebaseSync = new FirebaseSyncManager();

})(window);
