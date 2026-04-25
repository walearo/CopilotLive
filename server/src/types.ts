export interface InterviewContext {
  resume: string;
  jobDescription: string;
  notes: string;
}

export interface AnswerRequest {
  question: string;
  context: InterviewContext;
}
