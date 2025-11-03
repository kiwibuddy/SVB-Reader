import React, { useRef, useState } from 'react';
import logger from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useTranslation } from '@/hooks/useTranslation';
import { qrCodeDiscoveryManager } from '@/services/QRCodeDiscoveryManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface QRCodeScannerProps {
  onQRCodeScanned: (data: string) => void;
  onClose: () => void;
  title?: string;
  // default full-screen; 'inline' renders with transparent bg for embedding in cards
  variant?: 'full' | 'inline';
}

const { width, height } = Dimensions.get('window');
const SCANNER_SIZE = Math.min(width, height) * 0.7;

export default function QRCodeScanner({ 
  onQRCodeScanned, 
  onClose, 
  title,
  variant = 'full'
}: QRCodeScannerProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const displayTitle = title || t('UI.qrScanner.title');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const handledOnceRef = useRef(false);

  const handleBarCodeScanned = async (scanResult: any) => {
    if (handledOnceRef.current || scanned || isProcessing) return;
    
    setIsProcessing(true);
    setScanned(true);
    handledOnceRef.current = true;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    
    try {
      logger.info('🔍 QR Code scanned:', scanResult.data.substring(0, 50) + '...');
      
      // First, determine the QR code type to use the correct parser
      let qrCodeType: string | null = null;
      try {
        const parsedData = JSON.parse(scanResult.data);
        qrCodeType = parsedData.type;
        logger.info('🔍 QR code type detected:', qrCodeType);
      } catch (parseError) {
        logger.error('🔴 Failed to parse QR code data for type detection');
      }
      
      // Route to the appropriate parser based on type
      if (qrCodeType === "SVB_COMPLETION") {
        // Process completion QR code
        const completionData = qrCodeDiscoveryManager.parseCompletionFromQRCode(scanResult.data);
        
        if (completionData) {
          logger.info('✅ Valid completion QR code detected');
          logger.info('✅ Completion details:', {
            sessionId: completionData.sessionId,
            storyId: completionData.storyId,
            timestamp: completionData.timestamp
          });
          onQRCodeScanned(scanResult.data);
          return;
        }
      } else if (qrCodeType === "SVB_SESSION") {
        // Process session QR code
        const session = qrCodeDiscoveryManager.parseSessionFromQRCode(scanResult.data);
        
        if (session) {
          logger.info('✅ Valid session QR code detected');
          logger.info('✅ Session details:', {
            id: session.id,
            story: session.storyTitle,
            host: session.hostUserName,
            role: session.participants[0]?.role
          });
          onQRCodeScanned(scanResult.data);
          return;
        }
      } else {
        logger.error('🔴 Unknown QR code type:', qrCodeType);
      }
      
      // If session parsing failed, check what type of QR code this is for better error messages
      try {
        const parsedData = JSON.parse(scanResult.data);
        if (parsedData.type === "SVB_SESSION") {
          // This is a session QR code that failed validation
          logger.error('🔴 Session QR code validation failed');
          logger.error('🔴 Parsed session data:', {
            sessionId: parsedData.sessionId,
            storyId: parsedData.storyId,
            timestamp: parsedData.timestamp,
            expiresAt: parsedData.expiresAt,
            hostRole: parsedData.hostRole,
            hostUserName: parsedData.hostUserName
          });
          
          Alert.alert(
            'Invalid Session QR Code',
            'This session QR code could not be validated. The session may have expired, or there may be a time synchronization issue between devices. Please try generating a new QR code.',
            [
              { 
                text: 'Try Again', 
                onPress: () => {
                  setScanned(false);
                  setIsProcessing(false);
                  handledOnceRef.current = false;
                }
              },
              { 
                text: 'Cancel', 
                onPress: onClose,
                style: 'cancel'
              }
            ]
          );
          return;
        } else if (parsedData.type === "SVB_COMPLETION") {
          // This is a completion QR code that failed validation
          logger.error('🔴 Completion QR code validation failed');
          logger.error('🔴 Parsed completion data:', {
            sessionId: parsedData.sessionId,
            storyId: parsedData.storyId,
            timestamp: parsedData.timestamp,
            hostDeviceId: parsedData.hostDeviceId
          });
          
          Alert.alert(
            'Invalid Completion QR Code',
            'This completion QR code could not be validated. The completion may have expired, or there may be a time synchronization issue between devices. Please ask the host to generate a new completion QR code.',
            [
              { 
                text: 'Try Again', 
                onPress: () => {
                  setScanned(false);
                  setIsProcessing(false);
                  handledOnceRef.current = false;
                }
              },
              { 
                text: 'Cancel', 
                onPress: onClose,
                style: 'cancel'
              }
            ]
          );
          return;
        }
              } catch (parseError) {
          logger.error('🔴 Failed to parse QR code data for type checking');
        }
      
      // Invalid QR code - log more details for debugging
      logger.info('🔴 Invalid QR code format');
      logger.info('🔴 Raw QR data:', scanResult.data);
      try {
        const parsedData = JSON.parse(scanResult.data);
        logger.info('🔴 Parsed data type:', parsedData.type);
        logger.info('🔴 Parsed data keys:', Object.keys(parsedData));
      } catch (parseError) {
        logger.info('🔴 QR data is not valid JSON');
      }
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not recognized. Please scan a valid SourceView Together group reading QR code.',
        [
          { 
            text: 'Try Again', 
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
              handledOnceRef.current = false;
            }
          },
          { 
            text: 'Cancel', 
            onPress: onClose,
            style: 'cancel'
          }
        ]
      );
      
    } catch (error) {
      logger.error('🔴 Error processing scanned QR code:', error);
      Alert.alert(
        'Error',
        'Failed to process QR code. Please try again.',
        [
          { 
            text: 'Try Again', 
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
              handledOnceRef.current = false;
            }
          },
          { 
            text: 'Cancel', 
            onPress: onClose,
            style: 'cancel'
          }
        ]
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: variant === 'inline' ? 'transparent' : '#007AFF',
    },
    camera: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    overlay: {
      flex: 1,
      backgroundColor: variant === 'inline' ? 'transparent' : undefined,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: (variant === 'inline' ? 8 : insets.top + 8),
      paddingBottom: 20,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      flex: 1,
      textAlign: 'center',
    },
    scannerFrame: {
      alignSelf: 'center',
      marginTop: 12,
      width: SCANNER_SIZE,
      height: SCANNER_SIZE,
      borderWidth: 2,
      borderColor: 'white',
      backgroundColor: 'transparent',
    },
    corner: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderColor: '#4CAF50',
      borderWidth: 3,
    },
    cornerTopLeft: {
      top: -2,
      left: -2,
      borderBottomWidth: 0,
      borderRightWidth: 0,
    },
    cornerTopRight: {
      top: -2,
      right: -2,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
    },
    cornerBottomLeft: {
      bottom: -2,
      left: -2,
      borderTopWidth: 0,
      borderRightWidth: 0,
    },
    cornerBottomRight: {
      bottom: -2,
      right: -2,
      borderTopWidth: 0,
      borderLeftWidth: 0,
    },
    instructions: {
      textAlign: 'center',
      color: 'white',
      fontSize: 15,
      fontWeight: '600',
      marginTop: 8,
    },
    bottomSheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#007AFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 16,
      paddingBottom: 28,
      paddingHorizontal: 20,
    },
    stepsText: {
      color: '#FFFFFF',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      opacity: 0.95,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 20,
      fontSize: 16,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    permissionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    permissionText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 24,
    },
    permissionButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 10,
    },
    permissionButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Requesting camera permission...
          </Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.text} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>
            {t('UI.cameraPermission.title')}
          </Text>
          <Text style={[styles.permissionText, { color: colors.text }]}>
            {t('UI.cameraPermission.message')}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{t('UI.cameraPermission.allowAccess')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.permissionButton, { marginTop: 12, backgroundColor: '#666' }]} onPress={onClose}>
            <Text style={styles.permissionButtonText}>{t('UI.cameraPermission.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : ((result: any) => handleBarCodeScanned(result))}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{displayTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          <Text style={styles.instructions}>
            {t('UI.qrScanner.positionCode')}{"\n"}
            • {t('UI.qrScanner.holdSteady')}{"\n"}
            • {t('UI.qrScanner.increaseBrightness')}
          </Text>

          {isProcessing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="white" />
              <Text style={[styles.loadingText, { color: 'white' }]}>Processing QR code...</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
