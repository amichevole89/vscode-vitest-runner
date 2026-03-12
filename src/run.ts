// src/run.ts
import * as vscode from "vscode";
import * as path from "path";

// --------------------- Configuration ---------------------

interface VitestConfig {
  loopCount: number;
  extraArgs: string[];
  forceColorEnv: boolean;
  addColorFlag: boolean;
}

function getConfig(): VitestConfig {
  const cfg = vscode.workspace.getConfiguration("vitestRunner");
  return {
    loopCount: cfg.get<number>("loopCount", 20),
    extraArgs: cfg.get<string[]>("extraArgs", []),
    forceColorEnv: cfg.get<boolean>("forceColorEnv", true),
    addColorFlag: cfg.get<boolean>("addColorFlag", true),
  };
}

// --------------------- Path Utilities ---------------------

function cwdFor(filename: string): string {
  const folder = vscode.workspace.getWorkspaceFolder(
    vscode.Uri.file(filename)
  );
  return folder?.uri.fsPath ?? path.dirname(filename);
}

function baseName(p: string): string {
  try {
    return path.basename(p);
  } catch {
    return p;
  }
}

// --------------------- Terminal Management ---------------------

const terminalMap = new Map<string, vscode.Terminal>();
let runSeq = 0;
let loopSeq = 0;

function cleanupDisposedTerminals(): void {
  for (const [key, term] of terminalMap) {
    if (term.exitStatus !== undefined) {
      terminalMap.delete(key);
    }
  }
}

function singleRunTerminalName(filename: string, testName: string): string {
  const base = baseName(filename);
  const short = testName.length > 60 ? testName.slice(0, 57) + "…" : testName;
  runSeq += 1;
  return `Vitest • ${base} • ${short} #${runSeq}`;
}

function loopTerminalName(filename: string, testName: string): string {
  const base = baseName(filename);
  const short = testName.length > 60 ? testName.slice(0, 57) + "…" : testName;
  loopSeq += 1;
  return `Vitest ×N • ${base} • ${short} #${loopSeq}`;
}

function fileTerminalName(filename: string): string {
  const base = baseName(filename);
  return `Vitest • ${base} (all)`;
}

function createTerminal(
  name: string,
  cwd: string,
  config: VitestConfig
): vscode.Terminal {
  const env: Record<string, string> = {};
  if (config.forceColorEnv) {
    env["FORCE_COLOR"] = "1";
  }

  return vscode.window.createTerminal({
    name,
    cwd,
    env,
  });
}

function getOrCreateTerminal(
  key: string,
  name: string,
  cwd: string,
  config: VitestConfig,
  forceNew = false
): vscode.Terminal {
  cleanupDisposedTerminals();

  if (!forceNew && terminalMap.has(key)) {
    const existing = terminalMap.get(key)!;
    if (existing.exitStatus === undefined) {
      return existing;
    }
  }

  const term = createTerminal(name, cwd, config);
  terminalMap.set(key, term);
  return term;
}

// --------------------- Shell Utilities (POSIX) ---------------------

