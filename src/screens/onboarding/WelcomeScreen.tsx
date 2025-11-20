import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/ScreenContainer';
import PrimaryButton from '../../components/PrimaryButton';
import { OnboardingStackParamList } from '../../AppNavigator';
import { FONTS, FONT_WEIGHTS } from '../../styles/fonts';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Добро пожаловать!</Text>
          <Text style={styles.subtitle}>Дневник пикфлоуметрии</Text>
          <Text style={styles.description}>
            Это приложение поможет вам отслеживать показатели пиковой скорости выдоха (ПСВ) 
            для контроля состояния дыхательной системы.
          </Text>
          <Text style={styles.description}>
            Регулярные измерения помогут вам и вашему врачу лучше понимать динамику вашего состояния.
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Далее"
            onPress={() => navigation.navigate('ProfileSetup')}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
});



