"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Calculator } from "lucide-react";
import { toast } from "sonner";

const commonAllergens = [
  { id: "milk", name: "Молоко" },
  { id: "eggs", name: "Яйца" },
  { id: "fish", name: "Рыба" },
  { id: "shellfish", name: "Моллюски" },
  { id: "tree_nuts", name: "Орехи" },
  { id: "peanuts", name: "Арахис" },
  { id: "wheat", name: "Пшеница/Глютен" },
  { id: "soybeans", name: "Соя" },
  { id: "sesame", name: "Кунжут" },
  { id: "celery", name: "Сельдерей" },
  { id: "mustard", name: "Горчица" },
];

interface UserProfile {
  gender: string | null;
  dailyCalorieTarget: number | null;
  weightKg: number | null;
  heightCm: number | null;
  birthDate: string | null;
  activityLevel: string | null;
}

const activityLevels = [
  { value: "sedentary", label: "Сидячий образ жизни", multiplier: 1.2 },
  { value: "light", label: "Лёгкая активность", multiplier: 1.375 },
  { value: "moderate", label: "Умеренная активность", multiplier: 1.55 },
  { value: "active", label: "Высокая активность", multiplier: 1.725 },
  { value: "very_active", label: "Очень высокая активность", multiplier: 1.9 },
];

