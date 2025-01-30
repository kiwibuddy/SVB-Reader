import { FlatList, View, Text } from 'react-native';

export default function BibleScreen() {
    return (
        <FlatList
            data={[]} // Replace with your actual data array
            renderItem={({ item }) => (
                <View>
                    <Text>{item.title}</Text>
                </View>
            )}
        />
    );
}