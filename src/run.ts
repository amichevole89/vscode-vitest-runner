import * as vscode from "vscode";

function buildVitestCommand(filename: string, testName: string): string {
  const filenameArg = JSON.stringify(filename);
  const testNameArg = JSON.stringify(testName);
  return `npx vitest run ${filenameArg} -t ${testNameArg}`;
}

function buildDebugConfig(
  filename: string,
  testName: string
): vscode.DebugConfiguration {
  return {
    name: "Debug Vitest Case",
    request: "launch",
    runtimeArgs: ["vitest", "run", filename, "-t", testName],
    cwd: vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filename))?.uri
      .fsPath,
    runtimeExecutable: "npx",
    skipFiles: ["<node_internals>/**"],
    type: "pwa-node",
    console: "integratedTerminal",
    internalConsoleOptions: "neverOpen",
  };
}

export function runInTerminal(testName: string, filename: string) {
  const terminal = vscode.window.createTerminal(`vitest - ${testName}`);
  const command = buildVitestCommand(filename, testName);
  terminal.sendText(command, true);
  terminal.show();
}

export function debugInTermial(testName: string, filename: string) {
  const config = buildDebugConfig(filename, testName);
  vscode.debug.startDebugging(undefined, config);
}
