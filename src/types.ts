export interface Question {
  id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  time_limit: number;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  topic: string;
  created_at: string;
  questions?: Question[];
}
