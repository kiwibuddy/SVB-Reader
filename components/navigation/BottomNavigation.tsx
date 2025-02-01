import React from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavigationProps {
  isHome?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ isHome }) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [isVisible] = React.useState(new Animated.Value(1));
  const lastScrollY = React.useRef(0);

  // Move hooks before any conditional returns
  React.useEffect(() => {
    if (isHome) return; // Early return in useEffect is fine

    let timeout: NodeJS.Timeout;
    const handleScroll = (event: any) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        // Scrolling down - hide
        Animated.spring(isVisible, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else {
        // Scrolling up - show
        Animated.spring(isVisible, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
      
      // Clear previous timeout
      if (timeout) clearTimeout(timeout);
      
      // Set new timeout to show nav after stopping scroll
      timeout = setTimeout(() => {
        Animated.spring(isVisible, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }, 1500);

      lastScrollY.current = currentScrollY;
    };

    // Add scroll listener to window
    if (!isHome) {
      // Add your scroll listener logic here
      // This will depend on how you're handling scrolling in your app
    }

    return () => {
      if (timeout) clearTimeout(timeout);
      // Remove scroll listener if needed
    };
  }, [isHome, isVisible]);

  // Don't render the navigation on the index screen - move after hooks
  if (pathname === "/" || pathname === "/index") {
    return null;
  }

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
            color={pathname === "/Home" ? "#FF5733" : "#666"} 
          />
          <Text style={[styles.navText, pathname === "/Home" && styles.activeText]}>
            Home
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.push("/Reading-emoji")}
        >
          <Ionicons 
            name={pathname === "/Reading-emoji" ? "happy" : "happy-outline"} 
            size={24} 
            color={pathname === "/Reading-emoji" ? "#FF5733" : "#666"} 
          />
          <Text style={[styles.navText, pathname === "/Reading-emoji" && styles.activeText]}>
            Emoji
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.push("/Reading-movement")}
        >
          <Ionicons 
            name={pathname === "/Reading-movement" ? "trophy" : "trophy-outline"} 
            size={24} 
            color={pathname === "/Reading-movement" ? "#FF5733" : "#666"} 
          />
          <Text style={[styles.navText, pathname === "/Reading-movement" && styles.activeText]}>
            Achievements
          </Text>
        </Pressable>

        <Pressable 
          style={styles.navItem} 
          onPress={() => router.push("/Navigation")}
        >
          <Ionicons 
            name={pathname === "/Navigation" ? "search" : "search-outline"} 
            size={24} 
            color={pathname === "/Navigation" ? "#FF5733" : "#666"} 
          />
          <Text style={[styles.navText, pathname === "/Navigation" && styles.activeText]}>
            Search
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  activeText: {
    color: '#FF5733',
  },
});

export default BottomNavigation; 