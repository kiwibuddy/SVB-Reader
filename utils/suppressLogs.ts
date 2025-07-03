// Utility to suppress specific console logs
const originalConsoleLog = console.log;

// Override console.log to filter out specific messages
console.log = (...args: any[]) => {
  const message = args.join(' ');
  
  // Suppress image source logs
  if (message.includes('Book:') && message.includes('Image source:')) {
    return;
  }
  
  // Suppress other common debug logs
  if (message.includes('LOG') && (message.includes('Book:') || message.includes('Image source:'))) {
    return;
  }
  
  // Allow all other logs
  originalConsoleLog(...args);
};

export const suppressImageLogs = () => {
  // This function can be called to ensure logs are suppressed
  // It's already done at module load time
}; 