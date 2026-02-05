import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

/**
 * Тесты для утилитарной функции cn (className merger).
 * Функция объединяет CSS классы с помощью clsx и tailwind-merge.
 */
describe("cn utility function", () => {
  it("должна объединять несколько строк классов", () => {
    const result = cn("class1", "class2", "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("должна обрабатывать пустые значения", () => {
    const result = cn("class1", undefined, null, "class2");
    expect(result).toBe("class1 class2");
  });

  it("должна обрабатывать условные классы", () => {
    const isActive = true;
    const isDisabled = false;

    const result = cn("base", isActive && "active", isDisabled && "disabled");
    expect(result).toBe("base active");
  });

  it("должна объединять конфликтующие Tailwind классы", () => {
    // tailwind-merge должна оставить только последний класс при конфликте
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("должна работать с объектами классов", () => {
    const result = cn({
      "bg-red-500": true,
      "text-white": true,
      "border": false,
    });
    expect(result).toBe("bg-red-500 text-white");
  });

  it("должна работать с массивами", () => {
    const result = cn(["class1", "class2"], "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("должна возвращать пустую строку при отсутствии аргументов", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("должна корректно объединять различные варианты Tailwind", () => {
    // Проверяем слияние цветов фона
    const result = cn("bg-blue-500 hover:bg-blue-600", "bg-red-500");
    expect(result).toBe("hover:bg-blue-600 bg-red-500");
  });
});
