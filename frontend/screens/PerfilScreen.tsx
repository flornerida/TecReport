import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  getCurrentUser,
  PerfilData,
} from "../service/auth.api";

export default function PerfilScreen({ navigation }: any) {
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    areaId: "", 
  });

  const [passwordData, setPasswordData] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const response = await obtenerPerfil();
      if (response.success && response.data) {
        setPerfil(response.data);
        setFormData({
          nombre: response.data.nombre || "",
          telefono: response.data.telefono || "",
          areaId: response.data.areaId || "", 
        });
        if (response.data.fotoPerfil) {
          setImagenBase64(response.data.fotoPerfil);
          setImagenUri(`data:image/jpeg;base64,${response.data.fotoPerfil}`);
        } else {
          setImagenBase64(null);
          setImagenUri(null);
        }
      } else {
        Alert.alert("Error", response.message || "No se pudo cargar el perfil");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a la galería");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.3,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!resultado.canceled && resultado.assets?.[0]) {
      const asset = resultado.assets[0];
      setImagenBase64(asset.base64 || null);
      setImagenUri(asset.uri);
    }
  };

  const guardarCambios = async () => {
    if (!formData.nombre.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }

    setSubiendo(true);
    try {
      const response = await actualizarPerfil({
        nombre: formData.nombre,
        telefono: formData.telefono,
        areaId: formData.areaId || undefined,  // ← Actualizar área
        fotoPerfil: imagenBase64 || undefined,
      });

      if (response.success && response.data) {
        setPerfil(response.data);
        setEditando(false);
        Alert.alert("Éxito", "Perfil actualizado correctamente");
      } else {
        Alert.alert("Error", response.message || "No se pudo actualizar");
      }
    } catch (error) {
      Alert.alert("Error", "Error al guardar cambios");
    } finally {
      setSubiendo(false);
    }
  };

  const cambiarContraseña = async () => {
    if (!passwordData.actual || !passwordData.nueva || !passwordData.confirmar) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    if (passwordData.nueva !== passwordData.confirmar) {
      Alert.alert("Error", "Las contraseñas nuevas no coinciden");
      return;
    }
    if (passwordData.nueva.length < 6) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSubiendo(true);
    try {
      const response = await cambiarPassword(passwordData.actual, passwordData.nueva);
      if (response.success) {
        Alert.alert("Éxito", "Contraseña actualizada correctamente");
        setCambiandoPassword(false);
        setPasswordData({ actual: "", nueva: "", confirmar: "" });
      } else {
        Alert.alert("Error", response.message || "No se pudo cambiar la contraseña");
      }
    } catch (error) {
      Alert.alert("Error", "Error al cambiar contraseña");
    } finally {
      setSubiendo(false);
    }
  };
  const usuarioActual = getCurrentUser();
  const rolTexto = () => {
    switch (usuarioActual?.rol) {
      case 'ADMIN': return 'Administrador';
      case 'TECNICO': return 'Técnico de Soporte';
      case 'USUARIO': return 'Usuario';
      default: return 'Usuario';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1A237E" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          {!editando && !cambiandoPassword ? (
            <TouchableOpacity onPress={() => setEditando(true)}>
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setEditando(false);
                setCambiandoPassword(false);
                cargarPerfil();
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.fotoContainer}>
          <View style={styles.fotoWrapper}>
            {imagenUri ? (
              <Image source={{ uri: imagenUri }} style={styles.foto} />
            ) : (
              <View style={[styles.foto, styles.fotoPlaceholder]}>
                <Ionicons name="person" size={50} color="#fff" />
              </View>
            )}
            {editando && (
              <TouchableOpacity style={styles.cambiarFotoBtn} onPress={seleccionarImagen}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.roleBadge}>{rolTexto()}</Text>
        </View>

        {!editando && !cambiandoPassword ? (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nombre completo</Text>
                <Text style={styles.infoValue}>{perfil?.nombre || "No especificado"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Correo electrónico</Text>
                <Text style={styles.infoValue}>{perfil?.email || "No especificado"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{perfil?.telefono || "No especificado"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Área de trabajo</Text>
                <Text style={styles.infoValue}>
                  {perfil?.area?.nombre ? perfil.area.nombre : "No especificada"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.passwordButton}
              onPress={() => {
                setCambiandoPassword(true);
                setEditando(false);
              }}
            >
              <Ionicons name="key-outline" size={18} color="#1A237E" />
              <Text style={styles.passwordButtonText}>Cambiar contraseña</Text>
            </TouchableOpacity>
          </View>
        ) : editando ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Editar perfil</Text>

            <Text style={styles.inputLabel}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Tu nombre completo"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={formData.telefono}
              onChangeText={(text) => setFormData({ ...formData, telefono: text })}
              placeholder="Ej: 987654321"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Área de trabajo</Text>
            <TextInput
              style={styles.input}
              value={formData.areaId}
              onChangeText={(text) => setFormData({ ...formData, areaId: text })}
              placeholder="Nombre del área (ej: Marketing, Sistemas)"
              placeholderTextColor="#999"
            />
            <Text style={styles.inputHint}>
              Puedes ingresar directamente el nombre de tu área o su identificador (ID).
            </Text>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={guardarCambios}
              disabled={subiendo}
            >
              {subiendo ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Formulario de cambio de contraseña
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Cambiar contraseña</Text>

            <Text style={styles.inputLabel}>Contraseña actual</Text>
            <TextInput
              style={styles.input}
              value={passwordData.actual}
              onChangeText={(text) => setPasswordData({ ...passwordData, actual: text })}
              placeholder="Ingresa tu contraseña actual"
              secureTextEntry
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              value={passwordData.nueva}
              onChangeText={(text) => setPasswordData({ ...passwordData, nueva: text })}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Confirmar nueva contraseña</Text>
            <TextInput
              style={styles.input}
              value={passwordData.confirmar}
              onChangeText={(text) => setPasswordData({ ...passwordData, confirmar: text })}
              placeholder="Repite la nueva contraseña"
              secureTextEntry
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={cambiarContraseña}
              disabled={subiendo}
            >
              {subiendo ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Actualizar contraseña</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Header
  header: {
    backgroundColor: "#1A237E",
    padding: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  fotoContainer: {
    alignItems: "center",
    marginTop: -1,
    marginBottom: 20,
  },
  fotoWrapper: {
    position: "relative",
  },
  foto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#1A237E",
  },
  fotoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cambiarFotoBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ff6b00",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  roleBadge: {
    backgroundColor: "#e8eaf6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    fontSize: 12,
    color: "#1A237E",
    fontWeight: "600",
  },
  // Tarjeta de información
  infoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  passwordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1A237E",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  passwordButtonText: {
    color: "#1A237E",
    fontWeight: "600",
    fontSize: 14,
  },
  // Formulario
  formCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A237E",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: "#fafafa",
  },
  inputHint: {
    fontSize: 11,
    color: "#999",
    marginTop: -10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#1A237E",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});