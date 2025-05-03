'use client';

import React, { useState, useEffect, useMemo } from 'react';

// Helper function for random number generation (client-side only)
const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Use CSS variables for colors defined in globals.css
const starColors = ['var(--star-color-1)', 'var(--star-color-2)', 'var(--star-color-3)'];

interface StarStyle extends React.CSSProperties {
  // Ensure CSS properties are correctly typed if extending React.CSSProperties
  '--star-glow-color'?: string;
}


export function StarBackground() {
  const numStars = 250; // Increased number of stars
  const [starStyles, setStarStyles] = useState<StarStyle[]>([]);
  const [isClient, setIsClient] = useState(false);

   // Ensure this runs only on the client after hydration
   useEffect(() => {
    setIsClient(true);
   }, []);


  // Generate styles only on the client side
  useEffect(() => {
    if (isClient) {
      const styles: StarStyle[] = [];
      for (let i = 0; i < numStars; i++) {
        const size = randomRange(0.5, 2.5); // Adjusted size range (smaller minimum, slightly larger max)
        const color = starColors[Math.floor(randomRange(0, starColors.length))];
        styles.push({
          top: `${randomRange(-10, 110)}%`, // Allow stars slightly off-screen initially for rotation effect
          left: `${randomRange(-10, 110)}%`, // Allow stars slightly off-screen
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          animationDelay: `${randomRange(0, 10)}s`, // Wider range of delays
          animationDuration: `${randomRange(5, 15)}s`, // Wider range of durations
          '--star-glow-color': color.replace('hsl', 'hsla').replace(')', ', 0.4)'), // Add alpha for glow
        });
      }
      setStarStyles(styles);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]); // Re-run only when isClient changes


  // Render stars only on the client to avoid hydration mismatch
  const stars = useMemo(() => {
    if (!isClient) return null; // Don't render server-side

    return starStyles.map((style, index) => (
      <div
        key={index}
        className="star" // Base class with animation-name etc.
        style={style} // Apply dynamic styles inline
      />
    ));
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starStyles, isClient]); // Re-calculate only when styles or isClient changes


  return (
    <div className="star-bg" aria-hidden="true">
      <div className="stars">
        {stars}
      </div>
       {/* Optionally add more layers like shooting stars */}
       {/* <div className="shooting-stars">...</div> */}
    </div>
  );
}