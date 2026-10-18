export type Answer = string | number | string[];
export type QuestionType =
  | "single"
  | "scale"
  | "multi"
  | "frequency"
  | "ranking"
  | "multi_max3"
  | "open";
export interface Question {
  id: string;
  section: string;
  text: string;
  type: QuestionType;
  options?: string[] | null;
  min?: number;
  max?: number;
  scale_anchors?: Record<string, string>;
  intermediate_anchors_note?: string;
  rank_count?: number;
}
export interface Respondent {
  id: string;
  answers: Record<string, Answer>;
}
export interface Turn {
  speaker: "interviewer" | "participant";
  kind: string;
  question_id: string;
  section: string;
  text: string;
}
export interface Interview {
  id: string;
  alias: string;
  age_range: string;
  role: string;
  scenario: string;
  emphasis: string;
  turns: Turn[];
}
export interface GuideQuestion {
  id: string;
  section: string;
  question: string;
}
export interface QuestionStats {
  counts?: Record<string, number>;
  mean?: number;
  first_choice_counts?: Record<string, number>;
  average_rank?: Record<string, number>;
  responses?: string[];
  [key: string]: Record<string, number> | number | string[] | undefined;
}
export interface Seed {
  project: {
    name: string;
    title: string;
    team: { name: string; student_id: string }[];
    problem: string;
    goal: string;
    scope: string[];
    target_users: string;
    current_study_focus: string;
  };
  interview_guide: GuideQuestion[];
  interviews: Interview[];
  survey_questions: Question[];
  survey_responses: Respondent[];
  survey_summary: {
    respondent_count: number;
    question_stats: Record<string, QuestionStats>;
  };
}
