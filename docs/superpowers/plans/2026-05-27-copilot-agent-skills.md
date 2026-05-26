# Copilot Agent Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Copilot Agent Skills section to README.md that lists current agent skills with one-line purposes, leaving the portfolio skills list unchanged.

**Architecture:** Single-source documentation change in README.md only; no runtime or site layout changes. The skills list is a static markdown table with skill names and concise purposes.

**Tech Stack:** Markdown, git

---

## File Structure
- Modify: `README.md` — insert a new `## Copilot Agent Skills` section after the existing `## Skills` section and before `## Contact`.

---

### Task 1: Add Copilot Agent Skills section to README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Define the expected README section (documentation baseline)**

```markdown
## Copilot Agent Skills
The Copilot CLI agent includes the following skills used to plan, implement, and review work in this repo.

| Skill | Purpose |
| --- | --- |
| brainstorming | Explore intent and requirements before any creative or behavioral changes. |
| dispatching-parallel-agents | Split 2+ independent tasks across parallel agents. |
| executing-plans | Execute a written implementation plan with checkpoints. |
| finishing-a-development-branch | Wrap up completed work with merge/PR/cleanup options. |
| receiving-code-review | Verify and apply code review feedback carefully. |
| requesting-code-review | Ask for a formal code review when work is complete. |
| subagent-driven-development | Execute plans by dispatching focused subagents per task. |
| systematic-debugging | Debug unexpected behavior before proposing fixes. |
| test-driven-development | Implement features/bugfixes using TDD. |
| using-git-worktrees | Create an isolated worktree before feature work. |
| using-superpowers | Load skills and enforce skill-driven workflows. |
| verification-before-completion | Require verification before claiming completion. |
| writing-plans | Produce a detailed implementation plan from approved design. |
| writing-skills | Create or update skills and verify they work. |
| customize-cloud-agent | Configure Copilot cloud agent setup steps and environment. |
```

- [ ] **Step 2: Verify README does not already contain the section**

Run: `rg -n "Copilot Agent Skills" README.md`

Expected: no matches

- [ ] **Step 3: Insert the new section after the existing Skills section**

Add the following block after the current `## Skills` section and before `## Contact`:

```markdown
## Copilot Agent Skills
The Copilot CLI agent includes the following skills used to plan, implement, and review work in this repo.

| Skill | Purpose |
| --- | --- |
| brainstorming | Explore intent and requirements before any creative or behavioral changes. |
| dispatching-parallel-agents | Split 2+ independent tasks across parallel agents. |
| executing-plans | Execute a written implementation plan with checkpoints. |
| finishing-a-development-branch | Wrap up completed work with merge/PR/cleanup options. |
| receiving-code-review | Verify and apply code review feedback carefully. |
| requesting-code-review | Ask for a formal code review when work is complete. |
| subagent-driven-development | Execute plans by dispatching focused subagents per task. |
| systematic-debugging | Debug unexpected behavior before proposing fixes. |
| test-driven-development | Implement features/bugfixes using TDD. |
| using-git-worktrees | Create an isolated worktree before feature work. |
| using-superpowers | Load skills and enforce skill-driven workflows. |
| verification-before-completion | Require verification before claiming completion. |
| writing-plans | Produce a detailed implementation plan from approved design. |
| writing-skills | Create or update skills and verify they work. |
| customize-cloud-agent | Configure Copilot cloud agent setup steps and environment. |
```

- [ ] **Step 4: Re-check README for the new section**

Run: `rg -n "Copilot Agent Skills" README.md`

Expected: at least one match with the new section heading.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add copilot agent skills to README" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