/** Tiny POSIX single-quote escaper */
function shQ(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** Quote each arg for POSIX sh; keep safe args unquoted */
function shQuoteArg(a: string): string {
  if (/^[A-Za-z0-9_\-./:=@+]+$/.test(a)) return a;
  return shQ(a);
}

function shJoin(args: string[]): string {
  return args.map(shQuoteArg).join(" ");
}

// --------------------- Command Building ---------------------

/** Escape regex special characters so test names are matched literally */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function argsFor(
  filename: string,
  testName: string | null,
  extra: string[] = []
): string[] {
  const args = ["vitest", "run", filename];
  if (testName) {
    args.push("-t", escapeRegex(testName));
  }
  return [...args, ...extra];
}

function applyColorArgs(base: string[], config: VitestConfig): string[] {
  if (!config.addColorFlag) return base;
  if (base.some((a) => a === "--color" || a === "--no-color")) return base;
  return [...base, "--color"];
}

// --------------------- Error Handling ---------------------

function showError(message: string): void {
  vscode.window.showErrorMessage(`Vitest Runner: ${message}`);
}

function validateInputs(testName: string | null, filename: string): boolean {
  if (!filename) {
    showError("No file specified");
    return false;
  }
  return true;
}

// --------------------- Public API ---------------------

export function runInTerminal(testName: string, filename: string): void {
  if (!validateInputs(testName, filename)) return;

  const config = getConfig();
  const cwd = cwdFor(filename);
  const name = singleRunTerminalName(filename, testName);

  const args = applyColorArgs(argsFor(filename, testName, config.extraArgs), config);
  const term = createTerminal(name, cwd, config);

  term.show(true);
  const cmd = `cd ${shQ(cwd)} && npx ${shJoin(args)}`;
  term.sendText(cmd, true);
}

export function runFileInTerminal(filename: string): void {
  if (!validateInputs(null, filename)) return;

  const config = getConfig();
  const cwd = cwdFor(filename);
  const key = `file:${filename}`;
  const name = fileTerminalName(filename);

  const args = applyColorArgs(argsFor(filename, null, config.extraArgs), config);
  const term = getOrCreateTerminal(key, name, cwd, config);

  term.show(true);
  const cmd = `cd ${shQ(cwd)} && npx ${shJoin(args)}`;
  term.sendText(cmd, true);
}

export function debugInTerminal(testName: string, filename: string): void {
  if (!validateInputs(testName, filename)) return;

  const config = getConfig();
  const cwd = cwdFor(filename);
  const args = applyColorArgs(argsFor(filename, testName, config.extraArgs), config);

  const env: Record<string, string> = {};
  if (config.forceColorEnv) {
    env["FORCE_COLOR"] = "1";
  }

  const debugConfig: vscode.DebugConfiguration = {
    name: "Debug Vitest Case",
    request: "launch",
    runtimeExecutable: "npx",
    runtimeArgs: args,
    cwd,
    type: "pwa-node",
    console: "integratedTerminal",
    internalConsoleOptions: "neverOpen",
    skipFiles: ["<node_internals>/**"],
    env,
  };

  vscode.debug.startDebugging(undefined, debugConfig).then(
    (started) => {
      if (!started) {
        showError("Failed to start debug session");
      }
    },
    (err) => {
      showError(`Debug error: ${err.message || err}`);
    }
  );
}

/**
 * Loop runner: runs a test N times in a fresh terminal.
 * Single Ctrl+C aborts the whole loop and prints a partial summary.
 */
export function runTestLoopCmd(
  testName: string,
  filename: string,
  silent = false
): void {
  if (!validateInputs(testName, filename)) return;

  const config = getConfig();
  const count = config.loopCount;
  const cwd = cwdFor(filename);

  const name = loopTerminalName(filename, testName);
  const term = createTerminal(name, cwd, config);
  term.show(true);

  const baseArgs = applyColorArgs(argsFor(filename, testName, config.extraArgs), config);
  const redir = silent ? " > /dev/null 2>&1" : "";
  const header = silent ? ":" : `echo ""; echo "--- Run $i/${count} ---"`;

  const cmdCore = `npx ${shJoin(baseArgs)}${redir}`;
  const sh = `
cd ${shQ(cwd)}
passes=0
fails=0
i=1
while [ $i -le ${count} ]; do
  ${header}
  ${cmdCore}
  code=$?
  if [ $code -ge 128 ]; then
    echo ""
    echo "⛔ Aborted at run $i (exit $code)"
    break
  fi
  if [ $code -eq 0 ]; then
    passes=$((passes+1))
  else
    fails=$((fails+1))
  fi
  i=$((i+1))
done
echo ""
echo "Summary:" $passes "pass /" $fails "fail"
`.trim();

  term.sendText(sh, true);
}

// --------------------- Terminal Cleanup Listener ---------------------

export function registerTerminalCloseListener(
  context: vscode.ExtensionContext
): void {
  context.subscriptions.push(
    vscode.window.onDidCloseTerminal((terminal) => {
      for (const [key, term] of terminalMap) {
        if (term === terminal) {
          terminalMap.delete(key);
          break;
        }
      }
    })
  );
}
