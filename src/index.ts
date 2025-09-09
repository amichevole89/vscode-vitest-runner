import * as vscode from "vscode";
import { CodeLensProvider } from "./codelens";
import { getVscodeTypescriptPath } from "./utils";
import { runInTerminal, debugInTermial, runTestLoopCmd } from "./run";

export function activate(context: vscode.ExtensionContext) {
  const tsPath = getVscodeTypescriptPath(vscode.env.appRoot);
  const typescript = require(tsPath);

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      ["typescript", "javascript", "typescriptreact", "javascriptreact"],
      new CodeLensProvider(typescript)
    ),

    vscode.commands.registerCommand(
      "vitest.runTest",
      (text: string, filename: string) => {
        runInTerminal(text, filename);
      }
    ),

    vscode.commands.registerCommand(
      "vitest.debugTest",
      (text: string, filename: string) => {
        debugInTermial(text, filename);
      }
    ),

    vscode.commands.registerCommand(
      "vitest.runTestLoop",
      (text: string, filename: string) => {
        runTestLoopCmd(text, filename, false);
      }
    )
  );
}
