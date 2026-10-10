const fs = require("fs");
const path = require("path");

// Build-time additions on top of app.json:
//
// Firebase (google-services.json) — needed for push notifications on Android
// (loud new-order alerts while the app is closed or the phone is locked).
// Put the file next to this one, or point GOOGLE_SERVICES_JSON at it (e.g. an
// EAS file environment variable). The Firebase Android app's package must be
// com.gorush.merchant.
module.exports = ({ config }) => {
  const next = { ...config, android: { ...config.android } };
  const servicesFile = process.env.GOOGLE_SERVICES_JSON || path.join(__dirname, "google-services.json");
  if (fs.existsSync(servicesFile)) next.android.googleServicesFile = servicesFile;
  return next;
};
