import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb, resetDbMocks } from "../mocks/db";

// Мокаем модуль db
vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

// Импортируем после мокирования
import { GET, PUT, DELETE } from "@/app/api/products/[id]/route";

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

/**
 * Создает mock params объект для dynamic routes.
 */
function createParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("/api/products/[id]", () => {
  beforeEach(() => {
    resetDbMocks();
  });

  describe("GET /api/products/:id", () => {
    it("должен возвращать продукт по ID", async () => {
      // Arrange
      const mockProduct = {
        id: "product-1",
        name: "Молоко",
        category: "dairy",
        nutrition: { calories: 60, protein: 3, fat: 3, carbohydrates: 5 },
        storage: null,
        seasonality: null,
        dietaryInfo: null,
      };
      mockDb.product.findUnique.mockResolvedValue(mockProduct);

      const request = createMockRequest("/api/products/product-1");

      // Act
      const response = await GET(request, createParams("product-1"));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockProduct);
      expect(mockDb.product.findUnique).toHaveBeenCalledWith({
        where: { id: "product-1" },
        include: {
          nutrition: true,
          storage: true,
          seasonality: true,
          dietaryInfo: true,
        },
      });
    });

    it("должен возвращать 404 если продукт не найден", async () => {
      // Arrange
      mockDb.product.findUnique.mockResolvedValue(null);

      const request = createMockRequest("/api/products/nonexistent");

      // Act
      const response = await GET(request, createParams("nonexistent"));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });

    it("должен возвращать 500 при ошибке базы данных", async () => {
      // Arrange
      mockDb.product.findUnique.mockRejectedValue(new Error("Database error"));

      const request = createMockRequest("/api/products/product-1");

      // Act
      const response = await GET(request, createParams("product-1"));

      // Assert
      expect(response.status).toBe(500);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("должен обновлять продукт", async () => {
      // Arrange
      const updateData = {
        name: "Обезжиренное молоко",
        category: "dairy",
      };
      const updatedProduct = { id: "product-1", ...updateData };
      mockDb.product.update.mockResolvedValue(updatedProduct);

      const request = createMockRequest("/api/products/product-1", {
        method: "PUT",
        body: updateData,
      });

      // Act
      const response = await PUT(request, createParams("product-1"));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.name).toBe("Обезжиренное молоко");
    });

    it("должен обновлять продукт с информацией о питательности", async () => {
      // Arrange
      const updateData = {
        name: "Молоко",
        nutrition: {
          calories: 45,
          protein: 3,
          fat: 1,
          carbohydrates: 5,
        },
      };
      mockDb.product.update.mockResolvedValue({ id: "product-1", ...updateData });

      const request = createMockRequest("/api/products/product-1", {
        method: "PUT",
        body: updateData,
      });

      // Act
      const response = await PUT(request, createParams("product-1"));

      // Assert
      expect(response.status).toBe(200);
      expect(mockDb.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nutrition: {
              upsert: {
                create: updateData.nutrition,
                update: updateData.nutrition,
              },
            },
          }),
        })
      );
    });

    it("должен удалять информацию о питательности при передаче null", async () => {
      // Arrange
      const updateData = {
        nutrition: null,
      };
      mockDb.product.update.mockResolvedValue({ id: "product-1", nutrition: null });

      const request = createMockRequest("/api/products/product-1", {
        method: "PUT",
        body: updateData,
      });

      // Act
      const response = await PUT(request, createParams("product-1"));

      // Assert
      expect(response.status).toBe(200);
      expect(mockDb.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nutrition: { delete: true },
          }),
        })
      );
    });

    it("должен возвращать 400 при невалидных данных", async () => {
      // Arrange - невалидное значение calories
      const invalidData = {
        nutrition: {
          calories: "not-a-number",
        },
      };

      const request = createMockRequest("/api/products/product-1", {
        method: "PUT",
        body: invalidData,
      });

      // Act
      const response = await PUT(request, createParams("product-1"));

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("должен удалять продукт", async () => {
      // Arrange
      mockDb.product.delete.mockResolvedValue({ id: "product-1" });

      const request = createMockRequest("/api/products/product-1", { method: "DELETE" });

      // Act
      const response = await DELETE(request, createParams("product-1"));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDb.product.delete).toHaveBeenCalledWith({
        where: { id: "product-1" },
      });
    });

    it("должен возвращать 500 при ошибке удаления", async () => {
      // Arrange
      mockDb.product.delete.mockRejectedValue(new Error("Cannot delete"));

      const request = createMockRequest("/api/products/product-1", { method: "DELETE" });

      // Act
      const response = await DELETE(request, createParams("product-1"));

      // Assert
      expect(response.status).toBe(500);
    });
  });
});
