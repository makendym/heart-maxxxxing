'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { type GameState, LANGUAGE_OPTIONS } from '../../lib/game-state'
import { getQuickReplies } from '../../lib/coach-prompt'
import type { HealthTrends } from '../../lib/fitbit'
import { SpeakerHigh, SpeakerSlash, X, Stop, Play, Microphone } from '@phosphor-icons/react'
import LuigiIcon from './LuigiIcon'

interface ChatPanelProps {
  state: GameState
  onClose: () => void
  healthTrends?: HealthTrends | null
}

/** Map BCP-47 language code to speech synthesis / recognition locale */
const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-US', hi: 'hi-IN', es: 'es-ES', zh: 'zh-CN', ar: 'ar-SA',
  pt: 'pt-BR', fr: 'fr-FR', de: 'de-DE', ja: 'ja-JP', ko: 'ko-KR',
  ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', ur: 'ur-PK',
}

function getSpeechLang(code: string): string {
  return SPEECH_LANG_MAP[code] || 'en-US'
}

/** Short label for the language pill */
function getLangLabel(code: string): string {
  const map: Record<string, string> = {
    en: 'EN', hi: 'हि', es: 'ES', zh: '中', ar: 'عر',
    pt: 'PT', fr: 'FR', de: 'DE', ja: '日', ko: '한',
    ta: 'த', te: 'తె', bn: 'বা', ur: 'ار',
  }
  return map[code] || code.toUpperCase()
}

