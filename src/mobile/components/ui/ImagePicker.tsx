import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  spacing,
  typography,
  borderRadius,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface ImagePickerProps {
  imageUri?: string;
  onImageSelect: (uri: string) => void;
  label?: string;
  error?: string;
}

export function ImagePicker({
  imageUri,
  onImageSelect,
  label,
  error,
}: ImagePickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const { status } =
        await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar suas fotos.',
        );
        return false;
      }
    }
    return true;
  }, []);

  const pickImage = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  }, [onImageSelect, requestPermission]);

  const takePhoto = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para usar a câmera.',
        );
        return;
      }

      const result = await ExpoImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  }, [onImageSelect, requestPermission]);

  const showOptions = useCallback(() => {
    Alert.alert(
      'Selecionar Imagem',
      'Escolha uma opção',
      [
        { text: 'Câmera', onPress: takePhoto },
        { text: 'Galeria', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true },
    );
  }, [takePhoto, pickImage]);

  const removeImage = useCallback(() => {
    Alert.alert('Remover Imagem', 'Tem certeza que deseja remover a imagem?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => onImageSelect(''),
      },
    ]);
  }, [onImageSelect]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            accessibilityLabel={label ? `Imagem de ${label}` : 'Imagem'}
          />
          <View style={styles.imageOverlay}>
            <Pressable
              style={styles.overlayButton}
              onPress={showOptions}
              accessibilityRole="button"
              accessibilityLabel="Trocar imagem"
            >
              <Ionicons name="pencil" size={20} color="#ffffff" />
            </Pressable>
            <Pressable
              style={styles.overlayButton}
              onPress={removeImage}
              accessibilityRole="button"
              accessibilityLabel="Remover imagem"
            >
              <Ionicons name="trash" size={20} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={styles.placeholder}
          onPress={showOptions}
          accessibilityRole="button"
          accessibilityLabel="Adicionar imagem"
          accessibilityHint="Abre opções de câmera ou galeria"
        >
          <Ionicons
            name="image-outline"
            size={48}
            color={colors.inkMuted}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.placeholderText}>
            Toque para adicionar uma imagem
          </Text>
          <Text style={styles.placeholderSubtext}>
            Formatos: JPG, PNG, GIF (máximo 5MB)
          </Text>
        </Pressable>
      )}

      {error ? (
        <Text
          style={styles.errorText}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      ...typography.bodySmall,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    imageContainer: {
      position: 'relative',
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: colors.surfaceMuted,
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.md,
    },
    overlayButton: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.round,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholder: {
      aspectRatio: 16 / 9,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: colors.line,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    placeholderText: {
      ...typography.body,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    placeholderSubtext: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    errorText: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.xs,
    },
  });
