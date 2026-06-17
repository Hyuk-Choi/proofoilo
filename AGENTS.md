# Proofolio Development Guide

## 1. Project Goal

Proofolio is a desktop-first SaaS web app that turns a user's project evidence
into recruiter-friendly career content.

The product flow is:

`File upload -> Analysis report -> Follow-up questions -> Portfolio -> Cover letter -> Resume bullets -> Expert feedback -> Interview questions -> Export`

Proofolio is not a generic writing tool. Every generated statement should connect
source evidence to a job competency, outcome, or credible professional narrative.

## 2. Current Codebase

This repository currently contains a working Next.js app named Market Fit Lab.
Do not delete or overwrite it while introducing Proofolio.

- `app/`: App Router entry, root layout, and global Tailwind styles
- `components/market-fit-lab.tsx`: current client app, including most UI and state
- `types/market.ts`: Market Fit Lab domain types
- `lib/sample-data.ts`: sample data and localStorage normalization
- `lib/scoring.ts`: scoring and text-generation helpers
- `lib/positioning.ts`: positioning helpers
- `lib/report.ts`: report-generation helpers
- `app.js`, `index.html`, `styles.css`, `server.py`: legacy static/Python app files
- `icons/`, `manifest.webmanifest`, `sw.js`: legacy PWA assets

Current technical baseline:

- Next.js 16.2.9 with App Router
- React 19.2.7
- TypeScript 6.0.3 with `strict: true`
- Tailwind CSS 4.3.1
- ESLint 9 with Next.js Core Web Vitals rules
- `@/*` path alias mapped to the repository root
- Browser `localStorage` persistence

Known structural issue: `components/market-fit-lab.tsx` is approximately 2,800
lines and combines shell UI, feature UI, state, persistence, and interactions.
Do not repeat this structure for Proofolio.

## 3. Non-Negotiable Product Rules

1. Show an analysis report after upload. Do not generate final artifacts directly
   from uploaded files.
2. Require the analysis step before portfolio, cover letter, resume, feedback, or
   interview generation becomes available.
3. Preserve source evidence. Generated claims must be traceable to uploaded
   content or an explicit user answer.
4. Give every generated artifact `Copy`, `Edit`, and `Regenerate` actions.
5. Save editable project state in the browser for the MVP.
6. Keep AI provider code replaceable. UI components must not contain generation
   logic or call a future AI SDK directly.
7. Use a professional SaaS dashboard style: white background, light-gray cards,
   navy text, and blue accents.
8. Optimize for desktop first, while avoiding layouts that completely break on
   tablet or mobile.
9. Keep all user-facing MVP copy in Korean unless a feature explicitly generates
   another language.

## 4. Architecture Rules

- Prefer Server Components by default. Add `"use client"` only at interactive
  boundaries that use state, effects, browser APIs, or event handlers.
- Keep domain types in `types/proofolio.ts` or a feature-local `types.ts`.
- Keep browser persistence behind `lib/storage/`; components must not access
  `localStorage` directly.
- Keep dummy AI functions behind `lib/ai/`; components consume typed functions
  through feature hooks or actions.
- Keep file validation and text extraction behind `lib/files/`.
- Keep domain transformations out of JSX. Put them in pure functions that can be
  tested independently.
- Split components by responsibility. A page may compose features, but it should
  not own every form, card, modal, and generator implementation.
- Use explicit loading, success, empty, and error states for upload and generation.
- Use schema versions and normalization/migrations for persisted data.
- Do not add global state libraries during the MVP unless React state plus focused
  hooks becomes demonstrably insufficient.
- Do not introduce an API route merely to simulate AI. Mock services may run in
  the browser, but their signatures should remain compatible with a future async
  server implementation.

## 5. Proposed Folder Structure

Create folders incrementally as their implementation phase begins. Do not add
empty placeholder files.

