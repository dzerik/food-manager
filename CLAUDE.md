# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## О проекте

**Food Manager** — сервис планирования меню на неделю с автоматическим формированием списка покупок.

### Требования к продукту

- Каталог минимум из 20 блюд с ингредиентами
- Выбор блюд на 7 дней
- Агрегированный список продуктов с суммарными количествами
- Исключение продуктов (аллергии) с пересчётом корзины

## MCP серверы

Проект использует следующие MCP серверы (настроены в `.mcp.json`):

| Сервер | Назначение |
|--------|------------|
| serena | Навигация по коду, символьное редактирование |
| context7 | Документация библиотек |
| sequential-thinking | Анализ сложных задач |
| playwright | E2E тестирование |
| @magicuidesign/mcp | UI компоненты |
| memory | Персистентная память |
| package-version | Проверка версий пакетов |
| mcp-compass | Поиск MCP серверов |

## Технологический стек

| Слой | Технология |
|------|------------|
| Frontend | Next.js 15 + React 19 |
| Стили | Tailwind CSS v4 + Shadcn/ui |
| ORM | Prisma |
| База данных | SQLite (dev) / PostgreSQL (prod) |
| Валидация | Zod |

## Команды разработки

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Миграции БД
npx prisma migrate dev
npx prisma generate

# Prisma Studio (GUI для БД)
npx prisma studio

# Сборка
npm run build

# Линтинг
npm run lint
```

## Архитектура

Подробный анализ в [`docs/ANALYSIS.md`](docs/ANALYSIS.md):
- Модель данных продуктов (питание, хранение, сезонность, сочетаемость)
- Модель данных рецептов (классификация, сложность, диеты)
- Prisma schema
- Best practices для списка покупок и аллергий
