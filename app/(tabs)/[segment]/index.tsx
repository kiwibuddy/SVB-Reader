import React, { useRef, useState, useMemo, useEffect } from 'react';
import logger from '@/utils/logger';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, FlatList, ScrollView, View, TouchableOpacity, Text, StatusBar, Dimensions } from 'react-native';
import { useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';
import { bibleLoader } from '@/services/BibleLoader';
import readingPlansData from "@/assets/data/ReadingPlansChallenges.json";
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { useBottomNavAnimation } from '@/context/BottomNavContext';
import Segment from '@/components/Bible/Segment';
import { SegmentType, IntroType, BibleType, isIntroType, isSegmentType } from "@/types";
import Intro from '@/components/Bible/Intro';
import TalkAboutCard from '@/components/thread/TalkAboutCard';
import CheckCircle from '@/components/CheckCircle';
import StickyHeader from '@/components/StickyHeader';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { startReadingSession, updateReadingSession } from '@/api/sqlite';
import { isLargeScreen, isLandscape, responsivePadding, spacing } from '@/constants/sizes';

// Helper function moved outside component but Bible loading moved inside

// Helper function to find verse location in Bible content
const findVerseLocation = (segmentData: any, targetChapter: number, targetVerse: number) => {
  if (!segmentData) {
    return null;
  }
  
  // Check different possible data structures
  let content = null;
  if (segmentData.children) {
    content = segmentData.children;
  } else if (segmentData.content) {
    content = segmentData.content;
  } else {
    return null;
  }
  
  // Search through the Bible content to find the target verse
  let currentY = 0;
  let verseCount = 0;
  
  for (const block of content) {
    if (block.type === 'paragraph' && block.children) {
      for (const child of block.children) {
        // Check if this child has a verse reference
        if (child.link && child.link.chapter && child.link.verse) {
          const chapter = parseInt(child.link.chapter);
          const verse = parseInt(child.link.verse);
          verseCount++;
          
          if (chapter === targetChapter && verse === targetVerse) {
            return { y: currentY, chapter, verse, verseCount };
          }
        }
        // Increment Y position for each verse element
        currentY += 40; // Approximate height per verse element
      }
    } else if (block.type === 'paragraph') {
      // For paragraph blocks without children, add some height
      currentY += 60;
    } else {
      // For other block types (headings, etc.)
      currentY += 80;
    }
  }
  
  return null;
};

// Move styles outside component
const createStyles = (colors: any, isLargeScreen: boolean, isLandscape: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    color: colors.secondary,
  },
  roleSelector: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "column",
    gap: 8,
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSpacer: {
    height: 16,
  },
  buttonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: isLargeScreen ? 180 : (isLandscape ? 120 : 140), // Responsive positioning
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: responsivePadding.screen,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  roundButton: {
    width: isLargeScreen ? 60 : 50,
    height: isLargeScreen ? 60 : 50,
    borderRadius: isLargeScreen ? 30 : 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  prevButton: {
    marginRight: 'auto',
  },
  nextButton: {
    marginLeft: 'auto',
  },
  checkCircleContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: isLargeScreen ? 120 : (isLandscape ? 80 : 100), // Responsive padding
    marginTop: 0,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
  },
  navigationButton: {
    backgroundColor: colors.card,
    width: isLargeScreen ? 48 : 40,
    height: isLargeScreen ? 48 : 40,
    borderRadius: isLargeScreen ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  contentContainer: {
    paddingBottom: spacing.md, // Responsive padding
  }
});

