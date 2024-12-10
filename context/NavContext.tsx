import React, { createContext, useContext, useState } from "react";
import { ReactNode } from 'react';

// Define the context value type
interface ModalContextType {
  modalVisible: boolean;
  toggleModal: () => void;
}

// Update the context creation to use the correct type
const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible((prev) => !prev);
  };

  const value = { modalVisible, toggleModal }; // Create a value object
  return (
    <ModalContext.Provider value={value as ModalContextType}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
