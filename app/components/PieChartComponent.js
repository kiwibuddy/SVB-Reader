import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { View } from 'react-native';

export default function PieChartComponent() {
    return (
        <View>
            <Canvas style={{ width: 200, height: 200 }}>
                {/* Your chart content will go here */}
            </Canvas>
        </View>
    );
}

// Make sure you're using the correct chart component
// Consider using a different chart library if the issue persists