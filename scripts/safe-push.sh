#!/bin/bash

# Скрипт безопасного push с проверкой

CURRENT_BRANCH=$(git branch --show-current)

echo "🔍 Текущая ветка: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "⚠️  ВНИМАНИЕ! Вы собираетесь пушить в MAIN!"
  echo "   Это автоматически задеплоит изменения на peakflow.oxia.life"
  echo ""
  echo "🔍 Проверьте:"
  echo "   - Это веб-изменения или общие фиксы?"
  echo "   - Протестировали npm run web?"
  echo "   - Нет мобильно-специфичного кода?"
  echo ""
  read -p "Продолжить push в main? (yes/no): " confirm
  
  if [ "$confirm" != "yes" ]; then
    echo "❌ Push отменен"
    exit 1
  fi
fi

echo "✅ Выполняется push..."
git push origin "$CURRENT_BRANCH"


