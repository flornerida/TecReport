import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getCurrentUser,
  setCurrentUser,
  getToken,
  obtenerIncidencias,
  Incidencia,
  EstadoIncidencia,
} from "../../service/auth.api";
import { tecnicosApi } from "../../service/tecnicos.api";
import { useSidebar } from "../../context/SidebarContext";
import { useTheme } from "../../context/ThemeContext";

// ─── Animated Card Component ──────────────────────────────────────────────────
const AnimatedCard = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<EstadoIncidencia, { label: string; color: string; bg: string; icon: string }> = {
  RECIBIDO:      { label: "Recibido",      color: "#1565C0", bg: "#E3F2FD", icon: "time-outline" },
  EN_EVALUACION: { label: "En Evaluación", color: "#E65100", bg: "#FFF3E0", icon: "search-outline" },
  EN_EJECUCION:  { label: "En Ejecución",  color: "#6A1B9A", bg: "#F3E5F5", icon: "construct-outline" },
  FINALIZADO:    { label: "Finalizado",    color: "#B71C1C", bg: "#FFEBEE", icon: "checkmark-done-outline" },
  COMPLETADO:    { label: "Completado",    color: "#1B5E20", bg: "#E8F5E9", icon: "checkmark-circle-outline" },
};

const PRIORIDAD_CONFIG: Record<string, { color: string; bg: string }> = {
  CRITICA: { color: "#B71C1C", bg: "#FFCDD2" },
  ALTA:    { color: "#E64A19", bg: "#FFE0B2" },
  MEDIA:   { color: "#F57F17", bg: "#FFF9C4" },
  BAJA:    { color: "#2E7D32", bg: "#DCEDC8" },
};

const PRIORIDAD_BORDER: Record<string, string> = {
  CRITICA: "#EF5350",
  ALTA:    "#FF7043",
  MEDIA:   "#FFB300",
  BAJA:    "#66BB6A",
};

const CATEGORIA_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  HARDWARE: { label: "Hardware", icon: "desktop-outline",    color: "#2196F3" },
  SOFTWARE: { label: "Software", icon: "code-slash-outline", color: "#4CAF50" },
  RED:      { label: "Red",      icon: "wifi-outline",       color: "#FF9800" },
  OTRO:     { label: "Otro",     icon: "help-buoy-outline",  color: "#9C27B0" },
};

