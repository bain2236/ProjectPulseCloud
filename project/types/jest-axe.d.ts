// Ambient module declaration for jest-axe (ships no .d.ts in v10).
// No top-level imports/exports so this stays a script — declare module
// acts as a global ambient declaration, not a module augmentation.
declare module 'jest-axe' {
  export interface JestAxeResults {
    violations: unknown[];
    [key: string]: unknown;
  }

  export function axe(
    html: Element | string,
    options?: Record<string, unknown>
  ): Promise<JestAxeResults>;

  export function configureAxe(options?: Record<string, unknown>): typeof axe;

  export const toHaveNoViolations: {
    toHaveNoViolations(results: JestAxeResults): { pass: boolean; message(): string };
  };
}
