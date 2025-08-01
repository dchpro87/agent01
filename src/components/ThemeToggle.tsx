"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);

    // Get saved theme from localStorage or default to system
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (theme === "system") {
      // Remove class and let CSS media query handle it
      root.classList.remove("light", "dark");
      localStorage.setItem("theme", "system");
    } else {
      // Apply specific theme
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className='w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse' />
    );
  }

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className='w-4 h-4' />;
      case "dark":
        return <Moon className='w-4 h-4' />;
      case "system":
        return (
          <div className='relative w-4 h-4'>
            <Sun className='w-4 h-4 absolute top-0 left-0 opacity-50' />
            <Moon className='w-4 h-4 absolute top-0 left-0 opacity-50 transform translate-x-0.5 translate-y-0.5' />
          </div>
        );
      default:
        return <Sun className='w-4 h-4' />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case "light":
        return "Switch to dark theme";
      case "dark":
        return "Switch to system theme";
      case "system":
        return "Switch to light theme";
      default:
        return "Toggle theme";
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className='p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-200 flex items-center justify-center'
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      {getIcon()}
    </button>
  );
}