const formatFecha = (fechaStr: string) => {
  const fecha = new Date(fechaStr);
  const ahora = new Date();
  const diffHoras = Math.floor((ahora.getTime() - fecha.getTime()) / 3600000);
  if (diffHoras < 1) return "Hace unos minutos";
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  if (diffHoras < 48) return "Ayer";
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TecnicoPanelScreen({ navigation }: any) {
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);
  const { toggleSidebar } = useSidebar();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  // Stagger animation for list
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const user = getCurrentUser();
    setUsuario(user);
    if (user) cargarIncidencias();
  }, []);

  const cargarIncidencias = async () => {
    try {
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado. Por favor inicia sesión.");
        navigation.replace("Login");
        return;
      }
      const res = await tecnicosApi.getMisIncidencias();
      if (res.success && res.data) {
        setIncidencias(res.data);
        Animated.timing(listAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      } else {
        setIncidencias([]);
      }
    } catch {
      Alert.alert("Error", "Error de conexión");
      setIncidencias([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); cargarIncidencias(); };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, cerrar", onPress: () => { setCurrentUser(null); navigation.replace("Login"); } },
    ]);
  };

  const stats = {
    total:      incidencias.length,
    pendientes: incidencias.filter(i => ["RECIBIDO", "EN_EVALUACION"].includes(i.estado)).length,
    enProceso:  incidencias.filter(i => i.estado === "EN_EJECUCION").length,
    resueltos:  incidencias.filter(i => ["FINALIZADO", "COMPLETADO"].includes(i.estado)).length,
  };

  // ─── Card Render ───────────────────────────────────────────────────────────
  const renderIncidencia = ({ item, index }: { item: Incidencia; index: number }) => {
    const estado = ESTADO_CONFIG[item.estado] || { label: item.estado, color: "#555", bg: "#eee", icon: "alert-circle-outline" };
    const prioridad = PRIORIDAD_CONFIG[item.prioridad] || { color: "#555", bg: "#eee" };
    const borderColor = PRIORIDAD_BORDER[item.prioridad] || "#ccc";
    const categoria = CATEGORIA_CONFIG[item.categoria] || { label: item.categoria, icon: "help-circle-outline", color: "#999" };

    return (
      <AnimatedCard
        onPress={() => navigation.navigate("TecnicoReporteDetalle", { reporteId: item.id })}
        style={{ marginBottom: 12 }}
      >
        <View style={[styles.card, { borderLeftColor: borderColor }]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
              <Ionicons name={estado.icon as any} size={12} color={estado.color} />
              <Text style={[styles.estadoText, { color: estado.color }]}>{estado.label}</Text>
            </View>
            <View style={[styles.prioridadBadge, { backgroundColor: prioridad.bg }]}>
              <Text style={[styles.prioridadText, { color: prioridad.color }]}>{item.prioridad}</Text>
            </View>
          </View>

          {/* Categoría */}
          <View style={styles.categoriaRow}>
            <View style={[styles.categoriaIconBg, { backgroundColor: categoria.color + "20" }]}>
              <Ionicons name={categoria.icon as any} size={14} color={categoria.color} />
            </View>
            <Text style={[styles.categoriaText, { color: categoria.color }]}>{categoria.label}</Text>
          </View>

          {/* Título */}
          <Text style={styles.tituloText} numberOfLines={1}>{item.titulo}</Text>
          <Text style={styles.descripcionText} numberOfLines={2}>{item.descripcion}</Text>

          {/* Equipo */}
          {item.equipo && (
            <View style={styles.equipoRow}>
              <Ionicons name="desktop-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.equipoText}>{item.equipo}</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.footerUser}>
              <Ionicons name="person-circle-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.footerUserText}>{item.usuario?.nombre || "Usuario"}</Text>
            </View>
            <View style={styles.footerDate}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.footerDateText}>{formatFecha(item.fechaHora)}</Text>
            </View>
          </View>
        </View>
      </AnimatedCard>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando tus incidencias...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={toggleSidebar} style={{ marginRight: 4 }}>
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>
              {(usuario?.nombre || "T").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerGreeting}>Mis Asignaciones</Text>
            <Text style={styles.headerSubtitle}>{usuario?.nombre || "Técnico"}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerBtn}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        {[
          { label: "Total",    value: stats.total,      color: colors.primary, icon: "layers-outline" },
          { label: "Recibido", value: stats.pendientes,  color: "#E65100", icon: "time-outline" },
          { label: "Proceso",  value: stats.enProceso,   color: "#6A1B9A", icon: "construct-outline" },
          { label: "Resuelto", value: stats.resueltos,   color: "#1B5E20", icon: "checkmark-circle-outline" },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Ionicons name={s.icon as any} size={16} color={s.color} />
            <Text style={[styles.statNumber, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── List ── */}
      <FlatList
        data={incidencias}
        renderItem={renderIncidencia}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="construct-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.primary }]}>Sin asignaciones</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Cuando te asignen una incidencia, aparecerá aquí.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (colors: any, theme: string) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  loadingText:     { marginTop: 12, fontSize: 14, fontFamily: "Poppins_400Regular", color: colors.textSecondary },

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "android" ? 14 : 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  headerLeft:    { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBadge: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText:      { fontSize: 18, fontFamily: "Poppins_700Bold", color: "#fff" },
  headerGreeting:  { fontSize: 18, fontFamily: "Poppins_700Bold", color: "#fff" },
  headerSubtitle:  { fontSize: 12, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 1 },
  headerActions:   { flexDirection: "row", gap: 10 },
  headerBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    width: 38, height: 38, borderRadius: 19,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginTop: -14,
    marginBottom: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 3,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    gap: 3,
  },
  statNumber: { fontSize: 22, fontFamily: "Poppins_700Bold" },
  statLabel:  { fontSize: 10, fontFamily: "Poppins_400Regular", color: colors.textSecondary },

  // List
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30 },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  estadoBadge:    { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  estadoText:     { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  prioridadBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  prioridadText:  { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  categoriaRow:   { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  categoriaIconBg:{ width: 24, height: 24, borderRadius: 6, justifyContent: "center", alignItems: "center" },
  categoriaText:  { fontSize: 12, fontFamily: "Poppins_500Medium" },
  tituloText:     { fontSize: 15, fontFamily: "Poppins_700Bold", color: colors.text, marginBottom: 4 },
  descripcionText:{ fontSize: 13, fontFamily: "Poppins_400Regular", color: colors.textSecondary, lineHeight: 19, marginBottom: 8 },
  equipoRow:      { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  equipoText:     { fontSize: 11, fontFamily: "Poppins_400Regular", color: colors.textSecondary },
  cardFooter:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  footerUser:     { flexDirection: "row", alignItems: "center", gap: 4 },
  footerUserText: { fontSize: 12, fontFamily: "Poppins_400Regular", color: colors.textSecondary },
  footerDate:     { flexDirection: "row", alignItems: "center", gap: 4 },
  footerDateText: { fontSize: 11, fontFamily: "Poppins_400Regular", color: colors.textSecondary },

  // Empty
  emptyContainer: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.primaryLight,
    justifyContent: "center", alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: colors.primary, marginBottom: 8 },
  emptyText:  { fontSize: 14, fontFamily: "Poppins_400Regular", color: colors.textSecondary, textAlign: "center", lineHeight: 21 },
});