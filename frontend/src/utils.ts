import type { Category } from "./types";

export function getCategory(name: string): Exclude<Category, "all"> {
  const lower = name.toLowerCase();
  if (lower.includes("workshop") || lower.includes("atelier"))
    return "atelier";
  if (lower.includes("networking") || lower.includes("pause"))
    return "networking";
  return "conference";
}

export function getCategoryLabel(cat: Exclude<Category, "all">): string {
  switch (cat) {
    case "conference":
      return "Conférence";
    case "atelier":
      return "Atelier";
    case "networking":
      return "Networking";
  }
}

export function getBadgeClass(cat: Exclude<Category, "all">): string {
  switch (cat) {
    case "conference":
      return "badge badge-conference";
    case "atelier":
      return "badge badge-atelier";
    case "networking":
      return "badge badge-networking";
  }
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
