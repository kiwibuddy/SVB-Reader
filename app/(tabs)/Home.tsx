import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ThreadList from '@/components/thread/ThreadList';
import { getCompletedStoryIds } from '@/utils/threadProgress';
import { getLastReadSegment } from '@/api/sqlite';

const Home = () => {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [completed, last] = await Promise.all([
          getCompletedStoryIds(),
          getLastReadSegment(),
        ]);
        if (!alive) return;
        setCompletedIds(completed);
        const short = last?.match(/S\d+/i)?.[0] || last;
        setCurrentId(short || 'S001');
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  return (
    <View style={{ flex: 1 }}>
      <ThreadList completedIds={completedIds} currentId={currentId} />
    </View>
  );
};

export default Home;
