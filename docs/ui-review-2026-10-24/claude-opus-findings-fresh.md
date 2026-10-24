# UI Visual Review: Screenshots Only (2026-10-24)

**Source:** `output/playwright/ui-audit-2026-10-24/*.png` (86 files)
**Method:** I opened each PNG and looked at it. I used filenames to tell which app, viewport and state each image shows. I did not read any source code, logs, JSON reports or earlier reviews, and I did not open the live sites. Fix directions below are suggestions based only on what the images show.

## 1. Capture integrity

- **All 86 images opened.** None were corrupt or failed to load.
- **Dimensions match the filenames.** Desktop images are 1440×900, mobile 390×844, narrow 320×844. Every image is a **viewport-only** capture, not a full-page capture, so nothing below the first screen is covered.
- **No byte-identical duplicates.** I checked MD5 hashes and none match.
- **Visual duplicates (the image does not show the state its name claims):**
  - `note_*_dialog-help.png` and `note_*_dialog-onboarding.png` look the same at all three viewports. Both show the "Chào mừng đến với NoteNow!" onboarding modal, so the Help dialog was never captured.
  - `tuvi_*_validation-empty-name.png` differs from `tuvi_*_initial-view.png` only by a focus ring on the Họ Tên field. No validation message is visible.
  - `talk_*_form-focus.png` differs from initial only by the focus ring on the Nội dung textarea. This is expected for a focus state, and I note it only for completeness.

## 2. Coverage gaps (I am not claiming these states were reviewed)

| # | Gap | Evidence |
|---|-----|----------|
| G1 | NoteNow Help dialog was never captured | `note_{desktop,mobile,narrow}_dialog-help.png` all show the onboarding modal |
| G2 | NoteNow mobile editor-expanded is missing | No `note_mobile_390x844_editor-expanded.png` exists. Desktop and narrow both have one. |
| G3 | IChingNow mobile/narrow "methods-unlocked" does not show the method cards | `kinhdich_{mobile,narrow}_methods-unlocked.png` show only the filled form. Desktop shows only the top edge of the cards. |
| G4 | SpiritNow mobile/narrow "apps-grid-view" does not show the apps grid | `spiritnow_{mobile,narrow}_apps-grid-view.png` stop at the Daily Insight cards |
| G5 | TarotNow manual (Chọn Tay) card-picking UI is not shown | `tarot_*_mode-manual-selection.png` show only the toggle state and a relabelled textarea |
| G6 | TuVi validation error state is not shown | `tuvi_*_validation-empty-name.png` show focus only, with no error text or invalid styling |
| G7 | Only the first screen is captured | Footers, history sections and the lower parts of forms are cut off, e.g. `talk_mobile_390x844_initial-view.png` and `tuvi_desktop_1440x900_initial-view.png` |
| G8 | No result or output states for any app | There is no hexagram result, drawn Tarot spread, generated Tử Vi chart, saved note or sent message |
| G9 | No logged-in states | Every journal, history and Hợp hôn view shows only its login prompt |

## 3. Confirmed bugs

### B1 · P2 · IChingNow: Mai Hoa banknote suggestion cards clip the serial numbers
- **Viewport/state:** mobile and narrow, method-maihoa-serial
- **Files:** `kinhdich_mobile_390x844_method-maihoa-serial.png`, `kinhdich_narrow_320x844_method-maihoa-serial.png`
- **Symptom:** The 4-column grid of banknote cards is too narrow for its content. At 390px, serials like "7199 · 1769" run into the card edges and the "CHỌN ↵" label and coin icon overlap. At 320px the serials are cut off on both sides ("154 · 731", "361 · 698"), and the "₫ VND" label wraps onto two lines over the star.
- **Why it matters:** Users cannot read the number they are about to pick, and the suggestions exist to be read. The tap targets are also cramped.
- **Fix direction:** Use 2 columns, or a horizontal scroll row, below about 480px. Alternatively, shrink the serial font or stack the two halves of the number.

### B2 · P2 · IChingNow: Serial input placeholder is truncated
- **Viewport/state:** mobile, method-maihoa-serial
- **File:** `kinhdich_mobile_390x844_method-maihoa-serial.png`
- **Symptom:** The placeholder reads "Nhập 2–8 chữ số (VI". The monospace font and wide letter spacing cut off the example values.
- **Why it matters:** The example format (e.g. 123456) is the hint users need, and it is hidden.
- **Fix direction:** Shorten the placeholder on small screens and move the example to helper text, or reduce the letter spacing.

### B3 · P2 · TarotNow: Spread picker option titles are truncated so options look alike
- **Viewport/state:** mobile and narrow (also desktop), spread-picker-dialog
- **Files:** `tarot_mobile_390x844_spread-picker-dialog.png`, `tarot_narrow_320x844_spread-picker-dialog.png`, `tarot_desktop_1440x900_spread-picker-dialog.png`
- **Symptom:**
  - At 320px the options read "3 Lá — Quá…", "3 Lá — Tình hu…" and "3 Lá — Suy ng…", and "Yes / No (Câu tr…".
  - At 390px the options read "3 Lá — Tình huống · Trở…".
  - On desktop: "3 Lá — Tình huống · Trở ngại · Lời khu…".
  - The selected-value summary is also truncated: "3 Lá — Quá khứ · Hiện t…".
- **Why it matters:** Several spreads start with "3 Lá —". With truncation they become hard or impossible to tell apart, which leads to wrong choices.
- **Fix direction:** Let titles wrap to 2 lines, or put the distinguishing part first and move the card count into the badge, which already shows "3 lá".

