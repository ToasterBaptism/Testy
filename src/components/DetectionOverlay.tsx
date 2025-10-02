import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface Detection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  type: 'enemy' | 'weapon' | 'item';
}

interface DetectionOverlayProps {
  detections: Detection[];
  visible: boolean;
  aimPoint?: {x: number; y: number};
}

const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  detections,
  visible,
  aimPoint,
}) => {
  if (!visible) {
    return null;
  }

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const getDetectionColor = (type: string) => {
    switch (type) {
      case 'enemy': return '#FF0000';
      case 'weapon': return '#00FF00';
      case 'item': return '#0000FF';
      default: return '#FFFFFF';
    }
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Detection boxes */}
      {detections.map((detection) => (
        <View
          key={detection.id}
          style={[
            styles.detectionBox,
            {
              left: detection.x,
              top: detection.y,
              width: detection.width,
              height: detection.height,
              borderColor: getDetectionColor(detection.type),
            },
          ]}
        >
          <Text style={[styles.confidenceText, {color: getDetectionColor(detection.type)}]}>
            {Math.round(detection.confidence * 100)}%
          </Text>
        </View>
      ))}

      {/* Aim point indicator */}
      {aimPoint && (
        <View
          style={[
            styles.aimPoint,
            {
              left: aimPoint.x - 10,
              top: aimPoint.y - 10,
            },
          ]}
        >
          <View style={styles.aimCrosshair} />
        </View>
      )}

      {/* Debug info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Detections: {detections.length}
        </Text>
        {aimPoint && (
          <Text style={styles.debugText}>
            Aim: ({Math.round(aimPoint.x)}, {Math.round(aimPoint.y)})
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  detectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    position: 'absolute',
    top: -20,
    left: 0,
  },
  aimPoint: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aimCrosshair: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FFFF00',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  debugInfo: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default DetectionOverlay;