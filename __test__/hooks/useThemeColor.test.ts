import { useThemeColor } from '../../hooks/useThemeColor';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

jest.mock('react-native', () => ({
    useColorScheme: jest.fn(),
}));

jest.mock('@/constants/Colors', () => ({
    Colors: {
        light: {
            text: '#000000',
            background: '#ffffff',
            tint: '#1e90ff',
            icon: '#808080',
            tabIconDefault: '#cccccc',
            tabIconSelected: '#1e90ff',
        },
        dark: {
            text: '#ffffff',
            background: '#000000',
            tint: '#1e90ff',
            icon: '#ffffff',
            tabIconDefault: '#444444',
            tabIconSelected: '#1e90ff',
        },
      },
}));

describe('useThemeColor', () => {
    test('returns light mode color from props when light theme is active', () => {
        (useColorScheme as jest.Mock).mockReturnValue('light');

        const result = useThemeColor({ light: '#123456', dark: '#654321' }, 'text');
        expect(result).toBe('#123456');
    });

    test('returns dark mode color from props when dark theme is active', () => {
        (useColorScheme as jest.Mock).mockReturnValue('dark');

        const result = useThemeColor({ light: '#123456', dark: '#654321' }, 'text');
        expect(result).toBe('#654321');
    });

    test('returns light mode color from Colors when light theme is active and no prop is provided', () => {
        (useColorScheme as jest.Mock).mockReturnValue('light');

        const result = useThemeColor({}, 'text');
        expect(result).toBe(Colors.light.text);
    });

    test('returns dark mode color from Colors when dark theme is active and no prop is provided', () => {
        (useColorScheme as jest.Mock).mockReturnValue('dark');

        const result = useThemeColor({}, 'text');
        expect(result).toBe(Colors.dark.text);
    });

    test('defaults to light theme when useColorScheme returns null', () => {
        (useColorScheme as jest.Mock).mockReturnValue(null);

        const result = useThemeColor({}, 'text');
        expect(result).toBe(Colors.light.text);
    });
});