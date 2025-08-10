/**
 * Safe toast utilities to handle dynamic requires and prevent module loading errors
 */
import logger from '@/utils/logger';

let Toast: any = null;

// Initialize toast module safely
const initializeToast = async () => {
  if (Toast) return Toast;
  
  try {
    Toast = require('react-native-root-toast');
    return Toast;
  } catch (error) {
    logger.warn('Toast module not available:', error);
    return null;
  }
};

export const showToast = async (message: string, options: any = {}) => {
  try {
    const ToastModule = await initializeToast();
    if (ToastModule) {
      const defaultOptions = {
        duration: ToastModule.durations?.SHORT || 2000,
        position: ToastModule.positions?.BOTTOM || -80,
      };
      
      ToastModule.show(message, { ...defaultOptions, ...options });
    } else {
      logger.info('Toast fallback:', message);
      // Fallback to console if toast is not available
    }
  } catch (error) {
    logger.warn('Error showing toast:', error);
    logger.info('Toast fallback:', message);
  }
};

export const showErrorToast = async (message: string) => {
  await showToast(message, {
    backgroundColor: '#FF6B6B',
    textColor: '#FFFFFF',
    shadowColor: '#000000',
    opacity: 0.9,
  });
};

export const showSuccessToast = async (message: string) => {
  await showToast(message, {
    backgroundColor: '#4CAF50',
    textColor: '#FFFFFF',
    shadowColor: '#000000', 
    opacity: 0.9,
  });
};
