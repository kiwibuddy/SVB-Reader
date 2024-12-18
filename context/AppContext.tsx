import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';

interface ReadingPlanProgress {
  [key: string]: {
    completedSegments: string[];
    isCompleted: boolean;
  };
}

interface AppContextType {
  db: SQLite.SQLiteDatabase | null;
  readingPlanProgress: ReadingPlanProgress;
  updateReadingPlanProgress: (planId: string, segmentId: string) => void;
  startReadingPlan: (planId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [readingPlanProgress, setReadingPlanProgress] = useState<ReadingPlanProgress>({});

  useEffect(() => {
    const database = SQLite.openDatabase('bible.db');
    setDb(database);

    // Initialize the reading_plan_progress table
    const initDatabase = async () => {
      try {
        await database.transactionAsync(async (tx) => {
          await tx.executeSqlAsync(
            `CREATE TABLE IF NOT EXISTS reading_plan_progress (
              plan_id TEXT PRIMARY KEY,
              progress TEXT
            )`
          );
        });

        // Load existing progress
        const result = await database.transactionAsync(async (tx) => {
          return await tx.executeSqlAsync('SELECT * FROM reading_plan_progress');
        });

        const progress: ReadingPlanProgress = {};
        for (const row of result.rows) {
          progress[row.plan_id] = JSON.parse(row.progress);
        }
        setReadingPlanProgress(progress);
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    initDatabase();
  }, []);

  const updateReadingPlanProgress = async (planId: string, segmentId: string) => {
    const currentPlan = readingPlanProgress[planId] || { completedSegments: [], isCompleted: false };
    const updatedSegments = [...currentPlan.completedSegments];
    
    if (!updatedSegments.includes(segmentId)) {
      updatedSegments.push(segmentId);
    }

    const updatedProgress = {
      ...readingPlanProgress,
      [planId]: {
        completedSegments: updatedSegments,
        isCompleted: false // You can add logic here to determine when a plan is completed
      }
    };

    setReadingPlanProgress(updatedProgress);

    // Save to database
    try {
      if (db) {
        await db.transactionAsync(async (tx) => {
          await tx.executeSqlAsync(
            'INSERT OR REPLACE INTO reading_plan_progress (plan_id, progress) VALUES (?, ?)',
            [planId, JSON.stringify(updatedProgress[planId])]
          );
        });
      }
    } catch (error) {
      console.error('Error updating reading plan progress:', error);
    }
  };

  const startReadingPlan = (planId: string) => {
    if (!readingPlanProgress[planId]) {
      const newProgress = {
        ...readingPlanProgress,
        [planId]: {
          completedSegments: [],
          isCompleted: false
        }
      };
      setReadingPlanProgress(newProgress);
    }
  };

  return (
    <AppContext.Provider value={{
      db,
      readingPlanProgress,
      updateReadingPlanProgress,
      startReadingPlan
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 