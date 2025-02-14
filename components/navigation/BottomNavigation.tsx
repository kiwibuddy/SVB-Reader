import React from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';

declare global {
  var handleBottomNavScroll: ((event: any) => void) | undefined;
}

interface BottomNavigationProps {
  isHome?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ isHome }) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [isVisible] = React.useState(new Animated.Value(1));
  const lastScrollY = React.useRef(0);
  const { colors, isDarkMode } = useAppSettings();
  const { t } = useTranslation();

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    if (currentOffset > lastScrollY.current && currentOffset > 50) {
      // Scrolling down - hide
      Animated.spring(isVisible, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10
      }).start();
    } else if (currentOffset < lastScrollY.current) {
      // Scrolling up - show
      Animated.spring(isVisible, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10
      }).start();
    }
    lastScrollY.current = currentOffset;
  };

  // Pass this handleScroll function to each ScrollView in your app
  React.useEffect(() => {
    if (isHome) return;
    
    // You can expose the handleScroll function to other components
    if (global) {
      global.handleBottomNavScroll = handleScroll;
    }

    return () => {
      if (global) {
        delete global.handleBottomNavScroll;
      }
    };
  }, [isHome]);

  // Don't render the navigation on the index screen - move after hooks
  if (pathname === "/" || pathname === "/index") {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999,
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 6,
    },
    navItem: {
      alignItems: 'center',
      paddingVertical: 2,
    },
    navText: {
      fontSize: 12,
      marginTop: 2,
      color: colors.text,
    },
    activeText: {
      color: colors.primary,
    },
    label: {
      color: colors.text,
    },
    activeLabel: {
      color: colors.primary,
    },
    icon: {
      color: colors.secondary,
    },
    activeIcon: {
      color: colors.primary,
    },
    text: {
      color: colors.text,
    }
  });

  const containerStyle = [
    styles.container,
    {
      paddingBottom: insets.bottom,
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
          onPress={() => router.push("/Home")}
        >
          <Ionicons 
            name={pathname === "/Home" ? "home" : "home-outline"} 
            size={24} 
            color={pathname === "/Home" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Home" && styles.activeText]}>
            {t('home')}
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.push("/Reading-emoji")}
        >
          <Ionicons 
            name={pathname === "/Reading-emoji" ? "happy" : "happy-outline"} 
            size={24} 
            color={pathname === "/Reading-emoji" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Reading-emoji" && styles.activeText]}>
            {t('emoji')}
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.push("/Reading-movement")}
        >
          <Ionicons 
            name={pathname === "/Reading-movement" ? "trophy" : "trophy-outline"} 
            size={24} 
            color={pathname === "/Reading-movement" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Reading-movement" && styles.activeText]}>
            {t('achievements')}
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.push("/Navigation")}
        >
          <Ionicons 
            name={pathname === "/Navigation" ? "search" : "search-outline"} 
            size={24} 
            color={pathname === "/Navigation" ? colors.primary : colors.secondary} 
          />
          <Text style={[styles.navText, pathname === "/Navigation" && styles.activeText]}>
            {t('search')}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default BottomNavigation; 