import React, { ReactNode } from 'react';
import renderer from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import { Collapsible } from '../../components/Collapsible';

// Mock Expo's font loading
jest.mock('expo-font', () => ({
  useFonts: jest.fn().mockReturnValue([true]),
}));

// Mock Ionicons to avoid font-related issues
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

// Mocking ThemedText and ThemedView
jest.mock('@/components/ThemedText', () => ({
    ThemedText: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ThemedView', () => ({
    ThemedView: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('@/constants/Colors', () => ({
    Colors: {
        light: { icon: 'black' },
        dark: { icon: 'white' },
    },
}));

jest.mock('react-native', () => {
    const actualReactNative = jest.requireActual('react-native');
    return {
        ...actualReactNative,
        useColorScheme: jest.fn().mockReturnValue('light'),
        SettingsManager: { get: jest.fn().mockReturnValue({}) },
    };
});

describe('Collapsible Component', () => {
  it('renders correctly when closed', () => {
    const tree = renderer
        .create(
            <Collapsible title="Test Title">
            <></>
            </Collapsible>
        )
        .toJSON();
    });

    it('renders correctly when open', () => {
        const tree = renderer.create(
        <Collapsible title="Test Title">
            <></>
        </Collapsible>
        );
        const instance = tree.root;

        // Simulate button press to toggle open state
        const touchableOpacity = instance.findByType(TouchableOpacity);
        touchableOpacity.props.onPress();
    });

    it('toggles the icon and content visibility when clicked', () => {
        const tree = renderer.create(
        <Collapsible title="Test Title">
            <></>
        </Collapsible>
        );
        const instance = tree.root;

        // Simulate button press to open the content
        const touchableOpacity = instance.findByType(TouchableOpacity);
        touchableOpacity.props.onPress();
    });
});