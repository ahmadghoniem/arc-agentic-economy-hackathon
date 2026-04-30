# Design Decisions and Change Log

This file tracks important design decisions and implementation changes for the Arc Economy Hackathon app.

Use it for decisions that affect structure, UI patterns, dependencies, architecture, data flow, or developer workflow. Keep entries short enough to maintain during active development.

## How To Use This File

- Add a new entry to **Decision Records** when we choose an approach and want future contributors to understand why.
- Add a new entry to **Change Log** when implementation changes affect the product, architecture, UI composition, dependencies, or development workflow.
- Prefer linking to issues, PRs, screenshots, or source files when available.
- Do not use this as a task list. Track tasks elsewhere; track decisions and meaningful changes here.

## Decision Record Template

Copy this template for each new decision.

```md
### ADR-0000: Short Decision Title

- Date: YYYY-MM-DD
- Status: Proposed | Accepted | Superseded | Rejected
- Decision Makers: Name(s)
- Related Changes: Link to change log entry, PR, issue, or commit

#### Context

What problem are we solving? What constraints, user needs, or technical facts matter?

#### Considered Options

- Option A
- Option B
- Option C

#### Decision

Chosen option: "Option A", because ...

#### Consequences

- Positive: ...
- Negative: ...
- Follow-up: ...

#### Confirmation

How will we know this decision was implemented correctly? Example: review, build, test, visual QA, or runtime behavior.
```

## Change Log Template

Copy this template for each meaningful change.

```md
### YYYY-MM-DD - Short Change Title

- Type: Added | Changed | Fixed | Removed | Refactored | Decision
- Scope: UI | Data | Architecture | Tooling | Docs | Dependencies
- Related Decision: ADR-0000 or N/A

#### Summary

What changed?

#### Impact

Who or what is affected?

#### Verification

How was it checked?
```

## Decision Records

### ADR-0001: Use Shadcn Primitives For Magic Patterns Export

- Date: 2026-04-24
- Status: Accepted
- Decision Makers: Project team
- Related Changes: 2026-04-24 - Initial OmniClaw console UI

#### Context

The Magic Patterns export is a dark agent-payment console with a fixed header, side panels, chat workspace, gateway popover, service drawer, and execution status stepper. The app already uses Next.js, Tailwind CSS, shadcn, and Base UI.

#### Considered Options

- Install and use `@shadcn/dashboard-01` as the main block.
- Recreate the export as a single custom component.
- Compose the export from shadcn primitives and split it into feature blocks.

#### Decision

Chosen option: compose the export from shadcn primitives and split it into feature blocks, because the Magic Patterns UI is a custom console rather than a generic dashboard.

#### Consequences

- Positive: Keeps accessibility and interaction primitives from shadcn while preserving the exported design.
- Positive: Avoids pulling in dashboard, chart, and table code that the design does not use.
- Negative: Some custom layout and timeline UI remains bespoke.
- Follow-up: Split the current large console component into focused block files.

#### Confirmation

The implementation should pass `pnpm typecheck`, `pnpm lint`, and `pnpm build`, and the UI should preserve the Magic Patterns console layout.

### ADR-0003: Use Phosphor Icons For Product UI

- Date: 2026-04-24
- Status: Accepted
- Decision Makers: Project team
- Related Changes: 2026-04-24 - Switch icon system to Phosphor

#### Context

The console is a serious agent-payment and API-spend interface. Hugeicons felt too playful for this product surface, and the original Magic Patterns export used Phosphor icons.

#### Considered Options

- Keep Hugeicons.
- Use Phosphor Icons.
- Mix icon libraries.

#### Decision

Chosen option: use Phosphor Icons, because the visual tone is more restrained and closer to the source design.

#### Consequences

- Positive: The UI has a calmer, more technical icon style.
- Positive: Product code and shadcn component internals use one icon library.
- Negative: Existing Hugeicons imports must be removed from generated shadcn files and app code.
- Follow-up: Keep `components.json` set to `phosphor` for future shadcn additions.

#### Confirmation

Searches for `hugeicons` and `Hugeicons` should return no product or shadcn UI imports.

### ADR-0004: Split Console Into Feature Blocks

- Date: 2026-04-24
- Status: Accepted
- Decision Makers: Project team
- Related Changes: 2026-04-24 - Split OmniClaw console into blocks

#### Context

The first implementation placed the whole console in one large component file. That made iteration fast, but it made ownership boundaries unclear and made it harder to change individual UI blocks such as Active Guards, Transactions, Fund Activity, or wallet balances.

#### Considered Options

- Keep one large component file.
- Split only visual sections.
- Split by product block and shared data/helpers.

#### Decision

Chosen option: split by product block and shared data/helpers, because each section has a clear role and will evolve independently.

#### Consequences

- Positive: Each UI block can be changed without parsing the entire console.
- Positive: Wallet balances use one reusable component instead of one-off badge markup.
- Negative: There are more files to navigate.
- Follow-up: Keep future console additions inside `components/omniclaw/` unless they become generic UI primitives.

#### Confirmation

The root console entry should compose named blocks, and `components/omniclaw-console.tsx` should stay a small compatibility re-export.

