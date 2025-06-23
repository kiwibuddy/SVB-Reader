import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppSettings } from '@/context/AppSettingsContext';

interface ColorData {
  total: number;
  black: number;
  red: number;
  green: number;
  blue: number;
}

interface RoleProgressBarProps {
  colorData: ColorData;
  height?: number;
  showIndividualParts?: boolean; // New prop to show individual speaking parts
}

const RoleProgressBar: React.FC<RoleProgressBarProps> = ({ 
  colorData, 
  height = 4, 
  showIndividualParts = true 
}) => {
  const { colors, isDarkMode } = useAppSettings();
  const total = colorData.total;
  
  // Create darker versions of the bubble colors for better visibility
  const progressColors = {
    black: isDarkMode ? '#555555' : '#CCCCCC',
    red: isDarkMode ? '#8B4444' : '#FFB3B3', 
    green: isDarkMode ? '#4A8B4A' : '#B3FFB3',
    blue: isDarkMode ? '#4A4A8B' : '#B3D9FF',
  };
  
  if (total === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={[styles.emptyBar, { height, backgroundColor: colors.border }]} />
      </View>
    );
  }

  if (!showIndividualParts) {
    // Original grouped behavior - shows word-based proportions
    const blackPercent = (colorData.black / total) * 100;
    const redPercent = (colorData.red / total) * 100;
    const greenPercent = (colorData.green / total) * 100;
    const bluePercent = (colorData.blue / total) * 100;

    const segments = [
      { color: progressColors.black, percent: blackPercent, label: 'Narrator' },
      { color: progressColors.red, percent: redPercent, label: 'God' },
      { color: progressColors.green, percent: greenPercent, label: 'Main Character' },
      { color: progressColors.blue, percent: bluePercent, label: 'Other Voices' },
    ].filter(segment => segment.percent > 0);

    return (
      <View style={[styles.container, { height }]}>
        <View style={[styles.progressBar, { height, backgroundColor: colors.border }]}>
          {segments.map((segment, index) => (
            <View
              key={index}
              style={[
                styles.segment,
                {
                  backgroundColor: segment.color,
                  flex: segment.percent,
                  height,
                  borderTopLeftRadius: index === 0 ? height / 2 : 0,
                  borderBottomLeftRadius: index === 0 ? height / 2 : 0,
                  borderTopRightRadius: index === segments.length - 1 ? height / 2 : 0,
                  borderBottomRightRadius: index === segments.length - 1 ? height / 2 : 0,
                }
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  // Individual parts behavior: Show proportional reading roles based on word counts
  // This represents how the 4 reading roles share the speaking time
  const individualParts: Array<{ 
    color: string; 
    type: string; 
    roleNumber: number;
    wordCount: number;
    proportion: number;
  }> = [];
  
  const maxRoles = 4;
  
  // Get colors with word counts, sorted by speaking time (most to least)
  const colorsByWordCount = [
    { color: 'black', count: colorData.black, progressColor: progressColors.black, label: 'Narrator' },
    { color: 'red', count: colorData.red, progressColor: progressColors.red, label: 'God' },
    { color: 'green', count: colorData.green, progressColor: progressColors.green, label: 'Main Character' },
    { color: 'blue', count: colorData.blue, progressColor: progressColors.blue, label: 'Other Voices' },
  ]
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);
  
  let rolesAssigned = 0;
  
  // Distribute roles based on speaking time, with larger roles potentially getting multiple readers
  colorsByWordCount.forEach(({ color, count, progressColor, label }) => {
    if (rolesAssigned >= maxRoles) return;
    
    const remainingRoles = maxRoles - rolesAssigned;
    const totalRemainingWords = colorsByWordCount
      .slice(colorsByWordCount.findIndex(c => c.color === color))
      .reduce((sum, c) => sum + c.count, 0);
    
    // Determine how many roles this color should get based on its proportion
    // Colors with more speaking time may get multiple readers to balance the workload
    let rolesToAssign = 1;
    
    if (remainingRoles > 1 && count > totalRemainingWords * 0.6) {
      // If this color has >60% of remaining words, give it multiple readers
      rolesToAssign = Math.min(2, remainingRoles);
    } else {
      rolesToAssign = 1;
    }
    
    // Create the individual parts with proper word count proportions
    const wordsPerRole = count / rolesToAssign;
    
    for (let i = 0; i < rolesToAssign; i++) {
      individualParts.push({ 
        color: progressColor, 
        type: color,
        roleNumber: i + 1,
        wordCount: wordsPerRole,
        proportion: wordsPerRole / total
      });
      rolesAssigned++;
    }
  });

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.progressBar, { height, backgroundColor: colors.border }]}>
        {individualParts.map((part, index) => (
          <React.Fragment key={index}>
            <View
              style={[
                styles.segment,
                {
                  backgroundColor: part.color,
                  flex: part.proportion * 100, // Use proportional width based on word count
                  height,
                  borderTopLeftRadius: index === 0 ? height / 2 : 0,
                  borderBottomLeftRadius: index === 0 ? height / 2 : 0,
                  borderTopRightRadius: index === individualParts.length - 1 ? height / 2 : 0,
                  borderBottomRightRadius: index === individualParts.length - 1 ? height / 2 : 0,
                }
              ]}
            />
            {/* Add more visible divider between different roles */}
            {index < individualParts.length - 1 && (
              <View
                style={[
                  styles.divider,
                  {
                    width: 1,
                    height: height,
                    backgroundColor: isDarkMode ? '#666666' : '#E0E0E0',
                  }
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  segment: {
    minWidth: 2, // Ensure very small segments are still visible
  },
  emptyBar: {
    width: '100%',
    borderRadius: 2,
  },
  divider: {
    // Subtle divider between different role types
  },
});

export default RoleProgressBar; 