```text
app/
  layout.tsx
  globals.css
  page.tsx
  (proofolio)/
    layout.tsx
    dashboard/
      page.tsx
    projects/
      new/
        page.tsx
      [projectId]/
        upload/
          page.tsx
        analysis/
          page.tsx
        questions/
          page.tsx
        portfolio/
          page.tsx
        cover-letter/
          page.tsx
        resume/
          page.tsx
        feedback/
          page.tsx
        interview/
          page.tsx
        export/
          page.tsx
  market-fit-lab/
    page.tsx

components/
  ui/
    button.tsx
    card.tsx
    input.tsx
    textarea.tsx
    badge.tsx
    modal.tsx
  layout/
    app-sidebar.tsx
    app-header.tsx
    workflow-nav.tsx
  shared/
    result-actions.tsx
    empty-state.tsx
    loading-state.tsx

features/
  projects/
  upload/
  analysis/
  questions/
  portfolio/
  cover-letter/
  resume/
  feedback/
  interview/
  export/

hooks/
  use-proofolio-workspace.ts
  use-generated-artifact.ts

lib/
  ai/
    contracts.ts
    analyze-file.ts
    generate-portfolio.ts
    generate-cover-letter.ts
    generate-resume.ts
    generate-feedback.ts
    generate-interview-questions.ts
  files/
    supported-files.ts
    validate-file.ts
    extract-file-content.ts
  storage/
    keys.ts
    proofolio-storage.ts
    migrations.ts
  utils/

mock/
  proofolio-sample.ts

types/
  proofolio.ts
```

The existing Market Fit Lab should eventually move to `/market-fit-lab` without
losing its implementation. Proofolio may then become the root experience.

## 6. Core Domain Model

Use these concepts as the starting point. Refine them before implementation if a
screen requires additional fields.

```ts
type WorkflowStep =
  | "upload"
  | "analysis"
  | "questions"
  | "portfolio"
  | "coverLetter"
  | "resume"
  | "feedback"
  | "interview"
  | "export";

type ArtifactType =
  | "portfolio"
  | "coverLetter"
  | "resume"
  | "feedback"
  | "interviewQuestions";

type UploadedSource = {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: "ready" | "processing" | "processed" | "error";
  extractedText?: string;
  errorMessage?: string;
};

type AnalysisReport = {
  summary: string;
  experiences: string[];
  skills: string[];
  achievements: string[];
  evidence: string[];
  missingInformation: string[];
  suggestedRoles: string[];
};

type FollowUpQuestion = {
  id: string;
  question: string;
  reason: string;
  answer: string;
  required: boolean;
};

type GeneratedArtifact = {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
  sourceIds: string[];
};

type ProofolioProject = {
  schemaVersion: number;
  id: string;
  name: string;
  targetRole: string;
  currentStep: WorkflowStep;
  sources: UploadedSource[];
  analysis?: AnalysisReport;
  questions: FollowUpQuestion[];
  artifacts: GeneratedArtifact[];
  createdAt: string;
  updatedAt: string;
};
```

Do not store a live `File` object in application state that is serialized to
localStorage.

## 7. Local Storage Boundary

`localStorage` usually has a small per-origin quota and is unsuitable for storing
large PDF, PPTX, DOCX, image, or spreadsheet binaries.

For the MVP:

- Store project metadata, extracted text, analysis, question answers, and generated
  artifacts in `localStorage`.
- Process selected `File` objects in memory during the active session.
- Make it clear when an original file must be selected again after a refresh.
- Enforce file count and size limits before reading content.
- Keep a versioned key such as `proofolio-workspace-v1`.

If original file persistence becomes required, adopt IndexedDB or remote object
storage in a later phase rather than encoding binaries into localStorage.

## 8. Dummy AI Contracts

All mock generators must be typed, asynchronous, and deterministic enough for
repeatable UI testing. They may simulate latency.

```ts
async function analyzeFile(
  sources: UploadedSource[],
): Promise<AnalysisReport>;

async function generatePortfolio(
  input: GenerationInput,
): Promise<GeneratedArtifact>;

async function generateCoverLetter(
  input: GenerationInput,
): Promise<GeneratedArtifact>;

async function generateResume(
  input: GenerationInput,
): Promise<GeneratedArtifact>;

async function generateFeedback(
  input: GenerationInput,
): Promise<GeneratedArtifact>;

async function generateInterviewQuestions(
  input: GenerationInput,
): Promise<GeneratedArtifact>;
```

`GenerationInput` must include the analysis report, answered follow-up questions,
target role, source references, and any artifact-specific options.

When a real AI provider is added, retain these public function boundaries and
replace only the implementation or adapter.

## 9. Implementation Phases

### Phase 0 - Baseline and Standards

- Inspect and document the current app.
- Keep Market Fit Lab working.
- Add this development guide.

Done when lint passes, the production build succeeds, and no current feature was
deleted.

### Phase 1 - Proofolio Foundation

- Add Proofolio domain types, sample data, storage adapter, migrations, and mock AI
  contracts.
