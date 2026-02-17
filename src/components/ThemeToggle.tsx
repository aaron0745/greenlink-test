import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-14" /> // Placeholder with same dimensions
  }

  const isDark = theme === "dark"

  return (
    <div 
      className="relative inline-flex h-8 w-14 cursor-pointer items-center rounded-full bg-muted p-1 transition-colors hover:bg-muted/80"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="button"
      aria-label="Toggle theme"
    >
      {/* Background Icons */}
      <div className="flex w-full justify-between px-1 text-muted-foreground/50">
        <Sun className="h-3.5 w-3.5" />
        <Moon className="h-3.5 w-3.5" />
      </div>

      {/* Sliding Thumb */}
      <div
        className={`absolute h-6 w-6 transform rounded-full bg-background shadow-sm transition-transform duration-200 flex items-center justify-center ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-orange-500" />
        )}
      </div>
    </div>
  )
}
