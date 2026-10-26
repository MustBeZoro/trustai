export type Verdict = 'Fraud/Scam' | 'Verified/Safe' | 'Misleading' | 'Satire' | 'Unverified';

export interface SourceRef {
  title: string;
  url: string;
  outlet: string;
}

export interface AnalysisResult {
  id: string;
  verdict: Verdict;
  summary: string;
  originalClaim: string;
  senderInfo: string;
  sources: SourceRef[];
  tactics: string[];
  detailedExplanation: string;
  trustScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  sourceReliability: number;
  contentConsistency: number;
  analyzedAt: string;
}

export interface QuizQuestion {
  id: number;
  message: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  topic?: string;
}

export interface UserProfile {
  name: string;
  dob: string;
}

export type Theme = 'default' | 'dark' | 'cyber';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}
