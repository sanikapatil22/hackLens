# HackLens Feature Matrix

## Active Tabs

1. Analyze Website
2. Live Hacking Demo
3. Try Attack
4. Simulate Attack

## Analyze Website

### Core
- URL-based analysis with risk findings.
- Severity and category breakdown.
- Expandable finding cards with educational context.

### Security Explainer (AI + Cache)
- Insight, risk, fix, attack scenario.
- Optional fix effort and before/after impact.
- Optional fix_code snippet shown in UI.

### Focus Personalization
- Finds and highlights user-specific focus areas using weak_areas.
- Optional focus-first ordering for findings.

### Report Generator (New)
- Generate structured report from vulnerabilities, explanations, and optional user profile.
- AI mode via backend route.
- Deterministic template fallback.
- UI supports print/export.

## Live Hacking Demo

### Narration
- AI narration through secure backend route.
- Deterministic fallback narration.
- Display safety filter for risky payload-like text.

### Branching Story Mode (New)
- Per-stage defensive choices (2-3 options).
- AI-generated choices when available.
- Deterministic cached choices by stage.
- Chosen action influences stage momentum and narration tone.

### Safety and clarity
- Persistent disclaimer banner.
- Simulation mode and safe simulation badges.
- Educational context label.

## Try Attack

### Existing
- Input sandbox for SQLi/XSS/command injection style learning.
- Classification (correct/partial/incorrect).
- Reasoning-aware coaching with fallback hints.

### Strategy Scoring (New)
- Strategy score 0-100 + insights.
- AI mode via secure backend route.
- Deterministic fallback from action history patterns:
  - repeated mistakes
  - delayed correct actions
  - missing investigation/log behavior
  - missed root-cause indicators

### Session Replay (New)
- Replay timeline with step index, user action, attacker response, narration.
- Auto-play with speed control (slow/normal/fast).
- Works from stored local session history only.

## Simulate Attack

### Existing
- Scenario generation with adaptive/manual mode.
- Stateful progression and result explanation.
- DB-first interaction logging with local fallback.

### Memory-Based Attacker (New)
- Internal attacker memory in simulation state:
  - previous_failures
  - preferred_style (stealth/aggressive)
- Attacker adapts behavior from repeated user defenses/misses.
- No API response structure changes.

### Session Replay (New)
- Replay timeline exposed in scenario result view.
- Auto-play with speed controls.

## User Intelligence Layer

### Profile fields
- weak_areas
- strengths
- behavior_pattern
- avg_score

### Generation and persistence
- Computed from interaction history.
- Stored additively in user_stats.
- No existing field removals.

### Product usage
- Coaching bias in Try Attack.
- Focus highlighting in Analyze Website.
- Difficulty context signal in simulation/scenario generation.

## Global Intelligence UX (New)

### Global AI Summary
- Compact summary of strengths, weak areas, and next focus.
- AI mode with deterministic fallback.

### Guided Learning Path
- Three recommended next steps.
- AI mode with deterministic fallback.

## Security and Compliance Guarantees

- No frontend API key exposure.
- Existing endpoint contracts preserved.
- Existing endpoint response shapes preserved.
- Additive schema changes only.
- Deterministic fallback available for all new AI-assisted features.
