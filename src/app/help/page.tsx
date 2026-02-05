"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingCart,
  Calendar,
  UtensilsCrossed,
  Package,
  Settings,
  HelpCircle,
  ChevronRight,
  Keyboard,
} from "lucide-react";

const sections = [
  {
    id: "getting-started",
    title: "Начало работы",
    icon: HelpCircle,
    content: [
      {
        title: "Регистрация и вход",
        text: `1. Откройте приложение и нажмите «Регистрация»
2. Введите email и пароль
3. После регистрации вы автоматически войдёте в систему`,
      },
      {
        title: "Навигация",
        text: `В верхнем меню доступны разделы:
• Рецепты — каталог рецептов с поиском и фильтрами
• Продукты — база продуктов с пищевой ценностью
• План питания — планирование меню на неделю
• Список покупок — автоматически сформированный список
• Настройки — профиль, расчёт калорий, аллергии`,
      },
    ],
  },
  {
    id: "products",
    title: "Продукты",
    icon: Package,
    content: [
      {
        title: "Просмотр каталога",
        text: `Каталог содержит 150+ продуктов с информацией:
• Пищевая ценность (калории, белки, жиры, углеводы на 100г)
• Категория (овощи, мясо, крупы и т.д.)
• Единица измерения (граммы, миллилитры, штуки)
• Размер упаковки (для округления в списке покупок)
• Аллергены (молоко, яйца, глютен и т.д.)`,
      },
      {
        title: "Добавление продукта",
        text: `1. Перейдите в раздел «Продукты»
2. Нажмите «Добавить продукт»
3. Заполните обязательные поля:
   • Название — например, «Куриная грудка»
   • Категория — выберите из списка
4. Дополнительно укажите пищевую ценность, аллергены и размер упаковки
5. Нажмите «Создать продукт»`,
      },
      {
        title: "Размер упаковки",
        text: `Укажите размер типичной упаковки продукта в граммах.
Это используется для округления в списке покупок:
• Молоко (1000г): 750г → 1000г (1 уп.)
• Рис (500г): 350г → 500г (1 уп.)`,
      },
      {
        title: "Всегда есть дома",
        text: `Отметьте продукты, которые обычно не нужно покупать (соль, перец, базовые специи).
Они будут автоматически отмечены как купленные в списке покупок.`,
      },
    ],
  },
  {
    id: "recipes",
    title: "Рецепты",
    icon: UtensilsCrossed,
    content: [
      {
        title: "Поиск и фильтрация",
        text: `Используйте поиск по названию рецепта.

Доступные фильтры:
• Приём пищи — завтрак, обед, ужин, перекус
• Кухня — русская, итальянская, азиатская и др.
• Время приготовления — до 15 мин, до 30 мин, до 1 часа
• Сложность — от «очень легко» до «очень сложно»
• Диета — вегетарианское, веганское

Активные фильтры отображаются как бейджи — нажмите ✕ чтобы убрать.`,
      },
      {
        title: "Создание рецепта",
        text: `1. Нажмите «Добавить рецепт»
2. Заполните информацию: название, описание, время, порции, сложность
3. Добавьте ингредиенты из каталога продуктов
4. Добавьте пошаговые инструкции
5. Калорийность рассчитается автоматически на основе ингредиентов
6. Нажмите «Создать рецепт»`,
      },
      {
        title: "Автоматический расчёт калорий",
        text: `При добавлении ингредиентов калорийность рецепта рассчитывается автоматически:
• На основе пищевой ценности каждого продукта
• С учётом количества каждого ингредиента
• Делится на количество порций

Вы можете скорректировать значения вручную если нужно.`,
      },
    ],
  },
  {
    id: "meal-plan",
    title: "План питания",
    icon: Calendar,
    content: [
      {
        title: "Создание плана",
        text: `1. Перейдите в раздел «План питания»
2. Нажмите «Новый план»
3. Введите название (необязательно)
4. Выберите период:
   • Быстрый выбор: «Эта неделя», «Следующая неделя», «2 недели», «Месяц»
   • Или выберите произвольный диапазон в календаре
5. Нажмите «Создать план»`,
      },
      {
        title: "Изменение периода",
        text: `Вы можете изменить период уже созданного плана:
1. Откройте план
2. Нажмите на даты рядом с названием (они кликабельны)
3. Выберите новый диапазон в календаре
4. Нажмите «Сохранить»

Рецепты за пределами нового периода останутся в плане, но не будут отображаться.`,
      },
      {
        title: "Добавление рецептов",
        text: `1. Откройте созданный план
2. Нажмите на нужный день
3. В окне выберите приём пищи (завтрак, обед, ужин, перекус)
4. Нажмите «+ Добавить рецепт»
5. Выберите рецепт и укажите количество порций`,
      },
      {
        title: "Редактирование дня",
        text: `В окне редактирования дня вы можете:
• Видеть все приёмы пищи сразу
• Изменять количество порций
• Удалять рецепты из плана
• Видеть калорийность каждого приёма пищи
• Видеть общую калорийность дня`,
      },
      {
        title: "Копирование плана",
        text: `Чтобы скопировать план одного дня в другие:
1. Откройте день, который хотите скопировать
2. Нажмите «Копировать в другие дни»
3. Выберите дни назначения
4. Выберите: заменить существующие записи или добавить к ним
5. Нажмите «Копировать»`,
      },
      {
        title: "Отслеживание калорий",
        text: `• Каждый приём пищи показывает сумму калорий
• Внизу дня отображается общая калорийность
• Прогресс-бар показывает процент от дневной нормы (2000 ккал)`,
      },
    ],
  },
  {
    id: "shopping-list",
    title: "Список покупок",
    icon: ShoppingCart,
    content: [
      {
        title: "Автоматическое формирование",
        text: `Список покупок формируется автоматически на основе:
• Всех рецептов в текущем плане питания
• Количества порций каждого рецепта
• Ингредиенты суммируются если повторяются`,
      },
      {
        title: "Группировка по категориям",
        text: `Продукты группируются для удобства:
• Овощи
• Фрукты
• Мясо
• Рыба
• Молочные продукты
• Крупы
• И другие...`,
      },
      {
        title: "Округление до упаковки",
        text: `Если у продукта указан размер упаковки, количество округляется:
• Молоко (упаковка 1000г): 750г → 1000г (1 уп.)
• Рис (упаковка 500г): 350г → 500г (1 уп.)`,
      },
      {
        title: "Отметка купленных",
        text: `• Нажмите на чекбокс слева от продукта
• Отмеченные продукты перечёркиваются
• Прогресс-бар показывает процент купленных
• Состояние сохраняется в браузере`,
      },
      {
        title: "Экспорт и копирование",
        text: `Нажмите «Экспорт» и выберите формат:
• Текст (.txt) — для мессенджера
• CSV (.csv) — для Excel
• JSON (.json) — для других приложений

Или нажмите «Копировать» для копирования в буфер обмена.`,
      },
    ],
  },
  {
    id: "settings",
    title: "Настройки",
    icon: Settings,
    content: [
      {
        title: "Профиль",
        text: `В разделе «Настройки» вы можете:
• Изменить имя пользователя
• Изменить email
• Выйти из системы`,
      },
      {
        title: "Расчёт дневной нормы калорий (ВАЖНО!)",
        text: `Для точного отслеживания калорий обязательно заполните параметры тела:

• Пол — базовый метаболизм у мужчин выше на 5-10%
• Дата рождения — с возрастом метаболизм замедляется
• Вес (кг) — основной фактор расчёта
• Рост (см) — влияет на базовый метаболизм
• Уровень активности — множитель для дневной нормы

Как использовать:
1. Перейдите в «Настройки»
2. Заполните поля в разделе «Параметры тела»
3. Нажмите кнопку «Рассчитать» — система вычислит вашу норму
4. Или введите значение вручную
5. Нажмите «Сохранить»

После сохранения прогресс-бар в плане питания будет показывать % от вашей личной нормы.`,
      },
      {
        title: "Формула расчёта",
        text: `Используется формула Миффлина-Сан Жеора:

Мужчины: BMR = 10×вес + 6.25×рост - 5×возраст + 5
Женщины: BMR = 10×вес + 6.25×рост - 5×возраст - 161

Затем BMR умножается на коэффициент активности:
• Сидячий образ жизни: ×1.2
• Лёгкая активность (1-3 раза/нед): ×1.375
• Умеренная активность (3-5 раз/нед): ×1.55
• Высокая активность (6-7 раз/нед): ×1.725
• Очень высокая активность: ×1.9

Пример: женщина 30 лет, 65 кг, 165 см, умеренная активность
BMR = 1370 ккал → TDEE = 2124 ккал/день`,
      },
      {
        title: "Аллергии",
        text: `1. Перейдите в «Настройки»
2. В разделе «Аллергии» отметьте ваши аллергены:
   • Молоко, Яйца, Рыба, Моллюски
   • Орехи, Арахис, Пшеница/Глютен
   • Соя, Кунжут, Сельдерей, Горчица
3. Нажмите «Сохранить»

После сохранения продукты с аллергенами будут отмечены в списке покупок.`,
      },
      {
        title: "Тёмная тема",
        text: `Нажмите на иконку солнца/луны в верхнем меню для переключения между светлой и тёмной темой.`,
      },
    ],
  },
];

