// Web Speech API — Recognition

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare var SpeechRecognition: {
  new (): SpeechRecognition
}

// Web Speech API — Synthesis

interface SpeechSynthesisUtterance extends EventTarget {
  text: string
  lang: string
  rate: number
  pitch: number
  volume: number
  onend: (() => void) | null
  onerror: (() => void) | null
}

declare var SpeechSynthesisUtterance: {
  new (text?: string): SpeechSynthesisUtterance
}

interface Window {
  SpeechRecognition: typeof SpeechRecognition
  webkitSpeechRecognition: typeof SpeechRecognition
  speechSynthesis: {
    speak(utterance: SpeechSynthesisUtterance): void
    cancel(): void
    speaking: boolean
  }
}
