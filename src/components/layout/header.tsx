"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UtensilsCrossed,
  Moon,
  Sun,
  Settings,
  LogOut,
  HelpCircle,
  Menu,
  ChefHat,
  Package,
  Calendar,
  ShoppingCart,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/recipes", label: "Рецепты", icon: ChefHat },
  { href: "/products", label: "Продукты", icon: Package },
  { href: "/meal-plan", label: "План питания", icon: Calendar },
  { href: "/shopping-list", label: "Список покупок", icon: ShoppingCart },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden text-primary-foreground hover:bg-primary-foreground/20">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Меню</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b p-4">
              <SheetTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Food Manager
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="my-2 border-t" />
              <Link
                href="/help"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                  pathname === "/help"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <HelpCircle className="h-5 w-5" />
                Справка
              </Link>
            </nav>

            {/* Mobile user section */}
            {session?.user && (
              <div className="absolute bottom-0 left-0 right-0 border-t p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium truncate">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary-foreground">
          <UtensilsCrossed className="h-6 w-6" />
          <span className="hidden sm:inline">Food Manager</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="ml-8 hidden items-center gap-1 text-sm md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex text-primary-foreground hover:bg-primary-foreground/20">
            <Link href="/help">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Справка</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Тема</span>
          </Button>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-primary-foreground/20">
                  <Avatar className="h-8 w-8 border-2 border-primary-foreground/30">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback className="bg-primary-foreground text-primary">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user.name && (
                      <p className="font-medium">{session.user.name}</p>
                    )}
                    {session.user.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Настройки
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary-foreground/20">
                <Link href="/login">Войти</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:flex bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
