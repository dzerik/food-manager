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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Plus,
  Calculator,
  Settings,
  User,
  Flame,
  Scale,
  Ruler,
  Calendar,
  Activity,
  Target,
  AlertTriangle,
  Milk,
  Egg,
  Fish,
  Nut,
  Wheat,
  Bean,
  Leaf,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const commonAllergens = [
  { id: "milk", name: "Молоко", icon: Milk },
  { id: "eggs", name: "Яйца", icon: Egg },
  { id: "fish", name: "Рыба", icon: Fish },
  { id: "shellfish", name: "Моллюски", icon: Fish },
  { id: "tree_nuts", name: "Орехи", icon: Nut },
  { id: "peanuts", name: "Арахис", icon: Nut },
  { id: "wheat", name: "Пшеница/Глютен", icon: Wheat },
  { id: "soybeans", name: "Соя", icon: Bean },
  { id: "sesame", name: "Кунжут", icon: Leaf },
  { id: "celery", name: "Сельдерей", icon: Leaf },
  { id: "mustard", name: "Горчица", icon: Leaf },
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
  { value: "sedentary", label: "Сидячий образ жизни", multiplier: 1.2, description: "Минимальная физическая активность" },
  { value: "light", label: "Лёгкая активность", multiplier: 1.375, description: "1-3 тренировки в неделю" },
  { value: "moderate", label: "Умеренная активность", multiplier: 1.55, description: "3-5 тренировок в неделю" },
  { value: "active", label: "Высокая активность", multiplier: 1.725, description: "6-7 тренировок в неделю" },
  { value: "very_active", label: "Очень высокая", multiplier: 1.9, description: "Профессиональный спорт" },
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
      const payload = {
        gender: profile.gender && profile.gender !== "" ? profile.gender : null,
        dailyCalorieTarget: typeof profile.dailyCalorieTarget === "number" ? profile.dailyCalorieTarget : null,
        weightKg: typeof profile.weightKg === "number" ? profile.weightKg : null,
        heightCm: typeof profile.heightCm === "number" ? profile.heightCm : null,
        birthDate: profile.birthDate && profile.birthDate !== "" ? profile.birthDate : null,
        activityLevel: profile.activityLevel && profile.activityLevel !== "" ? profile.activityLevel : null,
      };

      const res = await fetch("/api/users/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Профиль сохранён");
      } else {
        throw new Error("Failed to save");
      }
    } catch {
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

  // Calculate profile completion
  const profileFields = [profile.gender, profile.weightKg, profile.heightCm, profile.birthDate, profile.activityLevel, profile.dailyCalorieTarget];
  const filledFields = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((filledFields / profileFields.length) * 100);

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
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Настройки</h1>
            <p className="text-sm text-muted-foreground">
              Управление профилем и предпочтениями
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main settings column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Профиль</CardTitle>
                    <CardDescription>Информация о вашем аккаунте</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">Имя</Label>
                    <p className="font-medium">{session?.user?.name || "Не указано"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">Email</Label>
                    <p className="font-medium">{session?.user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calorie Settings Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                      <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle>Калорийность</CardTitle>
                      <CardDescription>
                        Дневная норма для отслеживания в плане питания
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      profileCompletion === 100
                        ? "border-green-500 text-green-600"
                        : "border-orange-500 text-orange-600"
                    )}
                  >
                    {profileCompletion}% заполнено
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Progress indicator */}
                <div className="space-y-2">
                  <Progress value={profileCompletion} className="h-2" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Пол
                    </Label>
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
                    <Label htmlFor="birthDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Дата рождения
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={profile.birthDate || ""}
                      onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      Активность
                    </Label>
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
                            <div className="flex flex-col">
                              <span>{level.label}</span>
                              <span className="text-xs text-muted-foreground">{level.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weightKg" className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      Вес (кг)
                    </Label>
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
                    <Label htmlFor="heightCm" className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      Рост (см)
                    </Label>
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
                    <Label htmlFor="dailyCalorieTarget" className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      Норма (ккал)
                    </Label>
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
                        className="shrink-0"
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-sm">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Рекомендации:</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-blue-800 dark:text-blue-200">
                      <li>Мужчины: ~2500 ккал/день</li>
                      <li>Женщины: ~2000 ккал/день</li>
                      <li>Нажмите <Calculator className="inline h-3 w-3" /> для автоматического расчёта</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={saveProfile} disabled={isSavingProfile} className="w-full sm:w-auto">
                  {isSavingProfile ? "Сохранение..." : "Сохранить настройки"}
                </Button>
              </CardContent>
            </Card>

            {/* Allergies Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle>Аллергии и непереносимости</CardTitle>
                    <CardDescription>
                      Эти продукты будут исключены из списка покупок
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Current allergies */}
                <div className="mb-6">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-3 block">
                    Ваши аллергии ({allergies.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {allergies.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Нет указанных аллергий</p>
                    ) : (
                      allergies.map((allergen) => {
                        const allergenInfo = commonAllergens.find((a) => a.id === allergen);
                        const Icon = allergenInfo?.icon || AlertTriangle;
                        return (
                          <Badge
                            key={allergen}
                            variant="secondary"
                            className="gap-2 py-1.5 px-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200"
                          >
                            <Icon className="h-3 w-3" />
                            {allergenInfo?.name || allergen}
                            <button
                              onClick={() => removeAllergy(allergen)}
                              className="ml-1 rounded-full hover:bg-red-300 dark:hover:bg-red-800 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Add allergen */}
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Добавить аллергию
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {commonAllergens
                      .filter((a) => !allergies.includes(a.id))
                      .map((allergen) => {
                        const Icon = allergen.icon;
                        return (
                          <Button
                            key={allergen.id}
                            variant="outline"
                            size="sm"
                            onClick={() => addAllergy(allergen.id)}
                            className="justify-start h-auto py-2"
                          >
                            <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{allergen.name}</span>
                          </Button>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick stats card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Ваш профиль</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.dailyCalorieTarget && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Дневная норма</span>
                    <Badge variant="secondary" className="font-bold">
                      {profile.dailyCalorieTarget} ккал
                    </Badge>
                  </div>
                )}
                {profile.weightKg && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Вес</span>
                    <span className="font-medium">{profile.weightKg} кг</span>
                  </div>
                )}
                {profile.heightCm && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Рост</span>
                    <span className="font-medium">{profile.heightCm} см</span>
                  </div>
                )}
                {profile.activityLevel && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Активность</span>
                    <span className="font-medium text-sm">
                      {activityLevels.find((l) => l.value === profile.activityLevel)?.label}
                    </span>
                  </div>
                )}
                {allergies.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Аллергии</span>
                    <Badge variant="destructive" className="font-medium">
                      {allergies.length}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BMI Calculator result if available */}
            {profile.weightKg && profile.heightCm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    Индекс массы тела
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const bmi = profile.weightKg / Math.pow(profile.heightCm / 100, 2);
                    const bmiRounded = Math.round(bmi * 10) / 10;
                    let category = "";
                    let color = "";
                    if (bmi < 18.5) {
                      category = "Недостаточный вес";
                      color = "text-blue-600";
                    } else if (bmi < 25) {
                      category = "Нормальный вес";
                      color = "text-green-600";
                    } else if (bmi < 30) {
                      category = "Избыточный вес";
                      color = "text-yellow-600";
                    } else {
                      category = "Ожирение";
                      color = "text-red-600";
                    }
                    return (
                      <div className="text-center">
                        <p className={cn("text-4xl font-bold", color)}>{bmiRounded}</p>
                        <p className={cn("text-sm font-medium mt-1", color)}>{category}</p>
                        <div className="mt-4 h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-400">
                          <div
                            className="relative h-2"
                            style={{
                              marginLeft: `${Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100)}%`,
                            }}
                          >
                            <div className="absolute -top-1 h-4 w-1 rounded bg-foreground" />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>15</span>
                          <span>18.5</span>
                          <span>25</span>
                          <span>30</span>
                          <span>40</span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
