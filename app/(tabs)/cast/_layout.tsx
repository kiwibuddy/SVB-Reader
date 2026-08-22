import { Stack } from 'expo-router';

export default function CastLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[voice]"
        getId={({ params }) => String(params?.voice ?? '')}
      />
    </Stack>
  );
}
