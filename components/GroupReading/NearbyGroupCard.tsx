import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/context/AppSettingsContext';
import { GroupSession, Role } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

interface NearbyGroupCardProps {
  session: GroupSession;
  onJoin: () => void;
  onDismiss: () => void;
}

const ROLE_COLORS: Record<Role, string> = {
  narrator: '#8E8E93',
  god: '#FF3B30',
  main_character: '#30D158',
  other_voices: '#007AFF',
};

const ROLE_LABELS: Record<Role, string> = {
  narrator: 'Narrator',
  god: 'God',
  main_character: 'Main Character',
  other_voices: 'Other Voices',
};

const NearbyGroupCard: React.FC<NearbyGroupCardProps> = ({
  session,
  onJoin,
  onDismiss,
}) => {
  const { colors } = useAppSettings();
  const [slideAnim] = useState(new Animated.Value(-100));
  const [pulseAnim] = useState(new Animated.Value(1));
  const translateX = useRef(new Animated.Value(0)).current;
  const gestureTranslateX = useRef(new Animated.Value(0)).current;
  const [isRevealed, setIsRevealed] = useState(false);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 10,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
      position: 'relative',
    },
    accentBorder: {
      position: 'absolute',
      left: 0,
      top: 16,
      bottom: 16,
      width: 4,
      borderRadius: 2,
      backgroundColor: '#007AFF', // Blue accent for group reading
    },
    contentWrapper: {
      flexDirection: 'column',
      justifyContent: 'flex-start',
    },
    textSection: {
      marginBottom: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    titleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    icon: {
      marginRight: 8,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    dismissButton: {
      padding: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    storyInfo: {
      marginLeft: 28, // Align with title text after icon
      marginTop: 2,
    },
    storyTitle: {
      fontSize: 14,
      color: colors.secondary,
      marginBottom: 2,
    },
    hostInfo: {
      fontSize: 14,
      color: colors.secondary,
      marginBottom: 2,
    },
    participantInfo: {
      fontSize: 14,
      color: colors.secondary,
    },
    availableRoles: {
      marginBottom: 20,
    },
    availableRolesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    rolesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
    },
    roleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1,
    },
    availableRoleChip: {
      borderColor: colors.border,
    },
    takenRoleChip: {
      borderColor: colors.border,
      opacity: 0.6,
    },
    roleIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    roleText: {
      fontSize: 12,
      fontWeight: '500',
    },
    availableRoleText: {
      color: colors.text,
    },
    takenRoleText: {
      color: colors.secondary,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    joinButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#007AFF', // Blue to match accent
    },
    joinButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    dismissButton2: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    dismissButtonText: {
      color: colors.secondary,
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
    },
    pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    dismissAction: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 80,
      backgroundColor: '#FF3B30',
      justifyContent: 'center',
      alignItems: 'center',
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
    },
    dismissActionText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginTop: 4,
    },
  });

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Pulse animation for broadcast icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const getAvailableRoles = (): Role[] => {
    const takenRoles = session.participants.map(p => p.role);
    const allRoles: Role[] = ['narrator', 'god', 'main_character', 'other_voices'];
    return allRoles.filter(role => !takenRoles.includes(role));
  };

  const getTakenRoles = (): { role: Role; userName: string }[] => {
    return session.participants.map(p => ({ role: p.role, userName: p.userName }));
  };

  const availableRoles = getAvailableRoles();
  const takenRoles = getTakenRoles();

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;
    
    // Only allow left swipe (negative translation)
    if (translationX <= 0) {
      gestureTranslateX.setValue(Math.max(translationX, -80));
    }
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === 5) { // GESTURE_STATE_END
      if (translationX < -40) {
        // Reveal dismiss action
        setIsRevealed(true);
        Animated.spring(gestureTranslateX, {
          toValue: -80,
          useNativeDriver: true,
        }).start();
      } else {
        // Hide dismiss action
        setIsRevealed(false);
        Animated.spring(gestureTranslateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleDismiss = () => {
    // Animate card out then call onDismiss
    Animated.timing(translateX, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  return (
    <View style={{ overflow: 'hidden', marginBottom: 20 }}>
      {/* Dismiss Action Background */}
      <View style={styles.dismissAction}>
        <Ionicons name="trash" size={20} color="#FFFFFF" />
        <Text style={styles.dismissActionText}>Dismiss</Text>
      </View>
      
      {/* Main Card */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View 
          style={[
            styles.container,
            { 
              transform: [
                { translateY: slideAnim },
                { translateX: Animated.add(translateX, gestureTranslateX) }
              ]
            }
          ]}
        >
          <View style={styles.accentBorder} />
          <View style={styles.contentWrapper}>
            <View style={styles.textSection}>
              <View style={styles.titleRow}>
                <View style={styles.titleLeft}>
                  <View style={styles.icon}>
                    <Animated.View 
                      style={[
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      <Ionicons name="radio" size={18} color="#007AFF" />
                    </Animated.View>
                  </View>
                  <Text style={styles.headerTitle}>Join Reading Group</Text>
                </View>
              </View>
              <View style={styles.storyInfo}>
                <Text style={styles.storyTitle}>{session.storyTitle}</Text>
                <Text style={styles.hostInfo}>
                  Host: {session.hostUserName}'s {session.participants[0]?.deviceName || 'Device'}
                </Text>
                <Text style={styles.participantInfo}>
                  Readers: {session.participants.length} of 4 joined
                </Text>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.joinButton} 
                onPress={onJoin}
                activeOpacity={0.8}
              >
                <Text style={styles.joinButtonText}>Join Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Dismiss Action Touchable */}
      {isRevealed && (
        <TouchableOpacity
          style={[styles.dismissAction, { zIndex: 1 }]}
          onPress={handleDismiss}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.dismissActionText}>Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NearbyGroupCard; 