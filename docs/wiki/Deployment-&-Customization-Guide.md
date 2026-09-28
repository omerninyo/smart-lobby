# 🌍 Deployment & Customization Guide

Launch a smart lobby digital signage board for your building in 3 minutes using GitHub Pages and Firebase:

---

## 🚀 Quick Launch (3-Minute Setup)

1. **Fork or Use Template:** Click **'Use this template'** or **'Fork'** on the main GitHub repository.
2. **Configure Building Details:** Edit `data/settings.json` with your building name, city, and GPS coordinates (used for automatic Shabbat and weather calculations).
3. **Enable GitHub Pages:**
   * Go to **Settings ➡️ Pages** in your repository.
   * Under **Build and deployment**, select **Deploy from a branch** ➡️ choose `main` / `root`.
   * Your lobby dashboard is immediately live at `https://<your-username>.github.io/<repo-name>/`!

---

## ⚡ Real-Time Cloud Sync (Firebase Firestore)

To enable live updates between committee members' mobile phones and the lobby screen:

1. **Create Firebase Project:** Open [Google Firebase Console](https://console.firebase.google.com) and create a free project.
2. **Provision Cloud Firestore:** In the Firebase menu, go to **Build ➡️ Firestore Database ➡️ Create database** (choose a close region like `eur3` or `me-west1`).
3. **Apply Permanent Security Rules:**
   * Open the **Rules** tab in Firestore.
   * Replace the default 30-day expiring rule with [`firestore.rules`](../../firestore.rules):
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /smart_lobby/{docId} {
           allow read, write: if true;
         }
       }
     }
     ```
   * Click **Publish**. *(This ensures your database never expires or gets locked by Google).*
4. **Add Web App Credentials:**
   * In Project Settings, create a Web app (`</>`).
   * Copy `js/config.example.js` to `js/config.js` and paste your Firebase credentials.
   * Push changes to GitHub.

For a deeper dive into cloud sync architecture and telemetry, see [Real-Time Firebase Cloud Sync](Real-Time-Firebase-Cloud-Sync.md).

---

## 📺 Tablet & Hardware Installation

For wall-mounted Android tablets or commercial smart screens in the lobby:
* Install [Webview Kiosk](Hardware-&-Android-Kiosk-Setup.md) (100% Free & Open Source) or Fully Kiosk Browser.
* Set the Start URL to your live lobby screen.
* Enable Kiosk / Pinning mode and Autoplay audio.

