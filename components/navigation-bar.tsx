"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, Stethoscope, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"

interface NavigationBarProps {
  active?: "care" | "none"
  initials?: string
}

export function NavigationBar({ active = "care", initials = "T" }: NavigationBarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground">H.E.A.L.</span>
            <span className="text-[10px] text-muted-foreground leading-none -mt-1">Health Evaluation by AI Logic</span>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Users button */}
          <Link href="/profile">
            <Button
              variant={pathname === "/profile" ? "secondary" : "ghost"}
              size="icon"
              className={`h-10 w-10 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                pathname === "/profile"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  : ""
              }`}
              aria-pressed={pathname === "/profile"}
              aria-label="Users"
            >
              <Users className="h-5 w-5" />
              <span className="sr-only">Users</span>
            </Button>
          </Link>



          {/* Care button */}
          <Link href="/">
            <Button
              variant={active === "care" ? "secondary" : "ghost"}
              size="icon"
              className={`h-10 w-10 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                active === "care"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  : ""
              }`}
              aria-pressed={active === "care"}
              aria-label="AI Chat"
            >
              <Stethoscope className="h-5 w-5" />
              <span className="sr-only">AI Chat</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 cursor-pointer hover:bg-accent transition-colors"
                aria-label="Profile menu"
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || "User"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user && (
                <DropdownMenuItem className="cursor-default text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  {user.email}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
