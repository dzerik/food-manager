import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb, resetDbMocks } from "../mocks/db";

// Мокаем модуль db
vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

// Импортируем после мокирования
import { GET, POST } from "@/app/api/products/route";

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

describe("/api/products", () => {
  beforeEach(() => {
    resetDbMocks();
  });

  describe("GET /api/products", () => {
    it("должен возвращать список продуктов с пагинацией", async () => {
      // Arrange
      const mockProducts = [
        { id: "1", name: "Молоко", category: "dairy", nutrition: null, dietaryInfo: null },
        { id: "2", name: "Хлеб", category: "grains", nutrition: null, dietaryInfo: null },
      ];
      mockDb.product.findMany.mockResolvedValue(mockProducts);
      mockDb.product.count.mockResolvedValue(2);

      const request = createMockRequest("/api/products");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.products).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 2,
        pages: 1,
      });
    });

    it("должен фильтровать по категории", async () => {
      // Arrange
      const mockProducts = [
        { id: "1", name: "Молоко", category: "dairy", nutrition: null, dietaryInfo: null },
      ];
      mockDb.product.findMany.mockResolvedValue(mockProducts);
      mockDb.product.count.mockResolvedValue(1);

      const request = createMockRequest("/api/products?category=dairy");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: "dairy" },
        })
      );
      expect(data.products).toHaveLength(1);
    });

    it("должен поддерживать поиск по названию", async () => {
      // Arrange
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(0);

      const request = createMockRequest("/api/products?search=мол");

      // Act
      const response = await GET(request);

      // Assert
      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: "мол" } },
        })
      );
    });

    it("должен поддерживать пагинацию", async () => {
      // Arrange
      mockDb.product.findMany.mockResolvedValue([]);
      mockDb.product.count.mockResolvedValue(100);

      const request = createMockRequest("/api/products?page=2&limit=10");

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(mockDb.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(data.pagination.pages).toBe(10);
    });

    it("должен возвращать ошибку 400 при невалидных параметрах", async () => {
      // Arrange
      const request = createMockRequest("/api/products?page=-1");

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(400);
    });

    it("должен возвращать ошибку 500 при ошибке базы данных", async () => {
      // Arrange
      mockDb.product.findMany.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest("/api/products");

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/products", () => {
    it("должен создавать новый продукт", async () => {
      // Arrange
      const newProduct = {
        name: "Творог",
        category: "dairy",
        defaultUnit: "g",
      };
      const createdProduct = { id: "new-id", ...newProduct };
      mockDb.product.create.mockResolvedValue(createdProduct);

      const request = createMockRequest("/api/products", {
        method: "POST",
        body: newProduct,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(createdProduct);
    });

    it("должен создавать продукт с информацией о питательности", async () => {
      // Arrange
      const newProduct = {
        name: "Яйца",
        category: "dairy",
        nutrition: {
          calories: 155,
          protein: 13,
          fat: 11,
          carbohydrates: 1,
        },
      };
      mockDb.product.create.mockResolvedValue({ id: "1", ...newProduct });

      const request = createMockRequest("/api/products", {
        method: "POST",
        body: newProduct,
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      expect(mockDb.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Яйца",
            nutrition: {
              create: newProduct.nutrition,
            },
          }),
        })
      );
    });

    it("должен возвращать ошибку 400 при невалидных данных", async () => {
      // Arrange - отсутствует обязательное поле name
      const invalidProduct = {
        category: "dairy",
      };

      const request = createMockRequest("/api/products", {
        method: "POST",
        body: invalidProduct,
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
    });

    it("должен создавать продукт с диетической информацией", async () => {
      // Arrange
      const newProduct = {
        name: "Соевое молоко",
        category: "dairy",
        dietaryInfo: {
          isVegan: true,
          isVegetarian: true,
          isDairyFree: true,
          allergens: ["soy"],
        },
      };
      mockDb.product.create.mockResolvedValue({ id: "1", ...newProduct });

      const request = createMockRequest("/api/products", {
        method: "POST",
        body: newProduct,
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      expect(mockDb.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dietaryInfo: {
              create: expect.objectContaining({
                isVegan: true,
                allergens: JSON.stringify(["soy"]),
              }),
            },
          }),
        })
      );
    });
  });
});
