import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient } from "@/lib/api/client";

const favoritesSchema = z.array(idSchema);

export async function getFavorites(): Promise<string[]> {
  const response = await apiClient<unknown>("/api/favorites");

  return favoritesSchema.parse(response);
}

export async function addFavorite(applicationId: string): Promise<void> {
  await apiClient<void>(`/api/favorites/${applicationId}`, {
    method: "PUT",
  });
}

export async function removeFavorite(applicationId: string): Promise<void> {
  await apiClient<void>(`/api/favorites/${applicationId}`, {
    method: "DELETE",
  });
}