import { vi } from "vitest";

/**
 * Мок для PrismaClient - имитирует методы Prisma для тестирования.
 * Каждый метод возвращает мокированную функцию, которую можно настроить в тестах.
 */
export const mockDb = {
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  mealPlan: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  userAllergy: {
    findMany: vi.fn(),
  },
  recipe: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  mealPlanRecipe: {
    create: vi.fn(),
    delete: vi.fn(),
  },
};

// Экспортируем мок как `db`
export const db = mockDb;

/**
 * Сбрасывает все моки в начальное состояние.
 */
export const resetDbMocks = () => {
  Object.values(mockDb).forEach((model) => {
    Object.values(model).forEach((method) => {
      if (typeof method === "function" && "mockReset" in method) {
        method.mockReset();
      }
    });
  });
};
