// src/run.ts
import * as vscode from "vscode";
import * as path from "path";

function cwdFor(filename: string): string {
  const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filename));
  return folder?.uri.fsPath ?? path.dirname(filename);
}

function baseName(p: string) {
  try {
    return path.basename(p);
  } catch {
    return p;
  }
}

let runSeq = 0;
function singleRunTerminalName(filename: string, testName: string) {
  const base = baseName(filename);
  const short = testName.length > 60 ? testName.slice(0, 57) + "…" : testName;
  runSeq += 1;
  return `Vitest • ${base} • ${short} #${runSeq}`;
}

let loopSeq = 0;
function loopTerminalName(filename: string, testName: string) {
  const base = baseName(filename);
  const short = testName.length > 60 ? testName.slice(0, 57) + "…" : testName;
  loopSeq += 1;
  return `Vitest ×N • ${base} • ${short} #${loopSeq}`;
}

/** Tiny POSIX single-quote escaper */
function shQ(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
/** Quote each arg for POSIX sh; keep flags like --foo unquoted */
function shQuoteArg(a: string): string {
  if (/^[A-Za-z0-9_\-./:=@+]+$/.test(a)) return a;
  return shQ(a);
}
function shJoin(args: string[]): string {
  return args.map(shQuoteArg).join(" ");
}

function argsFor(filename: string, testName: string, extra: string[] = []) {
  return ["vitest", "run", filename, "-t", testName, ...extra];
}

function ensureColorArgs(base: string[]): string[] {
  // Keep colors unless user explicitly disables
  if (base.some((a) => a === "--color" || a === "--no-color")) return base;
  return [...base, "--color"];
}

function createTerminal(name: string, cwd: string) {
  return vscode.window.createTerminal({ name, cwd });
}

// --------------------- Public API ---------------------

export function runInTerminal(testName: string, filename: string) {
  const cfg = vscode.workspace.getConfiguration("vitestRunner");
  const extraArgs = cfg.get<string[]>("extraArgs", []);
  const cwd = cwdFor(filename);

  const args = ensureColorArgs(argsFor(filename, testName, extraArgs));
  const term = createTerminal(singleRunTerminalName(filename, testName), cwd);
  term.show(true);

  // POSIX only
  const cmd = `cd ${shQ(cwd)} && npx ${shJoin(args)}`;
  term.sendText(cmd, true);
}

export function debugInTermial(testName: string, filename: string) {
  const cfg = vscode.workspace.getConfiguration("vitestRunner");
  const extraArgs = cfg.get<string[]>("extraArgs", []);
  const cwd = cwdFor(filename);

  const config: vscode.DebugConfiguration = {
    name: "Debug Vitest Case",
    request: "launch",
    runtimeExecutable: "npx",
    runtimeArgs: ensureColorArgs(argsFor(filename, testName, extraArgs)),
    cwd,
    type: "pwa-node",
    console: "integratedTerminal",
    internalConsoleOptions: "neverOpen",
    skipFiles: ["<node_internals>/**"],
  };
  vscode.debug.startDebugging(undefined, config);
}

/**
 * Loop runner: NEW terminal every time.
 * Single Cmd/Ctrl+C aborts the WHOLE loop (silent or not),
 * then prints a partial summary.
 */
export function runTestLoopCmd(
  testName: string,
  filename: string,
  silent = false
) {
  const cfg = vscode.workspace.getConfiguration("vitestRunner");
  const count = cfg.get<number>("loopCount", 20);
  const extraArgs = cfg.get<string[]>("extraArgs", []);
  const cwd = cwdFor(filename);

  const name = loopTerminalName(filename, testName);
  const term = createTerminal(name, cwd);
  term.show(true);

  const baseArgs = ensureColorArgs(argsFor(filename, testName, extraArgs));
  const redir = silent ? " > /dev/null 2>&1" : "";
  const header = silent ? ":" : `echo ""; echo "--- Run $i/${count} ---"`;

  // Detect child killed by signal: exit status >=128 -> abort loop
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
