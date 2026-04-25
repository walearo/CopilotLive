import Anthropic from '@anthropic-ai/sdk';
import { InterviewContext } from '../types.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ~4 chars per token; cap each field so a verbose PDF doesn't inflate every request
const MAX_FIELD_CHARS = 8000;

function truncate(text: string): string {
  if (text.length <= MAX_FIELD_CHARS) return text;
  return text.slice(0, MAX_FIELD_CHARS) + '\n\n[content truncated]';
}

function buildSystemPrompt(context: InterviewContext): string {
  const sections: string[] = [
    `You are an expert interview coach providing real-time assistance during a live job interview.
Generate the best answer the candidate should say, written in first person.

RULES:
- First person only ("I have…", "I built…", "In my experience…")
- 200–300 words maximum — be thorough but speakable
- No filler openers ("Great question!", "Certainly!")
- Behavioral questions: STAR format (Situation, Task, Action, Result)
- Draw on the candidate's specific background when available
- Close with one strong, confident sentence`,
  ];

  if (context.resume) {
    sections.push(`\n---\nCANDIDATE RESUME:\n${truncate(context.resume)}`);
  }
  if (context.jobDescription) {
    sections.push(`\n---\nTARGET ROLE:\n${truncate(context.jobDescription)}`);
  }
  if (context.notes) {
    sections.push(`\n---\nTALKING POINTS:\n${truncate(context.notes)}`);
  }

  return sections.join('');
}

export async function* streamInterviewAnswer(
  question: string,
  context: InterviewContext,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(context);

  const stream = anthropic.messages.stream(
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      // Cache the system prompt — TTL is 5 min, covers a full interview session.
      // Cache hit costs 10% of normal input tokens; first-request write costs 25% extra once.
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: `Interview question: "${question}"` }],
    },
    { signal }
  );

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield chunk.delta.text;
    }
  }
}
