"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Clock,
  Truck,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Zap,
  Store,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DeliveryService {
  id: string;
  name: string;
  logo: string; // emoji for now, can be replaced with actual logos
  color: string;
  bgColor: string;
  deliveryTime: string;
  minOrder: number;
  deliveryCost: string;
  description: string;
  type: "express" | "supermarket" | "hypermarket";
  features: string[];
  url: string;
}

const deliveryServices: DeliveryService[] = [
  // Express delivery (10-30 min)
  {
    id: "yandex-lavka",
    name: "Яндекс Лавка",
    logo: "🟡",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    deliveryTime: "10-15 мин",
    minOrder: 0,
    deliveryCost: "Бесплатно от 500₽",
    description: "Сверхбыстрая доставка продуктов",
    type: "express",
    features: ["Доставка за минуты", "Свежие продукты", "Готовая еда"],
    url: "https://lavka.yandex.ru",
  },
  {
    id: "samokat",
    name: "Самокат",
    logo: "🛴",
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    deliveryTime: "15-30 мин",
    minOrder: 0,
    deliveryCost: "Бесплатно",
    description: "Быстрая доставка продуктов и товаров",
    type: "express",
    features: ["Нет минимального заказа", "Круглосуточно", "Свежие продукты"],
    url: "https://samokat.ru",
  },

  // Supermarkets
  {
    id: "sbermarket",
    name: "СберМаркет",
    logo: "🟢",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    deliveryTime: "от 2 часов",
    minOrder: 1000,
    deliveryCost: "от 99₽",
    description: "Доставка из любимых магазинов",
    type: "supermarket",
    features: ["Ашан", "Метро", "ВкусВилл", "Лента", "Магнит"],
    url: "https://sbermarket.ru",
  },
  {
    id: "vkusvill",
    name: "ВкусВилл",
    logo: "🥬",
    color: "text-green-700",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    deliveryTime: "от 1 часа",
    minOrder: 500,
    deliveryCost: "от 99₽",
    description: "Полезные продукты для здорового питания",
    type: "supermarket",
    features: ["Натуральные продукты", "Короткий срок годности", "Фермерское"],
    url: "https://vkusvill.ru",
  },
  {
    id: "perekrestok",
    name: "Перекрёсток Впрок",
    logo: "🛒",
    color: "text-green-600",
    bgColor: "bg-lime-50 dark:bg-lime-950/30",
    deliveryTime: "от 2 часов",
    minOrder: 1500,
    deliveryCost: "от 99₽",
    description: "Онлайн-супермаркет X5 Group",
    type: "supermarket",
    features: ["Большой выбор", "Акции и скидки", "Собственные торговые марки"],
    url: "https://vprok.ru",
  },
  {
    id: "ozon-fresh",
    name: "Ozon Fresh",
    logo: "🔵",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    deliveryTime: "от 1 часа",
    minOrder: 500,
    deliveryCost: "от 49₽",
    description: "Свежие продукты с доставкой Ozon",
    type: "supermarket",
    features: ["Premium подписка", "Кэшбэк баллами", "Интеграция с Ozon"],
    url: "https://ozon.ru/fresh",
  },

  // Hypermarkets
  {
    id: "lenta",
    name: "Лента Онлайн",
    logo: "🔷",
    color: "text-blue-700",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    deliveryTime: "от 2 часов",
    minOrder: 1500,
    deliveryCost: "от 199₽",
    description: "Доставка из гипермаркетов Лента",
    type: "hypermarket",
    features: ["Оптовые цены", "Огромный выбор", "Товары для дома"],
    url: "https://lenta.com",
  },
  {
    id: "magnit",
    name: "Магнит Доставка",
    logo: "🔴",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    deliveryTime: "от 1 часа",
    minOrder: 500,
    deliveryCost: "от 99₽",
    description: "Доставка из сети Магнит",
    type: "supermarket",
    features: ["Магнит Косметик", "Магнит Аптека", "Низкие цены"],
    url: "https://magnit.ru",
  },
  {
    id: "pyaterochka",
    name: "Пятёрочка",
    logo: "🍀",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    deliveryTime: "от 30 мин",
    minOrder: 300,
    deliveryCost: "от 49₽",
    description: "Доставка из магазинов у дома",
    type: "supermarket",
    features: ["Выручай-карта", "Акции каждый день", "Около 18000 магазинов"],
    url: "https://5ka.ru",
  },
  {
    id: "utkonos",
    name: "Утконос",
    logo: "🦆",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    deliveryTime: "на следующий день",
    minOrder: 1500,
    deliveryCost: "от 199₽",
    description: "Первый онлайн-гипермаркет России",
    type: "hypermarket",
    features: ["Более 35000 товаров", "Собственное производство", "С 2000 года"],
    url: "https://utkonos.ru",
  },
];

