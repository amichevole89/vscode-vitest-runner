# Vitest Runner Optimized

A lightweight VS Code extension for running Vitest tests directly from your editor. Execute, debug, or stress-test individual test cases with a single command.

## Why This Extension?

- **Zero configuration** — works out of the box with any Vitest project
- **Real terminals** — each test runs in its own integrated terminal, no output collision
- **Flaky test detection** — loop a test N times to catch intermittent failures
- **Minimal footprint** — does one thing well without bloat

## Commands

| Command | Description |
|---------|-------------|
| `Vitest Runner: Run` | Execute the test at cursor |
| `Vitest Runner: Debug` | Debug the test with Node inspector |
| `Vitest Runner: Run ×N` | Loop the test multiple times |

Access these via Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) while your cursor is inside a test block.

## Configuration

```jsonc
{
  // Number of iterations for Run ×N (default: 20)
  "vitestRunner.loopCount": 20,

  // Additional arguments passed to Vitest
  "vitestRunner.extraArgs": ["--pool=threads"],

  // Enable FORCE_COLOR=1 environment variable (default: true)
  "vitestRunner.forceColorEnv": true,

  // Append --color flag to Vitest (default: true)
  "vitestRunner.addColorFlag": true
}
```

## Supported Platforms

macOS and Linux only. This extension uses POSIX shell commands and does not support Windows PowerShell or CMD.

## Acknowledgments

This project is a fork of [kwai-explore/vscode-vitest-runner](https://github.com/kwai-explore/vscode-vitest-runner), modified for personal workflow preferences.

## License

MIT
