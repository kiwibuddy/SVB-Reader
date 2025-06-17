export interface ColorScheme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  bubbles: {
    [key: string]: string;
    default: string;
    red: string;
    blue: string;
    green: string;
    black: string;
  };
  card: string;
  border: string;
} 