interface DeliveryServicesProps {
  shoppingListText: string;
  itemsCount: number;
}

export function DeliveryServices({ shoppingListText, itemsCount }: DeliveryServicesProps) {
  const [selectedService, setSelectedService] = useState<DeliveryService | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const handleOrder = async (service: DeliveryService) => {
    setIsOrdering(true);

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Copy shopping list to clipboard
    try {
      await navigator.clipboard.writeText(shoppingListText);
    } catch {
      // Ignore clipboard errors
    }

    setIsOrdering(false);
    setOrderComplete(true);

    toast.success(`Список скопирован! Переход в ${service.name}...`, {
      description: "Вставьте список в поиск или добавьте товары вручную",
    });

    // Open service URL in new tab after a short delay
    setTimeout(() => {
      window.open(service.url, "_blank");
      setOrderComplete(false);
      setSelectedService(null);
    }, 1500);
  };

  const servicesByType = {
    express: deliveryServices.filter((s) => s.type === "express"),
    supermarket: deliveryServices.filter((s) => s.type === "supermarket"),
    hypermarket: deliveryServices.filter((s) => s.type === "hypermarket"),
  };

  return (
    <>
      <Card className="mt-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5 text-primary" />
            Заказать доставку
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Закажите продукты в популярных сервисах доставки
          </p>

          <Tabs defaultValue="express" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="express" className="flex items-center gap-1 py-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Экспресс</span>
              </TabsTrigger>
              <TabsTrigger value="supermarket" className="flex items-center gap-1 py-2">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Супермаркеты</span>
              </TabsTrigger>
              <TabsTrigger value="hypermarket" className="flex items-center gap-1 py-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Гипермаркеты</span>
              </TabsTrigger>
            </TabsList>

            {Object.entries(servicesByType).map(([type, services]) => (
              <TabsContent key={type} value={type} className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md hover:scale-[1.02]",
                        service.bgColor
                      )}
                    >
                      <span className="text-2xl">{service.logo}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-semibold", service.color)}>
                            {service.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{service.deliveryTime}</span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Service detail dialog */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedService && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("text-4xl p-2 rounded-xl", selectedService.bgColor)}>
                    {selectedService.logo}
                  </div>
                  <div>
                    <DialogTitle className={selectedService.color}>
                      {selectedService.name}
                    </DialogTitle>
                    <DialogDescription>{selectedService.description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Delivery info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">{selectedService.deliveryTime}</p>
                    <p className="text-xs text-muted-foreground">Время доставки</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <ShoppingCart className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">
                      {selectedService.minOrder > 0 ? `от ${selectedService.minOrder}₽` : "Нет"}
                    </p>
                    <p className="text-xs text-muted-foreground">Мин. заказ</p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Стоимость доставки</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedService.deliveryCost}</p>
                </div>

                {/* Features */}
                <div>
                  <p className="text-sm font-medium mb-2">Особенности:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedService.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Order info */}
                <div className="rounded-lg border border-dashed p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Ваш список: <strong>{itemsCount} товаров</strong></span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Список будет скопирован в буфер обмена
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedService(null)}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleOrder(selectedService)}
                  disabled={isOrdering || orderComplete}
                >
                  {isOrdering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Подготовка...
                    </>
                  ) : orderComplete ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Готово!
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Перейти на сайт
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
