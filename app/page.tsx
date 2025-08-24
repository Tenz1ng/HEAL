"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Activity, Shield } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/auth-context"
import { useHealthData } from "@/contexts/health-data-context"
import { NavigationBar } from "@/components/navigation-bar"
import { useSearchParams } from "next/navigation"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export default function HealthAIChat() {
  const { user, logout } = useAuth()
  const { healthData, saveChatSummary } = useHealthData()
  const searchParams = useSearchParams()

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi there! I'm Clinic Copilot, your personal health assistant. I'm here to chat with you about your health and wellness journey. I can see you've been tracking some health metrics - that's fantastic! What's on your mind today? Are you feeling good, or is there something specific you'd like to talk about?",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [chatSummarySaved, setChatSummarySaved] = useState(false)
  const [showSaveSummary, setShowSaveSummary] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const messageParam = searchParams.get("message")
    if (messageParam) {
      console.log("[v0] Setting pre-populated message:", messageParam)
      setInputValue(messageParam)
      setTimeout(() => {
        if (inputRef.current) {
          console.log("[v0] Focusing input field")
          inputRef.current.focus()
          const length = inputRef.current.value.length
          inputRef.current.setSelectionRange(length, length)
        }
      }, 200)
    }
  }, [searchParams])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateChatSummary = async () => {
    if (messages.length <= 2 || chatSummarySaved) return

    try {
      const conversationText = messages
        .slice(1)
        .map((msg) => `${msg.isUser ? "Patient" : "AI"}: ${msg.content}`)
        .join("\n")

      const response = await fetch("/api/chat-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation: conversationText,
          healthData: healthData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        saveChatSummary(data.summary, data.keyFindings, data.recommendations)
        setChatSummarySaved(true)
        setShowSaveSummary(false)

        setTimeout(() => {
          setMessages([
            {
              id: "1",
              content:
                "Hi there! I'm Clinic Copilot, your personal health assistant. I'm here to chat with you about your health and wellness journey. I can see you've been tracking some health metrics - that's fantastic! What's on your mind today? Are you feeling good, or is there something specific you'd like to talk about?",
              isUser: false,
              timestamp: new Date(),
            },
          ])
          setChatSummarySaved(false)
        }, 1000)
      }
    } catch (error) {
      console.error("Error generating chat summary:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsTyping(true)

    try {
      const conversationMessages = [...messages, userMessage]
        .map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        }))
        .slice(1)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationMessages,
          healthData: healthData,
          isFirstMessage: messages.length === 1,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response")
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
      }

      setMessages((prev) => {
        const newMessages = [...prev, aiMessage]
        if (newMessages.length > 4 && !chatSummarySaved) {
          setShowSaveSummary(true)
        }
        return newMessages
      })
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <AuthGuard>
      <NavigationBar active="care" initials={user?.name?.charAt(0) || "U"} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl h-screen flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.isUser ? "justify-end" : "justify-start"}`}>
                {!message.isUser && (
                  <Avatar className="h-10 w-10 bg-primary flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Activity className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <Card
                  className={`max-w-[75%] p-5 ${
                    message.isUser ? "bg-primary text-primary-foreground ml-auto shadow-sm" : "bg-card border shadow-sm"
                  }`}
                >
                  <div className="leading-relaxed whitespace-pre-line">{message.content}</div>
                  <p
                    className={`text-xs mt-3 opacity-70 ${
                      message.isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </Card>

                {message.isUser && (
                  <Avatar className="h-10 w-10 bg-muted flex-shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground font-medium">You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 justify-start">
                <Avatar className="h-10 w-10 bg-primary flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Activity className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-card border shadow-sm p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}

            {showSaveSummary && !chatSummarySaved && (
              <div className="flex justify-center">
                <Button
                  onClick={generateChatSummary}
                  variant="outline"
                  className="bg-card border-primary/20 hover:bg-primary/5 text-primary"
                >
                  Save Chat Summary to History
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-border bg-card/30">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    console.log("[v0] Input changed:", e.target.value)
                    setInputValue(e.target.value)
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Tell me what's on your mind about your health..."
                  className="min-h-[48px] bg-background border-border focus:border-primary/50 focus:ring-primary/20 text-base"
                  disabled={isTyping}
                  onFocus={() => console.log("[v0] Input focused")}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="h-12 w-12 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center mt-4 gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>
                This AI provides general health information only and cannot replace professional medical advice
              </span>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
