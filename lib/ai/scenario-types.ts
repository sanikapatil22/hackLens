export type ScenarioType = "phishing" | "smishing" | "impersonation" | "malware";

export type ScenarioDifficulty = "easy" | "medium" | "hard";

export type ScenarioInterface = "email" | "sms" | "chat" | "website";
export type ScenarioSource = "cached" | "ai";
export type ScenarioSelectionMode = "manual" | "adaptive";

export interface Solution {
  immediate_action: string;
  prevention_tips: string[];
  best_practices: string[];
}

export interface Scenario {
  id: string;
  type: ScenarioType;
  difficulty: ScenarioDifficulty;
  interface: ScenarioInterface;
  title: string;
  content: string;
  options: string[];
  correct_action: string;
  red_flags: string[];
  explanation: {
    hacker: string;
    user: string;
    developer: string;
  };
  solution: Solution;
  meta: {
    source: ScenarioSource;
    mode: ScenarioSelectionMode;
    difficulty_reason?: string;
  };
}

export interface ScenarioParams {
  type: ScenarioType;
  difficulty: ScenarioDifficulty;
  context?: string;
  selectionMode?: ScenarioSelectionMode;
  difficultyReason?: string;
}
