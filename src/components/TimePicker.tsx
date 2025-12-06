import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FONTS, FONT_WEIGHTS } from '../styles/fonts';

interface TimePickerProps {
  value: string; // HH:MM format
  onChange: (time: string) => void;
  error?: string;
}

export default function TimePicker({ value, onChange, error }: TimePickerProps) {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(() => {
    if (value) {
      const [hours, minutes] = value.split(':');
      const d = new Date();
      d.setHours(parseInt(hours, 10));
      d.setMinutes(parseInt(minutes, 10));
      return d;
    }
    return new Date();
  });

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return 'Выберите время';
    // Убираем секунды, оставляем только HH:MM
    return timeStr.substring(0, 5);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  // Для веб-версии используем HTML5 input type="time"
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <input
          type="time"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={false}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            borderWidth: error ? '2px' : '1px',
            borderStyle: 'solid',
            borderColor: error ? '#F44336' : '#ddd',
            borderRadius: '32px',
            backgroundColor: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            fontWeight: '400',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <Text style={styles.errorText}>⚠️ {error}</Text>
        )}
      </View>
    );
  }

  // Для iOS и Android
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, error && styles.buttonError]}
        onPress={() => setShow(true)}
      >
        <Text style={[styles.buttonText, !value && styles.placeholder]}>
          {formatTime(value)}
        </Text>
        <Text style={styles.icon}>🕐</Text>
      </Pressable>
      
      {error && (
        <Text style={styles.errorText}>⚠️ {error}</Text>
      )}

      {show && (
        <>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <Pressable onPress={handleDismiss}>
                  <Text style={styles.iosPickerButton}>Готово</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={date}
                mode="time"
                display="spinner"
                onChange={handleChange}
              />
            </View>
          )}
          
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={handleChange}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 32,
    padding: 12,
    backgroundColor: '#fff',
  },
  buttonError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  buttonText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  icon: {
    fontSize: 20,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#F44336',
    marginTop: 6,
    marginBottom: 4,
  },
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  iosPickerButton: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: FONT_WEIGHTS.semibold,
  },
});


