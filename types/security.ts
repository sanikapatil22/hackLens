// Security analysis types and interfaces

export interface AttackStep {
  step: number;
  title: string;
  description: string;
  action: string;
  result: string;
}

export interface CodeExample {
  vulnerable: string;
  fixed: string;
  explanation: string;
}

export interface DemoPayload {
  input: string;
  output: string;
  isVulnerable: boolean;
}

export interface ELI5Explanation {
  simple: string;
  analogy: string;
  example: string;
}

export interface HackerConfidenceMetrics {
  exploitDifficulty: number; // 0-100
  commonAttackVector: boolean;
  requiresUserInteraction: boolean;
  requiresAuthentication: boolean;
  estimatedSuccessRate: number; // 0-100
}

export interface InteractiveDemo {
  type: 'sql-injection' | 'xss' | 'command-injection' | 'csrf';
  title: string;
  description: string;
  payload: string;
  expectedOutput: string;
  tips: string[];
}

export interface QuizQuestion {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scenario: string;
  code?: string;
  options: {
    label: string;
    value: 'safe' | 'vulnerable';
    isCorrect: boolean;
  }[];
  explanation: string;
  hackerTip: string;
  pointsReward: number;
}

export interface SecurityFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  observed: string;
  hackerPerspective: string;
  impact: string;
  fix: string;
  codeExample?: CodeExample;
  attackTimeline?: AttackStep[];
  eli5?: ELI5Explanation;
  hackerConfidence?: HackerConfidenceMetrics;
  interactiveDemo?: InteractiveDemo;
  beforeAfterComparison?: {
    before: {
      code: string;
      vulnerabilityCount: number;
      attackSurfaceArea: string;
    };
    after: {
      code: string;
      vulnerabilityCount: number;
      attackSurfaceArea: string;
    };
  };
}

export interface AnalysisResult {
  url: string;
  timestamp: string;
  findings: SecurityFinding[];
  overallRiskScore: number; // 0-100
  summary: string;
  htmlUploadAnalysis?: {
    fileName: string;
    findings: SecurityFinding[];
  };
}

export interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completedAt: string;
}
