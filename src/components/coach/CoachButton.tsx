"use client"

import React, { useState } from "react"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { CoachPanel } from "@/components/coach/CoachPanel"

interface CoachButtonProps {
  userId: string
  userName: string | null
}

export function CoachButton({ userId, userName }: CoachButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasEverOpened, setHasEverOpened] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
    setHasEverOpened(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        aria-label="Open PACE Coach"
        className={cn(
          // Base styles
          "fixed z-50 flex items-center justify-center rounded-full shadow-lg",
          "bg-primary text-primary-foreground",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Size
          "w-14 h-14",
          // Mobile: above bottom nav, right-aligned
          "bottom-20 right-4",
          // Desktop: bottom-right corner
          "md:bottom-6 md:right-6",
          // Pulse animation when never opened
          !hasEverOpened && "animate-pulse"
        )}
      >
        <Zap
          className={cn(
            "h-6 w-6 transition-transform duration-200",
            isOpen && "scale-90"
          )}
        />
        <span className="sr-only">PACE Coach</span>
      </button>

      {/* Coach panel */}
      <CoachPanel
        isOpen={isOpen}
        onClose={handleClose}
        userId={userId}
        userName={userName}
      />
    </>
  )
}
