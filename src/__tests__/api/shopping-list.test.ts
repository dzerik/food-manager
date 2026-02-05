import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb, resetDbMocks } from "../mocks/db";
import {
  mockAuth,
  mockUser,
  setAuthenticatedSession,
  setUnauthenticatedSession,
  resetAuthMock,
} from "../mocks/auth";

// Мокаем модули
vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

// Импортируем после мокирования
import { GET } from "@/app/api/meal-plans/[id]/shopping-list/route";

/**
 * Создает mock NextRequest объект.
 */
function createMockRequest(url: string) {
  const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url}`;
  return {
    nextUrl: new URL(fullUrl),
  } as any;
}

/**
 * Создает mock params объект для dynamic routes.
 */
function createParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("/api/meal-plans/[id]/shopping-list", () => {
  beforeEach(() => {
    resetDbMocks();
    resetAuthMock();
  });

  describe("GET /api/meal-plans/:id/shopping-list", () => {
    it("должен возвращать 401 для неавторизованного пользователя", async () => {
      // Arrange
      setUnauthenticatedSession();

      const request = createMockRequest("/api/meal-plans/plan-1/shopping-list");

      // Act
      const response = await GET(request, createParams("plan-1"));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("должен возвращать 404 если план не найден", async () => {
      // Arrange
      setAuthenticatedSession();
      mockDb.mealPlan.findUnique.mockResolvedValue(null);
      mockDb.product.findMany.mockResolvedValue([]);

      const request = createMockRequest("/api/meal-plans/nonexistent/shopping-list");

      // Act
      const response = await GET(request, createParams("nonexistent"));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Meal plan not found");
    });

    it("должен агрегировать ингредиенты из всех рецептов", async () => {
      // Arrange
      setAuthenticatedSession();
      const mockMealPlan = {
        id: "plan-1",
        name: "Тестовый план",
        userId: mockUser.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        recipes: [
          {
            servings: 2,
            recipe: {
              servings: 2,
              ingredients: [
                {
                  productId: "product-1",
                  amountInGrams: 200,
                  isOptional: false,
                  product: {
                    name: "Молоко",
                    category: "dairy",
                    defaultUnit: "ml",
                    dietaryInfo: null,
                  },
                },
                {
                  productId: "product-2",
                  amountInGrams: 100,
                  isOptional: false,
                  product: {
                    name: "Мука",
                    category: "grains",
                    defaultUnit: "g",
                    dietaryInfo: null,
                  },
                },
              ],
            },
          },
          {
            servings: 4, // Удвоенная порция
            recipe: {
              servings: 2,
              ingredients: [
                {
                  productId: "product-1", // Тот же продукт
                  amountInGrams: 150,
                  isOptional: false,
                  product: {
                    name: "Молоко",
                    category: "dairy",
                    defaultUnit: "ml",
                    dietaryInfo: null,
                  },
                },
              ],
            },
          },
        ],
      };
      const mockProducts = [
        { id: "product-1", packageSize: null, isAlwaysOwned: false, gramsPerPiece: null },
        { id: "product-2", packageSize: 1000, isAlwaysOwned: false, gramsPerPiece: null },
      ];

      mockDb.mealPlan.findUnique.mockResolvedValue(mockMealPlan);
      mockDb.product.findMany.mockResolvedValue(mockProducts);
      mockDb.userAllergy.findMany.mockResolvedValue([]);

      const request = createMockRequest("/api/meal-plans/plan-1/shopping-list");

      // Act
      const response = await GET(request, createParams("plan-1"));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.totalItems).toBe(2);

      // Молоко: 200 + (150 * 4/2) = 200 + 300 = 500г
      const milk = data.items.find((i: any) => i.productId === "product-1");
      expect(milk.totalGrams).toBe(500);

      // Мука: 100г, но packageSize=1000, значит roundedGrams=1000
      const flour = data.items.find((i: any) => i.productId === "product-2");
      expect(flour.roundedGrams).toBe(1000);
      expect(flour.packagesNeeded).toBe(1);
    });

    it("должен исключать продукты с аллергенами пользователя", async () => {
      // Arrange
      setAuthenticatedSession();
      const mockMealPlan = {
        id: "plan-1",
        name: "План",
        userId: mockUser.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        recipes: [
          {
            servings: 2,
            recipe: {
              servings: 2,
              ingredients: [
                {
                  productId: "product-1",
                  amountInGrams: 100,
                  isOptional: false,
                  product: {
                    name: "Арахис",
                    category: "nuts",
                    defaultUnit: "g",
                    dietaryInfo: {
                      allergens: JSON.stringify(["peanuts"]),
                    },
                  },
                },
              ],
            },
          },
        ],
      };
      mockDb.mealPlan.findUnique.mockResolvedValue(mockMealPlan);
      mockDb.product.findMany.mockResolvedValue([
        { id: "product-1", packageSize: null, isAlwaysOwned: false, gramsPerPiece: null },
      ]);
      // Пользователь имеет аллергию на арахис
      mockDb.userAllergy.findMany.mockResolvedValue([{ allergen: "peanuts" }]);

      const request = createMockRequest("/api/meal-plans/plan-1/shopping-list");

      // Act
      const response = await GET(request, createParams("plan-1"));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.excludedItems).toBe(1);
      const peanuts = data.items.find((i: any) => i.productId === "product-1");
      expect(peanuts.isExcluded).toBe(true);
      expect(peanuts.excludeReason).toBe("Аллергия");
    });

    it("должен отмечать продукты которые всегда есть дома", async () => {
      // Arrange
      setAuthenticatedSession();
      const mockMealPlan = {
        id: "plan-1",
        name: "План",
        userId: mockUser.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        recipes: [
          {
            servings: 2,
            recipe: {
              servings: 2,
              ingredients: [
                {
                  productId: "product-1",
                  amountInGrams: 10,
                  isOptional: false,
                  product: {
                    name: "Соль",
                    category: "spices",
                    defaultUnit: "g",
                    dietaryInfo: null,
                  },
                },
              ],
            },
          },
        ],
      };
      mockDb.mealPlan.findUnique.mockResolvedValue(mockMealPlan);
      mockDb.product.findMany.mockResolvedValue([
        { id: "product-1", packageSize: null, isAlwaysOwned: true, gramsPerPiece: null },
      ]);
      mockDb.userAllergy.findMany.mockResolvedValue([]);

      const request = createMockRequest("/api/meal-plans/plan-1/shopping-list");

      // Act
      const response = await GET(request, createParams("plan-1"));
      const data = await response.json();

      // Assert
      const salt = data.items.find((i: any) => i.productId === "product-1");
      expect(salt.isAlwaysOwned).toBe(true);
      expect(salt.isChecked).toBe(true);
    });

    it("должен группировать продукты по категориям", async () => {
      // Arrange
      setAuthenticatedSession();
      const mockMealPlan = {
        id: "plan-1",
        name: "План",
        userId: mockUser.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        recipes: [
          {
            servings: 2,
            recipe: {
              servings: 2,
              ingredients: [
                {
                  productId: "product-1",
                  amountInGrams: 100,
                  isOptional: false,
                  product: { name: "Молоко", category: "dairy", defaultUnit: "ml", dietaryInfo: null },
                },
                {
                  productId: "product-2",
                  amountInGrams: 200,
                  isOptional: false,
                  product: { name: "Помидоры", category: "vegetables", defaultUnit: "g", dietaryInfo: null },
                },
              ],
            },
          },
        ],
      };
      mockDb.mealPlan.findUnique.mockResolvedValue(mockMealPlan);
      mockDb.product.findMany.mockResolvedValue([
        { id: "product-1", packageSize: null, isAlwaysOwned: false, gramsPerPiece: null },
        { id: "product-2", packageSize: null, isAlwaysOwned: false, gramsPerPiece: null },
      ]);
      mockDb.userAllergy.findMany.mockResolvedValue([]);

      const request = createMockRequest("/api/meal-plans/plan-1/shopping-list");

      // Act
      const response = await GET(request, createParams("plan-1"));
      const data = await response.json();

      // Assert
      expect(data.groupedByCategory).toBeDefined();
      expect(data.groupedByCategory.dairy).toHaveLength(1);
      expect(data.groupedByCategory.vegetables).toHaveLength(1);
    });

    it("должен корректно рассчитывать количество упаковок", async () => {
      // Arrange
      setAuthenticatedSession();
      const mockMealPlan = {
        id: "plan-1",
        name: "План",
        userId: mockUser.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        recipes: [
          {
            servings: 2,
            recipe: {
              servings: 2,
              ingredients: [
                {
                  productId: "product-1",
                  amountInGrams: 350, // Нужно 350г
                  isOptional: false,
                  product: { name: "Макароны", category: "grains", defaultUnit: "g", dietaryInfo: null },
                },
              ],
            },
          },
        ],
      };
      mockDb.mealPlan.findUnique.mockResolvedValue(mockMealPlan);
      mockDb.product.findMany.mockResolvedValue([
        { id: "product-1", packageSize: 500, isAlwaysOwned: false, gramsPerPiece: null }, // Упаковка 500г
      ]);
      mockDb.userAllergy.findMany.mockResolvedValue([]);

      const request = createMockRequest("/api/meal-plans/plan-1/shopping-list");

      // Act
      const response = await GET(request, createParams("plan-1"));
      const data = await response.json();

      // Assert
      const pasta = data.items.find((i: any) => i.productId === "product-1");
      expect(pasta.totalGrams).toBe(350);
      expect(pasta.roundedGrams).toBe(500); // Округлено до упаковки
      expect(pasta.packagesNeeded).toBe(1);
    });
  });
});
