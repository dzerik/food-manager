import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(500).default(50),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { category, search, page, limit } = querySchema.parse(searchParams);

    const where = {
      ...(category && { category }),
    };

    // SQLite не поддерживает mode: insensitive, фильтруем в JS
    const searchLower = search?.toLowerCase();

    const allProducts = await db.product.findMany({
      where,
      include: {
        nutrition: true,
        dietaryInfo: true,
      },
      orderBy: { name: "asc" },
    });

    // Фильтрация по имени (case-insensitive) на стороне JS
    const filteredProducts = searchLower
      ? allProducts.filter((p) => p.name.toLowerCase().includes(searchLower))
      : allProducts;

    const total = filteredProducts.length;

    // Пагинация
    const products = filteredProducts.slice(
      (page - 1) * limit,
      page * limit
    );

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

const nutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbohydrates: z.number(),
  fatSaturated: z.number().optional().nullable(),
  sugar: z.number().optional().nullable(),
  fiberTotal: z.number().optional().nullable(),
});

const dietaryInfoSchema = z.object({
  allergens: z.array(z.string()).optional(),
  isVegan: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isDairyFree: z.boolean().optional(),
  isNutFree: z.boolean().optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  defaultUnit: z.string().default("g"),
  gramsPerPiece: z.number().optional(),
  gramsPerCup: z.number().optional(),
  packageSize: z.number().optional(),
  isAlwaysOwned: z.boolean().optional(),
  nutrition: nutritionSchema.optional(),
  dietaryInfo: dietaryInfoSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createProductSchema.parse(body);

    const { nutrition, dietaryInfo, ...productData } = data;

    const product = await db.product.create({
      data: {
        ...productData,
        ...(nutrition && {
          nutrition: {
            create: nutrition,
          },
        }),
        ...(dietaryInfo && {
          dietaryInfo: {
            create: {
              ...dietaryInfo,
              allergens: dietaryInfo.allergens ? JSON.stringify(dietaryInfo.allergens) : null,
            },
          },
        }),
      },
      include: {
        nutrition: true,
        dietaryInfo: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
