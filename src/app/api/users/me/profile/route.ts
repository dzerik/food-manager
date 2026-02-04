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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        dailyCalorieTarget: true,
        birthDate: true,
        weightKg: true,
        heightCm: true,
        activityLevel: true,
        servingsDefault: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  dailyCalorieTarget: z.number().positive().optional().nullable(),
  birthDate: z.string().optional().nullable(), // ISO date string
  weightKg: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional().nullable(),
  servingsDefault: z.number().positive().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Convert birthDate string to Date if provided
    const updateData = {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : data.birthDate,
    };

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        dailyCalorieTarget: true,
        birthDate: true,
        weightKg: true,
        heightCm: true,
        activityLevel: true,
        servingsDefault: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
