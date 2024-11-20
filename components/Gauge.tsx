import React from 'react';
import { View, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';

interface GaugeProps {
  score: number;
}

export default function Gauge({ score }: GaugeProps) {
    const rotation = useSharedValue(-90);

    React.useEffect(() => {
        const targetRotation = calculateRotation();
        rotation.value = withSpring(targetRotation);
    }, [score]);

    const needleStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            width: 150,
            height: 150,
            top: -5,
            left: 30,
            zIndex: 10,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: `${rotation.value}deg` }]
        };
    });

    const calculateRotation = () => {
      if (score <= 50) {
        // Scale 0-50 to -90 to -30 degrees
        return -90 + ((score / 50) * 60);
      } else if (score <= 100) {
        // Scale 50-100 to -30 to 30 degrees
        return -30 + (((score - 50) / 50) * 60);
      } else {
        // Scale 100+ to 30-90 degrees
        // Cap at 90 degrees for scores above 150
        const maxScore = 150;
        const normalizedScore = Math.min(score, maxScore);
        return 30 + (((normalizedScore - 100) / 50) * 60);
      }
    };

    console.log(score);
  return (
    <View className="items-center justify-center">
      <View 
        style={{
          width: 200,
          height: 100,
          backgroundColor: '#E5E7EB', // gray-200
          borderTopLeftRadius: 100,
          borderTopRightRadius: 100,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <View
          style={{
            width: 50, // Diameter
            height: 320, // Diameter
            borderTopLeftRadius: 25, // Half of width/height to make it circular
            backgroundColor: '#F87171', // red-400, // Rotate to form a 1/6th segment
            borderColor: 'transparent',
            overflow: 'hidden',
            transform: [
              { rotate: '0deg' },
              { translateY: 0 },
              { translateX: 0 }
            ],
          }}
        />
        <View
          style={{
            width: 100, // Diameter
            height: 320, // Diameter
            borderTopLeftRadius: 25, // Half of width/height to make it circular
            backgroundColor: '#4ADE80', // green-400
            borderColor: 'transparent',
            overflow: 'hidden',
            position: 'absolute',
            top: '33%',
            left: '66%',
            transform: [
              { translateX: -80 }, // Half of width to center horizontally
              { translateY: -50 }, // Half of height to center vertically
              { rotate: '0deg' }
            ],
          }}
        />
        <View
          style={{
            width: 50, // Diameter
            height: 320, // Diameter
            borderTopRightRadius: 25, // Half of width/height to make it circular
            backgroundColor: '#A78BFA', // purple-400
            borderColor: 'transparent',
            overflow: 'hidden',
            position: 'absolute',
            top: '33%',
            left: '99%',
            transform: [
              { translateX: -45 }, // Half of width to center horizontally
              { translateY: -50 }, // Half of height to center vertically
              { rotate: '0deg' }
            ],
          }}
        />
        <View 
            style={{
                width: 140, // 180 * 0.8
                height: 80, // 80 * 0.8
                backgroundColor: '#F3F4F6', // gray-100
                borderTopLeftRadius: 80, // Adjusted for new width
                borderTopRightRadius: 80, // Adjusted for new width
                overflow: 'hidden',
                position: 'absolute',
                alignSelf: 'center', // Center the smaller semicircle
                marginTop: 0, // Add some spacing from top to account for size difference
                zIndex: 10, // Ensure it's displayed on top
                top: 20,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#FFFFFF' // white
            }}
        ></View>
        <Animated.View style={needleStyle}>
            <View
            style={{
                width: 5,
                height: 70,
                backgroundColor: '#374151', // gray-700
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: [
                { translateX: -2 }, // Half of width to center
                { translateY: -60 }, // Full height to start from center
                { rotate: `0deg` }
                ],
                borderRadius: 2,
                zIndex: 20,
            }}
            />
            <View
            style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#1F2937', // gray-800
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: [
                { translateX: -5 },
                { translateY: -5 }
                ],
                zIndex: 21,
            }}
            />
        </Animated.View>
        <Text 
          style={{
            position: 'absolute',
            width: '100%',
            left: '0%',
            top: '50%',
            textAlign: 'center',
            fontSize: 42,
            fontWeight: 'bold',
            opacity: 0.2,
            color: '#374151', // gray-700
            zIndex: 40, // Behind needle which has zIndex 20
          }}
        >
          {Math.round(score)}%
        </Text>
        
      </View>
    </View>
  );
}