- Extract reusable button, card, form, shell, and result-action components.
- Add the Proofolio dashboard shell and workflow navigation.
- Move or expose Market Fit Lab at `/market-fit-lab` before changing the root page.

Done when both apps are reachable and Proofolio project state survives refresh.

### Phase 2 - Project Creation and Upload

- Add project name and target role inputs.
- Add drag-and-drop and file-picker upload UI.
- Validate supported extension, MIME type, count, and size.
- Show per-file processing, success, and error states.
- Use mock extraction where real browser parsing is not yet available.

Initial formats: PDF, PPT/PPTX, DOC/DOCX, TXT, CSV/XLSX, JPG/JPEG, PNG, and WebP.

Done when users can create a project, add/remove files, and continue to analysis.

### Phase 3 - Analysis Report

- Call `analyzeFile()` only after explicit user action.
- Show summary, experience, competency, achievement, evidence, and missing-data
  sections.
- Link analysis items to source file names where possible.
- Allow analysis regeneration.
- Lock downstream generation until a valid analysis exists.

Done when upload always leads to a reviewable analysis report before generation.

### Phase 4 - Follow-Up Questions

- Generate clarification questions from missing information.
- Let users answer, skip optional questions, and edit answers.
- Persist answers and feed them into all downstream generators.

Done when the user can fill evidence gaps before creating final content.

### Phase 5 - Career Artifacts

- Implement portfolio, cover letter, and resume generation screens.
- Use one shared artifact editor and shared result actions.
- Preserve user edits across navigation and refresh.
- Regeneration creates a new version without silently destroying edited content.

Done when all three artifact types support copy, edit, save, and regenerate.

### Phase 6 - Feedback, Interview, and Export

- Generate structured expert feedback with strengths, risks, and improvements.
- Generate role-specific interview questions with answer guidance and evidence.
- Add export selection and browser-friendly Markdown/text download or print output.

Done when the full workflow reaches export without dead ends.

### Phase 7 - Hardening

- Add focused tests for storage migrations, workflow guards, file validation, and
  mock generators.
- Verify keyboard navigation, labels, focus states, and contrast.
- Test corrupted localStorage, empty projects, unsupported files, and generation
  failures.
- Review bundle size and client-component boundaries.

Done when lint, tests, and production build pass and core flows have no known
blocking defects.

## 10. UI and Content Standards

- Use semantic design tokens in `app/globals.css` rather than scattering new hex
  values across every component.
- Prefer navy for primary text, blue for primary actions, muted gray for secondary
  surfaces, green for success, amber for warning, and red for destructive actions.
- Keep cards lightly bordered with restrained shadows and consistent radius.
- Show the current workflow step and completed steps at all times inside a project.
- Disable unavailable steps with a visible reason instead of hiding them.
- Include source/evidence context near generated claims.
- Confirmation is required before destructive actions such as deleting a project,
  source, or artifact version.

## 11. Consultant Output Standard

All analysis, feedback, personal branding, skill assessment, career writing, and
interview guidance must meet a professional career and strategy consultant
standard.

- Structure analysis as `diagnosis -> evidence -> implication -> recommendation`.
- Distinguish verified facts, interpretations, proposals, expected impact, and
  execution results. Never present a proposal or expected effect as a measured
  outcome.
- Connect every competency claim to a concrete action, decision, deliverable, or
  result. Do not award a high skill rating from a single keyword match.
- Score conservatively. Repetition across projects, role specificity, source
  quality, quantitative evidence, and transferability should affect the rating.
- State evidence gaps and limitations directly. Include the exact data, source,
  comparison baseline, or user answer required to strengthen a weak claim.
- Make feedback specific enough to revise the document immediately. Identify the
  weak sentence or logic, explain the evaluation risk, and provide a replacement
  direction.
- Avoid generic praise and abstract expressions such as "excellent", "worked
  hard", or "learned a lot". Prefer problem definition, decision criteria,
  action, result, and validation language.
- Preserve the candidate's voice in cover letters and interviews while keeping
  the reasoning concise, credible, and appropriate for a recruiter or hiring
  manager.

## 12. Verification

Run after each implementation phase:

```bash
pnpm lint
pnpm build
```

If `pnpm` is unavailable in the Codex desktop shell, use the bundled runtime:

```bash
export PATH="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
node node_modules/eslint/bin/eslint.js .
node node_modules/next/dist/bin/next build
```

Add targeted tests when test tooling is introduced. Do not claim file parsing,
AI analysis, export fidelity, or persistence works without exercising the relevant
user path.
