import * as vscode from "vscode";
import { CodeLensProvider } from "./codelens";
import { loadTypescript } from "./utils";
import {
  runInTerminal,
  debugInTerminal,
  runTestLoopCmd,
  runFileInTerminal,
  registerTerminalCloseListener,
} from "./run";

export function activate(context: vscode.ExtensionContext) {
  const typescript = loadTypescript(vscode.env.appRoot);

  if (!typescript) {
    vscode.window.showErrorMessage(
      "Vitest Runner: Failed to load TypeScript. CodeLens features will be disabled."
    );
    // Still register commands so manual invocation works
  } else {
    // Register CodeLens provider
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(
        ["typescript", "javascript", "typescriptreact", "javascriptreact"],
        new CodeLensProvider(typescript)
      )
    );
  }

  // Register terminal cleanup listener
  registerTerminalCloseListener(context);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vitest.runTest",
      (text: string, filename: string) => {
        runInTerminal(text, filename);
      }
    ),

    vscode.commands.registerCommand(
      "vitest.debugTest",
      (text: string, filename: string) => {
        debugInTerminal(text, filename);
      }
    ),

    vscode.commands.registerCommand(
      "vitest.runTestLoop",
      (text: string, filename: string, silent: boolean = false) => {
        runTestLoopCmd(text, filename, silent);
      }
    ),

    vscode.commands.registerCommand("vitest.runFile", (filename: string) => {
      // If called from command palette, use active editor
      const file = filename || vscode.window.activeTextEditor?.document.fileName;
      if (file) {
        runFileInTerminal(file);
      } else {
        vscode.window.showErrorMessage("Vitest Runner: No file to run");
      }
    })
  );
}

export function deactivate() {
  // Cleanup handled by VS Code disposing subscriptions
}
