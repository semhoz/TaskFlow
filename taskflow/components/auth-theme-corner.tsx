"use client";

import { ThemeToggle } from "@/components/theme-toggle";

/** Giriş / kayıt sayfalarında sabit köşede görünür tema anahtarı */
export function AuthThemeCorner() {
  return (
    <div
      className="pointer-events-auto fixed right-4 top-4 z-50 rounded-xl border border-border bg-card/95 p-1 shadow-lg ring-1 ring-border/60 backdrop-blur-md supports-[backdrop-filter]:bg-card/80"
      role="navigation"
      aria-label="Tema"
    >
      <ThemeToggle variant="outline" />
    </div>
  );
}
