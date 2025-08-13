import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Path, G, Rect } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

interface AnimatedLogoSVGProps {
  size?: number;
  enableBreathing?: boolean;
}

export const AnimatedLogoSVG: React.FC<AnimatedLogoSVGProps> = ({
  size = 120,
  enableBreathing = true,
}) => {
  // Animation values for each speech bubble
  const pinkBubbleScale = useSharedValue(1);
  const greenBubbleScale = useSharedValue(1);
  const blueBubbleScale = useSharedValue(1);
  const pinkOpacity = useSharedValue(1);
  const greenOpacity = useSharedValue(1);
  const blueOpacity = useSharedValue(1);

  useEffect(() => {
    if (!enableBreathing) return;

    // Pink bubble animation (largest, starts immediately)
    pinkBubbleScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
    
    pinkOpacity.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    // Green bubble animation (medium, 200ms delay)
    setTimeout(() => {
      greenBubbleScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
      
      greenOpacity.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    }, 200);

    // Blue bubble animation (smallest, 400ms delay)
    setTimeout(() => {
      blueBubbleScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
      
      blueOpacity.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    }, 400);
  }, [enableBreathing, pinkBubbleScale, pinkOpacity, greenBubbleScale, greenOpacity, blueBubbleScale, blueOpacity]);

  // Animated props for each bubble
  const pinkBubbleProps = useAnimatedProps(() => ({
    opacity: pinkOpacity.value,
    transform: `scale(${pinkBubbleScale.value})`,
  }));

  const greenBubbleProps = useAnimatedProps(() => ({
    opacity: greenOpacity.value,
    transform: `scale(${greenBubbleScale.value})`,
  }));

  const blueBubbleProps = useAnimatedProps(() => ({
    opacity: blueOpacity.value,
    transform: `scale(${blueBubbleScale.value})`,
  }));

  const viewBoxSize = 256;
  const scale = size / viewBoxSize;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        style={styles.svg}
      >
        {/* Background */}
        <Rect x="0" y="0" width="256" height="256" fill="#808080" />
        
        {/* Blue bubble (smallest, animated) */}
        <AnimatedG
          animatedProps={blueBubbleProps}
          origin={`${176.282 + 22}, ${178.154 + 22}`} // Center of blue bubble
        >
          <Path
            d="M176.282,178.154c-6.64-2.24-14.519-4.567-22.986-4.57c-11.294,0.008-21.536,2.266-29.188,6.079
            c-3.825,1.918-7.019,4.228-9.341,6.968c-2.317,2.723-3.762,7.027-3.756,10.518c-0.006,3.488,1.438,6.746,3.756,9.467
            c3.49,4.104,8.91,7.275,15.542,9.525c6.639,2.241,14.52,3.521,22.986,3.521c4.422,0,8.682-0.352,12.688-1.001l14.77,14.771
            v-19.039c4.023-1.799,7.434-4.006,10.018-6.627c2.928-2.965,4.813-6.617,4.81-10.617c0.004-3.489-1.44-6.744-3.754-9.467
            C188.332,183.577,182.911,180.406,176.282,178.154z"
            fill="#8CE3FF"
          />
        </AnimatedG>

        {/* Pink bubble (largest, animated) */}
        <AnimatedG
          animatedProps={pinkBubbleProps}
          origin={`${190}, ${110}`} // Center of pink bubble
        >
          <Path
            d="M240.492,92.208c-1.912-4.065-4.641-7.794-7.98-11.197c-5.881-5.97-13.643-10.993-22.808-15.087V22.57
            L176.07,56.205c-6.848-1.113-14.018-1.251-21.424-1.251c-2.424,0-4.875,0.016-7.347,0.016c-0.038,0-0.077,0-0.12,0
            c-19.284,0.005-37.228,2.918-52.34,8.018c-15.1,5.13-27.44,12.351-35.391,21.692c-5.275,6.204-8.566,13.609-8.554,21.56
            c-0.007,3.224,0.542,6.358,1.535,9.36c9.523-2.494,19.517-3.817,29.386-3.825h0.002h0.003
            c14.042,0.005,27.655,2.095,39.378,6.053c12.295,4.177,21.65,9.967,27.813,17.206c4.864,5.722,7.432,12.282,7.424,18.959
            c0.004,1.077-0.088,2.149-0.219,3.221c15.846-0.998,30.584-4.476,43.307-8.769c15.099-5.131,27.438-12.354,35.39-21.692
            c5.274-6.202,8.563-13.61,8.555-21.56C243.469,100.666,242.402,96.263,240.492,92.208z"
            fill="#FCC1C3"
          />
        </AnimatedG>

        {/* Green bubble (medium, animated) */}
        <AnimatedG
          animatedProps={greenBubbleProps}
          origin={`${80}, ${150}`} // Center of green bubble
        >
          <Path
            d="M110.699,183.182c2.703-3.188,6.414-5.976,11.029-8.287c6.693-3.34,15.006-5.486,23.936-6.281
            c3.361-4.275,5.447-9.271,5.439-14.612c0.008-5.724-2.359-11.054-6.152-15.515c-5.723-6.723-14.605-11.919-25.469-15.611
            c-10.875-3.671-23.788-5.764-37.661-5.769c-18.505,0.013-35.288,4.758-47.825,11.012c-6.267,3.14-11.498,6.926-15.306,11.416
            c-3.796,4.466-6.163,9.792-6.157,15.512c-0.002,3.261,0.766,6.429,2.145,9.347c2.066,4.385,5.432,8.227,9.678,11.563
            c3.563,2.788,7.76,5.243,12.473,7.349v31.19l24.203-25.244c6.568,1.067,13.549,2.688,20.79,2.688
            c9.019-0.006,17.622-1.142,25.532-3.024C108.207,186.777,109.338,184.786,110.699,183.182z"
            fill="#B8F8BA"
          />
        </AnimatedG>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    borderRadius: 16, // Apple-style rounded corners
  },
});
