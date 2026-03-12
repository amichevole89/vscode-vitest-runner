import type * as ts from "typescript";
import * as vscode from "vscode";
import { TextCase } from "./types";
import { RunVitestCommand, DebugVitestCommand, RunFileCommand } from "./vscode";

// Base test function names
const testFunctions = new Set(["it", "describe", "test"]);

// Modifiers that can be chained (it.only, test.skip, etc.)
const testModifiers = new Set(["only", "skip", "todo", "concurrent", "sequential"]);

// Special methods that take different argument patterns
const parameterizedMethods = new Set(["each"]);

/**
 * Check if this is a test function call like:
 * - it("name", fn)
 * - test.only("name", fn)
 * - describe.skip("name", fn)
 * - it.each([...])("name", fn)
 */
function tryGetVitestTestCase(
  typescript: typeof ts,
  callExpression: ts.CallExpression,
  file: ts.SourceFile
): TextCase | undefined {
  const expr = callExpression.expression;

  // Handle simple calls: it("name", fn)
  if (typescript.isIdentifier(expr)) {
    if (!testFunctions.has(expr.text)) {
      return undefined;
    }
    return extractTestCase(typescript, callExpression, file);
  }

  // Handle chained calls: it.only("name", fn), test.skip("name", fn)
  if (typescript.isPropertyAccessExpression(expr)) {
    const { expression, name } = expr;

    // it.only() or test.skip() pattern
    if (typescript.isIdentifier(expression) && testFunctions.has(expression.text)) {
      if (testModifiers.has(name.text)) {
        return extractTestCase(typescript, callExpression, file);
      }
    }

    // it.each([...])("name", fn) pattern - the call we see is the ("name", fn) part
    // The expression is the result of it.each([...])
    if (typescript.isCallExpression(expression)) {
      const innerExpr = expression.expression;
      if (typescript.isPropertyAccessExpression(innerExpr)) {
        const base = innerExpr.expression;
        const method = innerExpr.name;
        if (
          typescript.isIdentifier(base) &&
          testFunctions.has(base.text) &&
          parameterizedMethods.has(method.text)
        ) {
          return extractTestCase(typescript, callExpression, file);
        }
      }
    }
  }

  // Handle deeper chaining: it.concurrent.each([...])("name", fn)
  if (typescript.isCallExpression(expr)) {
    const innerExpr = expr.expression;
    if (typescript.isPropertyAccessExpression(innerExpr)) {
      // Check for patterns like it.concurrent.each
      return checkDeepChain(typescript, innerExpr, callExpression, file);
    }
  }

  return undefined;
}

/**
 * Check deeply chained patterns like it.concurrent.each
 */
function checkDeepChain(
  typescript: typeof ts,
  propAccess: ts.PropertyAccessExpression,
  callExpression: ts.CallExpression,
  file: ts.SourceFile
): TextCase | undefined {
  const method = propAccess.name.text;
  if (!parameterizedMethods.has(method) && !testModifiers.has(method)) {
    return undefined;
  }

  // Walk up the chain to find the base test function
  let current: ts.Expression = propAccess.expression;
  while (typescript.isPropertyAccessExpression(current)) {
    current = current.expression;
  }

  if (typescript.isIdentifier(current) && testFunctions.has(current.text)) {
    return extractTestCase(typescript, callExpression, file);
  }

  return undefined;
}

/**
 * Extract test name from a call expression's arguments
 */
function extractTestCase(
  typescript: typeof ts,
  callExpression: ts.CallExpression,
  file: ts.SourceFile
): TextCase | undefined {
  const args = callExpression.arguments;
  if (args.length < 2) return undefined;

  const [testName, body] = args;

  // Test name must be a string literal
  if (!typescript.isStringLiteralLike(testName)) {
    return undefined;
  }

  // Second argument should be function-like (the test body)
  if (!typescript.isFunctionLike(body)) {
    return undefined;
  }

  return {
    start: testName.getStart(file),
    end: testName.getEnd(),
    text: testName.text,
  };
}

export class CodeLensProvider implements vscode.CodeLensProvider {
  constructor(private typescript: typeof ts) {}

  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const ts = this.typescript;
    const config = vscode.workspace.getConfiguration("vitestRunner");
    const loopCount = config.get<number>("loopCount", 20);

    const text = document.getText();
    const sourceFile = ts.createSourceFile(
      document.fileName,
      text,
      ts.ScriptTarget.Latest,
      true
    );

    const testCases: TextCase[] = [];
    const lenses: vscode.CodeLens[] = [];

    // Add "Run File" lens at the top of the file if it contains tests
    const runFileLens = new vscode.CodeLens(
      new vscode.Range(0, 0, 0, 0),
      new RunFileCommand(document.fileName)
    );

    visitor(sourceFile);

    // Only add the file lens if we found tests
    if (testCases.length > 0) {
      lenses.push(runFileLens);
    }

    // Add lenses for each test case
    for (const testCase of testCases) {
      if (token.isCancellationRequested) break;

      const start = document.positionAt(testCase.start);
      const end = document.positionAt(testCase.end);
      const range = new vscode.Range(start, end);

      lenses.push(
        new vscode.CodeLens(range, new RunVitestCommand(testCase.text, document.fileName)),
        new vscode.CodeLens(range, new DebugVitestCommand(testCase.text, document.fileName)),
        new vscode.CodeLens(range, {
          title: `Run(×${loopCount})`,
          command: "vitest.runTestLoop",
          arguments: [testCase.text, document.fileName, false],
        })
      );
    }

    return lenses;

    function visitor(node: ts.Node) {
      if (token.isCancellationRequested) return;

      if (ts.isCallExpression(node)) {
        const testCase = tryGetVitestTestCase(ts, node, sourceFile);
        if (testCase) {
          testCases.push(testCase);
        }
      }

      ts.forEachChild(node, visitor);
    }
  }
}
