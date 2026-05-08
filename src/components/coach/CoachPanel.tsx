"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, Zap, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface CoachPanelProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string | null
}

const STARTER_QUESTIONS = [
  "Why am I doing today's session?",
  "What should I eat before my run?",
  "How's my training load looking?",
  "My legs feel sore — is that normal?",
]

// webkit SpeechRecognition fallback (types provided by @types/dom-speech-recognition)
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export function CoachPanel({ isOpen, onClose, userId, userName }: CoachPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [unavailable, setUnavailable] = useState(false)

  // Speech-to-text state
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check for speech recognition support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
      setSpeechSupported(supported)
    }
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingMessage])

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Stop recognition when panel closes
  useEffect(() => {
    if (!isOpen && isListening) {
      recognitionRef.current?.stop()
    }
  }, [isOpen, isListening])

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      setInterimTranscript("")
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      if (final) {
        setInput((prev) => (prev ? `${prev} ${final}` : final).trim())
        setInterimTranscript("")
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        console.error("[SpeechRecognition] error:", event.error)
      }
      setIsListening(false)
      setInterimTranscript("")
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript("")
      // Focus back to textarea after mic
      setTimeout(() => textareaRef.current?.focus(), 50)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return

      // Stop mic if still listening
      if (isListening) {
        recognitionRef.current?.stop()
      }

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage.trim(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput("")
      setInterimTranscript("")
      setIsLoading(true)
      setStreamingMessage("")

      try {
        const response = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage.trim() }],
            userId,
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          if (response.status === 503 || (data.error && data.error.includes("API key"))) {
            setUnavailable(true)
          }
          const errorContent = data.error ?? `Error ${response.status}`
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "assistant", content: errorContent },
          ])
          setIsLoading(false)
          return
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let fullText = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.error) {
                  fullText += `\n[Error: ${data.error}]`
                } else if (data.text) {
                  fullText += data.text
                  setStreamingMessage(fullText)
                }
              } catch {
                // skip malformed SSE lines
              }
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: fullText },
        ])
        setStreamingMessage("")
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "Something went wrong. Please try again.",
          },
        ])
        setStreamingMessage("")
      } finally {
        setIsLoading(false)
      }
    },
    [messages, userId, isLoading, isListening]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const hasMessages = messages.length > 0

  if (!isOpen) return null

  // The display value shows interim transcript inline while speaking
  const displayValue = isListening && interimTranscript
    ? input
      ? `${input} ${interimTranscript}`
      : interimTranscript
    : input

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        className="fixed inset-0 z-40 bg-black/20 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 flex flex-col bg-background border shadow-xl",
          "inset-x-0 bottom-0 rounded-t-2xl max-h-[70vh]",
          "md:inset-x-auto md:bottom-20 md:right-6 md:rounded-xl md:w-[400px] md:max-h-[70vh]"
        )}
        role="dialog"
        aria-label="PACE Coach"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">PACE Coach</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {isListening
                  ? "Listening…"
                  : isLoading
                  ? "Thinking..."
                  : "Your personal running coach"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close coach panel">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {unavailable && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              Coach unavailable — configure API key to enable AI coaching.
            </div>
          )}

          {!hasMessages && !unavailable && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {userName ? `Hi ${userName}! ` : "Hi! "}
                I&apos;m your PACE Coach. I can see your training data, workouts, and nutrition.
                What would you like to know?
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Suggested questions
                </p>
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap bg-muted text-foreground">
                {streamingMessage}
              </div>
            </div>
          )}

          {isLoading && !streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 bg-muted">
                <div className="flex items-center gap-1.5 h-5">
                  <span className="text-xs text-muted-foreground">PACE Coach is thinking</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t px-3 py-3 shrink-0">
          {/* Listening indicator */}
          {isListening && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs text-red-500 font-medium">
                {interimTranscript ? `"${interimTranscript}"` : "Listening — speak now…"}
              </span>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Mic button */}
            {speechSupported && (
              <Button
                onClick={toggleListening}
                disabled={isLoading || unavailable}
                size="icon"
                variant={isListening ? "destructive" : "outline"}
                aria-label={isListening ? "Stop recording" : "Start voice input"}
                className={cn(
                  "shrink-0 transition-all",
                  isListening && "ring-2 ring-red-400 ring-offset-1"
                )}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}

            <textarea
              ref={textareaRef}
              value={displayValue}
              onChange={(e) => {
                if (!isListening) setInput(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Speak now…" : "Ask your coach anything..."}
              rows={1}
              disabled={isLoading || unavailable}
              className={cn(
                "flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "max-h-28 overflow-y-auto",
                isListening && "border-red-300 dark:border-red-700"
              )}
              style={{ minHeight: "38px" }}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading || unavailable}
              size="icon"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 px-0.5">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  )
}
