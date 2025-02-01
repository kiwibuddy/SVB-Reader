import React, { createContext, useContext } from 'react';
import { Animated } from 'react-native';

type BottomNavContextType = {
  isVisible: Animated.Value;
};

const BottomNavContext = createContext<BottomNavContextType>({
  isVisible: new Animated.Value(1)
});

export const BottomNavProvider = ({ children }: { children: React.ReactNode }) => {
  const isVisible = new Animated.Value(1);

  return (
    <BottomNavContext.Provider value={{ isVisible }}>
      {children}
    </BottomNavContext.Provider>
  );
};

export const useBottomNavAnimation = () => useContext(BottomNavContext); 