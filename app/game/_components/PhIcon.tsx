'use client'

import {
  Target,
  Leaf,
  EnvelopeSimple,
  Star,
  Heartbeat,
  Crown,
  Heart,
  Trophy,
  Sparkle,
  Check,
  X,
  Play,
  CaretDown,
  CaretRight,
  Lightning,
  ChartBar,
  TrendUp,
  TrendDown,
  Moon,
  Watch,
  Microphone,
  SpeakerHigh,
  SpeakerSlash,
  Stop,
  PersonSimpleRun,
  Fire,
  ChatCircleDots,
  Confetti,
  SealCheck,
  Flask,
  Footprints,
} from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

const ICON_MAP: Record<string, PhosphorIcon> = {
  target: Target,
  leaf: Leaf,
  envelope: EnvelopeSimple,
  star: Star,
  heartbeat: Heartbeat,
  crown: Crown,
  heart: Heart,
  trophy: Trophy,
  sparkle: Sparkle,
  check: Check,
  x: X,
  play: Play,
  'caret-down': CaretDown,
  'caret-right': CaretRight,
  lightning: Lightning,
  'chart-bar': ChartBar,
  'trend-up': TrendUp,
  'trend-down': TrendDown,
  moon: Moon,
  watch: Watch,
  microphone: Microphone,
  'speaker-high': SpeakerHigh,
  'speaker-slash': SpeakerSlash,
  stop: Stop,
  run: PersonSimpleRun,
  fire: Fire,
  chat: ChatCircleDots,
  confetti: Confetti,
  'seal-check': SealCheck,
  flask: Flask,
  footprints: Footprints,
}

interface PhIconProps {
  name: string
  size?: number
  className?: string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
}

export default function PhIcon({ name, size = 24, className = '', weight = 'fill' }: PhIconProps) {
  const IconComponent = ICON_MAP[name]
  if (!IconComponent) return <span>{name}</span>
  return <IconComponent size={size} className={className} weight={weight} />
}
