const fs = require('fs');
const path = require('path');

// Читаем сгенерированный Expo HTML
const exposGeneratedHtml = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf-8');

// Читаем наш кастомный HTML с Метрикой
const customHtml = fs.readFileSync(path.join(__dirname, '../web/index.html'), 'utf-8');

// Извлекаем все теги <script> из Expo HTML
const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>|<script[^>]*\/>/gi;
const expoScripts = exposGeneratedHtml.match(scriptRegex) || [];

// Вставляем скрипты Expo в конец <body> нашего HTML
const result = customHtml.replace('</body>', expoScripts.join('\n    ') + '\n  </body>');

// Сохраняем результат
fs.writeFileSync(path.join(__dirname, '../dist/index.html'), result, 'utf-8');

console.log('✅ HTML injected successfully with Yandex.Metrika and Expo scripts');

