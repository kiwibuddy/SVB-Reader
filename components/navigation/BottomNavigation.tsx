import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, useWindowDimensions, Platform } from "react-native";
import { useRouter, usePathname, useFocusEffect } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { isLargeScreen, isLandscape } from '@/constants/sizes';

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
  const { colors } = useSyncAppSettings();
  const { t } = useTranslation();

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
                       pathname === '/ReadingPlans' || 
                       pathname === '/Achievements' ||
                       pathname === '/plan' ||
                       pathname === '/you' ||
                       pathname.startsWith('/cast');
    
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
    if (globalThis) {
      (globalThis as any).handleBottomNavScroll = handleScroll;
    }

    return () => {
      if (globalThis) {
        delete (globalThis as any).handleBottomNavScroll;
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
      paddingTop: isLargeScreen ? 16 : 12,
      paddingBottom: isLargeScreen ? 8 : 6,
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
      color: colors.primary,
      fontWeight: '600',
    },
  });

  const containerStyle = [
    styles.container,
    {
      paddingBottom: Math.max(insets.bottom, isLargeScreen ? 4 : 2),
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
        <Pressable style={styles.navItem} onPress={() => router.replace("/Home")}>
          <Ionicons name={pathname === "/Home" ? "book" : "book-outline"} size={iconSize} color={pathname === "/Home" ? colors.primary : colors.secondary} />
          <Text style={[styles.navText, pathname === "/Home" && styles.activeText]}>{t('UI.tabs.read')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace("/cast")}>
          <Ionicons name={pathname.startsWith("/cast") ? "people" : "people-outline"} size={iconSize} color={pathname.startsWith("/cast") ? colors.primary : colors.secondary} />
          <Text style={[styles.navText, pathname.startsWith("/cast") && styles.activeText]}>{t('UI.tabs.cast')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace("/plan")}>
          <Ionicons name={pathname === "/plan" || pathname.startsWith("/plan/") ? "calendar" : "calendar-outline"} size={iconSize} color={pathname.includes("plan") ? colors.primary : colors.secondary} />
          <Text style={[styles.navText, pathname.includes("plan") && styles.activeText]}>{t('UI.tabs.plan')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace("/Reading-emoji")}>
          <Ionicons name={pathname === "/Reading-emoji" ? "bookmark" : "bookmark-outline"} size={iconSize} color={pathname === "/Reading-emoji" ? colors.primary : colors.secondary} />
          <Text style={[styles.navText, pathname === "/Reading-emoji" && styles.activeText]}>{t('UI.tabs.saved')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace("/you")}>
          <Ionicons name={pathname === "/you" ? "person" : "person-outline"} size={iconSize} color={pathname === "/you" ? colors.primary : colors.secondary} />
          <Text style={[styles.navText, pathname === "/you" && styles.activeText]}>{t('UI.tabs.you')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default BottomNavigation; 