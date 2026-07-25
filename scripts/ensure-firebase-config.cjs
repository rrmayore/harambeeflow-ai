const fs = require('fs');
const path = require('path');

const DEFAULT_FIREBASE_CONFIG = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "harambeeflow",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:991042439020:web:8996339bb8d18bd4121549",
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD6CTXy_YMZniq3CLBcdO_rEtRn1AOyySE",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "harambeeflow.firebaseapp.com",
  firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-harambeeflowai-6b7cbd54-bb1f-4ee2-9d86-5807fcaeec9b",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "harambeeflow.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "991042439020",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  recaptchaSiteKey: process.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || ""
};

function ensureFirebaseConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let isValid = false;

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8').trim();
      if (content.length > 0) {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && parsed.projectId && parsed.apiKey) {
          isValid = true;
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ firebase-applet-config.json contains invalid JSON or is unparseable:', err.message);
  }

  if (!isValid) {
    console.log('🔄 Regenerating valid firebase-applet-config.json to prevent build failure...');
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2), 'utf-8');
    console.log('✅ firebase-applet-config.json successfully regenerated.');
  } else {
    console.log('✅ firebase-applet-config.json is valid.');
  }
}

if (require.main === module) {
  ensureFirebaseConfig();
}

module.exports = { ensureFirebaseConfig, DEFAULT_FIREBASE_CONFIG };
