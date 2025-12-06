export default {
  expo: {
    name: "Дневник пикфлоуметрии",
    slug: "peak-flow-diary",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    
    splash: {
      backgroundColor: "#2D6A93"
    },
    
    updates: {
      fallbackToCacheTimeout: 0
    },
    
    assetBundlePatterns: [
      "**/*"
    ],
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.oxia.peakflowdiary",
      buildNumber: "1",
      infoPlist: {
        NSHealthShareUsageDescription: "Приложение использует данные о здоровье для отслеживания показателей дыхания.",
        NSHealthUpdateUsageDescription: "Приложение сохраняет данные о показателях дыхания в Health приложении.",
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1E4C60"
      },
      package: "com.oxia.peakflowdiary",
      versionCode: 7,
      permissions: []
    },
    
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    
    plugins: [],
    
    extra: {
      eas: {
        projectId: "ca48f9ec-0c57-4293-a7ed-ba85666de272"
      }
    }
  }
};


