import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTarotPromptText } from '../src/utils/buildTarotPromptText.mjs';

const translations = {
  'form.question_label': 'Question',
  'result.perspective_prefix': 'Perspective',
  'modal.orientation_upright': 'Upright',
  'modal.orientation_reversed': 'Reversed',
};

function translate(key, fallback) {
  return translations[key] || fallback;
}

function makeCard(overrides = {}) {
  return {
    name: 'The Lovers',
    orientation: 'upright',
    arcana: 'Major',
    suit: null,
    uprightKeywords: ['union', 'choice'],
    reversedKeywords: ['imbalance', 'conflict'],
    ...overrides,
  };
}

test('Tarot prompt includes detailed card context and the selected English template instruction', () => {
  const prompt = buildTarotPromptText({
    language: 'en',
    promptTemplate: 'love',
    question: 'Should I repair this relationship?',
    drawnCards: [makeCard()],
    spreadName: 'Three Card Spread',
    spreadPositions: ['Present'],
    interpretationContext: 'relationship',
    interpretationSummary: 'A choice needs honest communication.',
    getCardMeaning: () => 'A bond that asks for mutual choice.',
    t: translate,
  });

  assert.match(prompt, /Question: Should I repair this relationship\?/);
  assert.match(prompt, /Spread: Three Card Spread/);
  assert.match(prompt, /Perspective: relationship/);
  assert.match(prompt, /1\. Card: The Lovers/);
  assert.match(prompt, /Orientation: Upright/);
  assert.match(prompt, /Category: Major/);
  assert.match(prompt, /Keywords: union, choice/);
  assert.match(prompt, /Position in spread: Present/);
  assert.match(prompt, /Preliminary meaning: A bond that asks for mutual choice\./);
  assert.match(prompt, /General Overview:\nA choice needs honest communication\./);
  assert.match(prompt, /Please interpret this spread focusing on Love & Relationships/);
  assert.doesNotMatch(prompt, /Please provide a detailed reading based on the information above\./);
});

test('Tarot prompt selects reversed keywords and the Vietnamese career instruction', () => {
  const prompt = buildTarotPromptText({
    language: 'vi',
    promptTemplate: 'career',
    question: 'Có nên đổi việc không?',
    drawnCards: [makeCard({ orientation: 'reversed' })],
    spreadName: 'Trải bài ba lá',
    spreadPositions: [],
    interpretationContext: '',
    interpretationSummary: '',
    getCardMeaning: null,
    t: (_key, fallback) => fallback,
  });

  assert.match(prompt, /Lá bài: The Lovers/);
  assert.match(prompt, /Từ khóa chính: imbalance, conflict/);
  assert.match(prompt, /Hãy luận giải trải bài này theo khía cạnh Công việc, Sự nghiệp & Tài chính/);
});
