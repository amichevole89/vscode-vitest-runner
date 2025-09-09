# vscode-vitest-runner

Run a single Vitest case from VS Code, debug it, or loop it N times to hunt flakiness — all from real terminals.

> Forked from [kwai-explore/vscode-vitest-runner](https://github.com/kwai-explore/vscode-vitest-runner)

## Features

- **Run test** at cursor (opens a fresh integrated terminal).
- **Debug test** with Node debugger (integrated terminal).
- **Run ×N (loop)** to detect flaky tests; shows per-run header and a final summary.
- Uses the workspace folder as **cwd** for correct module resolution.

> **Platform:** POSIX shells only (macOS/Linux). Windows PowerShell/CMD not supported in this fork.

## Usage

1. Open a test file in VS Code.
2. Place your cursor in the test you want to run (or select its name).
3. Use the Command Palette and choose:

   - **Vitest Runner: Run**
   - **Vitest Runner: Debug**
   - **Vitest Runner: Run ×N**

4. Each action opens a **new** terminal so runs don’t stomp each other.

## Settings

Add any of these to your workspace settings:

```jsonc
{
  // Extra args to pass to Vitest on every run
  "vitestRunner.extraArgs": ["--pool=threads"],

  // How many iterations for "Run ×N"
  "vitestRunner.loopCount": 20
}
```

### Examples

- Run a single named test with extra args:

  ```jsonc
  { "vitestRunner.extraArgs": ["--reporter=verbose"] }
  ```

## Known limitations

- Windows shells aren’t supported in this fork.
- “Run ×N” uses real terminals; if you start multiple loops, each gets its own terminal.

## Credits

Heavily based on the excellent work in the original
[kwai-explore/vscode-vitest-runner](https://github.com/kwai-explore/vscode-vitest-runner).
