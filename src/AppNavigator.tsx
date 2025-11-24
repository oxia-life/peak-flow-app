import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Svg, { Path, Line, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Storage from './services/Storage';
import SupabaseService from './services/SupabaseService';
import { Session } from '@supabase/supabase-js';

// Auth screen
import AuthScreen from './screens/AuthScreen';

// Onboarding screens
import WelcomeScreen from './screens/onboarding/WelcomeScreen';
import ProfileSetupScreen from './screens/onboarding/ProfileSetupScreen';

// Main screens
import DiaryScreen from './screens/DiaryScreen';
import GraphScreen from './screens/GraphScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import AddEntryScreen from './screens/AddEntryScreen';

export type AuthStackParamList = {
  Auth: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  ProfileSetup: undefined;
};

export type DiaryStackParamList = {
  DiaryMain: undefined;
  AddEntry: undefined;
};

export type MainTabParamList = {
  Diary: undefined;
  Graph: undefined;
  AddButton: undefined; // Пустая вкладка для центральной кнопки
  History: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Auth" component={AuthScreen} />
    </AuthStack.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </OnboardingStack.Navigator>
  );
}

function DiaryNavigator() {
  return (
    <DiaryStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <DiaryStack.Screen name="DiaryMain" component={DiaryScreen} />
      <DiaryStack.Screen 
        name="AddEntry" 
        component={AddEntryScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </DiaryStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontFamily: Platform.select({
            ios: 'SF Pro Display',
            android: 'System',
            web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            default: 'System',
          }),
          fontSize: 12,
          fontWeight: '400',
          lineHeight: 12,
          letterSpacing: 0,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 83 : 65,
          paddingBottom: Platform.OS === 'ios' ? 34 : 10,
          paddingTop: 5,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          ...(Platform.OS === 'web' && {
            // @ts-ignore - Web-specific property
            boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.15)',
          }),
        },
      }}
      tabBar={(props) => {
        const { state, descriptors, navigation } = props;
        
        return (
          <View style={tabStyles.tabBarContainer}>
            {/* Левая секция - Дневник */}
            <Pressable
              style={tabStyles.sideTab}
              onPress={() => navigation.navigate('Graph')}
            >
              <CalendarIcon color={state.index === 0 ? '#000000' : '#999'} />
              <Text style={[
                tabStyles.tabLabel,
                { color: state.index === 0 ? '#000000' : '#999' }
              ]}>
                Дневник
              </Text>
            </Pressable>

            {/* Центральная кнопка + */}
            <AddButtonWithNavigation />

            {/* Правая секция - Настройки */}
            <Pressable
              style={tabStyles.sideTab}
              onPress={() => navigation.navigate('Settings')}
            >
              <SettingsIcon color={state.index === 2 ? '#000000' : '#999'} />
              <Text style={[
                tabStyles.tabLabel,
                { color: state.index === 2 ? '#000000' : '#999' }
              ]}>
                Настройки
              </Text>
            </Pressable>
          </View>
        );
      }}
    >
      <MainTab.Screen 
        name="Graph" 
        component={GraphScreen}
        options={{
          tabBarLabel: 'Дневник',
          tabBarIcon: ({ color }) => <CalendarIcon color={color} />,
        }}
      />
      <MainTab.Screen 
        name="AddButton" 
        component={EmptyComponent}
        options={{
          tabBarLabel: '',
          tabBarButton: () => <AddButtonWithNavigation />,
        }}
      />
      <MainTab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Настройки',
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
        }}
      />
      {/* Скрытые экраны - доступны через навигацию, но не отображаются в TabBar */}
      <MainTab.Screen 
        name="Diary" 
        component={DiaryNavigator}
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <MainTab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </MainTab.Navigator>
  );
}

// Иконка календаря (дневник)
function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Верхняя часть календаря */}
      <Rect x="3" y="6" width="18" height="15" rx="2" stroke={color} strokeWidth="2" fill="none" />
      {/* Линия под заголовком */}
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      {/* Крепления сверху */}
      <Line x1="7" y1="4" x2="7" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="4" x2="17" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Точки - дни */}
      <Circle cx="7" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="17" cy="14" r="1" fill={color} />
      <Circle cx="7" cy="17" r="1" fill={color} />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

// Иконка настроек (шестеренка)
function SettingsIcon({ color }: { color: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Шестеренка */}
      <Path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
    </View>
  );
}

// Пустой компонент для центральной вкладки (она не будет показываться)
function EmptyComponent() {
  return null;
}

