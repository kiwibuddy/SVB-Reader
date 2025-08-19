import React from "react";
import { View, Text, Pressable, StyleSheet, Animated, useWindowDimensions, Platform } from "react-native";
import { useRouter, usePathname, useFocusEffect } from "expo-router";
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

  // iPad-specific override: always show bottom navigation on iPad even if "large screen"
  const isIPad = Platform.OS === 'ios' && (Platform as any).isPad === true;
  // Hide navigation on large screens or in landscape mode (except iPad)
  const shouldHideNavigation = (!isIPad) && (isLargeScreen || (isLandscape && height < 500));

  // Enhanced navigation visibility logic
  const shouldShowNavigation = React.useMemo(() => {
    if (isHome) return false;
    
    // Always show on main tab screens (regardless of parameters)
    const isTabScreen = pathname.includes('/(tabs)/') || 
                       pathname === '/Home' || 
                       pathname === '/Navigation' || 
                       pathname === '/Reading-emoji' || 
                       pathname === '/Reading-Challenges' || 
                       pathname === '/Plan' || 
                       pathname === '/Achievements';
    
    // Show on segment pages
    const isSegmentPage = pathname.includes('segment') || 
                         pathname.startsWith('/S') || 
                         pathname.startsWith('/I');
    
    // Show on any screen that's not the index
    const isNotIndex = pathname !== "/" && pathname !== "/index";
    
    return isTabScreen || isSegmentPage || isNotIndex;
  }, [pathname, isHome]);

  // Navigation restoration on focus (ensures navigation is visible after story completion)
  useFocusEffect(
    React.useCallback(() => {
      if (shouldShowNavigation && !isHome) {
        // Force navigation to be visible when screen comes into focus
        isVisible.setValue(1);
        
        // Additional safety check with delay
        const timer = setTimeout(() => {
          if (shouldShowNavigation) {
            isVisible.setValue(1);
          }
        }, 150);
        
        return () => clearTimeout(timer);
      }
    }, [shouldShowNavigation, isHome, isVisible])
  );

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

  // Enhanced navigation visibility management
  React.useEffect(() => {
    if (isHome) return;
    
    // Always ensure navigation is visible on tab screens and after navigation
    if (shouldShowNavigation) {
      // Force navigation to be visible
      isVisible.setValue(1);
      
      // Add a small delay to ensure navigation is restored after completion
      const timer = setTimeout(() => {
        if (shouldShowNavigation) {
          isVisible.setValue(1);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [pathname, isHome, shouldShowNavigation, isVisible]);

  // Pass this handleScroll function to each ScrollView in your app
  React.useEffect(() => {
    if (isHome) return;
    
    // You can expose the handleScroll function to other components
    if (global) {
      (global as any).handleBottomNavScroll = handleScroll;
    }

    return () => {
      if (global) {
        delete (global as any).handleBottomNavScroll;
      }
    };
  }, [isHome, handleScroll]);

  // Don't render the navigation if it should be hidden
  if (!shouldShowNavigation || shouldHideNavigation) {
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: isLargeScreen ? 16 : 12,
      paddingHorizontal: 8,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: isLargeScreen ? 56 : 44,
      paddingHorizontal: isLargeScreen ? 8 : 4,
      flex: 1,
      maxWidth: isLargeScreen ? 120 : 100,
    },
    navText: {
      color: colors.text,
      fontSize: isLargeScreen ? 13 : 11,
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
            Reactions
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

        {/* MVP: Removed Plans and Challenges from bottom nav - accessible via Home screen cards */}
        {/* <Pressable 
          style={styles.navItem} 
          onPress={() => router.replace("/Plan")}
        >
          <Ionicons 
            name="calendar-outline" 
            size={iconSize} 
            color={pathname === "/Plan" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Plan" && styles.activeText]}>
            Plans
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.replace("/Reading-Challenges")}
        >
          <Ionicons 
            name="trophy-outline" 
            size={iconSize} 
            color={pathname === "/Reading-Challenges" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Reading-Challenges" && styles.activeText]}>
            Challenges
          </Text>
        </Pressable> */}

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