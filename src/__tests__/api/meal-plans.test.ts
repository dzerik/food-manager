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
import { GET, POST } from "@/app/api/meal-plans/route";

/**
 * Создает mock NextRequest объект.
 */
function createMockRequest(url: string, options?: { method?: string; body?: unknown }) {
  const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url}`;
  return {
    nextUrl: new URL(fullUrl),
    json: async () => options?.body || null,
  } as any;
}

describe("/api/meal-plans", () => {
  beforeEach(() => {
    resetDbMocks();
    resetAuthMock();
  });

  describe("GET /api/meal-plans", () => {
    it("должен возвращать список планов питания для авторизованного пользователя", async () => {
      // Arrange
      setAuthenticatedSession();
      const mockMealPlans = [
        {
          id: "plan-1",
          name: "Неделя 1",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-07"),
          userId: mockUser.id,
          recipes: [],
          _count: { recipes: 5 },
        },
      ];
      mockDb.mealPlan.findMany.mockResolvedValue(mockMealPlans);

      const request = createMockRequest("/api/meal-plans");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.mealPlans).toHaveLength(1);
      expect(mockDb.mealPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id },
        })
      );
    });

    it("должен возвращать 401 для неавторизованного пользователя", async () => {
      // Arrange
      setUnauthenticatedSession();

      const request = createMockRequest("/api/meal-plans");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("должен поддерживать параметр limit", async () => {
      // Arrange
      setAuthenticatedSession();
      mockDb.mealPlan.findMany.mockResolvedValue([]);

      const request = createMockRequest("/api/meal-plans?limit=5");

      // Act
      await GET(request);

      // Assert
      expect(mockDb.mealPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it("должен сортировать по startDate в порядке убывания", async () => {
      // Arrange
      setAuthenticatedSession();
      mockDb.mealPlan.findMany.mockResolvedValue([]);

      const request = createMockRequest("/api/meal-plans");

      // Act
      await GET(request);

      // Assert
      expect(mockDb.mealPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startDate: "desc" },
        })
      );
    });
  });

  describe("POST /api/meal-plans", () => {
    it("должен создавать план питания для авторизованного пользователя", async () => {
      // Arrange
      setAuthenticatedSession();
      const newPlanData = {
        name: "Новый план",
        startDate: "2024-01-01",
        endDate: "2024-01-07",
      };
      const createdPlan = {
        id: "new-plan-id",
        ...newPlanData,
        userId: mockUser.id,
        recipes: [],
      };
      mockDb.user.findUnique.mockResolvedValue({ id: mockUser.id });
      mockDb.mealPlan.create.mockResolvedValue(createdPlan);

      const request = createMockRequest("/api/meal-plans", {
        method: "POST",
        body: newPlanData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.id).toBe("new-plan-id");
    });

    it("должен возвращать 401 для неавторизованного пользователя", async () => {
      // Arrange
      setUnauthenticatedSession();

      const request = createMockRequest("/api/meal-plans", {
        method: "POST",
        body: {
          startDate: "2024-01-01",
          endDate: "2024-01-07",
        },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("должен создавать план с рецептами", async () => {
      // Arrange
      setAuthenticatedSession();
      const planWithRecipes = {
        name: "План с рецептами",
        startDate: "2024-01-01",
        endDate: "2024-01-07",
        recipes: [
          {
            recipeId: "recipe-1",
            date: "2024-01-01",
            mealType: "breakfast",
            servings: 2,
          },
        ],
      };
      mockDb.user.findUnique.mockResolvedValue({ id: mockUser.id });
      mockDb.mealPlan.create.mockResolvedValue({
        id: "plan-id",
        ...planWithRecipes,
        userId: mockUser.id,
      });

      const request = createMockRequest("/api/meal-plans", {
        method: "POST",
        body: planWithRecipes,
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      expect(mockDb.mealPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipes: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  recipeId: "recipe-1",
                  mealType: "breakfast",
                }),
              ]),
            },
          }),
        })
      );
    });

    it("должен возвращать 400 при невалидных данных", async () => {
      // Arrange
      setAuthenticatedSession();
      const invalidData = {
        // отсутствует обязательные startDate и endDate
        name: "План",
      };

      const request = createMockRequest("/api/meal-plans", {
        method: "POST",
        body: invalidData,
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
    });

    it("должен возвращать 404 если пользователь не найден в БД", async () => {
      // Arrange
      setAuthenticatedSession();
      mockDb.user.findUnique.mockResolvedValue(null); // Пользователь не найден

      const request = createMockRequest("/api/meal-plans", {
        method: "POST",
        body: {
          startDate: "2024-01-01",
          endDate: "2024-01-07",
        },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("должен возвращать 400 при невалидном mealType", async () => {
      // Arrange
      setAuthenticatedSession();
      const invalidMealType = {
        startDate: "2024-01-01",
        endDate: "2024-01-07",
        recipes: [
          {
            recipeId: "recipe-1",
            date: "2024-01-01",
            mealType: "invalid_meal", // невалидный тип
            servings: 2,
          },
        ],
      };

      const request = createMockRequest("/api/meal-plans", {
        method: "POST",
        body: invalidMealType,
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
    });
  });
});
