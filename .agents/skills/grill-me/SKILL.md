> Copied from the owner's Claude Code setup. Adapt tool names to your CLI.

---
name: grill-me
description: One-question-at-a-time interview to resolve ambiguous requirements before building a feature, or to catch up on user context at the start of a session. Invoke via /grill-me, @grill-me, or when about to design something with unresolved forks in the decision tree.
recommended_model: sonnet
---

# Grill-Me Interview Engine

This skill is the invocable form of `.agentrules/grill-me-protocol.md` — read that file for the full canonical protocol (it applies across every CLI/IDE this project uses, not just Claude Code). This SKILL.md is what makes it directly triggerable by name in Claude Code.

## Trigger

- **Mode A — Design Interview**: the user typed `/grill-me`, `@grill-me`, or asked for a design interview before building a feature or architecture.
- **Mode B — Session Catch-Up**: a session wants to build or refresh context about the user specifically (their background, preferences, goals, working style) rather than resolve a feature's design forks.

## Mandatory Execution Rules

1. **Codebase/profile-first**: before asking anything, check what's already known. For Mode A, search the codebase for the answer. For Mode B, read `second-brain/My Configuration.md` (and `.agentrules/persona.md`, `.agentrules/mistakes-prevention.md`, `second-brain/Index.md`) first — never ask something those files already answer.
2. **One question at a time**: in a live interactive chat session, ask a single question, wait for the answer, then ask the next. Walk down each branch of the decision tree, resolving dependencies sequentially. (The one exception is the dashboard's automated batched-interview flow, `scripts/claude-interview.mjs` — see the protocol doc's "Mode A variant" for why that context alone collects all answers in one submission instead.)
3. **Always recommend the optimal choice**: when presenting options, prefix the best one with `(Recommended)` and briefly explain why.
4. **Structured format**: 2-4 concrete, mutually exclusive options per question, phrased from the user's perspective (how they want the system/relationship to work), using the `a one-question-at-a-time prompt to the user` tool.
5. **Persist the result**:
   - Mode A design decisions -> `second-brain/Decisions/` or the task's own plan/spec, so downstream execution has zero ambiguity.
   - Mode B profile/preference answers -> `second-brain/My Configuration.md` (facts about the user: background, goals, working style, standing preferences) — durable, cross-session facts belong there, not in a one-off chat reply. A preference significant enough to change future behavior everywhere should also be saved via the Agent Memory mechanism, not just written into this doc.

## Mode B question bank (pick what's still unknown, skip what My Configuration.md already answers)

Background & goals: current role/work, what this project is for them, what "done" looks like for their biggest current goal.
Working style: how hands-on vs. hands-off they want automation to be, how much detail they want in updates, sync vs. async check-in preference.
Technical context: which tools/platforms they already use daily, any hard constraints (budget, time, platforms they refuse to touch).
Standing preferences: communication tone, how they want mistakes handled, anything they've corrected an agent on before that should never recur.

Stop once you have enough to act — this is a targeted interview, not an exhaustive intake form. If the user says "that's enough for now," stop immediately and save what you have.
