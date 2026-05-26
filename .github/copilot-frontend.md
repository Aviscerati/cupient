---
applyTo: "index.html,styles.css,main.js,404.html"
---

# Frontend Editing Guide

## Goals
- Keep section IDs and nav anchors stable.
- Preserve accessibility: skip link, menu button ARIA state, focus behavior, reduced-motion support.
- Protect mobile viewport stabilization and `--stable-vh` usage.

## HTML
- Maintain semantic structure (nav > main > section).
- Update metadata and JSON-LD only when public identity or copy changes.
- When adding or removing sections, sync nav links and update alternate docs.

## CSS
- Prefer CSS custom properties and existing scale tokens.
- Extend tokens in :root before introducing new colors or spacing.
- Ensure new motion respects `prefers-reduced-motion`.

## JS
- Do not remove viewport height stabilization or nav toggle logic.
- Keep menu open or close classes and ARIA in sync.
- Gate heavier effects behind reduced-motion or low-end device checks.
