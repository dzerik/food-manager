"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Product {
  id: string;
  name: string;
  defaultUnit: string;
  gramsPerPiece?: number;
}

interface ProductComboboxProps {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectedProductName?: string; // Fallback для режима редактирования когда продукты ещё загружаются
}

export function ProductCombobox({
  products,
  value,
  onChange,
  placeholder = "Выберите продукт",
  selectedProductName,
}: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selectedProduct = products.find((p) => p.id === value);

  // Используем selectedProductName как fallback если продукт ещё не загружен
  const displayName = selectedProduct?.name || selectedProductName || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {displayName}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск продукта..." />
          <CommandList>
            <CommandEmpty>Продукт не найден</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onChange(product.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {product.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
