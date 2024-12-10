import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    // alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderColor: Colors.light.tint,
    borderWidth: 2,
  },
  header: {
    marginRight: -32,
    marginTop: -32,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  textStyle: {
    color: Colors.light.tint,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  headerTextStyle: {
    color: Colors.light.tint,
    fontWeight: 'bold',
    textAlign: 'right',
    fontSize: 20,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  title: {
    alignItems: 'center',
    marginTop: 12,
    flexGrow: 1,
  },
});

interface ExpoModalProps {
  title: string;
  modalVisible: boolean;
  onClose: () => void;
  children: React.ReactNode; // Allows any valid React node as children
}

export default function ExpoModal({ title, modalVisible, onClose, children }: ExpoModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={modalVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <View style={styles.title}>
              <Text style={styles.headerTextStyle}>{title.toUpperCase()}</Text>
            </View>
            <TouchableHighlight style={styles.closeButton} onPress={onClose}>
              <Text style={styles.textStyle}>X</Text>
            </TouchableHighlight>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
