import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import logger from '@/utils/logger';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, FlatList, ScrollView, View, TouchableOpacity, Text, StatusBar, Dimensions } from 'react-native';
import { useSQLiteGlobalContext } from '@/context/SQLiteGlobalContext';
import { bibleLoader } from '@/services/BibleLoader';
import conversations from "@/assets/data/conversations.json";
import SegmentTitles from "@/assets/data/SegmentTitles.json";
import { ConversationsFile } from "@/types/conversations";
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { useBottomNavAnimation } from '@/context/BottomNavContext';
import Segment from '@/components/Bible/Segment';
import { SegmentType, IntroType, BibleType, isIntroType, isSegmentType } from "@/types";
import Intro from '@/components/Bible/Intro';
import TalkAboutCard from '@/components/thread/TalkAboutCard';
import PlanIntroCard from '@/components/thread/PlanIntroCard';
import PlanQuestionsCard from '@/components/thread/PlanQuestionsCard';
import CheckCircle, { type Celebration } from '@/components/CheckCircle';
import CompletionBanner from '@/components/Bible/CompletionBanner';
import UpNextCard from '@/components/Bible/UpNextCard';
import { findCatalogItem, type CatalogItem } from '@/utils/planCatalog';
import { findPlanItem } from '@/api/userPlans';
import { canonicalStories, neighbours, storiesInContext } from '@/utils/storyOrder';
import StickyHeader from '@/components/StickyHeader';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { startReadingSession, updateReadingSession } from '@/api/sqlite';
import { isLargeScreen, isLandscape, responsivePadding, spacing } from '@/constants/sizes';
import { getCompanionDay } from '@/utils/planCompanion';

