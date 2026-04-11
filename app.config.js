// app.config.js — using JS instead of app.json so we can add comments.
// Expo picks this up automatically; app.json is no longer read when this file exists.

export default {
  expo: {
    name: "MouthQuest",
    slug: "MouthQuest",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "MouthQuest uses your location to find restaurants nearby.",
      },
    },
    android: {
      permissions: ["ACCESS_FINE_LOCATION"],
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },

    // New Architecture is intentionally disabled.
    // react-native-deck-swiper (v2.0.19, our swipe card library) does not support
    // the New Architecture (Fabric renderer / JSI). Enabling it breaks the swiper.
    // Revisit when react-native-deck-swiper publishes New Architecture support,
    // or when we replace it with a Fabric-compatible alternative.
    newArchEnabled: false,
  },
};
