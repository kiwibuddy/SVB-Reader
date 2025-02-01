import React, { createContext, useContext, useState } from 'react';

type ScrollContextType = {
  setIsScrollingDown: (isScrolling: boolean) => void;
  isScrollingDown: boolean;
};

const ScrollContext = createContext<ScrollContextType>({
  setIsScrollingDown: () => {},
  isScrollingDown: false,
});

export const ScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  return (
    <ScrollContext.Provider value={{ isScrollingDown, setIsScrollingDown }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => useContext(ScrollContext);
