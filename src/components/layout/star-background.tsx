'use client';

import React, { useState, useEffect, useMemo } from 'react';

// Helper function for random number generation (client-side only)
const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const starColors = ['var(--star-color-1)', 'var(--star-color-2)', 'var(--star-color-3)'];

interface StarStyle {
  top: string;
  left: string;
  width: string;
  height: string;
  backgroundColor: string;
  animationDelay: string;
  animationDuration: string;
}

export function StarBackground() {
  const numStars = 150; // Number of stars to generate
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
        const size = randomRange(1, 3); // Star size in px
        styles.push({
          top: `${randomRange(0, 100)}%`, // Use percentage for responsiveness
          left: `${randomRange(0, 100)}%`, // Use percentage for responsiveness
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: starColors[Math.floor(randomRange(0, starColors.length))],
          animationDelay: `${randomRange(0, 5)}s`,
          animationDuration: `${randomRange(3, 8)}s`,
        });
      }
      setStarStyles(styles);
    }
  }, [isClient, numStars]); // Re-run if numStars changes (though it's constant here)


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
