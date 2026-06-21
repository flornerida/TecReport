import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { obtenerIncidencias, getCurrentUser, Usuario, Incidencia } from "../service/auth.api";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/CustomToast";
import { SkeletonCardList } from "../components/SkeletonLoader";
import { FAB } from "../components/FloatingActionButton";
import { useSidebar } from "../context/SidebarContext";

type RootStackParamList = {
  PanelUsuario: undefined;
  Report: undefined;
  MisReportes: undefined;
  Perfil: undefined;
  Login: undefined;
  ReporteDetalle: { reporteId: string };
};

type PanelUsuarioNavigationProp = NativeStackNavigationProp<RootStackParamList, "PanelUsuario">;
type Props = { navigation: PanelUsuarioNavigationProp };

const getPrioridadConfig = (prioridad: string, theme: "light" | "dark") => {
  const isDark = theme === "dark";
  switch (prioridad) {
    case "CRITICA": return { color: "#EF4444", bg: isDark ? "rgba(239, 68, 68, 0.18)" : "#FEE2E2", label: "Crítica" };
    case "ALTA": return { color: "#F97316", bg: isDark ? "rgba(249, 115, 22, 0.18)" : "#FFEDD5", label: "Alta" };
    case "MEDIA": return { color: "#F59E0B", bg: isDark ? "rgba(245, 158, 11, 0.18)" : "#FEF3C7", label: "Media" };
    case "BAJA": return { color: "#10B981", bg: isDark ? "rgba(16, 185, 129, 0.18)" : "#D1FAE5", label: "Baja" };
    default: return { color: "#64748B", bg: isDark ? "rgba(100, 116, 139, 0.18)" : "#F1F5F9", label: prioridad };
  }
};

const getEstadoConfig = (estado: string, theme: "light" | "dark") => {
  const isDark = theme === "dark";
  switch (estado) {
    case "RECIBIDO": return { color: "#3B82F6", bg: isDark ? "rgba(59, 130, 246, 0.18)" : "#DBEAFE", label: "Recibido" };
    case "EN_EVALUACION": return { color: "#D97706", bg: isDark ? "rgba(217, 119, 6, 0.18)" : "#FEF3C7", label: "Evaluación" };
    case "EN_EJECUCION": return { color: "#8B5CF6", bg: isDark ? "rgba(139, 92, 246, 0.18)" : "#EDE9FE", label: "Ejecución" };
    case "FINALIZADO": return { color: "#EF4444", bg: isDark ? "rgba(239, 68, 68, 0.18)" : "#FEE2E2", label: "Finalizado" };
    case "COMPLETADO": return { color: "#10B981", bg: isDark ? "rgba(16, 185, 129, 0.18)" : "#D1FAE5", label: "Completado" };
    default: return { color: "#64748B", bg: isDark ? "rgba(100, 116, 139, 0.18)" : "#F1F5F9", label: estado };
  }
};

const getCategoriaIcono = (categoria: string): string => {
  switch (categoria) {
    case "HARDWARE": return "desktop-outline";
    case "SOFTWARE": return "code-slash-outline";
    case "RED": return "wifi-outline";
    default: return "help-buoy-outline";
  }
};

const formatearFecha = (fechaStr: string) => {
  try {
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diffHoras = Math.floor((ahora.getTime() - fecha.getTime()) / 3600000);
    if (diffHoras < 1) return "Hace unos minutos";
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffHoras < 48) return "Ayer";
    return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  } catch {
    return "Fecha inválida";
  }
};

