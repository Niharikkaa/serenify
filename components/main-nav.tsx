"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-accent">
          {/* <div className="w-20 h-20 bg-accent rounded-lg flex items-center justify-center"> */}
          <Image src="/logo2.png" alt="Serenify Logo"
            width={52}
            height={20} />
          {/* </div> */}
          <span>Serenify</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-foreground/80 hover:text-accent transition-colors">
            Dashboard
          </Link>
          <Link href="/tracker" className="text-foreground/80 hover:text-accent transition-colors">
            Tracker
          </Link>
          <Link href="/habits" className="text-foreground/80 hover:text-accent transition-colors">
            Habits
          </Link>
          <Link href="/reflect" className="text-foreground/80 hover:text-accent transition-colors">
            Reflect
          </Link>
          <Link href="/profile" className="text-foreground/80 hover:text-accent transition-colors">
            Profile
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-accent">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-4 space-y-3">
            <Link href="/dashboard" className="block text-foreground/80 hover:text-accent transition-colors py-2">
              Dashboard
            </Link>
            <Link href="/tracker" className="block text-foreground/80 hover:text-accent transition-colors py-2">
              Tracker
            </Link>
            <Link href="/habits" className="block text-foreground/80 hover:text-accent transition-colors py-2">
              Habits
            </Link>
            <Link href="/reflect" className="block text-foreground/80 hover:text-accent transition-colors py-2">
              Reflect
            </Link>
            <Link href="/profile" className="block text-foreground/80 hover:text-accent transition-colors py-2">
              Profile
            </Link>
            <hr className="border-border my-2" />
            <Button variant="ghost" size="sm" className="w-full justify-start text-foreground/70">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
