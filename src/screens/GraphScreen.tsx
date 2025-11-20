import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Dimensions, Platform, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Svg, { Line, Circle, Rect, Text as SvgText, Polyline, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import ScreenContainer from '../components/ScreenContainer';
import PrimaryButton from '../components/PrimaryButton';
import Storage from '../services/Storage';
import { PEFRecord, Profile } from '../types/models';
import { calculateNormPEF } from '../utils/calculation';
import { MainTabParamList } from '../AppNavigator';
import { FONTS, FONT_WEIGHTS } from '../styles/fonts';

type RangeType = 'week' | 'month' | 'year';

export default function GraphScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [records, setRecords] = useState<PEFRecord[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeType>('week');
  const [normValue, setNormValue] = useState<number>(500);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [periodOffset, setPeriodOffset] = useState<number>(0); // 0 = текущий период, -1 = предыдущий и т.д.
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [allRecords, userProfile, savedChartType] = await Promise.all([
        Storage.getAllRecords(),
        Storage.getProfile(),
        Storage.getChartType(),
      ]);

      setRecords(allRecords);
      setProfile(userProfile);
      setChartType(savedChartType);

      // Рассчитываем норму PEF
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
    } finally {
      setLoading(false);
    }
  };

  const getPeriodDates = (): { start: Date; end: Date } => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    switch (range) {
      case 'week':
        start.setDate(today.getDate() - 6 + periodOffset * 7);
        end.setDate(today.getDate() + periodOffset * 7);
        break;
      case 'month':
        start.setDate(today.getDate() - 29 + periodOffset * 30);
        end.setDate(today.getDate() + periodOffset * 30);
        break;
      case 'year':
        start.setMonth(today.getMonth() - 11 + periodOffset * 12);
        start.setDate(1);
        end.setMonth(today.getMonth() + periodOffset * 12);
        end.setDate(new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate());
        break;
    }

    return { start, end };
  };

  const formatPeriodLabel = (): string => {
    const { start, end } = getPeriodDates();
    
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthNamesGenitive = ['декабрь', 'январь', 'февраль', 'март', 'апрель', 'май', 
                                 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь'];

    switch (range) {
      case 'week': {
        const startDay = start.getDate();
        const endDay = end.getDate();
        const startMonth = monthNames[start.getMonth()];
        const endMonth = monthNames[end.getMonth()];
        
        if (start.getMonth() === end.getMonth()) {
          return `${startDay} - ${endDay} ${startMonth}`;
        }
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
      }
      case 'month': {
        const startDay = start.getDate();
        const endDay = end.getDate();
        const startMonth = monthNames[start.getMonth()];
        const endMonth = monthNames[end.getMonth()];
        
        if (start.getMonth() === end.getMonth()) {
          return `${startDay} - ${endDay} ${startMonth}`;
        }
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
      }
      case 'year': {
        const startMonthName = monthNamesGenitive[start.getMonth()];
        const endMonthName = monthNamesGenitive[end.getMonth()];
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        
        return `${startMonthName} ${startYear} - ${endMonthName} ${endYear}`;
      }
      default:
        return '';
    }
  };

  const canGoNext = (): boolean => {
    return periodOffset < 0;
  };

  const handlePrevPeriod = () => {
    setPeriodOffset(prev => prev - 1);
  };

  const handleNextPeriod = () => {
    if (canGoNext()) {
      setPeriodOffset(prev => prev + 1);
    }
  };

  const getFilteredRecords = (): PEFRecord[] => {
    const { start, end } = getPeriodDates();
    
    return records
      .filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      })
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}`).getTime();
        const timeB = new Date(`${b.date}T${b.time}`).getTime();
        return timeA - timeB;
      });
  };

  const getTodayMeasurements = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date === today);
    
    if (todayRecords.length === 0) {
      return { morning: null, evening: null, dailyVariability: null };
    }

    // Утро: самое раннее до 13:00
    const morningRecords = todayRecords.filter(r => {
      const [hours] = r.time.split(':').map(Number);
      return hours < 13;
    });
    const morning = morningRecords.length > 0 
      ? morningRecords.sort((a, b) => a.time.localeCompare(b.time))[0].value
      : null;

    // Вечер: самое позднее после 13:00 включительно
    const eveningRecords = todayRecords.filter(r => {
      const [hours] = r.time.split(':').map(Number);
      return hours >= 13;
    });
    const evening = eveningRecords.length > 0
      ? eveningRecords.sort((a, b) => b.time.localeCompare(a.time))[0].value
      : null;

    // Суточный разброс (только при наличии утренних и вечерних значений)
    let dailyVariability: number | null = null;
    if (morning !== null && evening !== null) {
      // Формула: (ПСВ вечер − ПСВ утро) / (½ × (ПСВ вечер + ПСВ утро)) × 100%
      const average = (evening + morning) / 2;
      dailyVariability = Math.round(Math.abs(evening - morning) / average * 100);
    }

    return { morning, evening, dailyVariability };
  };

  const calculatePeriodStatistics = () => {
    const filtered = getFilteredRecords();
    
    if (filtered.length === 0) {
      return { average: 0, best: 0 };
    }

    const average = Math.round(filtered.reduce((sum, r) => sum + r.value, 0) / filtered.length);
    const best = Math.max(...filtered.map(r => r.value));
    
    return { average, best };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('ru-RU', { month: 'short' });
    return `${day} ${month}`;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📈</Text>
      <Text style={styles.emptyTitle}>Недостаточно данных</Text>
      <Text style={styles.emptyText}>
        Добавьте записи измерений на вкладке "Дневник", чтобы увидеть график
      </Text>
    </View>
  );

  const getZoneColor = (value: number): string => {
    const greenMin = normValue * 0.8;
    const yellowMin = normValue * 0.5;
    
    if (value >= greenMin) return '#4CAF50';
    if (value >= yellowMin) return '#ffeb3b';
    return '#f44336';
  };

  const getZoneName = (value: number): string => {
    const greenMin = normValue * 0.8;
    const yellowMin = normValue * 0.5;
    
    if (value >= greenMin) return 'Зелёная зона';
    if (value >= yellowMin) return 'Жёлтая зона';
    return 'Красная зона';
  };

  const getGradientId = (value: number): string => {
    const greenMin = normValue * 0.8;
    const yellowMin = normValue * 0.5;
    
    if (value >= greenMin) return 'greenGradient';
    if (value >= yellowMin) return 'yellowGradient';
    return 'redGradient';
  };

  const renderBarChart = () => {
    const filtered = getFilteredRecords();

    try {
      // Параметры графика
      const screenWidth = Dimensions.get('window').width;
      const containerMargin = 32; // marginHorizontal графа container (16 * 2)
      const innerPadding = 32; // padding внутри barChartContainer (16 * 2)
      const svgWidth = containerWidth > 0 ? containerWidth : screenWidth - containerMargin - innerPadding;
      const chartHeight = 300;
      const padding = { top: 20, right: 10, bottom: 60, left: 40 };
      const graphWidth = svgWidth - padding.left - padding.right;
      const graphHeight = chartHeight - padding.top - padding.bottom;

      // Создаем полную шкалу времени
      const timeScale: Array<{ date: string; label: string }> = [];
      const { start, end } = getPeriodDates();
      
      if (range === 'week') {
        const dayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
        for (let i = 0; i < 7; i++) {
          // Создаем дату правильно, избегая проблем с временными зонами
          const year = start.getFullYear();
          const month = start.getMonth();
          const day = start.getDate() + i;
          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];
          const dayNum = date.getDate();
          const dayName = dayNames[date.getDay()];
          const label = `${dayNum} ${dayName}`;
          timeScale.push({ date: dateStr, label });
        }
      } else if (range === 'month') {
        for (let i = 0; i < 30; i++) {
          // Создаем дату правильно, избегая проблем с временными зонами
          const year = start.getFullYear();
          const month = start.getMonth();
          const day = start.getDate() + i;
          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];
          const label = `${date.getDate()}`;
          timeScale.push({ date: dateStr, label });
        }
      } else if (range === 'year') {
        const monthLetters = ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'];
        for (let i = 0; i < 12; i++) {
          const date = new Date(start);
          date.setMonth(start.getMonth() + i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          timeScale.push({ date: monthKey, label: monthLetters[date.getMonth()] });
        }
      }

      const maxY = filtered.length > 0 
        ? Math.max(normValue * 1.2, ...filtered.map(r => r.value)) + 50
        : normValue * 1.2 + 50;

      // Сопоставляем данные со шкалой времени
      const barData: Array<{ x: number; height: number; value: number; gradientId: string }> = [];
      
      timeScale.forEach((timePoint, index) => {
        let matchedRecords: PEFRecord[] = [];
        
        if (range === 'year') {
          matchedRecords = filtered.filter(r => r.date.startsWith(timePoint.date));
        } else {
          matchedRecords = filtered.filter(r => r.date === timePoint.date);
        }
        
        if (matchedRecords.length > 0) {
          // Для режима "Неделя" показываем все значения
          if (range === 'week') {
            const slotWidth = graphWidth / timeScale.length;
            const totalBarWidth = Math.min(slotWidth * 0.7, 40);
            const singleBarWidth = matchedRecords.length > 1 
              ? Math.min(totalBarWidth / matchedRecords.length - 2, 15) 
              : totalBarWidth;
            const startX = padding.left + (index * slotWidth) + (slotWidth - singleBarWidth * matchedRecords.length - 2 * (matchedRecords.length - 1)) / 2;
            
            matchedRecords.forEach((record, recordIndex) => {
              const barHeight = (record.value / maxY) * graphHeight;
              const x = startX + recordIndex * (singleBarWidth + 2);
              
              barData.push({
                x,
                height: barHeight,
                value: record.value,
                gradientId: getGradientId(record.value),
              });
            });
          } else {
            // Для месяца и года показываем среднее
            const avgValue = matchedRecords.reduce((sum, r) => sum + r.value, 0) / matchedRecords.length;
            const barHeight = (avgValue / maxY) * graphHeight;
            const slotWidth = graphWidth / timeScale.length;
            const barWidth = Math.min(slotWidth * 0.6, 30);
            const x = padding.left + (index * slotWidth) + (slotWidth - barWidth) / 2;
            
            barData.push({
              x,
              height: barHeight,
              value: avgValue,
              gradientId: getGradientId(avgValue),
            });
          }
        }
      });

      // Вычисляем ширину столбца
      const getBarWidth = (index: number) => {
        if (range === 'week') {
          const slotWidth = graphWidth / timeScale.length;
          // Подсчитываем количество записей в этот день
          const dayIndex = Math.floor((barData[index].x - padding.left) / slotWidth);
          const timePoint = timeScale[dayIndex];
          const matchedRecords = filtered.filter(r => r.date === timePoint.date);
          const totalBarWidth = Math.min(slotWidth * 0.7, 40);
          return matchedRecords.length > 1 
            ? Math.min(totalBarWidth / matchedRecords.length - 2, 15) 
            : totalBarWidth;
        } else {
          const slotWidth = graphWidth / timeScale.length;
          return Math.min(slotWidth * 0.6, 30);
        }
      };

      return (
        <View 
          style={[styles.barChartContainer, { paddingHorizontal: 16 }]}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0) {
              setContainerWidth(width - 32); // Вычитаем padding (16 * 2)
            }
          }}
        >
            <Svg width={svgWidth} height={chartHeight} style={styles.svg}>
              {/* Определяем градиенты */}
              <Defs>
                {/* Красный градиент */}
                <LinearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#D2395A" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#FF5353" stopOpacity="1" />
                </LinearGradient>
                
                {/* Желтый градиент */}
                <LinearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FFC037" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#F7F29C" stopOpacity="1" />
                </LinearGradient>
                
                {/* Зеленый градиент */}
                <LinearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#67DB71" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#CFF6B0" stopOpacity="1" />
                </LinearGradient>
              </Defs>

              {/* Горизонтальные линии сетки */}
              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const y = padding.top + graphHeight * (1 - fraction);
                return (
                  <Line
                    key={fraction}
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + graphWidth}
                    y2={y}
                    stroke="#E5E5EA"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Ось Y (подписи) */}
              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const value = Math.round(maxY * fraction);
                const y = padding.top + graphHeight * (1 - fraction);
                return (
                  <SvgText
                    key={fraction}
                    x={padding.left - 10}
                    y={y + 5}
                    fontSize="12"
                    fill="#666"
                    fontFamily={FONTS.regular}
                    textAnchor="end"
                  >
                    {value}
                  </SvgText>
                );
              })}

              {/* Столбцы с закруглением */}
              {barData.map((bar, index) => {
                const barWidth = getBarWidth(index);
                const radius = Math.min(10, barWidth / 2); // Радиус не больше половины ширины
                
                return (
                  <Rect
                    key={`bar-${index}`}
                    x={bar.x}
                    y={chartHeight - padding.bottom - bar.height}
                    width={barWidth}
                    height={bar.height}
                    rx={radius}
                    ry={radius}
                    fill={`url(#${bar.gradientId})`}
                  />
                );
              })}

              {/* Подписи X-оси */}
              {timeScale.map((timePoint, index) => {
                const slotWidth = graphWidth / timeScale.length;
                const x = padding.left + (index * slotWidth) + slotWidth / 2;
                
                // Для режима "Месяц" показываем только понедельники
                let shouldShow = true;
                if (range === 'month') {
                  const date = new Date(timePoint.date);
                  shouldShow = date.getDay() === 1; // 1 = понедельник
                }
                
                if (!shouldShow) return null;
                
                return (
                  <SvgText
                    key={`label-${index}`}
                    x={x}
                    y={chartHeight - padding.bottom + 20}
                    fontFamily={FONTS.regular}
                    fontSize="10"
                    fill="#5E5F60"
                    textAnchor="middle"
                    fontWeight={FONT_WEIGHTS.regular}
                  >
                    {timePoint.label}
                  </SvgText>
                );
              })}
            </Svg>
        </View>
      );
    } catch (error) {
      console.error('Error rendering bar chart:', error);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ошибка при отрисовке столбчатой диаграммы</Text>
        </View>
      );
    }
  };

  const renderChart = () => {
    const filtered = getFilteredRecords();

    try {
      // Параметры графика
      const screenWidth = Dimensions.get('window').width;
      const containerMargin = 32; // marginHorizontal графа container (16 * 2)
      const innerPadding = 32; // padding внутри контейнера (16 * 2)
      const svgWidth = containerWidth > 0 ? containerWidth : screenWidth - containerMargin - innerPadding;
      const chartHeight = 350;
      const padding = { top: 20, right: 10, bottom: 40, left: 40 };
      const graphWidth = svgWidth - padding.left - padding.right;
      const graphHeight = chartHeight - padding.top - padding.bottom;

      // Создаем полную шкалу времени (все периоды, даже если нет данных)
      const timeScale: Array<{ date: string; label: string }> = [];
      const { start, end } = getPeriodDates();
      
      if (range === 'week') {
        // 7 дней текущего периода
        const dayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
        for (let i = 0; i < 7; i++) {
          // Создаем дату правильно, избегая проблем с временными зонами
          const year = start.getFullYear();
          const month = start.getMonth();
          const day = start.getDate() + i;
          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];
          const dayNum = date.getDate();
          const dayName = dayNames[date.getDay()];
          const label = `${dayNum} ${dayName}`;
          timeScale.push({ date: dateStr, label });
        }
      } else if (range === 'month') {
        // 30 дней текущего периода
        for (let i = 0; i < 30; i++) {
          // Создаем дату правильно, избегая проблем с временными зонами
          const year = start.getFullYear();
          const month = start.getMonth();
          const day = start.getDate() + i;
          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];
          const label = `${date.getDate()}`;
          timeScale.push({ date: dateStr, label });
        }
      } else if (range === 'year') {
        // 12 месяцев текущего периода
        const monthLetters = ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'];
        for (let i = 0; i < 12; i++) {
          const date = new Date(start);
          date.setMonth(start.getMonth() + i);
          // Используем первый день месяца для сопоставления
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          timeScale.push({ date: monthKey, label: monthLetters[date.getMonth()] });
        }
      }

      // Границы зон
      const greenMin = normValue * 0.8;
      const yellowMin = normValue * 0.5;
      const maxY = filtered.length > 0 
        ? Math.max(normValue * 1.2, ...filtered.map(r => r.value)) + 50
        : normValue * 1.2 + 50;

      // Функция для преобразования значения Y в координату
      const getY = (value: number) => {
        return padding.top + graphHeight - (value / maxY) * graphHeight;
      };

      // Функция для преобразования индекса в координату X
      const getX = (index: number) => {
        const step = graphWidth / Math.max(timeScale.length - 1, 1);
        return padding.left + index * step;
      };

      // Сопоставляем данные со шкалой времени
      const allDataPoints: Array<{ x: number; y: number; value: number; date: string; time: string }> = [];
      
      if (range === 'week') {
        // Для недели: показываем ВСЕ точки, не усредняем
        timeScale.forEach((timePoint, index) => {
          const matchedRecords = filtered.filter(r => r.date === timePoint.date);
          const baseX = getX(index);
          
          if (matchedRecords.length > 0) {
            matchedRecords.forEach((record) => {
              allDataPoints.push({
                x: baseX,
                y: getY(record.value),
                value: record.value,
                date: record.date,
                time: record.time,
              });
            });
          }
        });
      } else {
        // Для месяца и года: показываем среднее по периоду
        timeScale.forEach((timePoint, index) => {
          let matchedRecords: PEFRecord[] = [];
          
          if (range === 'year') {
            // Для года: ищем все записи за этот месяц
            matchedRecords = filtered.filter(r => r.date.startsWith(timePoint.date));
          } else {
            // Для месяца: ищем записи за конкретный день
            matchedRecords = filtered.filter(r => r.date === timePoint.date);
          }
          
          if (matchedRecords.length > 0) {
            // Если есть данные, берем среднее значение
            const avgValue = matchedRecords.reduce((sum, r) => sum + r.value, 0) / matchedRecords.length;
            allDataPoints.push({
              x: getX(index),
              y: getY(avgValue),
              value: avgValue,
              date: timePoint.date,
              time: '',
            });
          }
        });
      }

      // Создаём строку для Polyline
      // Для недели - соединяем точки по дням (сортируем по дате и времени)
      let polylinePoints = '';
      if (range === 'week' && allDataPoints.length > 0) {
        const sortedPoints = [...allDataPoints].sort((a, b) => {
          const timeA = new Date(`${a.date}T${a.time}`).getTime();
          const timeB = new Date(`${b.date}T${b.time}`).getTime();
          return timeA - timeB;
        });
        polylinePoints = sortedPoints.map(p => `${p.x},${p.y}`).join(' ');
      } else if (allDataPoints.length > 0) {
        polylinePoints = allDataPoints.map(p => `${p.x},${p.y}`).join(' ');
      }

    return (
      <View 
        style={{ paddingHorizontal: 16 }}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          if (width > 0) {
            setContainerWidth(width - 32); // Вычитаем padding (16 * 2)
          }
        }}
      >
        <Svg width={svgWidth} height={chartHeight} style={styles.svg}>
          {/* Зона зелёная */}
          <Rect
            x={padding.left}
            y={getY(maxY)}
            width={graphWidth}
            height={getY(greenMin) - getY(maxY)}
            fill="#4CAF50"
            opacity={0.15}
          />
          
          {/* Зона жёлтая */}
          <Rect
            x={padding.left}
            y={getY(greenMin)}
            width={graphWidth}
            height={getY(yellowMin) - getY(greenMin)}
            fill="#FFEB3B"
            opacity={0.2}
          />
          
          {/* Зона красная */}
          <Rect
            x={padding.left}
            y={getY(yellowMin)}
            width={graphWidth}
            height={getY(0) - getY(yellowMin)}
            fill="#F44336"
            opacity={0.15}
          />

          {/* Горизонтальные линии сетки */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = padding.top + graphHeight * (1 - fraction);
            return (
              <Line
                key={fraction}
                x1={padding.left}
                y1={y}
                x2={padding.left + graphWidth}
                y2={y}
                stroke="#E5E5EA"
                strokeWidth={1}
              />
            );
          })}

          {/* Ось Y (подписи) */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const value = Math.round(maxY * fraction);
            const y = padding.top + graphHeight * (1 - fraction);
            return (
              <SvgText
                key={fraction}
                x={padding.left - 10}
                y={y + 5}
                fontSize="12"
                fill="#666"
                fontFamily={FONTS.regular}
                textAnchor="end"
              >
                {value}
              </SvgText>
            );
          })}

          {/* Процентные метки справа */}
          <SvgText
            x={svgWidth - padding.right + 10}
            y={getY(normValue)}
            fontSize="14"
            fill="#4CAF50"
            fontFamily={FONTS.semibold}
            fontWeight={FONT_WEIGHTS.semibold}
          >
            100%
          </SvgText>
          <SvgText
            x={svgWidth - padding.right + 10}
            y={getY(greenMin)}
            fontSize="14"
            fill="#FFEB3B"
            fontFamily={FONTS.semibold}
            fontWeight={FONT_WEIGHTS.semibold}
          >
            80%
          </SvgText>
          <SvgText
            x={svgWidth - padding.right + 10}
            y={getY(yellowMin)}
            fontSize="14"
            fill="#F44336"
            fontFamily={FONTS.semibold}
            fontWeight={FONT_WEIGHTS.semibold}
          >
            50%
          </SvgText>

          {/* Линия графика */}
          {allDataPoints.length > 0 && polylinePoints && (
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke="#000000"
              strokeWidth={2}
            />
          )}

          {/* Точки на графике */}
          {allDataPoints.map((point, index) => (
            <Circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r={3}
              fill="none"
              stroke="#000000"
              strokeWidth={2}
            />
          ))}

          {/* Подписи оси X (даты) */}
          {timeScale.map((timePoint, index) => {
            const x = getX(index);
            let shouldShow = true;
            
            // Определяем частоту меток в зависимости от периода
            if (range === 'week') {
              // Неделя: показываем все 7 дней
              shouldShow = true;
            } else if (range === 'month') {
              // Месяц: показываем только понедельники
              const date = new Date(timePoint.date);
              shouldShow = date.getDay() === 1; // 1 = понедельник
            } else if (range === 'year') {
              // Год: показываем все 12 месяцев
              shouldShow = true;
            }
            
            if (!shouldShow) return null;
            
            return (
              <SvgText
                key={`date-${index}`}
                x={x}
                y={chartHeight - padding.bottom + 20}
                fontSize="10"
                fill="#5E5F60"
                fontFamily={FONTS.regular}
                fontWeight={FONT_WEIGHTS.regular}
                textAnchor="middle"
              >
                {timePoint.label}
              </SvgText>
            );
          })}
        </Svg>

        {/* Легенда */}
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <View style={[styles.legendBox, { backgroundColor: '#4CAF50', opacity: 0.3 }]} />
            <Text style={styles.legendText}>Зелёная зона (≥80%)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendBox, { backgroundColor: '#FFEB3B', opacity: 0.3 }]} />
            <Text style={styles.legendText}>Жёлтая зона (50-80%)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendBox, { backgroundColor: '#F44336', opacity: 0.3 }]} />
            <Text style={styles.legendText}>{'Красная зона (<50%)'}</Text>
          </View>
        </View>
      </View>
    );
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <View style={styles.errorState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Ошибка отображения графика</Text>
          <Text style={styles.errorText}>
            Попробуйте перезагрузить приложение
          </Text>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <ScreenContainer title="График">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Загрузка данных...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Информация о норме */}
        {profile && normValue > 0 && (
          <View style={styles.normInfo}>
            <Text style={styles.normLabel}>Ваша норма PEF:</Text>
            <Text style={styles.normValue}>{normValue} л/мин</Text>
          </View>
        )}

        {/* Показатели на сегодня */}
        {(() => {
          const today = getTodayMeasurements();
          
          return (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Сегодня</Text>
                <Pressable 
                  style={styles.sectionInfoButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      window.alert('Суточный разброс ПСВ рассчитывается по формуле:\n(ПСВ вечер − ПСВ утро) / (½ × (ПСВ вечер + ПСВ утро)) × 100%\n\nПоказатель отображается только при наличии утренних и вечерних измерений за текущую дату.');
                    } else {
                      Alert.alert(
                        'Суточный разброс ПСВ',
                        'Рассчитывается по формуле:\n(ПСВ вечер − ПСВ утро) / (½ × (ПСВ вечер + ПСВ утро)) × 100%\n\nПоказатель отображается только при наличии утренних и вечерних измерений за текущую дату.'
                      );
                    }
                  }}
                >
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Circle cx="10" cy="10" r="9" stroke="#1E4C60" strokeWidth="1.5" fill="none" />
                    <Path d="M10 14V10M10 6H10.01" stroke="#1E4C60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>
              
              <View style={styles.todayContainer}>
                <View style={styles.todayRow}>
                <View style={styles.todayItem}>
                  <Text style={styles.todayLabel}>Утро</Text>
                  {today.morning !== null ? (
                    <View style={styles.todayValueContainer}>
                      <Text style={styles.todayValue}>{today.morning}</Text>
                      <Text style={styles.todayUnit}>л/мин</Text>
                    </View>
                  ) : (
                    <Text style={styles.todayValueEmpty}>—</Text>
                  )}
                </View>
                
                <View style={styles.todayDivider} />
                
                <View style={styles.todayItem}>
                  <Text style={styles.todayLabel}>Вечер</Text>
                  {today.evening !== null ? (
                    <View style={styles.todayValueContainer}>
                      <Text style={styles.todayValue}>{today.evening}</Text>
                      <Text style={styles.todayUnit}>л/мин</Text>
                    </View>
                  ) : (
                    <Text style={styles.todayValueEmpty}>—</Text>
                  )}
                </View>
                
                <View style={styles.todayDivider} />
                
                <View style={styles.todayItem}>
                  <Text style={styles.todayLabel}>Разброс</Text>
                  {today.dailyVariability !== null ? (
                    <View style={styles.todayValueContainer}>
                      <Text style={styles.todayValue}>{today.dailyVariability}</Text>
                      <Text style={styles.todayUnit}>%</Text>
                    </View>
                  ) : (
                    <Text style={styles.todayValueEmpty}>—</Text>
                  )}
                </View>
              </View>
            </View>
            </>
          );
        })()}

        {/* Динамика */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Динамика</Text>
        </View>

        {/* Блок с графиком */}
        <View style={styles.graphContainer}>
          {/* Переключатель периода */}
        <View style={styles.rangeSelector}>
          <Pressable
            style={[styles.rangeButton, range === 'week' && styles.rangeButtonActive]}
            onPress={() => {
              setRange('week');
              setPeriodOffset(0);
            }}
          >
            <Text style={[styles.rangeButtonText, range === 'week' && styles.rangeButtonTextActive]}>
              Неделя
            </Text>
          </Pressable>
          <Pressable
            style={[styles.rangeButton, range === 'month' && styles.rangeButtonActive]}
            onPress={() => {
              setRange('month');
              setPeriodOffset(0);
            }}
          >
            <Text style={[styles.rangeButtonText, range === 'month' && styles.rangeButtonTextActive]}>
              Месяц
            </Text>
          </Pressable>
          <Pressable
            style={[styles.rangeButton, range === 'year' && styles.rangeButtonActive]}
            onPress={() => {
              setRange('year');
              setPeriodOffset(0);
            }}
          >
            <Text style={[styles.rangeButtonText, range === 'year' && styles.rangeButtonTextActive]}>
              Год
            </Text>
          </Pressable>
        </View>

        {/* Навигация по периодам */}
        <View style={styles.periodNavigation}>
          <Pressable
            style={styles.arrowButton}
            onPress={handlePrevPeriod}
          >
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Text style={styles.periodLabel}>{formatPeriodLabel()}</Text>
          <Pressable
            style={[styles.arrowButton, !canGoNext() && styles.arrowButtonDisabled]}
            onPress={handleNextPeriod}
            disabled={!canGoNext()}
          >
            <Text style={[styles.arrowText, !canGoNext() && styles.arrowTextDisabled]}>›</Text>
          </Pressable>
        </View>

          {/* Отображаем выбранный тип графика */}
          {chartType === 'line' ? renderChart() : renderBarChart()}

          {/* Статистика за период */}
          {records.length > 0 && (() => {
            const stats = calculatePeriodStatistics();
            const filtered = getFilteredRecords();
            
            if (filtered.length === 0) return null;
            
            return (
              <View style={styles.periodStatsContainer}>
                {/* Среднее */}
                <View style={styles.periodStatRow}>
                  <View style={styles.periodStatLeft}>
                    <Text style={styles.periodStatLabel}>Среднее ПСВ</Text>
                    <Text style={styles.periodStatSubtitle}>За период</Text>
                  </View>
                  <Text style={styles.periodStatValue}>{stats.average} л/мин</Text>
                </View>
                
                {/* Лучшее */}
                <View style={styles.periodStatRow}>
                  <View style={styles.periodStatLeft}>
                    <Text style={styles.periodStatLabel}>Лучшее ПСВ</Text>
                    <Text style={styles.periodStatSubtitle}>За период</Text>
                  </View>
                  <Text style={styles.periodStatValue}>{stats.best} л/мин</Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Кнопка перехода на историю */}
        {records.length > 0 && (
          <View style={styles.viewAllContainer}>
            <PrimaryButton
              title="Посмотреть все данные"
              onPress={() => navigation.navigate('History')}
              variant="secondary"
            />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 16, // Отступ сверху для аккуратности
  },
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
  rangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 32,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific property
      boxShadow: '0px 2px 3px 0px rgba(0, 0, 0, 0.1) inset, 0px 1px 2px 0px rgba(0, 0, 0, 0.05) inset',
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  rangeButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#333',
    lineHeight: 16,
    letterSpacing: 0,
  },
  rangeButtonTextActive: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
    lineHeight: 16,
    letterSpacing: 0,
  },
  normInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 32,
    marginBottom: 12,
    marginTop: 4,
  },
  normLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    marginRight: 8,
  },
  normValue: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#1E4C60',
    lineHeight: 18,
    letterSpacing: 0,
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
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#F44336',
    marginBottom: 8,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Стили для графика
  chartScroll: {
    flex: 1,
  },
  svg: {
    marginTop: 8,
    marginBottom: 4,
  },
  legendContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendBox: {
    width: 24,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  legendText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
  },
  viewAllContainer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 16,
  },
  barChartContainer: {
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  periodNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontFamily: FONTS.semibold,
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    lineHeight: 28,
  },
  arrowTextDisabled: {
    color: '#999',
  },
  periodLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
    flex: 1,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
    lineHeight: 18,
    letterSpacing: 0,
  },
  sectionInfoButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  todayContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  todayItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
  todayLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0,
  },
  todayValueContainer: {
    alignItems: 'center',
  },
  todayValue: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#1E4C60',
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: 'center',
  },
  todayUnit: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  todayValueEmpty: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#CCC',
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: 'center',
  },
  graphContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  periodStatsContainer: {
    marginTop: 2,
    paddingTop: 4,
  },
  periodStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  periodStatLeft: {
    flex: 1,
  },
  periodStatLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
    lineHeight: 18,
    letterSpacing: 0,
  },
  periodStatSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#999',
    marginTop: 2,
  },
  periodStatValue: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#1E4C60',
    lineHeight: 18,
    letterSpacing: 0,
  },
});



