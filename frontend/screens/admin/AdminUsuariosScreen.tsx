import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getCurrentUser, setCurrentUser, getToken, obtenerUsuarios, crearUsuario, eliminarUsuario, Usuario } from "../../service/auth.api";
import { useTheme } from "../../context/ThemeContext";

export default function AdminUsuariosScreen({ navigation }: any) {
  const { colors, theme } = useTheme();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'TECNICO' as 'ADMIN' | 'TECNICO' | 'USUARIO',
    telefono: ''
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        navigation.replace("Login");
        return;
      }
      
      const response = await obtenerUsuarios();
      
      if (response.success && response.data) {
        const tecnicos = response.data.filter((user: Usuario) => user.rol === 'TECNICO');
        setUsuarios(tecnicos);
        console.log(`Cargados ${tecnicos.length} técnicos`);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error("Error cargando técnicos:", error);
      Alert.alert("Error", "Error de conexión");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTecnico = async () => {
    if (!formData.nombre || !formData.email || !formData.password) {
      Alert.alert("Error", "Completa todos los campos obligatorios");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "Ingresa un correo electrónico válido");
      return;
    }
    
    if (formData.password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    try {
      const token = getToken();
      
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        return;
      }
      
      const response = await crearUsuario({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: 'TECNICO',
        telefono: formData.telefono || undefined
      });

      if (response.success) {
        Alert.alert("Éxito", "Técnico creado correctamente");
        setModalVisible(false);
        setFormData({ nombre: '', email: '', password: '', rol: 'TECNICO', telefono: '' });
        cargarUsuarios();
      } else {
        Alert.alert("Error", response.message || "No se pudo crear el técnico");
      }
    } catch (error) {
      console.error("Error al crear técnico:", error);
      Alert.alert("Error", "Error al crear técnico");
    }
  };

  const handleDeleteTecnico = (user: Usuario) => {
    Alert.alert(
      "Eliminar Técnico",
      `¿Estás seguro de eliminar a ${user.nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const token = getToken();
              if (!token) {
                Alert.alert("Error", "No estás autenticado");
                return;
              }
              
              const response = await eliminarUsuario(user.id);

              if (response.success) {
                Alert.alert("Éxito", "Técnico eliminado correctamente");
                cargarUsuarios();
              } else {
                Alert.alert("Error", response.message || "No se pudo eliminar el técnico");
              }
            } catch (error) {
              console.error("Error eliminando técnico:", error);
              Alert.alert("Error", "Error al eliminar técnico");
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, cerrar sesión",
          onPress: () => {
            setCurrentUser(null);
            navigation.replace("Login");
          }
        }
      ]
    );
  };

  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return "Fecha no válida";
    }
  };

  const renderTecnico = ({ item }: { item: Usuario }) => (
    <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="construct" size={24} color={colors.primary} />
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.nombre}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
          <View style={styles.userMeta}>
            <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.roleText}>TÉCNICO</Text>
            </View>
            <Text style={[styles.userDate, { color: colors.textSecondary }]}>
              {formatFecha(item.createdAt)}
            </Text>
          </View>
          {item.telefono && (
            <Text style={[styles.userPhone, { color: colors.textSecondary }]}>
              <Ionicons name="call-outline" size={10} color={colors.textSecondary} /> {item.telefono}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteTecnico(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando técnicos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Técnicos</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.headerButton}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={usuarios}
        renderItem={renderTecnico}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay técnicos registrados</Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Crear primer técnico</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Crear Técnico</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollForm}
              >
                <TextInput
                  style={[styles.input, { backgroundColor: theme === "dark" ? colors.background : "#fafafa", borderColor: colors.border, color: colors.text }]}
                  placeholder="Nombre completo *"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.nombre}
                  onChangeText={(text) => setFormData({...formData, nombre: text})}
                />

                <TextInput
                  style={[styles.input, { backgroundColor: theme === "dark" ? colors.background : "#fafafa", borderColor: colors.border, color: colors.text }]}
                  placeholder="Correo electrónico *"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                />

                <TextInput
                  style={[styles.input, { backgroundColor: theme === "dark" ? colors.background : "#fafafa", borderColor: colors.border, color: colors.text }]}
                  placeholder="Contraseña * (mínimo 6 caracteres)"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                />

                <TextInput
                  style={[styles.input, { backgroundColor: theme === "dark" ? colors.background : "#fafafa", borderColor: colors.border, color: colors.text }]}
                  placeholder="Teléfono (opcional)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  value={formData.telefono}
                  onChangeText={(text) => setFormData({...formData, telefono: text})}
                />

                <Text style={[styles.label, { color: colors.text }]}>Rol (fijo):</Text>
                <View style={[styles.roleFixed, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="construct" size={20} color={colors.primary} />
                  <Text style={[styles.roleFixedText, { color: colors.primary }]}>TÉCNICO DE SOPORTE</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.createButton, { backgroundColor: colors.primary }]}
                  onPress={handleCreateTecnico}
                >
                  <Text style={styles.createButtonText}>Crear Técnico</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa"
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa"
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666"
  },
  header: {
    backgroundColor: "#1A237E",
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff"
  },
  headerRight: {
    flexDirection: "row",
    gap: 15
  },
  headerButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  list: {
    padding: 16,
    paddingBottom: 30
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A237E",
    marginBottom: 2
  },
  userEmail: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  roleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold"
  },
  userDate: {
    fontSize: 10,
    color: "#999"
  },
  userPhone: {
    fontSize: 11,
    color: "#999",
    marginTop: 4
  },
  userActions: {
    flexDirection: "row",
    gap: 10
  },
  actionButton: {
    padding: 8
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#999",
    marginBottom: 20
  },
  emptyButton: {
    backgroundColor: "#1A237E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600"
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalContainer: {
    justifyContent: "flex-end",
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A237E"
  },
  scrollForm: {
    paddingBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    backgroundColor: "#fafafa"
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 5
  },
  roleFixed: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8eaf6",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10
  },
  roleFixedText: {
    fontSize: 14,
    color: "#1A237E",
    fontWeight: "600"
  },
  createButton: {
    backgroundColor: "#1A237E",
    padding: 15,
    borderRadius: 12,
    alignItems: "center"
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }
});