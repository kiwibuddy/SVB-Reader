import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  error?: Error;
}

export default function ErrorBoundary({ error }: Props) {
  console.error('ErrorBoundary caught:', error);
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Something went wrong!</Text>
      <Text>{error?.message}</Text>
    </View>
  );
} 