import * as vscode from "vscode";

export class RunVitestCommand implements vscode.Command {
  static ID = "vitest.runTest";
  title = "Run(Vitest)";
  command = RunVitestCommand.ID;
  arguments?: [string, string];

  constructor(text: string, filename: string) {
    this.arguments = [text, filename];
  }
}

export class DebugVitestCommand implements vscode.Command {
  static ID = "vitest.debugTest";
  title = "Debug(Vitest)";
  command = DebugVitestCommand.ID;
  arguments?: [string, string];

  constructor(text: string, filename: string) {
    this.arguments = [text, filename];
  }
}

export class RunFileCommand implements vscode.Command {
  static ID = "vitest.runFile";
  title = "Run File(Vitest)";
  command = RunFileCommand.ID;
  arguments?: [string];

  constructor(filename: string) {
    this.arguments = [filename];
  }
}
