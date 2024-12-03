import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedView } from '../../components/ThemedView';

describe('ThemedView', () => {
    it('renders correctly with default props', () => {
        const { toJSON } = render(<ThemedView />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('applies custom lightColor and darkColor', () => {
        const { toJSON } = render(
        <ThemedView lightColor="#ffffff" darkColor="#000000" />
        );
        expect(toJSON()).toMatchSnapshot();
    });

    it('applies custom styles', () => {
        const { toJSON } = render(<ThemedView style={{ padding: 10 }} />);
        expect(toJSON()).toMatchSnapshot();
    });
});