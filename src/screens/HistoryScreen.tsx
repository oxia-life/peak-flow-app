import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, Modal, ScrollView, TextInput, Switch, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import ScreenContainer from '../components/ScreenContainer';
import PrimaryButton from '../components/PrimaryButton';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import Storage from '../services/Storage';
import { PEFRecord, Profile } from '../types/models';
import { MainTabParamList } from '../AppNavigator';
import { FONTS, FONT_WEIGHTS } from '../styles/fonts';
import { calculateNormPEF } from '../utils/calculation';

export default function HistoryScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [records, setRecords] = useState<PEFRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [normValue, setNormValue] = useState<number>(500);
  
  // Для редактирования
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PEFRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editSymptoms, setEditSymptoms] = useState({
    cough: false,
    breathlessness: false,
    sputum: false,
  });

  // Загружаем записи и профиль при фокусе на экран
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [allRecords, userProfile] = await Promise.all([
        Storage.getAllRecords(),
        Storage.getProfile(),
      ]);
      
      // Сортируем по дате и времени (новые сверху)
      const sorted = [...allRecords].sort((a, b) => {
        // Сравниваем сначала дату
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) {
          return dateCompare;
        }
        // Если даты равны, сравниваем время
        return b.time.localeCompare(a.time);
      });
      
      setRecords(sorted);
      setProfile(userProfile);

      // Рассчитываем норму
      if (userProfile && userProfile.birthDate && userProfile.heightCm) {
        if (userProfile.normMethod === 'manual' && userProfile.manualNormValue) {
          // Используем ручное значение нормы
          setNormValue(userProfile.manualNormValue);
        } else {
          // Автоматический расчет нормы по формуле
          const birthDate = new Date(userProfile.birthDate);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          const calculatedNorm = calculateNormPEF(
            userProfile.gender,
            age,
            userProfile.heightCm
          );
          setNormValue(calculatedNorm);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const getZoneInfo = (value: number): { color: string; name: string; bgColor: string } => {
    if (normValue === 0) return { color: '#999', name: 'Неизвестно', bgColor: '#f5f5f5' };
    
    const percentage = (value / normValue) * 100;
    const greenMin = normValue * 0.8;
    const yellowMin = normValue * 0.5;

    if (value >= greenMin) {
      return { color: '#4CAF50', name: 'Зелёная зона', bgColor: '#E8F5E9' };
    }
    if (value >= yellowMin) {
      return { color: '#FFA726', name: 'Жёлтая зона', bgColor: '#FFF8E1' };
    }
    return { color: '#F44336', name: 'Красная зона', bgColor: '#FFEBEE' };
  };

  const handleEditPress = (record: PEFRecord) => {
    setSelectedRecord(record);
    setEditDate(record.date);
    setEditTime(record.time);
    setEditValue(record.value.toString());
    setEditSymptoms({
      cough: record.cough,
      breathlessness: record.breathlessness,
      sputum: record.sputum,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;

    const value = parseInt(editValue, 10);
    if (value < 50 || value > 1000) {
      Alert.alert('Внимание', 'Проверьте корректность значения PEF. Допустимый диапазон: 50-1000 л/мин.');
      return;
    }

    try {
      const updatedRecord: PEFRecord = {
        ...selectedRecord,
        date: editDate,
        time: editTime,
        value,
        cough: editSymptoms.cough,
        breathlessness: editSymptoms.breathlessness,
        sputum: editSymptoms.sputum,
      };

      const allRecords = await Storage.getAllRecords();
      const updatedRecords = allRecords.map((r) =>
        r.id === selectedRecord.id ? updatedRecord : r
      );
      await Storage.saveRecords(updatedRecords);

      setEditModalVisible(false);
      loadData();

      setTimeout(() => {
        if (Platform.OS === 'web') {
          window.alert('Запись обновлена');
        } else {
          Alert.alert('Успешно', 'Запись обновлена');
        }
      }, 300);
    } catch (error) {
      console.error('Error updating record:', error);
      Alert.alert('Ошибка', 'Не удалось обновить запись');
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    const confirmDelete = Platform.OS === 'web'
      ? window.confirm('Вы уверены, что хотите удалить эту запись?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Удалить запись?',
            'Вы уверены, что хотите удалить эту запись?',
            [
              { text: 'Отмена', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Удалить', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmDelete) return;

    try {
      const allRecords = await Storage.getAllRecords();
      const updatedRecords = allRecords.filter((r) => r.id !== selectedRecord.id);
      await Storage.saveRecords(updatedRecords);

      setEditModalVisible(false);
      loadData();

      setTimeout(() => {
        if (Platform.OS === 'web') {
          window.alert('Запись удалена');
        } else {
          Alert.alert('Успешно', 'Запись удалена');
        }
      }, 300);
    } catch (error) {
      console.error('Error deleting record:', error);
      Alert.alert('Ошибка', 'Не удалось удалить запись');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('ru-RU', { month: 'long' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  const formatTime = (timeStr: string): string => {
    // Убираем секунды, оставляем только HH:MM
    return timeStr.substring(0, 5);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Записей пока нет</Text>
      <Text style={styles.emptyText}>
        Добавьте первую запись измерения PEF на вкладке "Дневник"
      </Text>
    </View>
  );

  const renderRecordItem = ({ item }: { item: PEFRecord }) => {
    const hasSymptoms = item.cough || item.breathlessness || item.sputum;
    const zoneInfo = getZoneInfo(item.value);
    
    // Собираем активные симптомы
    const symptoms: string[] = [];
    if (item.cough) symptoms.push('Кашель');
    if (item.breathlessness) symptoms.push('Одышка');
    if (item.sputum) symptoms.push('Мокрота');
    
    return (
      <View style={styles.recordItem}>
        <View style={styles.recordLeft}>
          <Text style={styles.recordValue}>{item.value}</Text>
          <Text style={styles.recordUnit}>л/мин</Text>
        </View>
        
        <View style={styles.recordRight}>
          <View style={styles.recordDateRow}>
            <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
          </View>
          <Text style={styles.recordTime}>{formatTime(item.time)}</Text>
          
          {/* Зона */}
          <View style={[styles.zoneBadge, { backgroundColor: zoneInfo.bgColor }]}>
            <Text style={[styles.zoneText, { color: zoneInfo.color }]}>
              {zoneInfo.name}
            </Text>
          </View>
          
          {/* Симптомы */}
          {hasSymptoms && (
            <View style={styles.symptomsContainer}>
              <Text style={styles.symptomsLabel}>Симптомы: </Text>
              <Text style={styles.symptomsText}>{symptoms.join(', ')}</Text>
            </View>
          )}
        </View>

        <Pressable 
          style={styles.recordArrow}
          onPress={() => handleEditPress(item)}
        >
          <Text style={styles.arrowIcon}>›</Text>
        </Pressable>
      </View>
    );
  };

  const handleClose = () => {
    navigation.navigate('Graph');
  };

  if (loading) {
    return (
      <ScreenContainer 
        title="История" 
        showCloseButton={true}
        onClose={handleClose}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Загрузка записей...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer 
      title="История"
      showCloseButton={true}
      onClose={handleClose}
    >
      <FlatList
        data={records}
        renderItem={renderRecordItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={records.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Модальное окно редактирования */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Редактирование записи</Text>
            <Pressable
              onPress={() => setEditModalVisible(false)}
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.modalCloseButtonPressed
              ]}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </Pressable>
          </View>
          
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            {/* Дата */}
            <View style={styles.section}>
              <Text style={styles.label}>Дата</Text>
              <DatePicker
                value={editDate}
                onChange={setEditDate}
              />
            </View>

            {/* Время */}
            <View style={styles.section}>
              <Text style={styles.label}>Время</Text>
              <TimePicker
                value={editTime}
                onChange={setEditTime}
              />
            </View>

            {/* Значение PEF */}
            <View style={styles.section}>
              <Text style={styles.label}>Значение PEF</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите PEF, л/мин"
                value={editValue}
                onChangeText={(text) => setEditValue(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={4}
                placeholderTextColor="#999"
              />
            </View>

            {/* Симптомы */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Симптомы</Text>

              <View style={styles.symptomRow}>
                <Text style={styles.symptomLabel}>Кашель</Text>
                <Switch
                  value={editSymptoms.cough}
                  onValueChange={(value) =>
                    setEditSymptoms({ ...editSymptoms, cough: value })
                  }
                  trackColor={{ false: '#ddd', true: '#1E4C60' }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#ddd"
                />
              </View>

              <View style={styles.symptomRow}>
                <Text style={styles.symptomLabel}>Одышка</Text>
                <Switch
                  value={editSymptoms.breathlessness}
                  onValueChange={(value) =>
                    setEditSymptoms({ ...editSymptoms, breathlessness: value })
                  }
                  trackColor={{ false: '#ddd', true: '#1E4C60' }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#ddd"
                />
              </View>

              <View style={styles.symptomRow}>
                <Text style={styles.symptomLabel}>Мокрота</Text>
                <Switch
                  value={editSymptoms.sputum}
                  onValueChange={(value) =>
                    setEditSymptoms({ ...editSymptoms, sputum: value })
                  }
                  trackColor={{ false: '#ddd', true: '#1E4C60' }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#ddd"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <PrimaryButton
              title="Сохранить"
              onPress={handleSaveEdit}
              style={styles.saveButton}
            />
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Удалить запись</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.regular,
    marginTop: 12,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingVertical: 8,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 16,
    minWidth: 100,
  },
  recordValue: {
    fontFamily: FONTS.semibold,
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#000',
  },
  recordUnit: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    marginLeft: 4,
  },
  recordRight: {
    flex: 1,
  },
  recordDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordDate: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
  },
  recordTime: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    marginBottom: 6,
  },
  zoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  zoneText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.medium,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  symptomsLabel: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
  },
  symptomsText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#FF9500',
  },
  recordArrow: {
    marginLeft: 8,
    padding: 8,
  },
  arrowIcon: {
    fontFamily: FONTS.regular,
    fontSize: 24,
    color: '#C7C7CC',
    fontWeight: FONT_WEIGHTS.regular,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 16,
  },
  // Стили для модального окна
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#333',
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modalCloseButtonPressed: {
    backgroundColor: '#E0E0E0',
  },
  modalCloseButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 20,
    color: '#666',
    fontWeight: FONT_WEIGHTS.regular,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginBottom: 16,
  },
  input: {
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    backgroundColor: '#fff',
    color: '#333',
  },
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  symptomLabel: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#333',
  },
  modalButtons: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  saveButton: {
    marginBottom: 0,
  },
  deleteButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  deleteButtonText: {
    fontFamily: FONTS.semibold,
    color: '#F44336',
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});



