# Copilot Agent Skills Documentation Design

## Context
The repository is a static portfolio site with agent-readiness metadata. The request is to add the Copilot agent's current skills into the repo while keeping the existing portfolio skills list unchanged.

## Goals
- Add a clear, human-readable list of current Copilot agent skills to the repository.
- Keep the portfolio skills list (HTML, CSS, JavaScript, Lua, Python, C) unchanged.
- Maintain a single source of truth for the Copilot agent skills list.

## Non-goals
- No changes to runtime behavior, site layout, or navigation.
- No updates to agent metadata files (llms.txt, agent.json).
- No automated validation or new tooling.

## Proposed Approach
Add a new "Copilot Agent Skills" section to README.md. The section will contain a two-column table with the skill name and a one-line purpose statement for each currently available skill.

## Components
- README.md
  - New "Copilot Agent Skills" section.
  - Table format: **Skill** | **Purpose**.
  - Content sourced from the current available Copilot skills list at the time of edit.

## Data Flow
Static documentation only. The list is maintained manually in README.md and does not affect site runtime behavior.

## Error Handling
No runtime error handling is required. The main risk is stale or incomplete skill entries; mitigated by keeping a single source of truth in README.md.

## Testing
Manual verification only:
- Confirm README.md renders correctly.
- Confirm the skills list is complete and accurate.
