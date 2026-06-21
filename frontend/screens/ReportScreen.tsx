import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { crearIncidencia, getCurrentUser, CategoriaIncidencia, Prioridad, CrearIncidenciaData } from '../service/auth.api';

export default function ReportScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<CategoriaIncidencia>('HARDWARE');
  const [prioridad, setPrioridad] = useState<Prioridad>('MEDIA');
  const [ubicacion, setUbicacion] = useState('');
  const [equipo, setEquipo] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const categorias = [
    { label: '💻 Hardware', value: 'HARDWARE' as CategoriaIncidencia, icon: 'desktop-outline', color: '#2196F3' },
    { label: '📱 Software', value: 'SOFTWARE' as CategoriaIncidencia, icon: 'code-slash-outline', color: '#4CAF50' },
    { label: '🌐 Red', value: 'RED' as CategoriaIncidencia, icon: 'wifi-outline', color: '#FF9800' },
    { label: '🔧 Otro', value: 'OTRO' as CategoriaIncidencia, icon: 'construct-outline', color: '#9C27B0' },
  ];

  const prioridades = [
    { label: 'Baja', value: 'BAJA' as Prioridad, color: '#4CAF50', icon: 'arrow-down-circle-outline' },
    { label: 'Media', value: 'MEDIA' as Prioridad, color: '#FF9800', icon: 'remove-circle-outline' },
    { label: 'Alta', value: 'ALTA' as Prioridad, color: '#F44336', icon: 'arrow-up-circle-outline' },
    { label: 'Crítica', value: 'CRITICA' as Prioridad, color: '#D32F2F', icon: 'alert-circle-outline' },
  ];

  const tomarFoto = async () => {
    if (fotos.length >= 3) {
      Alert.alert('Límite alcanzado', 'Solo puedes subir un máximo de 3 fotos de evidencia');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64String = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFotos([...fotos, base64String]);
    }
  };

  const seleccionarImagen = async () => {
    const disponibles = 3 - fotos.length;
    if (disponibles <= 0) {
      Alert.alert('Límite alcanzado', 'Solo puedes subir un máximo de 3 fotos de evidencia');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      let nuevas = result.assets
        .map(asset => asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : '')
        .filter(base64 => base64 !== '');
      if (nuevas.length > disponibles) {
        Alert.alert('Límite', `Solo puedes seleccionar hasta ${disponibles} fotos. Se añadirán las primeras ${disponibles}.`);
        nuevas = nuevas.slice(0, disponibles);
      }
      setFotos([...fotos, ...nuevas]);
    }
  };

  const eliminarFoto = (index: number) => {
    const nuevasFotos = [...fotos];
    nuevasFotos.splice(index, 1);
    setFotos(nuevasFotos);
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }

    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión');
        navigation.replace('Login');
        return;
      }

      const data: CrearIncidenciaData = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria: categoria,
        prioridad: prioridad,
        ubicacion: ubicacion.trim() || undefined,
        equipo: equipo.trim() || undefined,
        evidencias: fotos.length > 0 ? fotos : undefined,
      };

      const response = await crearIncidencia(data);

      if (response.success) {
        Alert.alert('Éxito', 'Incidencia reportada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'No se pudo crear el reporte');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const categoriaSeleccionada = categorias.find(c => c.value === categoria);
  const prioridadSeleccionada = prioridades.find(p => p.value === prioridad);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tarjeta de información */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#1A237E" />
            <Text style={styles.infoText}>
              Complete todos los campos para reportar una incidencia técnica
            </Text>
          </View>

          {/* Título */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="create-outline" size={16} color="#1A237E" /> Título *
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Computadora no enciende"
              placeholderTextColor="#999"
              value={titulo}
              onChangeText={setTitulo}
            />
          </View>

          {/* Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="document-text-outline" size={16} color="#1A237E" /> Descripción *
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe el problema detalladamente..."
              placeholderTextColor="#999"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Categoría */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="folder-outline" size={16} color="#1A237E" /> Categoría
            </Text>
            <View style={styles.optionsContainer}>
              {categorias.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.optionCard,
                    categoria === cat.value && { borderColor: cat.color, backgroundColor: `${cat.color}10` }
                  ]}
                  onPress={() => setCategoria(cat.value)}
                >
                  <Ionicons name={cat.icon as any} size={28} color={categoria === cat.value ? cat.color : '#999'} />
                  <Text style={[styles.optionText, categoria === cat.value && { color: cat.color, fontWeight: 'bold' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prioridad */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="flag-outline" size={16} color="#1A237E" /> Prioridad
            </Text>
            <View style={styles.prioridadContainer}>
              {prioridades.map((pri) => (
                <TouchableOpacity
                  key={pri.value}
                  style={[
                    styles.prioridadButton,
                    prioridad === pri.value && { backgroundColor: pri.color, borderColor: pri.color }
                  ]}
                  onPress={() => setPrioridad(pri.value)}
                >
                  <Ionicons 
                    name={pri.icon as any} 
                    size={18} 
                    color={prioridad === pri.value ? '#fff' : pri.color} 
                  />
                  <Text style={[
                    styles.prioridadButtonText,
                    prioridad === pri.value && { color: '#fff' }
                  ]}>
                    {pri.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Equipo y Ubicación en fila */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>
                <Ionicons name="desktop-outline" size={16} color="#1A237E" /> Equipo (opcional)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Laptop HP "
                placeholderTextColor="#999"
                value={equipo}
                onChangeText={setEquipo}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>
                <Ionicons name="location-outline" size={16} color="#1A237E" /> Ubicación
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Oficina 301"
                placeholderTextColor="#999"
                value={ubicacion}
                onChangeText={setUbicacion}
              />
            </View>
          </View>

          {/* Fotos */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="camera-outline" size={16} color="#1A237E" /> Evidencias
            </Text>
            <View style={styles.fotosContainer}>
              <TouchableOpacity style={styles.fotoButton} onPress={tomarFoto}>
                <Ionicons name="camera-outline" size={24} color="#fff" />
                <Text style={styles.fotoButtonText}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fotoButton} onPress={seleccionarImagen}>
                <Ionicons name="images-outline" size={24} color="#fff" />
                <Text style={styles.fotoButtonText}>Galería</Text>
              </TouchableOpacity>
            </View>

            {/* Vista previa de fotos */}
            {fotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewContainer}>
                {fotos.map((foto, index) => (
                  <View key={index} style={styles.previewItem}>
                    <Image source={{ uri: foto }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => eliminarFoto(index)}
                    >
                      <Ionicons name="close-circle" size={22} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Botón enviar */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={22} color="#fff" />
                <Text style={styles.submitButtonText}>Reportar Incidencia</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { padding: 16, paddingBottom: 48 },

  // Info Banner
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', borderRadius: 14,
    padding: 14, marginBottom: 20, gap: 12,
    borderLeftWidth: 4, borderLeftColor: '#1A237E',
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#1A237E', lineHeight: 19 },

  // Inputs
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#334155', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 14,
    fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#1E293B',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },

  // Category Cards (2x2 grid)
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard: {
    width: '47%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E2E8F0',
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 8,
  },
  optionText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#64748B' },

  // Priority Pills
  prioridadContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prioridadButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 25, paddingVertical: 10, paddingHorizontal: 12,
  },
  prioridadButtonText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#64748B' },

  // Row
  rowContainer: { flexDirection: 'row', gap: 12 },

  // Photo
  fotosContainer: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  fotoButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#1A237E',
    paddingVertical: 14, borderRadius: 14,
  },
  fotoButtonText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  previewContainer: { flexDirection: 'row', marginTop: 8 },
  previewItem: { position: 'relative', marginRight: 12 },
  previewImage: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: '#E2E8F0' },
  deleteButton: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },

  // Submit
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#1A237E', paddingVertical: 17, borderRadius: 16, marginTop: 8,
    elevation: 4, shadowColor: '#1A237E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },

  // Legacy (kept for header ref in navigation)
  header: { backgroundColor: '#1A237E', paddingBottom: 16, paddingHorizontal: 16, elevation: 4 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff' },
});