export default function ChatPanel({ state, onClose, healthTrends }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [sttLang, setSttLang] = useState(state.profile.language || 'en')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastSpokenRef = useRef<string | null>(null)
  const quickReplies = useMemo(() => getQuickReplies(state), [state])
  const speechLang = getSpeechLang(sttLang)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        gameState: state,
        healthTrends: healthTrends ?? null,
      },
    }),
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      window.speechSynthesis?.cancel()
    }
  }, [])

  // Auto-speak new assistant messages when streaming completes
  useEffect(() => {
    if (!autoSpeak || status === 'streaming') return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== 'assistant') return
    if (lastSpokenRef.current === lastMsg.id) return

    const text = lastMsg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')

    if (text.trim()) {
      lastSpokenRef.current = lastMsg.id
      speak(text, lastMsg.id)
    }
  }, [messages, status, autoSpeak])

  /** Speak text using Web Speech API */
  const speak = useCallback((text: string, msgId?: string) => {
    const synth = window.speechSynthesis
    if (!synth) return

    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = speechLang
    utterance.rate = 1.0
    utterance.pitch = 1.0

    if (msgId) {
      setSpeakingId(msgId)
      utterance.onend = () => setSpeakingId(null)
      utterance.onerror = () => setSpeakingId(null)
    }

    synth.speak(utterance)
  }, [speechLang])

  /** Stop speaking */
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeakingId(null)
  }, [])

  /** Toggle voice input */
  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = speechLang
    recognition.interimResults = true
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(transcript)

      if (event.results[event.results.length - 1].isFinal) {
        const text = transcript.trim()
        if (text && status === 'ready') {
          sendMessage({ text })
          setInput('')
        }
        setIsListening(false)
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
    setIsListening(true)
  }, [isListening, status, sendMessage, speechLang])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || status !== 'ready') return
    sendMessage({ text: input.trim() })
    setInput('')
  }

  function handleQuickReply(text: string) {
    if (status !== 'ready') return
    sendMessage({ text })
  }

  const hasMessages = messages.length > 0
  const showQuickReplies = status === 'ready'
  const hasSpeech = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window

  return (
    <div className="fixed top-0 right-0 z-40 w-full h-full md:w-96 md:h-[70vh] md:mt-2 md:mr-2">
      <div className="chat-panel-enter w-full h-full flex flex-col bg-sky-950/95 backdrop-blur-md border border-sky-700/40 md:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-sky-700/30 bg-sky-900/60">
          <div className="flex items-center gap-2">
            <LuigiIcon size={22} />
            <div>
              <h3 className="font-pixel text-[9px] text-emerald-400">Coach Heartley</h3>
              <p className="text-[10px] text-sky-400">Your rehab companion</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Auto-speak toggle */}
            {hasTTS && (
              <button
                onClick={() => {
                  setAutoSpeak(!autoSpeak)
                  if (autoSpeak) stopSpeaking()
                }}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors ${
                  autoSpeak
                    ? 'text-emerald-400 bg-emerald-900/30'
                    : 'text-sky-600 hover:text-sky-400'
                }`}
                title={autoSpeak ? 'Auto-speak on' : 'Auto-speak off'}
              >
                {autoSpeak ? <SpeakerHigh size={14} weight="fill" /> : <SpeakerSlash size={14} weight="fill" />}
              </button>
            )}
            <button
              onClick={() => {
                stopSpeaking()
                onClose()
              }}
              className="w-8 h-8 flex items-center justify-center text-sky-400 hover:text-white hover:bg-sky-800 rounded-lg transition-colors"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
          {!hasMessages && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
              <LuigiIcon size={48} />
              <p className="font-pixel text-[9px] text-emerald-400">Coach Heartley</p>
              <p className="text-sm text-sky-300/70">
                Ask me anything — recipes, nutrition, how you're feeling, or just say hi.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const msgText = message.parts
              .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map((p) => p.text)
              .join('')

            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-pink-600/80 text-white rounded-br-sm'
                      : 'bg-sky-800/80 text-sky-100 rounded-bl-sm'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <span className="inline-flex items-center gap-1 mb-0.5">
                      <LuigiIcon size={14} />
                      {hasTTS && (
                        <button
                          onClick={() =>
                            speakingId === message.id ? stopSpeaking() : speak(msgText, message.id)
                          }
                          className={`text-[10px] px-1 rounded transition-colors ${
                            speakingId === message.id
                              ? 'text-emerald-400 animate-pulse'
                              : 'text-sky-500 hover:text-sky-300'
                          }`}
                          title={speakingId === message.id ? 'Stop' : 'Listen'}
                        >
                          {speakingId === message.id ? <Stop size={12} weight="fill" /> : <Play size={12} weight="fill" />}
                        </button>
                      )}
                    </span>
                  )}
                  {message.parts.map((part, index) =>
                    part.type === 'text' ? (
                      <span key={index} className="whitespace-pre-wrap">{part.text}</span>
                    ) : null,
                  )}
                </div>
              </div>
            )
          })}

          {status === 'streaming' && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-sky-800/80 text-sky-300 rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                <LuigiIcon size={14} />
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="px-3 pb-1 flex gap-1.5 flex-wrap">
            {quickReplies.map((text) => (
              <button
                key={text}
                onClick={() => handleQuickReply(text)}
                className="px-2.5 py-1 text-[11px] bg-sky-800/50 hover:bg-sky-700/60 text-sky-300 hover:text-white border border-sky-700/30 rounded-full transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-sky-700/30 bg-sky-900/40">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Talk to Coach Heartley...'}
              disabled={status !== 'ready'}
              className="flex-1 px-3 py-2 bg-sky-900/60 border border-sky-700/40 rounded-lg text-white text-sm placeholder:text-sky-600 focus:outline-none focus:border-emerald-500/60 transition-colors disabled:opacity-50"
            />
            {hasSpeech && (
              <div className="relative flex items-center">
                {/* Language pill — tap to open picker */}
                <button
                  type="button"
                  onClick={() => setShowLangPicker(!showLangPicker)}
                  className="px-1.5 py-2 bg-sky-900 hover:bg-sky-800 text-sky-400 text-[10px] font-bold rounded-l-lg border-r border-sky-700/40 transition-colors"
                  title="Change voice language"
                >
                  {getLangLabel(sttLang)}
                </button>
                {/* Mic button */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`px-3 py-2 rounded-r-lg text-sm transition-colors active:scale-95 ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                      : 'bg-sky-800 hover:bg-sky-700 text-sky-300 hover:text-white'
                  }`}
                  title={isListening ? 'Stop listening' : `Voice input (${getLangLabel(sttLang)})`}
                >
                  <Microphone size={18} weight="fill" />
                </button>
                {/* Language picker dropdown */}
                {showLangPicker && (
                  <div className="absolute bottom-full right-0 mb-1 bg-sky-950 border border-sky-700/50 rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto no-scrollbar">
                    {LANGUAGE_OPTIONS.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setSttLang(l.code)
                          setShowLangPicker(false)
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs whitespace-nowrap transition-colors ${
                          sttLang === l.code
                            ? 'bg-emerald-800/40 text-emerald-400'
                            : 'text-sky-300 hover:bg-sky-800'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors active:scale-95"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
