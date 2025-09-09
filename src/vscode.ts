import * as vscode from "vscode";
import { debugInTermial, runInTerminal } from "./run";

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
