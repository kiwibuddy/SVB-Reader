import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { 
  getDatabaseInfo,
  analyzeDataConflicts,
  isDatabaseOutdated,
  logDatabaseDiagnostics,
  type DatabaseInfo,
  type ConflictAnalysis 
} from '@/api/database-diagnostics';
import {
  migrateAsyncStorageToSQLite,
  resetDatabaseAndStorage,
  checkAndMigrate,
  type MigrationResult,
  type ResetResult
} from '@/api/database-migration';
import { styles } from './styles';

interface DatabaseDebugScreenProps {
  visible: boolean;
  onClose: () => void;
}

const DatabaseDebugScreen: React.FC<DatabaseDebugScreenProps> = ({
  visible,
  onClose,
}) => {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [conflicts, setConflicts] = useState<ConflictAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'conflicts' | 'actions'>('overview');

  useEffect(() => {
    if (visible) {
      loadDatabaseInfo();
    }
  }, [visible]);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    try {
      const [dbData, conflictData] = await Promise.all([
        getDatabaseInfo(),
        analyzeDataConflicts()
      ]);
      
      setDbInfo(dbData);
      setConflicts(conflictData);
      
      // Log diagnostics to console
      await logDatabaseDiagnostics();
    } catch (error) {
      Alert.alert('Error', `Failed to load database info: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async () => {
    Alert.alert(
      'Migrate Data',
      'This will migrate data from AsyncStorage to SQLite. This is usually safe but recommended to backup data first. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await migrateAsyncStorageToSQLite();
              Alert.alert(
                result.success ? 'Migration Successful' : 'Migration Issues',
                result.summary + '\n\nCheck console for details.',
                [{ text: 'OK', onPress: loadDatabaseInfo }]
              );
              console.log('Migration Result:', result);
            } catch (error) {
              Alert.alert('Migration Failed', `Error: ${error}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Database',
      'WARNING: This will completely clear all data in both SQLite and AsyncStorage. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All Data',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await resetDatabaseAndStorage();
              Alert.alert(
                result.success ? 'Reset Successful' : 'Reset Issues',
                result.summary,
                [{ text: 'OK', onPress: loadDatabaseInfo }]
              );
              console.log('Reset Result:', result);
            } catch (error) {
              Alert.alert('Reset Failed', `Error: ${error}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAutoMigration = async () => {
    setLoading(true);
    try {
      const result = await checkAndMigrate();
      
      if (result.migrationPerformed) {
        Alert.alert(
          'Auto-Migration Complete',
          `Migration was ${result.result?.success ? 'successful' : 'completed with issues'}.\n\n${result.result?.summary}`,
          [{ text: 'OK', onPress: loadDatabaseInfo }]
        );
      } else if (result.error) {
        Alert.alert('Migration Check Failed', result.error);
      } else {
        Alert.alert('No Migration Needed', 'Database is up to date.');
      }
    } catch (error) {
      Alert.alert('Auto-Migration Failed', `Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Database Overview</Text>
      
      {dbInfo && (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Version:</Text>
            <Text style={styles.value}>{dbInfo.version}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Schema Hash:</Text>
            <Text style={styles.value}>{dbInfo.schemaHash}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Created:</Text>
            <Text style={styles.value}>{dbInfo.createdAt}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Total Tables:</Text>
            <Text style={styles.value}>{dbInfo.totalTables}</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Tables Summary</Text>
          {dbInfo.tablesSummary.map((table, index) => (
            <View key={index} style={styles.tableInfo}>
              <Text style={styles.tableName}>{table.name}</Text>
              <Text style={styles.tableDetail}>
                {table.rowCount} rows, {table.columns.length} columns
              </Text>
              {table.hasData && <Text style={styles.hasDataIndicator}>Has Data</Text>}
            </View>
          ))}
        </>
      )}
    </View>
  );

  const renderConflicts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Data Conflicts Analysis</Text>
      
      {conflicts && (
        <>
          <View style={styles.conflictSummary}>
            <Text style={styles.conflictStatus}>
              Status: {conflicts.hasConflicts ? '⚠️ Conflicts Found' : '✅ No Conflicts'}
            </Text>
            <Text style={styles.conflictDetail}>
              AsyncStorage Keys: {conflicts.asyncStorageKeys.length}
            </Text>
            <Text style={styles.conflictDetail}>
              SQLite Tables: {conflicts.sqliteTableCount}
            </Text>
          </View>
          
          {conflicts.conflicts.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Conflicts ({conflicts.conflicts.length})</Text>
              {conflicts.conflicts.map((conflict, index) => (
                <View key={index} style={styles.conflictItem}>
                  <Text style={styles.conflictKey}>{conflict.key}</Text>
                  <Text style={[styles.conflictSeverity, { color: getSeverityColor(conflict.severity) }]}>
                    {conflict.severity.toUpperCase()}
                  </Text>
                  <Text style={styles.conflictDescription}>{conflict.description}</Text>
                </View>
              ))}
            </>
          )}
          
          {conflicts.recommendations.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Recommendations</Text>
              {conflicts.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendation}>• {rec}</Text>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Database Actions</Text>
      
      <TouchableOpacity style={styles.actionButton} onPress={loadDatabaseInfo}>
        <Text style={styles.actionButtonText}>🔄 Refresh Analysis</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton} onPress={handleAutoMigration}>
        <Text style={styles.actionButtonText}>🔧 Auto-Check & Migrate</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton} onPress={handleMigration}>
        <Text style={styles.actionButtonText}>📦 Manual Migration</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleReset}>
        <Text style={[styles.actionButtonText, styles.dangerButtonText]}>🗑️ Reset All Data</Text>
      </TouchableOpacity>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          💡 Use "Auto-Check & Migrate" first. It will safely detect if migration is needed and perform it automatically.
        </Text>
      </View>
    </View>
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#FF4444';
      case 'medium': return '#FFA500';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Database Diagnostics</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {['overview', 'conflicts', 'actions'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab as any)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Analyzing database...</Text>
          </View>
        )}

        {!loading && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {selectedTab === 'overview' && renderOverview()}
            {selectedTab === 'conflicts' && renderConflicts()}
            {selectedTab === 'actions' && renderActions()}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

export default DatabaseDebugScreen;
