import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { Profile, PEFRecord, TimePeriod } from '../types/models';

/**
 * Класс для работы с локальной базой данных SQLite
 * Хранит записи PEF и профиль пользователя
 * 
 * ВАЖНО: SQLite работает только на iOS/Android!
 * Для web используйте старый Storage.ts с AsyncStorage
 */
class DiaryStorage {
  private db: SQLite.WebSQLDatabase | null = null;
  private isWebPlatform: boolean;

  constructor() {
    // Проверяем платформу
    this.isWebPlatform = Platform.OS === 'web';
    
    if (this.isWebPlatform) {
      console.warn('SQLite не поддерживается в web. Используйте AsyncStorage.');
      return;
    }

    try {
      // Открываем базу данных только для iOS/Android
      this.db = SQLite.openDatabase('peakflow.db');
      
      // Создаём таблицы при инициализации
      this.initDatabase();
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      console.warn('Falling back to web mode');
      this.isWebPlatform = true;
    }
  }

  /**
   * Инициализация базы данных - создание таблиц
   */
  private initDatabase(): void {
    if (!this.db) return;
    
    this.db.transaction(
      (tx) => {
        // Таблица записей PEF
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS pef_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            timePeriod TEXT NOT NULL,
            value INTEGER NOT NULL,
            cough INTEGER NOT NULL DEFAULT 0,
            breathlessness INTEGER NOT NULL DEFAULT 0,
            sputum INTEGER NOT NULL DEFAULT 0,
            createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );`
        );

        // Индекс для быстрого поиска по дате
        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_pef_date 
           ON pef_records(date, timePeriod);`
        );

        // Таблица профиля пользователя
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            gender TEXT NOT NULL,
            birthYear INTEGER NOT NULL,
            heightCm INTEGER NOT NULL,
            normMethod TEXT NOT NULL DEFAULT 'auto',
            manualNorm INTEGER,
            updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );`
        );

        // Таблица настроек приложения
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );`
        );
      },
      (error) => {
        console.error('Error initializing database:', error);
      },
      () => {
        console.log('Database initialized successfully');
      }
    );
  }

  /**
   * Сохраняет новую запись PEF в базу данных
   * 
   * @param record - Объект записи с полями: date, timePeriod, value, cough, breathlessness, sputum
   * @returns Promise<number> - ID созданной записи
   */
  saveRecord(record: {
    date: string;
    timePeriod: TimePeriod;
    value: number;
    cough: boolean;
    breathlessness: boolean;
    sputum: boolean;
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO pef_records (date, timePeriod, value, cough, breathlessness, sputum)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [
              record.date,
              record.timePeriod,
              record.value,
              record.cough ? 1 : 0,
              record.breathlessness ? 1 : 0,
              record.sputum ? 1 : 0,
            ],
            (_, result) => {
              resolve(result.insertId || 0);
            },
            (_, error) => {
              console.error('Error saving record:', error);
              reject(error);
              return false;
            }
          );
        },
        (error) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Получает записи PEF из базы данных за указанный период
   * 
   * @param fromDate - Начальная дата (YYYY-MM-DD), опционально
   * @param toDate - Конечная дата (YYYY-MM-DD), опционально
   * @returns Promise<PEFRecord[]> - Массив записей
   */
  getRecords(fromDate?: string, toDate?: string): Promise<PEFRecord[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        let query = 'SELECT * FROM pef_records';
        const params: any[] = [];

        // Добавляем фильтрацию по датам, если указаны
        if (fromDate && toDate) {
          query += ' WHERE date >= ? AND date <= ?';
          params.push(fromDate, toDate);
        } else if (fromDate) {
          query += ' WHERE date >= ?';
          params.push(fromDate);
        } else if (toDate) {
          query += ' WHERE date <= ?';
          params.push(toDate);
        }

        // Сортировка по дате (новые сначала) и времени суток
        query += ' ORDER BY date DESC, timePeriod DESC;';

        tx.executeSql(
          query,
          params,
          (_, result) => {
            const records: PEFRecord[] = [];
            
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              records.push({
                id: row.id.toString(),
                date: row.date,
                timePeriod: row.timePeriod as TimePeriod,
                value: row.value,
                cough: row.cough === 1,
                breathlessness: row.breathlessness === 1,
                sputum: row.sputum === 1,
              });
            }
            
            resolve(records);
          },
          (_, error) => {
            console.error('Error getting records:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Получает все записи PEF
   * 
   * @returns Promise<PEFRecord[]> - Массив всех записей
   */
  getAllRecords(): Promise<PEFRecord[]> {
    return this.getRecords();
  }

  /**
   * Получает запись по ID
   * 
   * @param id - ID записи
   * @returns Promise<PEFRecord | null> - Запись или null, если не найдена
   */
  getRecordById(id: number): Promise<PEFRecord | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM pef_records WHERE id = ?;',
          [id],
          (_, result) => {
            if (result.rows.length > 0) {
              const row = result.rows.item(0);
              resolve({
                id: row.id.toString(),
                date: row.date,
                timePeriod: row.timePeriod as TimePeriod,
                value: row.value,
                cough: row.cough === 1,
                breathlessness: row.breathlessness === 1,
                sputum: row.sputum === 1,
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Error getting record by ID:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Обновляет существующую запись
   * 
   * @param id - ID записи для обновления
   * @param record - Новые данные записи
   * @returns Promise<void>
   */
  updateRecord(
    id: number,
    record: {
      date: string;
      timePeriod: TimePeriod;
      value: number;
      cough: boolean;
      breathlessness: boolean;
      sputum: boolean;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `UPDATE pef_records 
           SET date = ?, timePeriod = ?, value = ?, 
               cough = ?, breathlessness = ?, sputum = ?
           WHERE id = ?;`,
          [
            record.date,
            record.timePeriod,
            record.value,
            record.cough ? 1 : 0,
            record.breathlessness ? 1 : 0,
            record.sputum ? 1 : 0,
            id,
          ],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve();
            } else {
              reject(new Error(`Record with ID ${id} not found`));
            }
          },
          (_, error) => {
            console.error('Error updating record:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Удаляет запись по ID
   * 
   * @param id - ID записи для удаления
   * @returns Promise<void>
   */
  deleteRecord(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'DELETE FROM pef_records WHERE id = ?;',
          [id],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve();
            } else {
              reject(new Error(`Record with ID ${id} not found`));
            }
          },
          (_, error) => {
            console.error('Error deleting record:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Сохраняет профиль пользователя
   * Если профиль уже существует (id=1), обновляет его, иначе создаёт новый
   * 
   * @param profile - Объект профиля с полями: gender, birthYear, heightCm, normMethod, manualNorm
   * @returns Promise<void>
   */
  saveProfile(profile: {
    gender: 'M' | 'F';
    birthYear: number;
    heightCm: number;
    normMethod: 'auto' | 'manual';
    manualNorm?: number | null;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        // Сначала проверяем, существует ли профиль
        tx.executeSql(
          'SELECT id FROM profile WHERE id = 1;',
          [],
          (_, result) => {
            const exists = result.rows.length > 0;

            if (exists) {
              // UPDATE существующего профиля
              tx.executeSql(
                `UPDATE profile 
                 SET gender = ?, birthYear = ?, heightCm = ?, 
                     normMethod = ?, manualNorm = ?, updatedAt = CURRENT_TIMESTAMP
                 WHERE id = 1;`,
                [
                  profile.gender,
                  profile.birthYear,
                  profile.heightCm,
                  profile.normMethod,
                  profile.manualNorm || null,
                ],
                () => {
                  resolve();
                },
                (_, error) => {
                  console.error('Error updating profile:', error);
                  reject(error);
                  return false;
                }
              );
            } else {
              // INSERT нового профиля
              tx.executeSql(
                `INSERT INTO profile (id, gender, birthYear, heightCm, normMethod, manualNorm)
                 VALUES (1, ?, ?, ?, ?, ?);`,
                [
                  profile.gender,
                  profile.birthYear,
                  profile.heightCm,
                  profile.normMethod,
                  profile.manualNorm || null,
                ],
                () => {
                  resolve();
                },
                (_, error) => {
                  console.error('Error inserting profile:', error);
                  reject(error);
                  return false;
                }
              );
            }
          },
          (_, error) => {
            console.error('Error checking profile existence:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Получает профиль пользователя из базы данных
   * 
   * @returns Promise<Profile | null> - Профиль или null, если не найден
   */
  getProfile(): Promise<Profile | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM profile WHERE id = 1;',
          [],
          (_, result) => {
            if (result.rows.length > 0) {
              const row = result.rows.item(0);
              resolve({
                gender: row.gender as 'M' | 'F',
                birthYear: row.birthYear,
                heightCm: row.heightCm,
                normMethod: row.normMethod as 'auto' | 'manual',
                manualNormValue: row.manualNorm,
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Error getting profile:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Проверяет, завершён ли онбординг
   * 
   * @returns Promise<boolean>
   */
  hasCompletedOnboarding(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          "SELECT value FROM app_settings WHERE key = 'onboarding_completed';",
          [],
          (_, result) => {
            if (result.rows.length > 0) {
              resolve(result.rows.item(0).value === 'true');
            } else {
              resolve(false);
            }
          },
          (_, error) => {
            console.error('Error checking onboarding status:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Устанавливает статус завершения онбординга
   * 
   * @returns Promise<void>
   */
  setOnboardingCompleted(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO app_settings (key, value)
           VALUES ('onboarding_completed', 'true');`,
          [],
          () => {
            resolve();
          },
          (_, error) => {
            console.error('Error setting onboarding status:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Получает количество записей в базе данных
   * 
   * @returns Promise<number> - Количество записей
   */
  getRecordsCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          'SELECT COUNT(*) as count FROM pef_records;',
          [],
          (_, result) => {
            resolve(result.rows.item(0).count);
          },
          (_, error) => {
            console.error('Error getting records count:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Получает статистику за период
   * 
   * @param fromDate - Начальная дата
   * @param toDate - Конечная дата
   * @returns Promise с минимальным, максимальным и средним значениями PEF
   */
  getStatistics(
    fromDate?: string,
    toDate?: string
  ): Promise<{
    min: number;
    max: number;
    avg: number;
    count: number;
  } | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        let query = `SELECT 
          MIN(value) as min,
          MAX(value) as max,
          AVG(value) as avg,
          COUNT(*) as count
          FROM pef_records`;
        
        const params: any[] = [];

        if (fromDate && toDate) {
          query += ' WHERE date >= ? AND date <= ?';
          params.push(fromDate, toDate);
        } else if (fromDate) {
          query += ' WHERE date >= ?';
          params.push(fromDate);
        } else if (toDate) {
          query += ' WHERE date <= ?';
          params.push(toDate);
        }

        query += ';';

        tx.executeSql(
          query,
          params,
          (_, result) => {
            if (result.rows.length > 0 && result.rows.item(0).count > 0) {
              const row = result.rows.item(0);
              resolve({
                min: row.min,
                max: row.max,
                avg: Math.round(row.avg),
                count: row.count,
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Error getting statistics:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Удаляет все данные из базы (записи и профиль)
   * 
   * @returns Promise<void>
   */
  clearAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql('DELETE FROM pef_records;');
          tx.executeSql('DELETE FROM profile;');
          tx.executeSql('DELETE FROM app_settings;');
        },
        (error) => {
          console.error('Error clearing all data:', error);
          reject(error);
        },
        () => {
          console.log('All data cleared successfully');
          resolve();
        }
      );
    });
  }

  /**
   * Полностью удаляет базу данных (DROP всех таблиц)
   * 
   * @returns Promise<void>
   */
  dropAllTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx) => {
          tx.executeSql('DROP TABLE IF EXISTS pef_records;');
          tx.executeSql('DROP TABLE IF EXISTS profile;');
          tx.executeSql('DROP TABLE IF EXISTS app_settings;');
          tx.executeSql('DROP INDEX IF EXISTS idx_pef_date;');
        },
        (error) => {
          console.error('Error dropping tables:', error);
          reject(error);
        },
        () => {
          console.log('All tables dropped successfully');
          // Пересоздаём таблицы
          this.initDatabase();
          resolve();
        }
      );
    });
  }

  /**
   * Экспортирует все данные в JSON для бэкапа
   * 
   * @returns Promise<object> - Объект со всеми данными
   */
  async exportData(): Promise<{
    profile: Profile | null;
    records: PEFRecord[];
    exportDate: string;
  }> {
    const profile = await this.getProfile();
    const records = await this.getAllRecords();
    
    return {
      profile,
      records,
      exportDate: new Date().toISOString(),
    };
  }

  /**
   * Импортирует данные из JSON (для восстановления бэкапа)
   * 
   * @param data - Объект с данными для импорта
   * @returns Promise<void>
   */
  async importData(data: {
    profile?: Profile | null;
    records?: PEFRecord[];
  }): Promise<void> {
    // Очищаем существующие данные
    await this.clearAll();

    // Импортируем профиль
    if (data.profile) {
      await this.saveProfile(data.profile);
    }

    // Импортируем записи
    if (data.records && data.records.length > 0) {
      for (const record of data.records) {
        await this.saveRecord({
          date: record.date,
          timePeriod: record.timePeriod,
          value: record.value,
          cough: record.cough,
          breathlessness: record.breathlessness,
          sputum: record.sputum,
        });
      }
    }
  }
}

// Экспортируем синглтон для глобального использования
export const storage = new DiaryStorage();

// Экспортируем класс для тестирования
export default DiaryStorage;