function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  // Mifflin-St Jeor formula
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allergies, setAllergies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    gender: null,
    dailyCalorieTarget: null,
    weightKg: null,
    heightCm: null,
    birthDate: null,
    activityLevel: null,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [allergiesRes, profileRes] = await Promise.all([
          fetch("/api/users/me/allergies"),
          fetch("/api/users/me/profile"),
        ]);

        if (allergiesRes.ok) {
          const data = await allergiesRes.json();
          setAllergies(data.map((a: { allergen: string }) => a.allergen));
        }

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile({
            gender: data.gender,
            dailyCalorieTarget: data.dailyCalorieTarget,
            weightKg: data.weightKg,
            heightCm: data.heightCm,
            birthDate: data.birthDate ? data.birthDate.split("T")[0] : null,
            activityLevel: data.activityLevel,
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchData();
    }
  }, [session]);

  async function addAllergy(allergen: string) {
    try {
      const res = await fetch("/api/users/me/allergies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allergen }),
      });

      if (res.ok) {
        setAllergies([...allergies, allergen]);
        toast.success("Аллергия добавлена");
      }
    } catch {
      toast.error("Не удалось добавить аллергию");
    }
  }

  async function removeAllergy(allergen: string) {
    try {
      const res = await fetch("/api/users/me/allergies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allergen }),
      });

      if (res.ok) {
        setAllergies(allergies.filter((a) => a !== allergen));
        toast.success("Аллергия удалена");
      }
    } catch {
      toast.error("Не удалось удалить аллергию");
    }
  }

  async function saveProfile() {
    setIsSavingProfile(true);
    try {
      // Convert empty strings to null, but preserve valid numbers (including 0)
      const payload = {
        gender: profile.gender && profile.gender !== "" ? profile.gender : null,
        dailyCalorieTarget: typeof profile.dailyCalorieTarget === "number" ? profile.dailyCalorieTarget : null,
        weightKg: typeof profile.weightKg === "number" ? profile.weightKg : null,
        heightCm: typeof profile.heightCm === "number" ? profile.heightCm : null,
        birthDate: profile.birthDate && profile.birthDate !== "" ? profile.birthDate : null,
        activityLevel: profile.activityLevel && profile.activityLevel !== "" ? profile.activityLevel : null,
      };

      console.log("Saving profile:", payload);

      const res = await fetch("/api/users/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Профиль сохранён");
      } else {
        const error = await res.json();
        console.error("Profile save error:", error);
        throw new Error("Failed to save");
      }
    } catch (err) {
      console.error("Profile save exception:", err);
      toast.error("Не удалось сохранить профиль");
    } finally {
      setIsSavingProfile(false);
    }
  }

  function calculateCalories() {
    if (!profile.gender || !profile.weightKg || !profile.heightCm || !profile.birthDate || !profile.activityLevel) {
      toast.error("Заполните все поля для расчёта");
      return;
    }

    const age = calculateAge(profile.birthDate);
    const bmr = calculateBMR(profile.weightKg, profile.heightCm, age, profile.gender);
    const activity = activityLevels.find((a) => a.value === profile.activityLevel);
    const tdee = Math.round(bmr * (activity?.multiplier || 1.55));

    setProfile({ ...profile, dailyCalorieTarget: tdee });
    toast.success(`Рекомендуемая норма: ${tdee} ккал`);
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="mt-8 h-64 rounded bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-xl sm:text-3xl font-bold">Настройки</h1>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Профиль</CardTitle>
              <CardDescription>Информация о вашем аккаунте</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Имя</Label>
                  <p className="mt-1">{session?.user?.name || "Не указано"}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="mt-1">{session?.user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calorie Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Калорийность</CardTitle>
              <CardDescription>
                Настройте дневную норму калорий для отслеживания в плане питания
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Пол</Label>
                  <Select
                    value={profile.gender || ""}
                    onValueChange={(value) => setProfile({ ...profile, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Мужской</SelectItem>
                      <SelectItem value="female">Женский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Дата рождения</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={profile.birthDate || ""}
                    onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Уровень активности</Label>
                  <Select
                    value={profile.activityLevel || ""}
                    onValueChange={(value) => setProfile({ ...profile, activityLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightKg">Вес (кг)</Label>
                  <Input
                    id="weightKg"
                    type="number"
                    min="30"
                    max="300"
                    value={profile.weightKg || ""}
                    onChange={(e) => setProfile({ ...profile, weightKg: parseFloat(e.target.value) || null })}
                    placeholder="70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heightCm">Рост (см)</Label>
                  <Input
                    id="heightCm"
                    type="number"
                    min="100"
                    max="250"
                    value={profile.heightCm || ""}
                    onChange={(e) => setProfile({ ...profile, heightCm: parseFloat(e.target.value) || null })}
                    placeholder="175"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyCalorieTarget">Дневная норма (ккал)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dailyCalorieTarget"
                      type="number"
                      min="1000"
                      max="10000"
                      value={profile.dailyCalorieTarget || ""}
                      onChange={(e) => setProfile({ ...profile, dailyCalorieTarget: parseInt(e.target.value) || null })}
                      placeholder="2000"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={calculateCalories}
                      title="Рассчитать автоматически"
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Рекомендации:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Мужчины: ~2500 ккал/день</li>
                  <li>Женщины: ~2000 ккал/день</li>
                  <li>Нажмите кнопку калькулятора для автоматического расчёта на основе ваших данных</li>
                </ul>
              </div>

              <Button onClick={saveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? "Сохранение..." : "Сохранить настройки"}
              </Button>
            </CardContent>
          </Card>

          {/* Allergies Card */}
          <Card>
            <CardHeader>
              <CardTitle>Аллергии и непереносимости</CardTitle>
              <CardDescription>
                Эти продукты будут исключены из списка покупок
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Current allergies */}
              <div className="mb-4 flex flex-wrap gap-2">
                {allergies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет указанных аллергий</p>
                ) : (
                  allergies.map((allergen) => {
                    const label = commonAllergens.find((a) => a.id === allergen)?.name || allergen;
                    return (
                      <Badge key={allergen} variant="secondary" className="gap-1">
                        {label}
                        <button
                          onClick={() => removeAllergy(allergen)}
                          className="ml-1 rounded-full hover:bg-muted-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })
                )}
              </div>

              {/* Add allergen */}
              <div className="space-y-2">
                <Label>Добавить аллергию</Label>
                <div className="flex flex-wrap gap-2">
                  {commonAllergens
                    .filter((a) => !allergies.includes(a.id))
                    .map((allergen) => (
                      <Button
                        key={allergen.id}
                        variant="outline"
                        size="sm"
                        onClick={() => addAllergy(allergen.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {allergen.name}
                      </Button>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
