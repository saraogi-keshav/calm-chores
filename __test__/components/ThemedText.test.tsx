import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../../components/ThemedText';

describe('ThemedText', () => {
    it('renders correctly with default type', () => {
        const { toJSON } = render(<ThemedText>Test Default</ThemedText>);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correctly with title type', () => {
        const { toJSON } = render(<ThemedText type="title">Test Title</ThemedText>);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correctly with defaultSemiBold type', () => {
        const { toJSON } = render(<ThemedText type="defaultSemiBold">Test DefaultSemiBold</ThemedText>);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correctly with subtitle type', () => {
        const { toJSON } = render(<ThemedText type="subtitle">Test Subtitle</ThemedText>);
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correctly with link type', () => {
        const { toJSON } = render(<ThemedText type="link">Test Link</ThemedText>);
        expect(toJSON()).toMatchSnapshot();
    });

    it('applies custom light and dark colors', () => {
        const { toJSON } = render(<ThemedText lightColor="#fff" darkColor="#000">Test Light and Dark</ThemedText>);
        expect(toJSON()).toMatchSnapshot();
    });
});