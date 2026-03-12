import * as path from "path";
import * as fs from "fs";

/**
 * Get the path to VS Code's built-in TypeScript installation.
 * Falls back to alternative paths if the primary doesn't exist.
 */
export function getVscodeTypescriptPath(appRoot: string): string {
  const possiblePaths = [
    // VS Code 1.74+ location
    path.join(appRoot, "extensions", "node_modules", "typescript", "lib", "typescript.js"),
    // Older VS Code location
    path.join(appRoot, "extensions", "typescript-language-features", "node_modules", "typescript", "lib", "typescript.js"),
    // Insiders/alternative location
    path.join(appRoot, "extensions", "typescript-basics", "node_modules", "typescript", "lib", "typescript.js"),
  ];

  for (const tsPath of possiblePaths) {
    if (fs.existsSync(tsPath)) {
      return tsPath;
    }
  }

  // Fallback: try to require typescript from node_modules
  // This allows the extension to work if typescript is installed locally
  try {
    return require.resolve("typescript");
  } catch {
    // Return the first path and let the caller handle the error
    return possiblePaths[0];
  }
}

/**
 * Load TypeScript with proper error handling
 */
export function loadTypescript(appRoot: string): typeof import("typescript") | null {
  try {
    const tsPath = getVscodeTypescriptPath(appRoot);
    return require(tsPath);
  } catch (err) {
    console.error("Failed to load TypeScript:", err);
    return null;
  }
}
