import { describe, it, test, expect } from 'vitest';

describe('Test', () => {
    it('Should work', () => {
        expect(1 + 41).toBe(42);
    });
});

test("Should work with tsx/jsx", () => {
    const React = {
        createElement() {
            return {}
        }
    };

    expect(<></>).toBeTruthy();
})

// Tests with special characters (TSX)
describe('Component Tests (TSX)', () => {
    it('renders <Button /> component correctly', () => {
        expect(true).toBe(true);
    });

    it('shows error message (required field) when empty', () => {
        expect('required').toBeTruthy();
    });

    it('handles onClick={() => void} callback', () => {
        const fn = () => {};
        expect(fn).toBeDefined();
    });
});
