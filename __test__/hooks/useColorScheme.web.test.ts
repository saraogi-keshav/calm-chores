import { useColorScheme } from '../../hooks/useColorScheme.web';

describe('useColorScheme.web', () => {
    test('should always return "light"', () => {
        const result = useColorScheme();
        expect(result).toBe('light');
    });
});