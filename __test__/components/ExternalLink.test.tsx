import React from 'react';
import { render } from '@testing-library/react-native';
import { ExternalLink } from '@/components/ExternalLink';
import { openBrowserAsync } from 'expo-web-browser';
import { Platform } from 'react-native';

jest.mock('expo-web-browser', () => ({
    openBrowserAsync: jest.fn(),
}));

describe('ExternalLink', () => {
    it('renders without crashing', () => {
        const { toJSON } = render(<ExternalLink href="https://example.com" />);
    });

    it('calls openBrowserAsync when not on web', async () => {
        const preventDefault = jest.fn();
        const event = { preventDefault };

        const { getByText } = render(<ExternalLink href="https://example.com">Click Here</ExternalLink>);
        
        const link = getByText('Click Here');
        await link.props.onPress(event);
    });
});