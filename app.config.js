const fs = require("fs");
const path = require("path");

// Build-time additions on top of app.json:
//
// 1. Firebase (google-services.json) — needed for push notifications on
//    Android (loud new-order alerts while the app is closed or the phone is
//    locked). Put the file next to this one, or point GOOGLE_SERVICES_JSON at
//    it (e.g. an EAS file environment variable). The Firebase Android app's
//    package must be com.gorush.merchant.
//
// 2. Plain-http API traffic. app.json disables it (preview / production
//    builds talk to the HTTPS API only); development builds and local runs
//    re-enable it so a backend on the LAN (http://192.168…) still works.
const allowsPlainHttp = (profile = process.env.EAS_BUILD_PROFILE) => !profile || profile === "development";

const withPlainHttp = (plugins = []) =>
  plugins.map((p) =>
    Array.isArray(p) && p[0] === "expo-build-properties"
      ? [p[0], { ...p[1], android: { ...(p[1]?.android ?? {}), usesCleartextTraffic: true } }]
      : p
  );

module.exports = ({ config }) => {
  const next = { ...config, android: { ...config.android } };
  const servicesFile = process.env.GOOGLE_SERVICES_JSON || path.join(__dirname, "google-services.json");
  if (fs.existsSync(servicesFile)) next.android.googleServicesFile = servicesFile;

  if (allowsPlainHttp()) next.plugins = withPlainHttp(config.plugins);

  return next;
};