export default function PanelUsuario({ navigation }: Props) {
  const { colors, theme } = useTheme();
  const { showToast } = useToast();
  const { toggleSidebar } = useSidebar();

  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [incidenciasFiltradas, setIncidenciasFiltradas] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [filtroVisible, setFiltroVisible] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [filtroPrioridad, setFiltroPrioridad] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useFocusEffect(
    useCallback(() => {
      const user = getCurrentUser();
      setUsuario(user);
      cargarIncidencias();
    }, [])
  );

  const cargarIncidencias = async () => {
    try {
      setRefreshing(true);
      const res = await obtenerIncidencias();
      if (res.success && Array.isArray(res.data)) {
        setIncidencias(res.data);
        aplicarFiltros(res.data, filtroEstado, filtroPrioridad, busqueda);
      } else {
        setIncidencias([]);
        setIncidenciasFiltradas([]);
      }
    } catch {
      showToast("Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const aplicarFiltros = (
    data: Incidencia[],
    estado: string | null,
    prioridad: string | null,
    texto: string
  ) => {
    let filtradas = [...data];
    if (estado) filtradas = filtradas.filter((inc) => inc.estado === estado);
    if (prioridad) filtradas = filtradas.filter((inc) => inc.prioridad === prioridad);
    if (texto.trim() !== "") {
      const busquedaLower = texto.toLowerCase();
      filtradas = filtradas.filter(
        (inc) =>
          inc.titulo.toLowerCase().includes(busquedaLower) ||
          inc.descripcion.toLowerCase().includes(busquedaLower)
      );
    }
    filtradas.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
    setIncidenciasFiltradas(filtradas);
  };

  const handleFiltroEstado = (estado: string | null) => {
    const nuevoEstado = filtroEstado === estado ? null : estado;
    setFiltroEstado(nuevoEstado);
    aplicarFiltros(incidencias, nuevoEstado, filtroPrioridad, busqueda);
  };

  const handleFiltroPrioridad = (prioridad: string | null) => {
    const nuevoPrioridad = filtroPrioridad === prioridad ? null : prioridad;
    setFiltroPrioridad(nuevoPrioridad);
    aplicarFiltros(incidencias, filtroEstado, nuevoPrioridad, busqueda);
  };

  const handleBusqueda = (texto: string) => {
    setBusqueda(texto);
    aplicarFiltros(incidencias, filtroEstado, filtroPrioridad, texto);
  };

  const limpiarFiltros = () => {
    setFiltroEstado(null);
    setFiltroPrioridad(null);
    setBusqueda("");
    aplicarFiltros(incidencias, null, null, "");
    setFiltroVisible(false);
    showToast("Filtros limpiados", "info");
  };

  const verDetalle = (incidenciaId: string) => {
    navigation.navigate("ReporteDetalle", { reporteId: incidenciaId });
  };

  const totalIncidencias = incidencias.length;
  const incidenciasPendientes = incidencias.filter((i) =>
    ["RECIBIDO", "EN_EVALUACION", "EN_EJECUCION"].includes(i.estado)
  ).length;
  const incidenciasResueltas = incidencias.filter((i) =>
    ["FINALIZADO", "COMPLETADO"].includes(i.estado)
  ).length;

  const renderIncidencia = ({ item }: { item: Incidencia }) => {
    const priConfig = getPrioridadConfig(item.prioridad, theme);
    const estConfig = getEstadoConfig(item.estado, theme);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => verDetalle(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.categoryIconBg, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={getCategoriaIcono(item.categoria) as any} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitulo, { color: colors.text }]} numberOfLines={1}>
              {item.titulo}
            </Text>
          </View>
          <View style={[styles.prioridadBadge, { backgroundColor: priConfig.bg }]}>
            <Text style={[styles.prioridadTexto, { color: priConfig.color }]}>{priConfig.label}</Text>
          </View>
        </View>

        <Text style={[styles.cardDescripcion, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.descripcion}
        </Text>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={[styles.estadoBadge, { backgroundColor: estConfig.bg }]}>
            <Text style={[styles.estadoTexto, { color: estConfig.color }]}>{estConfig.label}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.cardFecha, { color: colors.textSecondary }]}>
              {formatearFecha(item.fechaHora)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFiltrosModal = () => (
    <Modal visible={filtroVisible} transparent animationType="slide" onRequestClose={() => setFiltroVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitulo, { color: colors.text }]}>Filtros Avanzados</Text>
            <TouchableOpacity onPress={() => setFiltroVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.filtroSeccion, { color: colors.text }]}>Estado</Text>
            <View style={styles.filtroOpciones}>
              {["RECIBIDO", "EN_EVALUACION", "EN_EJECUCION", "FINALIZADO", "COMPLETADO"].map((estado) => {
                const config = getEstadoConfig(estado, theme);
                const isSelected = filtroEstado === estado;
                return (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.filtroChip,
                      { backgroundColor: isSelected ? colors.primary : colors.background, borderColor: colors.border },
                    ]}
                    onPress={() => handleFiltroEstado(estado)}
                  >
                    <Text style={[styles.filtroChipTexto, { color: isSelected ? "#FFFFFF" : colors.textSecondary }]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.filtroSeccion, { color: colors.text }]}>Prioridad</Text>
            <View style={styles.filtroOpciones}>
              {["CRITICA", "ALTA", "MEDIA", "BAJA"].map((prioridad) => {
                const config = getPrioridadConfig(prioridad, theme);
                const isSelected = filtroPrioridad === prioridad;
                return (
                  <TouchableOpacity
                    key={prioridad}
                    style={[
                      styles.filtroChip,
                      { backgroundColor: isSelected ? colors.primary : colors.background, borderColor: colors.border },
                    ]}
                    onPress={() => handleFiltroPrioridad(prioridad)}
                  >
                    <Text style={[styles.filtroChipTexto, { color: isSelected ? "#FFFFFF" : colors.textSecondary }]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.botonLimpiar} onPress={limpiarFiltros}>
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              <Text style={styles.botonLimpiarTexto}>Limpiar filtros</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      {/* Search Header */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.filtroButton,
            { backgroundColor: colors.background, borderColor: colors.border, marginRight: 2 }
          ]}
          onPress={toggleSidebar}
        >
          <Ionicons name="menu-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar por título, detalles..."
            placeholderTextColor={colors.textSecondary}
            value={busqueda}
            onChangeText={handleBusqueda}
          />
          {busqueda !== "" && (
            <TouchableOpacity onPress={() => handleBusqueda("")}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filtroButton,
            { backgroundColor: colors.background, borderColor: colors.border },
            (filtroEstado || filtroPrioridad) && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setFiltroVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={filtroEstado || filtroPrioridad ? "#FFFFFF" : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Active Filters chips */}
      {(filtroEstado || filtroPrioridad) && (
        <View style={[styles.filtrosActivos, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {filtroEstado && (
            <View style={[styles.filtroActivoChip, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.filtroActivoTexto, { color: colors.primary }]}>
                {getEstadoConfig(filtroEstado, theme).label}
              </Text>
              <TouchableOpacity onPress={() => handleFiltroEstado(null)}>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {filtroPrioridad && (
            <View style={[styles.filtroActivoChip, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.filtroActivoTexto, { color: colors.primary }]}>
                {getPrioridadConfig(filtroPrioridad, theme).label}
              </Text>
              <TouchableOpacity onPress={() => handleFiltroPrioridad(null)}>
                <Ionicons name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={limpiarFiltros}>
            <Text style={styles.limpiarFiltrosTexto}>Limpiar todo</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <SkeletonCardList />
      ) : (
        <FlatList
          data={incidenciasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderIncidencia}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={cargarIncidencias}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={[styles.statsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="layers-outline" size={20} color={colors.primary} />
                <Text style={[styles.statNumero, { color: colors.text }]}>{totalIncidencias}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Registrados</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={20} color={colors.warning} />
                <Text style={[styles.statNumero, { color: colors.warning }]}>{incidenciasPendientes}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En Curso</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                <Text style={[styles.statNumero, { color: colors.success }]}>{incidenciasResueltas}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completados</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="document-text-outline" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.text }]}>No hay incidencias</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 13, fontFamily: "Poppins_400Regular" }}>
                Reporta una nueva incidencia tocando el botón +
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button for modern SaaS experience */}
      <FAB onPress={() => navigation.navigate("Report")} />

      {renderFiltrosModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Stats Card Layout
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1.5,
  },
  statNumero: { fontSize: 20, fontFamily: "Poppins_700Bold", marginTop: 4 },
  statLabel: { fontSize: 10, fontFamily: "Poppins_400Regular", color: "#64748B", marginTop: 2 },

  // Search
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    height: 40,
  },
  filtroButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  filtrosActivos: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  filtroActivoChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  filtroActivoTexto: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  limpiarFiltrosTexto: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#EF4444" },

  // Cards List
  listContainer: { paddingBottom: 100 },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  categoryIconBg: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  cardTitulo: { fontSize: 15, fontFamily: "Poppins_700Bold", flex: 1 },
  prioridadBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  prioridadTexto: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  cardDescripcion: { fontSize: 13, fontFamily: "Poppins_400Regular", lineHeight: 18, marginBottom: 12 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
  },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  estadoTexto: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardFecha: { fontSize: 11, fontFamily: "Poppins_400Regular" },

  // Empty State
  emptyContainer: { alignItems: "center", paddingVertical: 80 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyText: { fontSize: 16, fontFamily: "Poppins_700Bold" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1 },
  modalTitulo: { fontSize: 18, fontFamily: "Poppins_700Bold" },
  filtroSeccion: { fontSize: 14, fontFamily: "Poppins_600SemiBold", marginTop: 15, marginBottom: 10 },
  filtroOpciones: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filtroChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  filtroChipTexto: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  botonLimpiar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
    marginBottom: Platform.OS === "ios" ? 20 : 10,
    gap: 8,
  },
  botonLimpiarTexto: { color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 14 },
});