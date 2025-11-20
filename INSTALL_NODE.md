# Установка Node.js и npm на macOS

## Вариант 1: Через Homebrew (рекомендуется)

### 1. Установите Homebrew (если ещё не установлен)

Откройте Терминал и выполните:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Установите Node.js

```bash
brew install node
```

### 3. Проверьте установку

```bash
node --version
npm --version
```

Должны увидеть версии, например:
```
v20.10.0
10.2.3
```

## Вариант 2: Через официальный установщик

1. Перейдите на https://nodejs.org/
2. Скачайте LTS версию (рекомендуется)
3. Откройте .pkg файл и следуйте инструкциям установщика
4. Перезапустите Терминал
5. Проверьте: `node --version && npm --version`

## Вариант 3: Через NVM (Node Version Manager)

NVM позволяет устанавливать и переключаться между разными версиями Node.js.

### 1. Установите NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### 2. Перезапустите терминал или выполните

```bash
source ~/.zshrc
```

### 3. Установите Node.js

```bash
nvm install node        # установит последнюю версию
nvm install --lts       # установит последнюю LTS версию
```

### 4. Используйте установленную версию

```bash
nvm use node
```

### 5. Проверьте

```bash
node --version
npm --version
```

## После установки Node.js

Перейдите в папку проекта и установите зависимости:

```bash
cd "/Users/monastyrskaya/Documents/peal flow"
npm install
```

Затем запустите проект:

```bash
npm start
```

## Возможные проблемы

### "command not found: node"

Если после установки команда `node` не найдена:

1. Перезапустите терминал
2. Проверьте PATH:
```bash
echo $PATH
```

3. Если используете NVM, убедитесь, что он активирован:
```bash
source ~/.zshrc
nvm use node
```

### Проблемы с правами доступа npm

Если при установке пакетов возникают ошибки прав доступа:

```bash
# Настройте npm для использования домашней папки
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Добавьте в PATH (в ~/.zshrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

## Полезные команды npm

```bash
npm install            # Установить зависимости
npm start             # Запустить проект
npm run android       # Запустить на Android
npm run ios           # Запустить на iOS
npm list              # Показать установленные пакеты
npm outdated          # Проверить устаревшие пакеты
npm update            # Обновить пакеты
```

## Рекомендуемые версии

- **Node.js:** 18.x или выше
- **npm:** 9.x или выше

Можете проверить актуальные версии на https://nodejs.org/

---

После успешной установки Node.js вернитесь к файлу **QUICKSTART.md** для продолжения настройки проекта.



