"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RecipeActionsProps {
  recipeId: string;
  recipeName: string;
}

export function RecipeActions({ recipeId, recipeName }: RecipeActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Удалить рецепт "${recipeName}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Рецепт удалён");
      router.push("/recipes");
    } catch {
      toast.error("Не удалось удалить рецепт");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/recipes/${recipeId}/edit`}>
          <Pencil className="mr-2 h-4 w-4" />
          Редактировать
        </Link>
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {isDeleting ? "Удаление..." : "Удалить"}
      </Button>
    </div>
  );
}
