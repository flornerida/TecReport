import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getCurrentUser, setCurrentUser, getToken, obtenerUsuarios, obtenerIncidencias, Usuario } from "../../service/auth.api";
import { useTheme } from "../../context/ThemeContext";

type TecnicoConConteo = Usuario & {
  incidenciasCount: number;
};

export default function TecnicosListScreen({ navigation }: any) {
  const { colors, theme } = useTheme();
  const [tecnicos, setTecnicos] = useState<TecnicoConConteo[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarTecnicos();
    }, [])
  );

  const cargarTecnicos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        navigation.replace("Login");
        return;
      }

      const resUsuarios = await obtenerUsuarios();
      
      if (!resUsuarios || !resUsuarios.success) {
        console.log("Error obteniendo usuarios:", resUsuarios?.message);
        setTecnicos([]);
        return;
      }
      
      const usuariosData = resUsuarios.data || [];
      
      const tecnicosList = usuariosData.filter((t: Usuario) => t.rol === 'TECNICO');
      
      const resIncidencias = await obtenerIncidencias();
      const incidencias = resIncidencias.success && resIncidencias.data ? resIncidencias.data : [];
      
      const tecnicosConConteo = tecnicosList.map((tecnico: Usuario) => {
        const incidenciasCount = incidencias.filter(
          (inc: any) => inc.tecnicoAsignadoId === tecnico.id
        ).length;
        
        return {
          ...tecnico,
          incidenciasCount
        };
      });
      
      setTecnicos(tecnicosConConteo);
      console.log(`Cargados ${tecnicosConConteo.length} técnicos`);
      
    } catch (error) {
      console.error("Error cargando técnicos:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
      setTecnicos([]);
    } finally {
      setLoading(false);
    }
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

  const renderTecnico = ({ item }: { item: TecnicoConConteo }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate("TecnicoDetalle", {
        tecnicoId: item.id,
        tecnicoNombre: item.nombre
      })}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>{item.nombre.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.nombre, { color: colors.text }]}>{item.nombre}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
        <View style={styles.stats}>
          <Ionicons name="clipboard-outline" size={14} color={colors.primary} />
          <Text style={[styles.statsText, { color: colors.primary }]}>
            {item.incidenciasCount} {item.incidenciasCount === 1 ? "incidencia asignada" : "incidencias asignadas"}
          </Text>
        </View>
        {item.telefono && (
          <View style={styles.phone}>
            <Ionicons name="call-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.phoneText, { color: colors.textSecondary }]}>{item.telefono}</Text>
          </View>
        )}
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          Desde: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Supervisión de Técnicos</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={cargarTecnicos} style={styles.headerButton}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.counterContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.counterText, { color: colors.textSecondary }]}>
          Total de técnicos: <Text style={[styles.counterNumber, { color: colors.primary }]}>{tecnicos.length}</Text>
        </Text>
      </View>

      <FlatList
        data={tecnicos}
        renderItem={renderTecnico}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay técnicos registrados</Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate("AdminUsuarios")}
            >
              <Text style={styles.emptyButtonText}>Ir a crear técnico</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center"
  },
  headerRight: {
    flexDirection: "row",
    gap: 12
  },
  headerButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  counterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  counterText: {
    fontSize: 14,
    color: "#666"
  },
  counterNumber: {
    fontWeight: "bold",
    color: "#1A237E",
    fontSize: 16
  },
  list: {
    padding: 16,
    paddingBottom: 30
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#1A237E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold"
  },
  info: {
    flex: 1
  },
  nombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A237E",
    marginBottom: 2
  },
  email: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3
  },
  statsText: {
    fontSize: 12,
    color: "#1A237E",
    fontWeight: "500"
  },
  phone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2
  },
  phoneText: {
    fontSize: 11,
    color: "#999"
  },
  date: {
    fontSize: 10,
    color: "#bbb",
    marginTop: 2
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
});