### ADR-0002: Track Decisions In A Single Markdown File For Now

- Date: 2026-04-24
- Status: Accepted
- Decision Makers: Project team
- Related Changes: 2026-04-24 - Add design decisions and change log

#### Context

The team needs a lightweight way to track why design and implementation choices were made, while also keeping a short record of meaningful changes during fast hackathon development.

#### Considered Options

- Use one combined `docs/design-decisions.md` file.
- Create one file per ADR in `docs/decisions/`.
- Use only a changelog.

#### Decision

Chosen option: use one combined `docs/design-decisions.md` file for now, because the project is small and needs low-friction tracking more than a full ADR directory.

#### Consequences

- Positive: Easy to update in the same repo as code changes.
- Positive: Combines decisions and implementation change notes in one place.
- Negative: It may become noisy if the project grows.
- Follow-up: Move to one ADR file per decision if this file becomes hard to scan.

#### Confirmation

New meaningful design or architectural changes should add one decision record or one change-log entry before the related implementation is considered complete.

## Change Log

### 2026-04-24 - Initial OmniClaw Console UI

- Type: Added
- Scope: UI, Dependencies
- Related Decision: ADR-0001

#### Summary

Implemented the Magic Patterns export as a dark agent-payment console using shadcn primitives for cards, badges, popovers, tabs, inputs, textareas, selects, sheet, scroll areas, separators, and tooltips.

#### Impact

The home page now renders the OmniClaw console instead of the starter shadcn page.

#### Verification

Checked with `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

### 2026-04-24 - Add Design Decisions and Change Log

- Type: Added
- Scope: Docs
- Related Decision: ADR-0002

#### Summary

Added this combined design-decision and change-tracking document.

#### Impact

Future architecture, design, dependency, and workflow decisions have a standard place to be recorded.

#### Verification

File added under `docs/design-decisions.md`.

### 2026-04-24 - Switch Icon System to Phosphor

- Type: Changed
- Scope: UI, Dependencies
- Related Decision: ADR-0003

#### Summary

Changed the product icon system from Hugeicons to Phosphor Icons and updated shadcn icon configuration.

#### Impact

Console icons and generated shadcn component internals should use Phosphor only.

#### Verification

Run `pnpm typecheck`, `pnpm lint`, `pnpm build`, and search for remaining Hugeicons references.

### 2026-04-24 - Split OmniClaw Console Into Blocks

- Type: Refactored
- Scope: UI, Architecture
- Related Decision: ADR-0004

#### Summary

Split the console into focused blocks for header, wallet balances, active guards, chat, status stepper, transactions, fund activity, and service catalog.

#### Impact

Future UI changes can target individual feature blocks instead of one large console component.

#### Verification

Run `pnpm typecheck`, `pnpm lint`, `pnpm build`, and manually verify the page interactions.

### 2026-04-24 - Switch To Local Satoshi Fonts

- Type: Changed
- Scope: UI, Dependencies
- Related Decision: N/A

#### Summary

Removed Google font loading and switched the app to local Satoshi font files from `public/fonts/Satoshi`.

#### Impact

The app no longer depends on external font delivery and the product UI uses a more intentional type system.

#### Verification

Search for `next/font/google`, `Geist`, and `Inter`, then verify the app renders with local Satoshi.

### 2026-04-24 - Adopt Dark-First App Theme Tokens

- Type: Changed
- Scope: UI, Architecture
- Related Decision: N/A

#### Summary

Replaced the generic theme values with dark-first app-context tokens for payments, pending work, routing, services, success states, and dividers.

#### Impact

The console uses semantic colors tied to payments and agent execution instead of raw zinc and violet utilities.

#### Verification

Run `pnpm typecheck`, `pnpm lint`, `pnpm build`, and inspect the console surfaces for token consistency.

### 2026-04-24 - Add Chat Session Header

- Type: Added
- Scope: UI
- Related Decision: N/A

#### Summary

Added a session title at the top-left of the chat area and a session summary counter at the top-right.

#### Impact

The chat surface now exposes the active task and current spend/API usage context at a glance.

#### Verification

Verify the header appears above the chat scroll area without layout overlap.

### 2026-04-30 - Split OmniClaw Store Into Slices

- Type: Refactored
- Scope: Architecture
- Related Decision: N/A

#### Summary

Split the OmniClaw Zustand store into internal connection, account, activity, and execution slices while keeping the public `useOmniClawStore` hook stable.

#### Impact

Store behavior and component selectors are preserved, while normalization, formatting, API fetch helpers, and service template lookup now live outside the store entry file.

#### Verification

Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

### 2026-04-30 - Simplify Shared App Code

- Type: Refactored
- Scope: Architecture, UI
- Related Decision: N/A

#### Summary

Removed unused agent/provider code, derived OmniClaw service templates from the paid API catalog, shared proxy route response handling, centralized activity time formatting, and trimmed unused loader variants.

#### Impact

The app keeps the same public UI and API behavior with less duplicate metadata, fewer route wrappers, and less unused client/provider code.

#### Verification

Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

## References

- MADR: https://adr.github.io/madr/
- MADR example decision: https://adr.github.io/madr/decisions/0000-use-markdown-architectural-decision-records.html
- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
