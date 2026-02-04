import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allergies = await db.userAllergy.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(allergies);
  } catch (error) {
    console.error("Error fetching allergies:", error);
    return NextResponse.json({ error: "Failed to fetch allergies" }, { status: 500 });
  }
}

const addAllergySchema = z.object({
  allergen: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { allergen } = addAllergySchema.parse(body);

    const allergy = await db.userAllergy.create({
      data: {
        userId: session.user.id,
        allergen,
      },
    });

    return NextResponse.json(allergy, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error adding allergy:", error);
    return NextResponse.json({ error: "Failed to add allergy" }, { status: 500 });
  }
}

const deleteAllergySchema = z.object({
  allergen: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { allergen } = deleteAllergySchema.parse(body);

    await db.userAllergy.deleteMany({
      where: {
        userId: session.user.id,
        allergen,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error deleting allergy:", error);
    return NextResponse.json({ error: "Failed to delete allergy" }, { status: 500 });
  }
}
