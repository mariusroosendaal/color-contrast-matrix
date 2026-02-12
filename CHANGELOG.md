# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- **Variable mode support** — Dropdown to select light/dark (or other) mode when collections have multiple modes. Matrix resolves colors for the selected mode.
- **Settings modal** — Display options (AAA, AA, AA Large, DNP, full name) and base color moved into a settings panel. Opens from gear icon in footer. Bottom sheet layout with Save and Cancel.
- **Settings persistence** — Display options and base color persist via `figma.clientStorage` across sessions.

### Changed

- **UI** — Updated to Figma UI3 using figma-ui3-kit-svelte.
- **Loading state** — Shows only loading indicator while fetching variables; other UI hidden until ready.
- **Empty state** — Shows helpful message when no color variables exist instead of empty checkboxes.
