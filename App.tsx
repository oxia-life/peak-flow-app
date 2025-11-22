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

    // Web-only features
    if (Platform.OS === 'web') {
      // Vercel Analytics
      try {
        const loadAnalytics = async () => {
          try {
            const analytics = await import('@vercel/analytics');
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

      // Yandex.Metrika - полная реализация с оригинальными параметрами
      try {
        // Инициализируем функцию-заглушку (из оригинального кода Яндекса)
        (window as any).ym = (window as any).ym || function() {
          ((window as any).ym.a = (window as any).ym.a || []).push(arguments);
        };
        (window as any).ym.l = 1 * new Date();
        
        // Проверяем, не загружен ли уже скрипт
        const existingScript = Array.from(document.scripts).find(
          s => s.src === 'https://mc.yandex.ru/metrika/tag.js?id=105448967'
        );
        
        if (!existingScript) {
          // Загружаем скрипт с ID (оригинальный подход Яндекса)
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          script.src = 'https://mc.yandex.ru/metrika/tag.js?id=105448967';
          script.onload = () => console.log('✅ Yandex.Metrika script loaded');
          script.onerror = (e) => console.log('❌ Yandex.Metrika script failed:', e);
          
          const firstScript = document.getElementsByTagName('script')[0];
          if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
          } else {
            document.head.appendChild(script);
          }
        }
        
        // Инициализируем счетчик с ПОЛНЫМИ параметрами от Яндекса
        (window as any).ym(105448967, 'init', {
          ssr: true,
          webvisor: true,
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          ecommerce: "dataLayer"
        });
        
        console.log('✅ Yandex.Metrika initialized with full params');
      } catch (error) {
        console.log('❌ Yandex.Metrika error:', error);
      }
    }
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}