const faq = [
  {
    question: "Как изменить количество порций в плане?",
    answer:
      "Откройте день в плане питания, найдите нужный рецепт и измените число в поле порций.",
  },
  {
    question: "Почему калории не совпадают с рецептом?",
    answer:
      "Калорийность в плане зависит от количества порций. Если указано 2 порции, калорийность удваивается.",
  },
  {
    question: "Как удалить рецепт из плана?",
    answer:
      "Откройте день, найдите рецепт и нажмите кнопку удаления (✕) рядом с ним.",
  },
  {
    question: "Можно ли использовать без регистрации?",
    answer: "Нет, для сохранения планов и настроек требуется регистрация.",
  },
  {
    question: "Как добавить свой продукт?",
    answer:
      'Перейдите в раздел «Продукты» → «Добавить продукт» и заполните информацию о продукте.',
  },
  {
    question: "Как работает округление до упаковки?",
    answer:
      "Если у продукта указан размер упаковки, количество в списке покупок округляется вверх до ближайшего целого числа упаковок.",
  },
];

const shortcuts = [
  { key: "/", action: "Фокус на поиск" },
  { key: "Esc", action: "Закрыть модальное окно" },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filteredSections = sections.filter((section) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.content.some(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.text.toLowerCase().includes(query)
      )
    );
  });

  const filteredFaq = faq.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold">Справка</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
            Руководство пользователя Food Manager
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по справке..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Links */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card
              key={section.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setActiveSection(section.id)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <section.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{section.title}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion
                  type="single"
                  collapsible
                  defaultValue={activeSection === section.id ? section.content[0]?.title : undefined}
                >
                  {section.content.map((item, index) => (
                    <AccordionItem key={index} value={item.title}>
                      <AccordionTrigger>{item.title}</AccordionTrigger>
                      <AccordionContent>
                        <div className="whitespace-pre-line text-muted-foreground">
                          {item.text}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        {filteredFaq.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Часто задаваемые вопросы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {filteredFaq.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Keyboard Shortcuts */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              Горячие клавиши
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center gap-4">
                  <Badge variant="secondary" className="font-mono">
                    {shortcut.key}
                  </Badge>
                  <span className="text-muted-foreground">{shortcut.action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Не нашли ответ?{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Свяжитесь с нами
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
