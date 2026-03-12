import { describe, it, test, expect } from 'vitest';

describe('Test', () => {
    it('Should work', () => {
        expect(1 + 41).toBe(42);
    });
});

test("Test should work", () => {
    expect(42).toBe(42)
})

// Tests with special characters in names (regex escaping)
describe('Special Characters', () => {
    it('does not show Mailed Letter (PDF) when createdModelId missing', () => {
        expect(true).toBe(true);
    });

    it('handles [array] notation in names', () => {
        expect([1, 2, 3]).toHaveLength(3);
    });

    it('works with dots... and more dots...', () => {
        expect('test...').toContain('...');
    });

    it('supports question marks? and asterisks*', () => {
        expect('hello?*').toBeTruthy();
    });

    it('handles {curly} and $dollar signs', () => {
        expect({ a: 1 }).toHaveProperty('a');
    });

    it('pipe | and caret ^ work too', () => {
        expect('a|b').toContain('|');
    });

    test.skip('backslash \\ should be escaped', () => {
        expect('path\\to\\file').toContain('\\');
    });
});