export default function BibleScreen() {
  const { colors, language } = useSyncAppSettings();
  const { updateSegmentId, state } = useSQLiteGlobalContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { planId, challengeId, verse, chapter } = params;
  const flatListRef = useRef<ScrollView>(null);
  const { isVisible } = useBottomNavAnimation();
  
  // State to track when Bible is loaded (moved before useMemo to fix TS error)
  const [bibleLoadingKey, setBibleLoadingKey] = useState(0);
  
  // Load Bible dynamically based on current language
  const Bible = useMemo(() => {
    try {
      // Pass language explicitly to ensure we get the right Bible
      const bible = bibleLoader.getCurrentBible(language);
      
      if (!bible || typeof bible !== 'object') {
        logger.error('❌ Invalid Bible data returned', { 
          bible: typeof bible, 
          hasBible: !!bible,
          isArray: Array.isArray(bible)
        });
        return null;
      }
      
      // Log Bible structure for debugging
      const keys = Object.keys(bible);
      logger.info(`📖 Bible loaded for ${language}:`, {
        type: typeof bible,
        isArray: Array.isArray(bible),
        keysCount: keys.length,
        firstKeys: keys.slice(0, 10),
        hasError: 'error' in bible,
        sampleKey: keys[0],
        sampleValue: keys[0] && bible[keys[0]] ? typeof bible[keys[0]] : 'undefined'
      });
      
      // If Bible has an "error" key, it's invalid
      if ('error' in bible) {
        logger.error('❌ Bible object contains error key:', bible.error);
        return null;
      }
      
      return bible;
    } catch (error) {
      logger.error('❌ Error loading Bible:', error);
      return null;
    }
  }, [language, bibleLoadingKey]); // Re-load when language changes OR when Bible finishes loading
  
  const segIds = useMemo(() => {
    if (!Bible || typeof Bible !== 'object') {
      return [];
    }
    return Object.keys(Bible);
  }, [Bible]);
  
  // Option 2: Memoize with useEffect
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });
    
    return () => subscription?.remove();
  }, []);
  
  const { width, height } = screenDimensions;
  const isLandscapeMode = width > height;


  
  // Scroll state
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isArrowsVisible, setIsArrowsVisible] = useState(true);
  
  // Create styles with responsive parameters
  const styles = useMemo(() => createStyles(colors, isLargeScreen, isLandscapeMode), [colors, isLargeScreen, isLandscapeMode]);

  // Parse segmentID
  const segID = useMemo(() => {
    const segment = params.segment as string;
    return segment.includes('-') ? segment.split('-').pop() || '' : segment;
  }, [params.segment]);

  // Get segment data
  const segmentData = useMemo(() => {
    if (!segID) {
      logger.warn('⚠️ No segment ID provided');
      return undefined;
    }
    if (!Bible || typeof Bible !== 'object') {
      logger.warn('⚠️ Bible not loaded yet', { Bible: typeof Bible, hasBible: !!Bible });
      return undefined;
    }
    
    // Try different segment ID formats
    let data = Bible[segID];
    
    // If not found, try with language prefix (e.g., "ENG-NLT-S002")
    if (!data && segID.includes('-')) {
      const cleanSegId = segID.split('-').pop() || segID;
      data = Bible[cleanSegId];
      logger.info(`🔄 Tried clean segment ID: ${cleanSegId}`);
    }
    
    // If still not found, try uppercase/lowercase variations
    if (!data) {
      data = Bible[segID.toUpperCase()] || Bible[segID.toLowerCase()];
    }
    
    logger.info(`📚 [BibleScreen] Segment data for ${segID}:`, {
      hasData: !!data,
      hasContent: !!data?.content,
      hasChildren: !!data?.children,
      contentType: data?.content ? typeof data.content : 'none',
      childrenType: data?.children ? typeof data.children : 'none',
      availableKeys: data ? Object.keys(data).slice(0, 5) : [],
      bibleKeys: Bible ? Object.keys(Bible).slice(0, 10) : [],
      bibleSize: Bible ? Object.keys(Bible).length : 0
    });
    
    return data;
  }, [segID, Bible]); // Include Bible in dependencies

  // Ensure Bible is loaded when language changes
  useEffect(() => {
    const ensureBibleLoaded = async () => {
      try {
        // Check if Bible for current language is available
        const isAvailable = await bibleLoader.isBibleAvailable(language);
        if (!isAvailable && language !== 'en') {
          logger.warn(`⚠️ ${language} Bible not available, will use English`);
          return;
        }
        
        // Preload the Bible to ensure it's cached
        const loaded = await bibleLoader.preloadBible(language);
        if (loaded) {
          logger.info(`✅ Bible preloaded for ${language}, triggering re-render`);
          // Trigger a re-render by updating the key
          setBibleLoadingKey(prev => prev + 1);
        }
      } catch (error) {
        logger.error(`❌ Failed to ensure Bible loaded:`, error);
      }
    };
    
    ensureBibleLoaded();
  }, [language]);

  // Update segment ID when it changes
  useEffect(() => {
    if (segID) {
      updateSegmentId(segID);
    }
  }, [segID, updateSegmentId]);

  // Always start scrolled to the top when a story loads or segID changes
  useEffect(() => {
    // Multiple scroll reset attempts to ensure it works reliably
    const scrollToTop = () => {
      flatListRef.current?.scrollTo({ y: 0, animated: false });
    };
    
    // Immediate scroll reset
    scrollToTop();
    
    // Additional scroll reset after a brief delay to ensure content is loaded
    const timer1 = setTimeout(scrollToTop, 50);
    const timer2 = setTimeout(scrollToTop, 200);
    
    logger.info(`📜 [BibleScreen] Resetting scroll position for segment ${segID}`);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [segID]);

  // Verse navigation logic - scroll to specific verse when provided
  useEffect(() => {
    if (verse && chapter && flatListRef.current && segmentData) {
      logger.info(`🎯 [BibleScreen] Navigating to verse ${chapter}:${verse} in segment ${segID}`);
      
      // Delay to ensure content is fully loaded and rendered
      const scrollToVerse = () => {
        if (flatListRef.current && segmentData) {
          try {
            // Find the verse location in the Bible content
            const targetVerse = findVerseLocation(segmentData, parseInt(chapter as string), parseInt(verse as string));
            if (targetVerse) {
              logger.info(`📍 [BibleScreen] Found verse at position: ${targetVerse.y}px, scrolling...`);
              
              // Add a small offset to center the verse better
              const scrollPosition = Math.max(0, targetVerse.y - 100);
              
              flatListRef.current.scrollTo({ 
                y: scrollPosition, 
                animated: true 
              });
              
              logger.info(`✅ [BibleScreen] Successfully scrolled to verse ${chapter}:${verse}`);
            } else {
              logger.warn(`⚠️ [BibleScreen] Verse ${chapter}:${verse} not found in segment ${segID}`);
            }
          } catch (error) {
            logger.error(`❌ [BibleScreen] Error scrolling to verse:`, error);
          }
        }
      };
      
      // Try multiple times with increasing delays to ensure content is loaded
      const timers = [
        setTimeout(scrollToVerse, 300),   // Quick first attempt
        setTimeout(scrollToVerse, 800),   // Second attempt
        setTimeout(scrollToVerse, 1500),  // Third attempt
        setTimeout(scrollToVerse, 2500)   // Final attempt
      ];
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [verse, chapter, segID, segmentData]);

  // Clear verse highlighting when navigating to a different segment
  useEffect(() => {
    // This effect runs when segID changes (user navigates to different segment)
    // The verse and chapter params will be undefined in the new segment
    // This automatically clears the highlighting in the Segment component
    logger.info(`🔄 [BibleScreen] Segment changed to ${segID}, clearing verse highlighting`);
  }, [segID]);

  // Initialize navigation arrows as visible when entering segment
  useEffect(() => {
    setIsArrowsVisible(true);
    isVisible.setValue(1);
  }, [segID, isVisible]);

  // Get context-aware navigation segments (MUST be before early return)
  const { prevSegId, nextSegId } = useMemo(() => {
    // Make sure language and version are defined
    if (!state.language || !state.version) {
      return { prevSegId: null, nextSegId: null };
    }

    if (planId) {
      // Get segments from the current plan
      const plan = readingPlansData.plans.find(p => p.id === planId);
      const planSegments = plan ? Object.values(plan.segments)
        .flatMap(book => book?.segments || [])
        .filter(seg => !seg.startsWith('I')) : [];
      
      const currentIndex = planSegments.indexOf(segID);
      return {
        prevSegId: currentIndex > 0 ? `${state.language}-${state.version}-${planSegments[currentIndex - 1]}` : null,
        nextSegId: currentIndex < planSegments.length - 1 ? `${state.language}-${state.version}-${planSegments[currentIndex + 1]}` : null
      };
    } 
    else if (challengeId) {
      // Get segments from the current challenge
      const challenge = readingPlansData.challenges.find(c => c.id === challengeId);
      const challengeSegments = challenge ? Object.values(challenge.segments)
        .flatMap(book => book?.segments || [])
        .filter(seg => !seg.startsWith('I')) : [];
      
      const currentIndex = challengeSegments.indexOf(segID);
      return {
        prevSegId: currentIndex > 0 ? `${state.language}-${state.version}-${challengeSegments[currentIndex - 1]}` : null,
        nextSegId: currentIndex < challengeSegments.length - 1 ? `${state.language}-${state.version}-${challengeSegments[currentIndex + 1]}` : null
      };
    }
    else {
      // Default navigation through all segments
      const currentSegmentIndex = segIds.indexOf(segID);
      return {
        prevSegId: currentSegmentIndex > 0 ? `${state.language}-${state.version}-${segIds[currentSegmentIndex - 1]}` : null,
        nextSegId: currentSegmentIndex < segIds.length - 1 ? `${state.language}-${state.version}-${segIds[currentSegmentIndex + 1]}` : null
      };
    }
  }, [segID, planId, challengeId, state.language, state.version]);

  // Show loading state if data isn't ready
  if (!segID) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading segment...</Text>
      </View>
    );
  }
  
  if (!Bible) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading Bible...</Text>
      </View>
    );
  }
  
  if (!segmentData) {
    // Enhanced error logging
    const availableSegments = Array.isArray(segIds) ? segIds.slice(0, 10).join(', ') : 'none';
    const bibleType = Bible ? typeof Bible : 'null';
    const bibleKeys = Bible && typeof Bible === 'object' ? Object.keys(Bible).slice(0, 5).join(', ') : 'none';
    const bibleSize = Bible && typeof Bible === 'object' ? Object.keys(Bible).length : 0;
    
    logger.error(`❌ Segment ${segID} not found in Bible.`, {
      segID,
      language,
      bibleType,
      bibleSize,
      bibleKeys,
      availableSegments,
      segIdsLength: segIds.length,
      hasBible: !!Bible
    });
    
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Segment not found</Text>
        <Text style={[styles.loadingText, { fontSize: 14, marginTop: 10, color: colors.secondary }]}>
          Segment "{segID}" not found in {language.toUpperCase()} Bible.
        </Text>
        {bibleSize > 0 && (
          <Text style={[styles.loadingText, { fontSize: 12, marginTop: 5, color: colors.secondary }]}>
            Bible loaded with {bibleSize} segments
          </Text>
        )}
      </View>
    );
  }

  // Navigation handler
  const handleNavigation = (segId: string) => {
    const cleanSegId = segId.includes('-') ? segId.split('-').pop() || segId : segId;
    
    updateSegmentId(cleanSegId);
    router.push({
              pathname: "/[segment]",
      params: {
        segment: cleanSegId,
        ...(planId ? { planId } : {}),
        ...(challengeId ? { challengeId } : {})
      }
    });
    flatListRef.current?.scrollTo({
      y: 0,
      animated: false,
    });
  };

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    
    // Use the global bottom navigation scroll handler for coordinated animations
    if ((globalThis as any)?.handleBottomNavScroll) {
      (globalThis as any).handleBottomNavScroll(event);
    }
    
    // Coordinate navigation arrows with bottom navigation using iOS-style behavior
    if (currentOffset <= 100) {
      // Show when near top
      if (!isArrowsVisible) {
        setIsArrowsVisible(true);
        Animated.spring(isVisible, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8
        }).start();
      }
    } else if (currentOffset > lastScrollY + 20) {
      // Hide when scrolling down with momentum
      if (isArrowsVisible) {
        setIsArrowsVisible(false);
        Animated.spring(isVisible, {
          toValue: 0,
          useNativeDriver: true,
          tension: 150,
          friction: 8
        }).start();
      }
    } else if (currentOffset < lastScrollY - 10) {
      // Show when scrolling up (more sensitive)
      if (!isArrowsVisible) {
        setIsArrowsVisible(true);
        Animated.spring(isVisible, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8
        }).start();
      }
    }
    
    setLastScrollY(currentOffset);
  };

  // Render the header content that was previously in ScrollView
  const renderHeader = () => (
    <View>
      <View style={styles.headerSpacer} />
      {segID[0] === "I" && isIntroType(segmentData) && (
        <Intro 
          segmentData={{...segmentData, id: segID}} 
          context={planId ? 'plan' : challengeId ? 'challenge' : 'main'}
          planId={planId as string}
          challengeId={challengeId as string}
        />
      )}
      {segID[0] === "S" && isSegmentType(segmentData) && (
        <>
          <Segment 
            segmentData={segmentData}
            context={planId ? 'plan' : challengeId ? 'challenge' : 'main'}
            planId={planId as string}
            challengeId={challengeId as string}
            targetVerse={verse ? parseInt(verse as string) : undefined}
            targetChapter={chapter ? parseInt(chapter as string) : undefined}
          />
          <View style={[styles.checkCircleContainer, { flexDirection: 'row', gap: 24, justifyContent: 'center', alignItems: 'flex-end' }]}> 
            <CheckCircle 
              segmentId={segID} 
              iconSize={isLargeScreen ? 80 : 60}
              context={planId ? 'plan' : challengeId ? 'challenge' : params.context === 'today' ? 'today' : 'main'}
              planId={planId as string || undefined}
              challengeId={challengeId as string || undefined}
              showCaption={false}
              resetVisualStateOnMount={true}
            />
          </View>
          <TalkAboutCard segmentId={segID} />
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>

      <ScrollView 
        ref={flatListRef} 
        style={styles.screenContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 88 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
      </ScrollView>

      <Animated.View style={[
        styles.buttonContainer,
        {
          transform: [{
            translateY: isVisible.interpolate({
              inputRange: [0, 1],
              outputRange: [120, 0], // Smooth slide animation
            })
          }],
          opacity: isVisible.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1], // Fade animation
          })
        }
      ]}>
        {/* Don't show navigation arrows for introduction segments */}
        {segID[0] !== "I" && (
          <>
            {prevSegId && (
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={() => handleNavigation(prevSegId)}
              >
                <Ionicons name="chevron-back" size={isLargeScreen ? 28 : 24} color={colors.secondary} />
              </TouchableOpacity>
            )}

            {nextSegId && (
              <TouchableOpacity
                style={[styles.navigationButton, { marginLeft: 'auto' }]}
                onPress={() => handleNavigation(nextSegId)}
              >
                <Ionicons name="chevron-forward" size={isLargeScreen ? 28 : 24} color={colors.secondary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </Animated.View>
    </View>
  );
}
