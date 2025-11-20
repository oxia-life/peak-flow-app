import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DiaryStackParamList } from '../AppNavigator';
import ScreenContainer from '../components/ScreenContainer';
import PrimaryButton from '../components/PrimaryButton';
import { FONTS, FONT_WEIGHTS } from '../styles/fonts';

type DiaryScreenNavigationProp = NativeStackNavigationProp<DiaryStackParamList, 'DiaryMain'>;

interface DiaryScreenProps {
  navigation: DiaryScreenNavigationProp;
}

export default function DiaryScreen({ navigation }: DiaryScreenProps) {
  const handleAddRecord = () => {
    navigation.navigate('AddEntry');
  };

  return (
    <ScreenContainer title="Дневник">
      <View style={styles.content}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>📊 Дневник измерений</Text>
          <Text style={styles.placeholderText}>
            Здесь будет ввод утренних и вечерних значений ПСВ (пиковой скорости выдоха).
          </Text>
          <Text style={styles.placeholderText}>
            Вы сможете отмечать симптомы: кашель, одышку, мокроту.
          </Text>
        </View>

        <PrimaryButton
          title="Добавить запись"
          onPress={handleAddRecord}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  placeholderText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
});



