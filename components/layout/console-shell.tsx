"use client"

import { ChatWindow } from "@/components/chat/chat-window"
import { Header } from "@/components/layout/header"
import { LeftSidebar } from "@/components/layout/left-sidebar"
import { RightSidebar } from "@/components/layout/right-sidebar"

export function OmniClawConsole() {
  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-background font-sans text-foreground selection:bg-primary/30">
      <Header />
      <div className="relative flex min-h-0 flex-1">
        <LeftSidebar />
        <ChatWindow />
        <RightSidebar />
      </div>
    </div>
  )
}