### B4 · P3 · NoteNow: Logo glyph disappears in dark theme
- **Viewport/state:** all viewports, theme-toggled
- **Files:** `note_desktop_1440x900_theme-toggled.png`, `note_mobile_390x844_theme-toggled.png`, `note_narrow_320x844_theme-toggled.png` (compare with `note_*_initial-empty-state.png`)
- **Symptom:** In light theme the green logo tile shows a document icon. In dark theme it is a plain green square.
- **Why it matters:** The brand mark is lost. At narrow width the logo is the only branding in the header.
- **Fix direction:** Give the icon a colour that contrasts with the tile in dark mode.

### B5 · P3 · NoteNow: Character limit uses a different number format in two places
- **Viewport/state:** desktop and narrow, editor-expanded vs onboarding
- **Files:** `note_desktop_1440x900_editor-expanded.png`, `note_narrow_320x844_editor-expanded.png`, `note_desktop_1440x900_dialog-onboarding.png`
- **Symptom:** The editor counter shows "0/2,048" (English comma separator). The onboarding text says "2.048 ký tự" (Vietnamese dot separator).
- **Why it matters:** In vi-VN, "2,048" reads as 2.048 (about two). This confuses users about the limit.
- **Fix direction:** Format the counter with the vi-VN locale.

### B6 · P3 · TarotNow: Streak "0" looks like the letter "o"
- **Viewport/state:** all viewports, initial-view
- **Files:** `tarot_desktop_1440x900_initial-view.png`, `tarot_mobile_390x844_initial-view.png`, `tarot_narrow_320x844_initial-view.png`
- **Symptom:** The streak counter next to "💫" uses the serif display font's old-style numerals. The zero renders as a small lowercase-looking "o".
- **Why it matters:** The streak value is ambiguous at a glance.
- **Fix direction:** Use lining numerals or the UI sans font for this number.

### B7 · P3 · IChingNow: Daily challenge row breaks apart at 320px in Luyện Dịch
- **Viewport/state:** narrow, dialog-practice-game
- **File:** `kinhdich_narrow_320x844_dialog-practice-game.png`
- **Symptom:** In the "Biến Quẻ" card, the "hexagram → hexagram" visual wraps. The second hexagram drops under the first, the arrow floats on its own, and the "Đề hôm nay #24 · tối ưu 5 nước" text sits to the side.
- **Why it matters:** The "transform A into B" idea is no longer readable.
- **Fix direction:** Keep the icon group from wrapping and let the text go on its own line below it.

### B8 · P3 · IChingNow: Knowledge dialog title crowds the close button at 320px
- **Viewport/state:** narrow, dialog-knowledge
- **File:** `kinhdich_narrow_320x844_dialog-knowledge.png`
- **Symptom:** "📖 Dịch Học mỗi ngày" runs right up to the "✕ Đóng" button with almost no gap. The date kicker also wraps mid-date ("2026-" / "10-23").
- **Why it matters:** It looks cramped, and the close button is easy to mistake for part of the title.
- **Fix direction:** Reduce the title size or switch to an icon-only close button on narrow screens. Keep the date on one line.

### B9 · P3 · Shared journal modal is oversized on desktop and styled differently in each app
- **Viewport/state:** desktop, dialog-journal
- **Files:** `kinhdich_desktop_1440x900_dialog-journal.png`, `tarot_desktop_1440x900_dialog-journal.png`, `tuvi_desktop_1440x900_dialog-journal.png`
- **Symptom:** The modal is about 1120px wide for one sentence and a button, which leaves large empty areas. It is dark in IChingNow and TarotNow (even though IChingNow's page is light) but white in TuViNow. In IChingNow and TuVi the "Đăng nhập SSO" button sits right under the text with almost no spacing.
- **Why it matters:** It looks unfinished and the shared component is inconsistent across apps.
- **Fix direction:** Cap the width at about 560–640px, follow each host app's theme or one shared style, and add vertical spacing above the button.

## 4. Uncertain observations (not counted as bugs)

- `talk_desktop_1440x900_initial-view.png`: the whole page looks faded or soft compared with `talk_desktop_1440x900_form-focus.png`. This is probably a fade-in animation caught mid-way.
- `tuvi_desktop_1440x900_theme-toggled.png`: a dot appears before "Lá số cá nhân" (".Lá số cá nhân"). It may be a starfield particle rather than a text glyph.
- `tarot_desktop_1440x900_spread-picker-dialog.png`: "RÚT BÀI TAROT" looks dim. This is likely a disabled state because the question field is empty.
- The filter chip rows in the Knowledge dialog and the Tarot spread picker are cut off at the right edge. This looks like intentional horizontal scrolling, but there is no clear scroll cue.
- TuViNow has no visible language (VI) switcher on desktop or in its drawer, and TalkWithMe has no app switcher. These may be product decisions.
- `spiritnow_desktop_1440x900_initial-view.png`: the Daily Insight cards stretch to equal height and leave large empty areas. This is probably by design.
- NoteNow mobile header icon buttons look about 32px. They may be below the recommended tap-target size, but I cannot measure them reliably from the image.

## 5. Counts

| Metric | Count |
|--------|-------|
| Images inspected (opened successfully) | **86 / 86** |
| Images that failed to open | 0 |
| Confirmed bugs | **9** (P1: 0 · P2: 3 · P3: 6) |
| Coverage gaps | **9** (G1–G9) |
| Uncertain observations (excluded) | 7 |
