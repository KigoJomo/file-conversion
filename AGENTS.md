<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Operating Rules

## Product Context

- Keep UX practical, low-friction, and useful before decorative.
- This app is database-less. Persist lightweight preferences/history in `localStorage`; do not add a DB without explicit approval.
- Exact Office-to-PDF conversion must use CloudConvert via `CLOUDCONVERT_API_KEY`. Do not add local binary fallbacks or silently fall back to lossy manual PDF rendering for XLSX/DOCX/PPTX.

## Code Hygiene

- TypeScript strictness is non-negotiable. Avoid `any`; use `unknown`, discriminated unions, and explicit return types for shared utilities.
- Keep files under 220 LOC. Split earlier when a file mixes UI, state, parsing, conversion, and formatting concerns.
- Keep React components under 120 LOC. Extract stateful workflows into feature components and pure formatting into `lib/`.
- Keep functions under 45 LOC unless a parser/renderer is clearer as one cohesive block.
- Prefer server components by default. Use `"use client"` only for browser APIs, local state, event handlers, and `localStorage`.
- Use `components/ui` primitives for controls. Add small local primitives there only when they are reusable.
- No hidden global mutable state for conversion. Pass data explicitly between parser, PDF renderer, and route handler.
- Use structured parsers for Office formats. Do not parse binary Office files with ad hoc string slicing.
- For format fidelity, keep route handlers wired to engine-based conversion. Manual parsing/rendering is acceptable only for explicit previews or diagnostics, not final PDFs.
- Do not commit generated conversion outputs, `.next`, coverage, or local test artifacts.

## Testing Discipline

- Every meaningful change must pass `bun run check` before handoff.
- Add or update tests when changing conversion parsing, PDF rendering, validation, or localStorage behavior.
- Manual smoke test the main upload flow after UI changes: upload `.xlsx`, `.docx`, or `.pptx`, convert, download, and verify history updates.
- Keep tests deterministic. Do not depend on network, local files outside the repo, or current time unless injected.
- CI must run install, lint, typecheck, unit tests, and production build.

## Development Workflow
- Do not run the dev server unless explicitly instructed to do so.
- Do not run a build unless explicitly instructed to do so.
