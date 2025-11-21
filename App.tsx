import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import AppNavigator from './src/AppNavigator';

export default function App() {
  useEffect(() => {
    // Регистрация Service Worker для PWA (только на веб)
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(registration => {
            console.log('✅ Service Worker registered:', registration);
          })
          .catch(error => {
            console.log('❌ Service Worker registration failed:', error);
          });
      });
    }

    // Vercel Analytics - работает только на веб
    if (Platform.OS === 'web') {
      try {
        // Используем динамический импорт с webpackChunkName
        const loadAnalytics = async () => {
          try {
            const analytics = await import(/* webpackChunkName: "vercel-analytics" */ '@vercel/analytics');
            if (analytics && analytics.inject) {
              analytics.inject();
              console.log('✅ Vercel Analytics initialized');
            }
          } catch (err) {
            console.log('❌ Vercel Analytics load failed:', err);
          }
        };
        loadAnalytics();
      } catch (error) {
        console.log('❌ Vercel Analytics import failed:', error);
      }

      // Yandex.Metrika загружается из HTML (web/index.html)
      console.log('ℹ️ Yandex.Metrika loads from HTML template');
    }
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}



