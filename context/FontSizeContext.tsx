import React, { createContext, useContext, useState } from 'react';

export type FontSize = 'small' | 'medium' | 'large';

// Define standard text sizes for different text roles
export interface TextSizes {
  title: number;      // Large headers
  subtitle: number;   // Secondary headers
  body: number;       // Main text content
  caption: number;    // Smaller informational text
  button: number;     // Button text
  navigation: number; // Navigation text
}

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  getTextSize: (baseSize: number) => number;
  sizes: TextSizes;
}

export const baseSizes: TextSizes = {
  title: 24,
  subtitle: 18,
  body: 16,
  caption: 14,
  button: 16,
  navigation: 16,
};

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FontSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSize] = useState<FontSize>('medium');

  const getTextSize = (baseSize: number): number => {
    switch(fontSize) {
      case 'small': return baseSize - 2;
      case 'large': return baseSize + 2;
      default: return baseSize;
    }
  };

  const sizes: TextSizes = {
    title: getTextSize(baseSizes.title),
    subtitle: getTextSize(baseSizes.subtitle),
    body: getTextSize(baseSizes.body),
    caption: getTextSize(baseSizes.caption),
    button: getTextSize(baseSizes.button),
    navigation: getTextSize(baseSizes.navigation),
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, getTextSize, sizes }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}; 