// Круглая кнопка "+" в центре навигации
function AddButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        tabStyles.addButton,
        pressed && tabStyles.addButtonPressed,
      ]}
      onPress={onPress}
    >
      <LinearGradient
        colors={['#1E4C60', '#3E9DC6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tabStyles.addButtonInner}
      >
        <View style={tabStyles.plusIcon}>
          <View style={tabStyles.plusHorizontal} />
          <View style={tabStyles.plusVertical} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// Wrapper для AddButton с навигацией
function AddButtonWithNavigation() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  
  const handlePress = () => {
    console.log('Add button pressed!');
    try {
      // @ts-ignore - navigate to nested screen
      navigation.navigate('Diary', { screen: 'AddEntry' });
      console.log('Navigation called successfully');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  
  return <AddButton onPress={handlePress} />;
}

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [profileCache, setProfileCache] = useState<any>(null); // Кеш профиля

  useEffect(() => {
    // Проверка авторизации и онбординга
    checkAuthAndOnboarding();

    // Подписка на изменения авторизации
    const authSubscription = SupabaseService.onAuthStateChange((newSession) => {
      console.log('[Navigator] Auth state changed:', newSession ? 'signed in' : 'signed out');
      setSession(newSession);
      if (newSession) {
        console.log('[Navigator] User authenticated, checking onboarding...');
        // При успешной авторизации проверяем онбординг
        checkOnboardingStatus();
        
        // Очищаем URL от токена после успешной авторизации (веб)
        if (Platform.OS === 'web' && window.location.search.includes('token')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        // При выходе очищаем кеш
        setProfileCache(null);
        setHasOnboarded(false);
      }
    });

    return () => {
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const checkAuthAndOnboarding = async () => {
    try {
      console.log('[Navigator] Checking auth and onboarding...');
      
      // На веб-платформе даем Supabase время обработать токен из URL
      if (Platform.OS === 'web') {
        // Проверяем, есть ли токен в URL (magic link)
        const urlParams = new URLSearchParams(window.location.search);
        const hasToken = urlParams.has('token') || window.location.hash.includes('access_token');
        
        if (hasToken) {
          console.log('[Navigator] Token detected in URL, waiting for Supabase to process...');
          // Даем Supabase время обработать токен
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      const currentSession = await SupabaseService.getSession();
      console.log('[Navigator] Current session:', currentSession ? 'exists' : 'none');
      setSession(currentSession);
      
      if (currentSession) {
        // Проверяем профиль с retry (3 попытки)
        let profile = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!profile && attempts < maxAttempts) {
          attempts++;
          console.log(`[Navigator] Fetching profile (attempt ${attempts}/${maxAttempts})...`);
          profile = await Storage.getProfile();
          
          if (!profile && attempts < maxAttempts) {
            console.log('[Navigator] Profile not found, retrying...');
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        
        console.log('[Navigator] Profile result:', profile ? 'exists' : 'none', profile);
        
        if (!profile) {
          console.log('[Navigator] No profile found after retries - need onboarding');
          setHasOnboarded(false);
          setProfileCache(null);
        } else {
          // Профиль есть - кешируем и устанавливаем статус
          console.log('[Navigator] Profile found - onboarding completed');
          setProfileCache(profile);
          setHasOnboarded(true);
        }
      } else {
        setHasOnboarded(false);
        setProfileCache(null);
      }
    } catch (error) {
      console.error('[Navigator] Error checking auth and onboarding:', error);
      // При ошибке НЕ сбрасываем состояние, если есть кеш
      if (profileCache) {
        console.log('[Navigator] Error occurred, but using cached profile');
        setHasOnboarded(true);
      } else {
        setSession(null);
        setHasOnboarded(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      console.log('[Navigator] Checking onboarding status...');
      
      // Если есть кеш профиля - используем его
      if (profileCache) {
        console.log('[Navigator] Using cached profile');
        setHasOnboarded(true);
        return;
      }
      
      // Проверяем наличие профиля в базе
      const profile = await Storage.getProfile();
      console.log('[Navigator] Onboarding check - profile:', profile ? 'exists' : 'none');
      
      if (profile) {
        setProfileCache(profile);
        setHasOnboarded(true);
      } else {
        setHasOnboarded(false);
      }
    } catch (error) {
      console.error('[Navigator] Error checking onboarding status:', error);
      // При ошибке НЕ сбрасываем состояние, если есть кеш
      if (!profileCache) {
        setHasOnboarded(false);
      }
    }
  };

  // Listen for profile changes to update navigation (только когда профиля создается)
  useEffect(() => {
    if (!session) return; // Только если есть сессия
    if (hasOnboarded) return; // Если уже прошли онбординг - не проверяем
    
    console.log('[Navigator] Starting profile listener (waiting for onboarding completion)');
    
    const interval = setInterval(async () => {
      const profile = await Storage.getProfile();
      if (profile && !hasOnboarded) {
        console.log('[Navigator] Profile created - onboarding completed!');
        setProfileCache(profile);
        setHasOnboarded(true);
      }
    }, 2000); // Проверяем каждые 2 секунды

    return () => {
      console.log('[Navigator] Stopping profile listener');
      clearInterval(interval);
    };
  }, [session]); // Только зависимость от session!

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#1E4C60" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!session ? (
          // Не авторизован - показываем экран авторизации
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : !hasOnboarded ? (
          // Авторизован, но не прошел онбординг - показываем Welcome и ProfileSetup
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          // Авторизован и прошел онбординг - показываем основное приложение
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 83 : 65,
    paddingBottom: Platform.OS === 'ios' ? 34 : 10,
    paddingTop: 5,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 0,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific property
      boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.15)',
    }),
  },
  sideTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontFamily: Platform.select({
      ios: 'SF Pro Display',
      android: 'System',
      web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      default: 'System',
    }),
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 12,
    letterSpacing: 0,
  },
  addButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  plusIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 20,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  plusVertical: {
    position: 'absolute',
    width: 3,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
});

