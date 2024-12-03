// Color.test.ts
import { Colors } from '../../constants/Colors';

describe('Colors', () => {
    it('should have light mode colors', () => {
        const lightColors = Colors.light;
        expect(lightColors).toHaveProperty('text', '#11181C');
        expect(lightColors).toHaveProperty('background', '#fff');
        expect(lightColors).toHaveProperty('tint', '#0a7ea4');
        expect(lightColors).toHaveProperty('icon', '#687076');
        expect(lightColors).toHaveProperty('tabIconDefault', '#687076');
        expect(lightColors).toHaveProperty('tabIconSelected', '#0a7ea4');
    });

    it('should have dark mode colors', () => {
        const darkColors = Colors.dark;
        expect(darkColors).toHaveProperty('text', '#ECEDEE');
        expect(darkColors).toHaveProperty('background', '#151718');
        expect(darkColors).toHaveProperty('tint', '#fff');
        expect(darkColors).toHaveProperty('icon', '#9BA1A6');
        expect(darkColors).toHaveProperty('tabIconDefault', '#9BA1A6');
        expect(darkColors).toHaveProperty('tabIconSelected', '#fff');
    });
});