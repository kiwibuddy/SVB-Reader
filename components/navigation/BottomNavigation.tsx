import React from "react";
import { View, Text, Pressable, StyleSheet, Animated, useWindowDimensions } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSettings } from '@/context/AppSettingsContext';
import { isLargeScreen, isLandscape } from '@/constants/sizes';

declare global {
  let handleBottomNavScroll: ((event: any) => void) | undefined;
}

interface BottomNavigationProps {
  isHome?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ isHome }) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [isVisible] = React.useState(new Animated.Value(1));
  const lastScrollY = React.useRef(0);
  const { colors } = useAppSettings();

  // Hide navigation on large screens or in landscape mode
  const shouldHideNavigation = isLargeScreen || (isLandscape && height < 500);

  const handleScroll = React.useCallback((event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    
    // iOS-style navigation bar behavior
    if (currentOffset <= 100) {
      // Show when near top
      Animated.spring(isVisible, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8
      }).start();
    } else if (currentOffset > lastScrollY.current + 20 && currentOffset > 100) {
      // Hide when scrolling down with momentum
      Animated.spring(isVisible, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8
      }).start();
    } else if (currentOffset < lastScrollY.current - 10) {
      // Show when scrolling up (more sensitive)
      Animated.spring(isVisible, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 8
      }).start();
    }
    
    lastScrollY.current = currentOffset;
  }, [isVisible]);

  // Pass this handleScroll function to each ScrollView in your app
  React.useEffect(() => {
    if (isHome) return;
    
    // Ensure navigation starts visible on segment pages
    if (pathname.includes('segment') || pathname.startsWith('/S') || pathname.startsWith('/I')) {
      isVisible.setValue(1);
    }
    
    // You can expose the handleScroll function to other components
    if (global) {
      global.handleBottomNavScroll = handleScroll;
    }

    return () => {
      if (global) {
        delete global.handleBottomNavScroll;
      }
    };
  }, [isHome, pathname, handleScroll, isVisible]);

  // Don't render the navigation on the index screen or large screens
  if (pathname === "/" || pathname === "/index" || shouldHideNavigation) {
    return null;
  }

  const iconSize = isLargeScreen ? 28 : 24;
  
  const styles = StyleSheet.create({
    container: {
      borderTopWidth: 1,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      paddingVertical: isLargeScreen ? 16 : 12,
      paddingHorizontal: 0,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: isLargeScreen ? 56 : 44,
      paddingHorizontal: isLargeScreen ? 12 : 8,
      flex: 1,
    },
    navText: {
      color: colors.text,
      fontSize: isLargeScreen ? 14 : 12,
      marginTop: 4,
      fontWeight: '500',
      textAlign: 'center',
    },
    activeText: {
      color: '#FF5733',
      fontWeight: '600',
    },
  });

  const containerStyle = [
    styles.container,
    {
      paddingBottom: Math.max(insets.bottom, isLargeScreen ? 12 : 8),
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
      transform: [{
        translateY: isVisible.interpolate({
          inputRange: [0, 1],
          outputRange: [100, 0],
        }),
      }],
    },
  ];

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.content}>
        <Pressable 
          style={styles.navItem} 
          onPress={() => router.replace("/Home")}
        >
          <Ionicons 
            name={pathname === "/Home" ? "home" : "home-outline"} 
            size={iconSize} 
            color={pathname === "/Home" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Home" && styles.activeText]}>
            Home
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.replace("/Reading-emoji")}
        >
          <Ionicons 
            name={pathname === "/Reading-emoji" ? "happy" : "happy-outline"} 
            size={iconSize} 
            color={pathname === "/Reading-emoji" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Reading-emoji" && styles.activeText]}>
            Emoji
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.replace("/(tabs)/Achievements")}
        >
          <Ionicons 
            name={pathname === "/Achievements" ? "trophy" : "trophy-outline"} 
            size={iconSize} 
            color={pathname === "/Achievements" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Achievements" && styles.activeText]}>
            Achievements
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.replace("/Navigation")}
        >
          <Ionicons 
            name="book-outline" 
            size={iconSize} 
            color={pathname === "/Navigation" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Navigation" && styles.activeText]}>
            Search
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default BottomNavigation; 