const ALL_STORIES = canonicalStories(Object.keys(SegmentTitles));

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
    paddingTop: 12,
    paddingBottom: 4,
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
  const { planId, challengeId, verse, chapter, voice, partner, locate } = params;
  const voiceName = Array.isArray(voice) ? voice[0] : voice;
  const partnerName = Array.isArray(partner) ? partner[0] : partner;
  const locateKind = (Array.isArray(locate) ? locate[0] : locate) as 'speech' | 'exchange' | undefined;
  const flatListRef = useRef<ScrollView>(null);
  const { isVisible } = useBottomNavAnimation();

  // Find-it-in-the-story: local override of the route verse params, with a
  // nonce so tapping the same verse again re-scrolls and re-pulses.
  const [keyFind, setKeyFind] = useState<{ chapter: number; verse: number; nonce: number } | null>(null);
  
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

  // Always start scrolled to the top when a story loads — unless a verse
  // reference sent us here, in which case these resets would land on top of
  // the scroll to that verse and win.
  useEffect(() => {
    if ((verse && chapter) || locateKind || keyFind) return;

    const scrollToTop = () => {
      flatListRef.current?.scrollTo({ y: 0, animated: false });
    };

    scrollToTop();
    const timer1 = setTimeout(scrollToTop, 50);
    const timer2 = setTimeout(scrollToTop, 200);

    logger.info(`📜 [BibleScreen] Resetting scroll position for segment ${segID}`);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [segID, verse, chapter, locateKind, keyFind]);

  const handleVerseLocated = useCallback((y: number) => {
    flatListRef.current?.scrollTo({ y: Math.max(0, y - 90), animated: true });
    logger.info(`📍 [BibleScreen] Scrolled to ${chapter}:${verse} at ${Math.round(y)}px`);
  }, [chapter, verse]);

  // Clear verse highlighting when navigating to a different segment
  useEffect(() => {
    logger.info(`🔄 [BibleScreen] Segment changed to ${segID}, clearing verse highlighting`);
  }, [segID]);

  // Initialize navigation arrows as visible when entering segment
  useEffect(() => {
    setIsArrowsVisible(true);
    isVisible.setValue(1);
  }, [segID, isVisible]);

  // The plan this story was opened from. Curated plans resolve at once; custom
  // plans live in the database, so they arrive a moment later.
  const planKey = ((planId || challengeId) as string | undefined) || undefined;
  const curatedPlan = useMemo(() => (planKey ? findCatalogItem(planKey) ?? null : null), [planKey]);
  const [customPlan, setCustomPlan] = useState<{ key: string; item: CatalogItem | null } | null>(null);
  useEffect(() => {
    if (!planKey || curatedPlan) return;
    let alive = true;
    findPlanItem(planKey).then((item) => {
      if (alive) setCustomPlan({ key: planKey, item: item ?? null });
    });
    return () => {
      alive = false;
    };
  }, [planKey, curatedPlan]);
  const plan: CatalogItem | null = curatedPlan ?? (customPlan && customPlan.key === planKey ? customPlan.item : null);

  const companionDay = useMemo(
    () => (planKey ? getCompanionDay(planKey, segID, language) : null),
    [planKey, segID, language]
  );

  useEffect(() => {
    setKeyFind(null);
  }, [segID]);

  const targetChapter = keyFind?.chapter ?? (chapter ? parseInt(chapter as string, 10) : undefined);
  const targetVerse = keyFind?.verse ?? (verse ? parseInt(verse as string, 10) : undefined);
  const targetNonce = keyFind?.nonce ?? 0;

  const findKeyVerse = useCallback((ch: number, v: number) => {
    setKeyFind((prev) => ({
      chapter: ch,
      verse: v,
      nonce: (prev && prev.chapter === ch && prev.verse === v ? prev.nonce : 0) + 1,
    }));
  }, []);

  // Reading order for this context: the plan's own order (week order for
  // Advent), the voice's stories, or the whole Bible. One helper, so the
  // arrows and the Up next card agree with the Plan tab. (MUST be before early return)
  const readingOrder = useMemo(
    () =>
      storiesInContext(
        { planId: planKey, voice: voiceName },
        {
          planStories: () => plan?.stories ?? null,
          voiceStories: (name) => {
            const conv = conversations as ConversationsFile;
            let decoded = name;
            try {
              decoded = decodeURIComponent(name);
            } catch {}
            return conv.voices[decoded]?.storyIds || conv.voices[name]?.storyIds || [];
          },
          allStories: ALL_STORIES,
        }
      ),
    [planKey, plan, voiceName]
  );
  const { prev: prevSegId, next: nextSegId } = useMemo(() => neighbours(readingOrder, segID), [readingOrder, segID]);

  // Up next appears once this story is finished; keyed by story so it resets
  // when the reader moves on.
  const [finishedId, setFinishedId] = useState<string | null>(null);
  // Shown at screen level so the banner can sit at the top of the screen.
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  // Stable: the banner restarts its hide timer whenever onHide changes.
  const hideCelebration = useCallback(() => setCelebration(null), []);
  const justFinished = finishedId === segID;

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
        ...(challengeId ? { challengeId } : {}),
        ...(voiceName ? { voice: voiceName } : {})
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
      <View style={{ height: Math.max(insets.top, 12) + 8 }} />
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
          {companionDay && (
            <PlanIntroCard
              day={companionDay}
              content={segmentData.content}
              onFindInStory={findKeyVerse}
            />
          )}
          <Segment 
            segmentData={segmentData}
            context={planId ? 'plan' : challengeId ? 'challenge' : 'main'}
            planId={planId as string}
            challengeId={challengeId as string}
            targetVerse={targetVerse}
            targetChapter={targetChapter}
            targetNonce={targetNonce}
            keyVerseRefs={companionDay?.keyVerses}
            keyVerseColour={companionDay?.colour}
            targetVoice={voiceName ? String(voiceName) : undefined}
            targetPartner={partnerName ? String(partnerName) : undefined}
            locate={locateKind === 'speech' || locateKind === 'exchange' ? locateKind : undefined}
            onVerseLocated={handleVerseLocated}
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
              onCompleted={() => setFinishedId(segID)}
              onCelebrate={setCelebration}
            />
          </View>
          {justFinished && (
            <UpNextCard
              storyId={segID}
              order={readingOrder}
              plan={plan}
              voice={planKey ? null : voiceName ? String(voiceName) : null}
            />
          )}
          {companionDay ? (
            <PlanQuestionsCard day={companionDay} />
          ) : (
            <TalkAboutCard segmentId={segID} />
          )}
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
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + (isLargeScreen ? 200 : 168) }]}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
      </ScrollView>

      <CompletionBanner
        visible={!!celebration}
        title={celebration?.title}
        subtitle={celebration?.subtitle}
        voiceNote={celebration?.voiceNote}
        durationMs={celebration?.subtitle.includes('\n') ? 3200 : 2400}
        onHide={hideCelebration}
      />

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
