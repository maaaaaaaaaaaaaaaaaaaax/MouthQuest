import React from 'react';
import Svg, { Ellipse, Circle, Path, Line, Rect } from 'react-native-svg';

export default function MouthQuestLogo({ size = 80 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Outer plate ring */}
      <Ellipse cx="50" cy="62" rx="22" ry="24" fill="none" stroke="#F97316" strokeWidth="1.5" opacity="0.7" />
      {/* Inner plate fill */}
      <Ellipse cx="50" cy="62" rx="16" ry="17" fill="#FEE2E2" opacity="0.3" />

      {/* Fork — three tines */}
      <Line x1="17" y1="48" x2="17" y2="57" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="20" y1="48" x2="20" y2="57" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="23" y1="48" x2="23" y2="57" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      {/* Fork stem */}
      <Line x1="20" y1="48" x2="20" y2="75" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />

      {/* Knife stem */}
      <Line x1="80" y1="48" x2="80" y2="75" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      {/* Knife blade */}
      <Rect x="78" y="48" width="4" height="9" fill="#EF4444" />

      {/* Pin drop 1 — faint */}
      <Path d="M50 18 C46 18 43 21 43 25 C43 29 50 38 50 38 C50 38 57 29 57 25 C57 21 54 18 50 18 Z" fill="#EF4444" opacity="0.3" />
      {/* Pin drop 2 — medium */}
      <Path d="M50 28 C46 28 43 31 43 35 C43 39 50 48 50 48 C50 48 57 39 57 35 C57 31 54 28 50 28 Z" fill="#EF4444" opacity="0.6" />
      {/* Pin drop 3 — solid */}
      <Path d="M50 38 C46 38 43 41 43 45 C43 49 50 58 50 58 C50 58 57 49 57 45 C57 41 54 38 50 38 Z" fill="#EF4444" />
      {/* Pin circle */}
      <Circle cx="50" cy="45" r="3" fill="white" />
    </Svg>
  );
}
