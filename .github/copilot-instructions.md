# Workspace Instructions

## Project Shape

This repository is a static personal portfolio site. There is no build step or framework layer; the browser loads [index.html](index.html), [styles.css](styles.css), and [main.js](main.js) directly.

## What To Read First

- [README.md](README.md) for the public-facing site summary and discovery links.
- [index.html](index.html) for the document structure, metadata, and page sections.
- [styles.css](styles.css) for the design system and responsive layout rules.
- [main.js](main.js) for mobile viewport stabilization, navigation behavior, and motion handling.
- [index.md](index.md), [llms.txt](llms.txt), and [agent.json](agent.json) for agent-readable site metadata.

## Related Agent Assets

- [.github/copilot-frontend.md](.github/copilot-frontend.md) for HTML, CSS, and JS guardrails.
- [.github/agents/portfolio-reviewer.md](.github/agents/portfolio-reviewer.md) for regression and parity reviews.
- [.github/prompts/portfolio-content-update.prompt.md](.github/prompts/portfolio-content-update.prompt.md) for syncing public copy across metadata files.

## Working Principles

- Preserve the semantic HTML structure and the existing section IDs so anchor navigation keeps working.
- Keep the accessibility affordances intact: skip link, menu button state, aria attributes, reduced-motion support, and keyboard escape handling.
- Treat the mobile viewport logic in [main.js](main.js) as deliberate; do not remove it without a replacement that solves the same URL-bar jump problem.
- Keep styles centralized in [styles.css](styles.css) with CSS custom properties rather than hard-coded one-off values.
- Update the markdown and metadata files when changing public copy, contact details, or site identity.

## File Conventions

- Root-level assets live beside the page entry points, including icons, the logo, and the optimized portrait image.
- Filenames are mostly lowercase with snake_case only where already established.
- The site uses vanilla JavaScript. Avoid introducing a framework or package dependency unless the user explicitly asks for it.

## Validation

- There is no automated test suite or build command in this workspace.
- Verify changes by opening the site in the browser, checking responsive behavior, and confirming navigation, animations, and metadata still work.
- If you change copy or links, confirm the corresponding alternate docs and metadata files still match the homepage.

## Common Pitfalls

- Do not break the nav toggle/menu state synchronization between DOM, aria attributes, and body classes.
- Do not regress reduced-motion or coarse-pointer behavior just to add animation.
- Avoid duplicating guidance from the linked docs; prefer linking to the existing source of truth.
- Keep the public identity consistent across [index.html](index.html), [index.md](index.md), [llms.txt](llms.txt), and [agent.json](agent.json).
