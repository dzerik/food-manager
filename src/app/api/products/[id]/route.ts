import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
      include: {
        nutrition: true,
        storage: true,
        seasonality: true,
        dietaryInfo: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  subcategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  defaultUnit: z.string().optional(),
  gramsPerPiece: z.number().optional().nullable(),
  gramsPerCup: z.number().optional().nullable(),
  packageSize: z.number().optional().nullable(),
  isAlwaysOwned: z.boolean().optional(),
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    fat: z.number(),
    carbohydrates: z.number(),
    fatSaturated: z.number().optional().nullable(),
    sugar: z.number().optional().nullable(),
    fiberTotal: z.number().optional().nullable(),
  }).optional().nullable(),
  dietaryInfo: z.object({
    allergens: z.array(z.string()).optional(),
    isVegan: z.boolean().optional(),
    isVegetarian: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    isDairyFree: z.boolean().optional(),
    isNutFree: z.boolean().optional(),
  }).optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateProductSchema.parse(body);

    const { nutrition, dietaryInfo, ...productData } = data;

    const product = await db.product.update({
      where: { id },
      data: {
        ...productData,
        ...(nutrition !== undefined && {
          nutrition: nutrition === null
            ? { delete: true }
            : {
                upsert: {
                  create: nutrition,
                  update: nutrition,
                },
              },
        }),
        ...(dietaryInfo !== undefined && {
          dietaryInfo: dietaryInfo === null
            ? { delete: true }
            : {
                upsert: {
                  create: {
                    ...dietaryInfo,
                    allergens: dietaryInfo.allergens ? JSON.stringify(dietaryInfo.allergens) : null,
                  },
                  update: {
                    ...dietaryInfo,
                    allergens: dietaryInfo.allergens ? JSON.stringify(dietaryInfo.allergens) : null,
                  },
                },
              },
        }),
      },
      include: {
        nutrition: true,
        dietaryInfo: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
