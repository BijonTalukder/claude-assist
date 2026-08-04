import type { ClaudeModel, Framework, Language } from '@claude-assist/types';

const FRAMEWORK_LABELS: Record<Framework, string> = {
  nestjs: 'NestJS',
  express: 'Express',
  nextjs: 'Next.js',
  react: 'React',
  flutter: 'Flutter',
  unknown: 'Unknown',
};

const LANGUAGE_LABELS: Record<Language, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  dart: 'Dart',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  go: 'Go',
  ruby: 'Ruby',
  php: 'PHP',
  rust: 'Rust',
  unknown: 'Unknown',
};

const MODEL_LABELS: Record<ClaudeModel, string> = {
  haiku: 'Haiku',
  sonnet: 'Sonnet',
  opus: 'Opus',
};

export function formatLinesOfCode(loc: number): string {
  if (loc >= 1_000_000) return `${(loc / 1_000_000).toFixed(1)}M`;
  if (loc >= 1_000) return `${Math.round(loc / 1000)}K`;
  return String(loc);
}

export function formatFrameworkLabel(framework: Framework): string {
  return FRAMEWORK_LABELS[framework];
}

export function formatLanguageLabel(language: Language): string {
  return LANGUAGE_LABELS[language];
}

export function formatModelLabel(model: ClaudeModel): string {
  return MODEL_LABELS[model];
}
