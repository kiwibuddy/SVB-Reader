import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, useWindowDimensions, Platform } from "react-native";
import { useRouter, usePathname, useFocusEffect } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { isLargeScreen, isLandscape } from '@/constants/sizes';
import conversations from '@/assets/data/conversations.json';
import { ConversationsFile } from '@/types/conversations';
import { roleFill } from '@/utils/ink';

const CAST_CREAM = '#F2EAE0';
const conv = conversations as ConversationsFile;

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

  // Match the Cast voice page field so the tab bar reads as one colored surface.
  const castField = useMemo(() => {
    const match = pathname.match(/^\/cast\/(.+)$/);
    if (!match) return null;
    const name = decodeURIComponent(match[1]);
    const voice = conv.voices[name];
    return voice ? roleFill(voice.color) : null;
  }, [pathname]);

  const navBackground = castField || colors.background;
  const navBorder = castField ? 'rgba(242,234,224,0.22)' : colors.border;
  const inactiveTint = castField ? 'rgba(242,234,224,0.55)' : colors.secondary;
  const activeTint = castField ? CAST_CREAM : colors.primary;
  const labelColor = castField ? 'rgba(242,234,224,0.7)' : colors.text;

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
                       pathname === '/Reading-emoji' || 
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
      color: labelColor,
      fontSize: isLargeScreen ? 13 : 11,
      marginTop: 4,
      fontWeight: '500',
      textAlign: 'center',
    },
    activeText: {
      color: activeTint,
      fontWeight: '600',
    },
  });

  const containerStyle = [
    styles.container,
    {
      paddingBottom: Math.max(insets.bottom, isLargeScreen ? 4 : 2),
      backgroundColor: navBackground,
      borderTopColor: navBorder,
      shadowColor: castField ? '#000' : colors.text,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: castField ? 0.18 : 0.1,
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

  const isRead = pathname === "/Home";
  const isCast = pathname.startsWith("/cast");
  const isPlan = pathname === "/plan" || pathname.startsWith("/plan/");
  const isSaved = pathname === "/Reading-emoji";
  const isYou = pathname === "/you";

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.content}>
        <Pressable style={styles.navItem} onPress={() => router.replace("/Home")}>
          <Ionicons name={isRead ? "book" : "book-outline"} size={iconSize} color={isRead ? activeTint : inactiveTint} />
          <Text style={[styles.navText, isRead && styles.activeText]}>{t('UI.tabs.read')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace("/cast")}>
          <Ionicons name={isCast ? "people" : "people-outline"} size={iconSize} color={isCast ? activeTint : inactiveTint} />
          <Text style={[styles.navText, isCast && styles.activeText]}>{t('UI.tabs.cast')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace("/plan")}>
          <Ionicons name={isPlan ? "calendar" : "calendar-outline"} size={iconSize} color={isPlan ? activeTint : inactiveTint} />
          <Text style={[styles.navText, isPlan && styles.activeText]}>{t('UI.tabs.plan')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace("/Reading-emoji")}>
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={iconSize} color={isSaved ? activeTint : inactiveTint} />
          <Text style={[styles.navText, isSaved && styles.activeText]}>{t('UI.tabs.saved')}</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace("/you")}>
          <Ionicons name={isYou ? "person" : "person-outline"} size={iconSize} color={isYou ? activeTint : inactiveTint} />
          <Text style={[styles.navText, isYou && styles.activeText]}>{t('UI.tabs.you')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default BottomNavigation; 