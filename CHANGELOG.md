# Changelog

All notable changes to Vitest Runner Optimized will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-03-12

### Fixed

- Test names containing regex special characters (parentheses, brackets, etc.) now work correctly
  - Previously, tests like `it("does not show Mailed Letter (PDF)")` would be skipped because `(PDF)` was interpreted as a regex capture group
  - Special characters are now escaped before being passed to Vitest's `-t` flag

## [0.2.0] - 2025-03-11

### Added

- "Run File" CodeLens at the top of test files to run all tests in the file
- Configurable loop count displayed in CodeLens button (`Run(×N)`)

### Changed

- Improved terminal naming with test name preview and sequence numbers
- Refactored codebase for better maintainability

## [0.1.0] - 2025-03-10

### Added

- Run individual Vitest tests from CodeLens
- Debug tests with Node inspector
- Loop tests N times to detect flaky tests
- Configurable extra arguments for Vitest
- FORCE_COLOR environment variable support
- Automatic --color flag option
