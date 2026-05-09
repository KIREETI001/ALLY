# ALLY — strategy folder

Generated 7 May 2026. Three deliverables, one folder.

## What's here

### `ALLY_Strategy_Bible.docx`
The full research, segmentation, pricing, regulatory, and competitive strategy in one Word document. Twelve parts:

1. The caregiving crisis — Singapore numbers, 2026 inflection, global comparators
2. Caregiver archetypes — the nine personas ALLY must serve
3. Walking in their shoes — pain points written from the caregiver's POV
4. Pull factors — why users will install voluntarily
5. Cautionary notes — the nine hurdles that kill startups in this space
6. Stakeholder lenses — government, clinical, and policy POVs
7. Competitive landscape — SG and international, with the white space mapped
8. Consumer bands & pricing — the eight-tier ladder
9. Differentiation — the six durable moats
10. Go-to-market roadmap — twelve months with decision points at 3, 6, 9
11. Risk register — top ten risks with mitigations
12. Closing — the mission statement made explicit

Pull this open first. It's the substrate for everything else.

### `ALLY_Segmentation_and_Pricing.xlsx`
Seven sheets of tabular data backing the Strategy Bible. Inputs are blue, formulas are black — change a blue cell and the rest recalculates.

- **Segments** — nine archetypes with rough TAM, willingness to pay, channels, stickiness
- **Pricing** — the eight pricing tiers in a single grid
- **Features** — feature × tier inclusion matrix
- **Competitors** — twenty competitors across SG and international, with ALLY's row highlighted
- **Unit Economics** — consumer subscriber model + B2B2C revenue scenario, fully formulaic
- **Subsidies** — twelve Singapore government schemes ALLY surfaces in the navigator
- **KPI Targets** — milestone targets for months 3, 6, 9, and 12

Recalculation verified clean: 0 errors across 15 formulas.

### `ALLY_Landing.html`
A single-file marketing landing page that translates the strategy into something tangible. Open it in any browser.

Sections: hero with embedded phone mockup, stats strip, six-feature grid, nine-archetype gallery, pain-point empathy walk, full eight-tier pricing, trust & compliance, partner pitch (hospitals / employers / government), FAQ, footer with regulatory disclaimer.

Designed mobile-responsive, accessible, and matched to the ALLY teal palette already used in the prototype.

## How to use these

Read the Bible front-to-back once. Keep the workbook open during pricing conversations and partner pitches. Show the landing page to anyone who asks "so what is ALLY actually?" — investors, hospital procurement, employer HR, family.

Update quarterly. The numbers will move; the mission shouldn't.

## What's still open

- Two refactoring questions from the previous Cowork turn that need answering before I touch the Next.js code (prototype refactor approach + `.env.local` confirmation).
- Phase 2 implementation work — Supabase wiring, real auth, care-team multi-user — is still queued and waiting on those answers.
