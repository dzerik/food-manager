// Color indicators from light green (good/easy/fast/low) to dark red (hard/slow/high)
// Using a 5-step gradient: green -> lime -> yellow -> orange -> red

export interface IndicatorConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

// Difficulty: 1 (very easy) to 5 (very hard)
const difficultyColors: IndicatorConfig[] = [
  { color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/40", borderColor: "border-green-300 dark:border-green-700", label: "Очень легко" },
  { color: "text-lime-700 dark:text-lime-400", bgColor: "bg-lime-100 dark:bg-lime-900/40", borderColor: "border-lime-300 dark:border-lime-700", label: "Легко" },
  { color: "text-yellow-700 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/40", borderColor: "border-yellow-300 dark:border-yellow-700", label: "Средне" },
  { color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/40", borderColor: "border-orange-300 dark:border-orange-700", label: "Сложно" },
  { color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/40", borderColor: "border-red-300 dark:border-red-700", label: "Очень сложно" },
];

// Time thresholds in minutes
const timeThresholds = [15, 30, 60, 90, 120]; // <= 15, <= 30, <= 60, <= 90, > 90

const timeColors: IndicatorConfig[] = [
  { color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/40", borderColor: "border-green-300 dark:border-green-700", label: "Очень быстро" },
  { color: "text-lime-700 dark:text-lime-400", bgColor: "bg-lime-100 dark:bg-lime-900/40", borderColor: "border-lime-300 dark:border-lime-700", label: "Быстро" },
  { color: "text-yellow-700 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/40", borderColor: "border-yellow-300 dark:border-yellow-700", label: "Средне" },
  { color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/40", borderColor: "border-orange-300 dark:border-orange-700", label: "Долго" },
  { color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/40", borderColor: "border-red-300 dark:border-red-700", label: "Очень долго" },
];

// Calorie thresholds per serving
const calorieThresholds = [200, 350, 500, 700, 1000]; // <= 200, <= 350, <= 500, <= 700, > 700

const calorieColors: IndicatorConfig[] = [
  { color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/40", borderColor: "border-green-300 dark:border-green-700", label: "Лёгкое" },
  { color: "text-lime-700 dark:text-lime-400", bgColor: "bg-lime-100 dark:bg-lime-900/40", borderColor: "border-lime-300 dark:border-lime-700", label: "Низкокалор." },
  { color: "text-yellow-700 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/40", borderColor: "border-yellow-300 dark:border-yellow-700", label: "Среднее" },
  { color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/40", borderColor: "border-orange-300 dark:border-orange-700", label: "Сытное" },
  { color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/40", borderColor: "border-red-300 dark:border-red-700", label: "Калорийное" },
];

export function getDifficultyIndicator(level: number): IndicatorConfig {
  const index = Math.max(0, Math.min(4, level - 1));
  return difficultyColors[index];
}

export function getTimeIndicator(minutes: number): IndicatorConfig {
  if (minutes <= timeThresholds[0]) return timeColors[0];
  if (minutes <= timeThresholds[1]) return timeColors[1];
  if (minutes <= timeThresholds[2]) return timeColors[2];
  if (minutes <= timeThresholds[3]) return timeColors[3];
  return timeColors[4];
}

export function getCalorieIndicator(calories: number): IndicatorConfig {
  if (calories <= calorieThresholds[0]) return calorieColors[0];
  if (calories <= calorieThresholds[1]) return calorieColors[1];
  if (calories <= calorieThresholds[2]) return calorieColors[2];
  if (calories <= calorieThresholds[3]) return calorieColors[3];
  return calorieColors[4];
}

// Format time display
export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} мин`;
}
