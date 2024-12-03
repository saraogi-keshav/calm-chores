import React from 'react';
import { render } from '@testing-library/react-native';
import { HelloWave } from '../../components/HelloWave';

describe('Gauge', () => {
    it('renders without crashing', () => {
        const { toJSON } = render(<HelloWave />);
    });
});