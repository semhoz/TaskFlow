"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  /** outline: yüksek kontrast (auth vb.); ghost: dashboard */
  variant?: "ghost" | "outline";
  className?: string;
};

export function ThemeToggle({
  variant = "ghost",
  className,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function toggle() {
    const current = theme ?? resolvedTheme ?? "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <Button
      type="button"
      variant={variant}
      size="icon-sm"
      onClick={toggle}
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      className={cn(
        "text-foreground [&_svg]:text-foreground",
        variant === "outline" &&
          "border-border bg-card shadow-sm hover:bg-muted dark:border-border dark:bg-card/90",
        className
      )}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  );
}
