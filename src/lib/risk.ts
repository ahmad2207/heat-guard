/**
 * Frontend risk levels, matching design-reference/TOKENS.md.
 * Every risk display shows the number, the name and the colour together.
 */
export type RiskLevel = 1 | 2 | 3 | 4

export const RISK_LEVELS: readonly RiskLevel[] = [1, 2, 3, 4]

export const RISK_NAMES: Record<RiskLevel, string> = {
  1: 'Low',
  2: 'Elevated',
  3: 'High',
  4: 'Critical',
}

/** Main instruction on the worker risk card, from design-reference/source/Main.dc.html. */
export const RISK_WORKER_MESSAGES: Record<RiskLevel, string> = {
  1: 'Conditions are manageable. Keep your routine breaks and drink water regularly.',
  2: 'Heat is building. Take your breaks on time and watch for warning signs.',
  3: 'Take extra breaks and reduce heavy work now.',
  4: 'Stop heavy work. Move to shade now and follow your supervisor.',
}

export interface RiskClasses {
  /** Background token class, for example `bg-risk-3` */
  bg: string
  /** Text token class for text on that background, for example `text-risk-3-text` */
  text: string
  /** Border token class in the level colour, for outlines */
  border: string
}

// Written out in full so Tailwind can find every class name at build time.
const CLASSES: Record<RiskLevel, RiskClasses> = {
  1: { bg: 'bg-risk-1', text: 'text-risk-1-text', border: 'border-risk-1' },
  2: { bg: 'bg-risk-2', text: 'text-risk-2-text', border: 'border-risk-2' },
  3: { bg: 'bg-risk-3', text: 'text-risk-3-text', border: 'border-risk-3' },
  4: { bg: 'bg-risk-4', text: 'text-risk-4-text', border: 'border-risk-4' },
}

/** Background, text and border token classes for a risk level. */
export function riskClasses(level: RiskLevel): RiskClasses {
  return CLASSES[level]
}

export function riskName(level: RiskLevel): string {
  return RISK_NAMES[level]
}

/** "3 · High", the short form used on badges and in tables. */
export function riskLabel(level: RiskLevel): string {
  return `${level} · ${RISK_NAMES[level]}`
}
