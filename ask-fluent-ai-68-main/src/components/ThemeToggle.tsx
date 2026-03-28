import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "dark"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full w-9 h-9 bg-foreground/5 hover:bg-foreground/10 transition-all duration-300 group"
      title={`${theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Sun 
          className={`w-[1.2rem] h-[1.2rem] transition-all absolute ${
            theme === "dark" ? "scale-0 rotate-90" : "scale-100 rotate-0"
          } text-amber-500`} 
        />
        <Moon 
          className={`w-[1.2rem] h-[1.2rem] transition-all absolute ${
            theme === "dark" ? "scale-100 rotate-0" : "scale-0 -rotate-90"
          } text-primary`} 
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
