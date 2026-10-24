import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { vi } from '../src/data/translations/vi.js';
import { en } from '../src/data/translations/en.js';

const appJsxPath = path.resolve(import.meta.dirname, '../src/App.jsx');
const onboardingModalPath = path.resolve(import.meta.dirname, '../src/components/OnboardingModal.jsx');
const helpModalPath = path.resolve(import.meta.dirname, '../src/components/HelpModal.jsx');

test('Help and Onboarding separation: translations define expected keys', () => {
  // Onboarding keys
  assert.equal(vi['onboarding.title'], 'Chào mừng đến với NoteNow!');
  assert.equal(vi['onboarding.start_btn'], 'Bắt đầu ghi chú');
  assert.equal(en['onboarding.title'], 'Welcome to NoteNow!');
  assert.equal(en['onboarding.start_btn'], 'Get Started');

  // Help keys
  assert.equal(vi['header.help_title'], 'Hướng dẫn & Tính năng');
  assert.equal(vi['help.title'], 'Hướng dẫn & Tính năng');
  assert.ok(vi['help.sub'], 'Help subtitle must exist in vi');
  assert.equal(vi['help.close_btn'], 'Đóng');

  assert.equal(en['header.help_title'], 'Guide & Features');
  assert.equal(en['help.title'], 'Guide & Features');
  assert.ok(en['help.sub'], 'Help subtitle must exist in en');
  assert.equal(en['help.close_btn'], 'Close');
});

test('App.jsx separates showOnboarding and showHelp states', () => {
  const appJsx = fs.readFileSync(appJsxPath, 'utf8');

  // Must import HelpModal
  assert.match(appJsx, /import\s+HelpModal\s+from\s+'\.\/components\/HelpModal\.jsx'/, 'App.jsx must import HelpModal');

  // Must have separate state for showOnboarding and showHelp
  assert.match(appJsx, /const\s+\[showOnboarding,\s*setShowOnboarding\]\s*=\s*useState\(false\)/, 'App.jsx must define showOnboarding state');
  assert.match(appJsx, /const\s+\[showHelp,\s*setShowHelp\]\s*=\s*useState\(false\)/, 'App.jsx must define showHelp state');

  // Header button must trigger setShowHelp(true), NOT setShowOnboarding(true)
  const headerBtnMatch = appJsx.match(/id="btn-help-guide"[^>]*>|onClick=\{[^}]*\}\s*[^>]*id="btn-help-guide"/);
  assert.ok(headerBtnMatch, 'Header help button must exist');
  assert.match(appJsx, /onClick=\{[^}]*setShowHelp\(true\)[^}]*\}[\s\S]*?id="btn-help-guide"/, 'Header help button must call setShowHelp(true)');
  assert.doesNotMatch(appJsx, /onClick=\{[^}]*setShowOnboarding\(true\)[^}]*\}[\s\S]*?id="btn-help-guide"/, 'Header help button must not trigger onboarding');

  // Closing help does not mark onboarding complete
  assert.match(appJsx, /<HelpModal\s+isOpen=\{showHelp\}\s+onClose=\{\(\)\s*=>\s*setShowHelp\(false\)\}\s*\/>/, 'HelpModal close only sets showHelp false');

  // First-visit onboarding behavior is retained
  assert.match(appJsx, /localStorage\.getItem\('notenow_onboarded_v2'\)/, 'First-visit check remains');
  assert.match(appJsx, /localStorage\.setItem\('notenow_onboarded_v2',\s*'true'\)/, 'Onboarding completion persists in localStorage');
});

test('HelpModal renders clear Hướng dẫn & Tính năng view with feature cards and dismiss action', () => {
  const helpModalCode = fs.readFileSync(helpModalPath, 'utf8');

  assert.match(helpModalCode, /t\('help\.title',\s*'Hướng dẫn & Tính năng'\)/, 'HelpModal displays Hướng dẫn & Tính năng title');
  assert.match(helpModalCode, /id="btn-help-dismiss"/, 'HelpModal provides dismiss button');
  assert.match(helpModalCode, /id="btn-help-close"/, 'HelpModal provides header close button');
  assert.match(helpModalCode, /<NoteNowFeatureCards\s*\/>/, 'HelpModal reuses feature cards');
  assert.doesNotMatch(helpModalCode, /localStorage/, 'HelpModal does not touch localStorage');
  assert.doesNotMatch(helpModalCode, /notesApi/, 'HelpModal does not create notes or call API');
});

test('OnboardingModal preserves first-visit onboarding CTA Bắt đầu ghi chú', () => {
  const onboardingModalCode = fs.readFileSync(onboardingModalPath, 'utf8');

  assert.match(onboardingModalCode, /t\('onboarding\.title',\s*'Chào mừng đến với NoteNow!'\)/, 'OnboardingModal retains welcome title');
  assert.match(onboardingModalCode, /id="btn-onboarding-start"/, 'OnboardingModal retains start button');
  assert.match(onboardingModalCode, /t\('onboarding\.start_btn',\s*'Bắt đầu ghi chú'\)/, 'OnboardingModal retains Bắt đầu ghi chú text');
  assert.match(onboardingModalCode, /<NoteNowFeatureCards\s*\/>/, 'OnboardingModal renders feature cards');
});
