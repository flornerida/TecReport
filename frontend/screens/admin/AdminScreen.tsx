import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  getCurrentUser,
  setCurrentUser,
  obtenerIncidencias,
  obtenerUsuarios,
} from "../../service/auth.api";
import { adminApi } from "../../service/admin.api";
import { Ionicons } from "@expo/vector-icons";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useSidebar } from "../../context/SidebarContext";
import { useTheme } from "../../context/ThemeContext";

const { width, height } = Dimensions.get("window");

type RootStackParamList = {
  AdminScreen: undefined;
  Panel: undefined;
  Login: undefined;
  AdminUsuarios: undefined;
  AdminCrearUsuario: undefined;
  AdminReportes: undefined;
  TecnicosList: undefined;
  TecnicoDetalle: { tecnicoId: string; tecnicoNombre: string };
};

type AdminScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AdminScreen"
>;

type Props = { navigation: AdminScreenNavigationProp };

type Estadisticas = {
  totalUsuarios: number;
  totalIncidencias: number;
  incidenciasPorEstado: { estado: string; cantidad: number }[];
  incidenciasPorPrioridad: { prioridad: string; cantidad: number }[];
};

const COLORS = {
  RECIBIDO: "#2196F3",
  EN_EVALUACION: "#FFC107",
  EN_EJECUCION: "#9C27B0",
  FINALIZADO: "#F44336",
  COMPLETADO: "#4CAF50",
  CRITICA: "#D32F2F",
  ALTA: "#F44336",
  MEDIA: "#FF9800",
  BAJA: "#4CAF50",
};

const getEstadoTexto = (estado: string): string => {
  const estados: Record<string, string> = {
    RECIBIDO: "Recibido",
    EN_EVALUACION: "En Evaluación",
    EN_EJECUCION: "En Ejecución",
    FINALIZADO: "Finalizado",
    COMPLETADO: "Completado",
  };
  return estados[estado] || estado;
};

const getPrioridadTexto = (prioridad: string): string => {
  const prioridades: Record<string, string> = {
    CRITICA: "Crítica",
    ALTA: "Alta",
    MEDIA: "Media",
    BAJA: "Baja",
  };
  return prioridades[prioridad] || prioridad;
};

export default function AdminScreen({ navigation }: Props) {
  const { colors, theme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<"barras" | "pastel">("barras");
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalUsuarios: 0,
    totalIncidencias: 0,
    incidenciasPorEstado: [],
    incidenciasPorPrioridad: [],
  });

  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState({ label: "", value: 0, total: 0, color: "" });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const user = getCurrentUser();
      setUsuario(user);
      verificarAcceso();
      cargarEstadisticas();
    }, [])
  );

  const verificarAcceso = () => {
    const user = getCurrentUser();
    if (!user || user.rol !== "ADMIN") {
      Alert.alert("Acceso Denegado", "No tienes permisos de administrador", [
        { text: "OK", onPress: () => navigation.replace("Panel") },
      ]);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getEstadisticas();
      if (res.success && res.data) {
        setEstadisticas({
          totalUsuarios: res.data.totalUsuarios || 0,
          totalIncidencias: res.data.totalIncidencias || 0,
          incidenciasPorEstado: res.data.incidenciasPorEstado || [],
          incidenciasPorPrioridad: res.data.incidenciasPorPrioridad || [],
        });
      } else {
        Alert.alert("Error", res.message || "No se pudieron obtener las estadísticas");
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, cerrar sesión",
        onPress: () => {
          setCurrentUser(null);
          navigation.replace("Login");
        },
      },
    ]);
  };

  const showTooltip = (label: string, value: number, total: number, color: string) => {
    setTooltipData({ label, value, total, color });
    setTooltipVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => setTooltipVisible(false));
    }, 1800);
  };

  // Datos para gráficos con onPress
  const estadoData = estadisticas.incidenciasPorEstado.map((item) => ({
    value: item.cantidad,
    label: getEstadoTexto(item.estado),
    frontColor: COLORS[item.estado as keyof typeof COLORS] || "#999",
    onPress: () => showTooltip(getEstadoTexto(item.estado), item.cantidad, estadisticas.totalIncidencias, COLORS[item.estado as keyof typeof COLORS] || "#999"),
  }));

  const prioridadData = estadisticas.incidenciasPorPrioridad.map((item) => ({
    value: item.cantidad,
    label: getPrioridadTexto(item.prioridad),
    frontColor: COLORS[item.prioridad as keyof typeof COLORS] || "#999",
    onPress: () => showTooltip(getPrioridadTexto(item.prioridad), item.cantidad, estadisticas.totalIncidencias, COLORS[item.prioridad as keyof typeof COLORS] || "#999"),
  }));

  // Datos para PieChart de estados (con onPress)
  const pieEstadoData = estadoData.map((item) => ({
    value: item.value,
    label: item.label,
    color: item.frontColor,
    text: item.value.toString(),
    onPress: () => showTooltip(item.label, item.value, estadisticas.totalIncidencias, item.frontColor),
  }));

  // Datos para PieChart de prioridades (con onPress y porcentaje en etiqueta)
  const piePrioridadData = prioridadData.map((item) => {
    const percentage = ((item.value / estadisticas.totalIncidencias) * 100).toFixed(1);
    return {
      value: item.value,
      label: `${item.label} (${percentage}%)`,
      color: item.frontColor,
      text: item.value.toString(),
      onPress: () => showTooltip(item.label, item.value, estadisticas.totalIncidencias, item.frontColor),
    };
  });

  const maxEstadoValue = estadoData.length ? Math.max(...estadoData.map((d) => d.value), 1) : 5;
  const maxPrioridadValue = prioridadData.length ? Math.max(...prioridadData.map((d) => d.value), 1) : 5;

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando estadísticas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar} style={{ marginRight: 4 }}>
              <Ionicons name="menu-outline" size={26} color="#fff" />
            </TouchableOpacity>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>
                {(usuario?.nombre || "A").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.title}>Panel Admin</Text>
              <Text style={styles.subtitle}>Hola, {usuario?.nombre?.split(" ")[0] || "Administrador"} 👋</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.refreshButton} onPress={cargarEstadisticas}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.resumenContainer}>
          <View style={[styles.resumenCard, { backgroundColor: colors.card, borderTopColor: "#1565C0" }]}>
            <View style={[styles.resumenIconBg, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="people" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.resumenNumero, { color: colors.text }]}>{estadisticas.totalUsuarios}</Text>
            <Text style={[styles.resumenLabel, { color: colors.textSecondary }]}>Usuarios</Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: colors.card, borderTopColor: "#6A1B9A" }]}>
            <View style={[styles.resumenIconBg, { backgroundColor: theme === "dark" ? "#6b21a8" : "#F3E5F5" }]}>
              <Ionicons name="document-text" size={22} color={theme === "dark" ? "#f3e8ff" : "#6A1B9A"} />
            </View>
            <Text style={[styles.resumenNumero, { color: theme === "dark" ? "#d8b4fe" : "#6A1B9A" }]}>{estadisticas.totalIncidencias}</Text>
            <Text style={[styles.resumenLabel, { color: colors.textSecondary }]}>Incidencias</Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: colors.card, borderTopColor: "#1B5E20" }]}>
            <View style={[styles.resumenIconBg, { backgroundColor: theme === "dark" ? "#166534" : "#E8F5E9" }]}>
              <Ionicons name="checkmark-circle" size={22} color={theme === "dark" ? "#bbf7d0" : "#1B5E20"} />
            </View>
            <Text style={[styles.resumenNumero, { color: theme === "dark" ? "#86efac" : "#1B5E20" }]}>
              {estadisticas.incidenciasPorEstado.find(e => e.estado === "COMPLETADO")?.cantidad || 0}
            </Text>
            <Text style={[styles.resumenLabel, { color: colors.textSecondary }]}>Completadas</Text>
          </View>
        </View>

        <View style={styles.chartSelector}>
          <TouchableOpacity
            style={[
              styles.chartButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedChart === "barras" && [styles.chartButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
            ]}
            onPress={() => setSelectedChart("barras")}>
            <Ionicons name="bar-chart" size={18} color={selectedChart === "barras" ? "#fff" : colors.primary} />
            <Text style={[styles.chartButtonText, { color: colors.primary }, selectedChart === "barras" && [styles.chartButtonTextActive, { color: "#fff" }]]}>Barras</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chartButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedChart === "pastel" && [styles.chartButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
            ]}
            onPress={() => setSelectedChart("pastel")}>
            <Ionicons name="pie-chart" size={18} color={selectedChart === "pastel" ? "#fff" : colors.primary} />
            <Text style={[styles.chartButtonText, { color: colors.primary }, selectedChart === "pastel" && [styles.chartButtonTextActive, { color: "#fff" }]]}>Pastel</Text>
          </TouchableOpacity>
        </View>

        {/* Gráfico por Estado */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <View style={[styles.titleDot, { backgroundColor: colors.primary }]} /> Incidencias por Estado
          </Text>
          {estadoData.length > 0 && estadisticas.totalIncidencias > 0 ? (
            selectedChart === "barras" ? (
              <BarChart
                data={estadoData}
                barWidth={32}
                spacing={18}
                roundedTop
                roundedBottom
                hideRules
                hideYAxisText // Elimina los números del eje Y
                xAxisThickness={0}
                yAxisThickness={0}
                noOfSections={3}
                maxValue={maxEstadoValue + 1}
                isAnimated
                animationDuration={800}
                showValuesAsTopLabel
                topLabelTextStyle={{ color: colors.text, fontWeight: "600", fontSize: 12 }}
                xAxisLabelTextStyle={{ fontSize: 11, fontWeight: "500", color: colors.textSecondary }}
              />
            ) : (
              <PieChart
                data={pieEstadoData}
                donut
                radius={100}
                innerRadius={45}
                innerCircleColor={colors.card}
                showText
                textColor="#fff"
                textSize={14}
                showGradient
                isAnimated
                animationDuration={800}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={[styles.centerLabelTotal, { color: colors.text }]}>{estadisticas.totalIncidencias}</Text>
                    <Text style={[styles.centerLabelText, { color: colors.textSecondary }]}>Total</Text>
                  </View>
                )}
              />
            )
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay incidencias registradas</Text>
          )}
        </View>

        {/* Gráfico por Prioridad */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <View style={[styles.titleDot, { backgroundColor: colors.primary }]} /> Incidencias por Prioridad
          </Text>
          {prioridadData.length > 0 && estadisticas.totalIncidencias > 0 ? (
            selectedChart === "barras" ? (
              <BarChart
                data={prioridadData}
                barWidth={40}
                spacing={20}
                roundedTop
                roundedBottom
                hideRules
                hideYAxisText
                xAxisThickness={0}
                yAxisThickness={0}
                noOfSections={3}
                maxValue={maxPrioridadValue + 1}
                isAnimated
                animationDuration={800}
                showValuesAsTopLabel
                topLabelTextStyle={{ color: colors.text, fontWeight: "600", fontSize: 12 }}
                xAxisLabelTextStyle={{ fontSize: 11, fontWeight: "500", color: colors.textSecondary }}
              />
            ) : (
              <PieChart
                data={piePrioridadData}
                donut
                radius={110}
                innerRadius={40}
                innerCircleColor={colors.card}
                showText
                textColor="#fff"
                textSize={13}
                showGradient
                isAnimated
                animationDuration={800}
              />
            )
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay incidencias registradas</Text>
          )}
        </View>

        <View style={styles.menuContainer}>
          {[
            { route: "AdminUsuarios", icon: "people",       iconColor: colors.primary, iconBg: colors.primaryLight, title: "Usuarios",              desc: "Gestionar usuarios y técnicos" },
            { route: "AdminReportes", icon: "document-text", iconColor: colors.primary, iconBg: colors.primaryLight, title: "Incidencias",          desc: "Ver y gestionar todas las incidencias" },
            { route: "TecnicosList", icon: "construct",      iconColor: colors.primary, iconBg: colors.primaryLight, title: "Supervisión Técnica", desc: "Ver técnicos y sus asignaciones" },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.menuItem, { backgroundColor: colors.card }]} onPress={() => navigation.navigate(item.route as any)} activeOpacity={0.8}>
              <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.menuDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
              </View>
              <View style={[styles.menuArrow, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Tooltip pequeño y elegante que aparece en la parte inferior */}
      <Modal transparent visible={tooltipVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTooltipVisible(false)}>
          <Animated.View style={[styles.tooltipContainer, { backgroundColor: colors.card, opacity: fadeAnim, borderLeftColor: tooltipData.color }]}>
            <Ionicons name="information-circle" size={20} color={tooltipData.color} />
            <Text style={[styles.tooltipLabel, { color: colors.text }]}>{tooltipData.label}</Text>
            <Text style={[styles.tooltipValue, { color: tooltipData.color }]}>{tooltipData.value}</Text>
            <Text style={[styles.tooltipPercent, { color: colors.textSecondary }]}>
              {((tooltipData.value / tooltipData.total) * 100).toFixed(1)}%
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#F5F7FA" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA" },
  loadingText:     { marginTop: 10, fontSize: 14, fontFamily: "Poppins_400Regular", color: "#666" },

  header: {
    backgroundColor: "#1A237E",
    padding: 20, paddingTop: 20, paddingBottom: 30,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: "#1A237E", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  headerLeft:    { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText:      { fontSize: 20, fontFamily: "Poppins_700Bold", color: "#fff" },
  title:           { fontSize: 20, fontFamily: "Poppins_700Bold", color: "#fff" },
  subtitle:        { fontSize: 12, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  headerRight:     { flexDirection: "row", gap: 10 },
  refreshButton: {
    backgroundColor: "rgba(255,255,255,0.18)", width: 38, height: 38, borderRadius: 19,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.18)", width: 38, height: 38, borderRadius: 19,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },

  // KPI Cards
  resumenContainer: { flexDirection: "row", padding: 16, gap: 12, marginTop: -20 },
  resumenCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 16, alignItems: "center",
    borderTopWidth: 3,
    elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
    gap: 6,
  },
  resumenIconBg:   { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  resumenNumero:   { fontSize: 28, fontFamily: "Poppins_700Bold", color: "#1A237E" },
  resumenLabel:    { fontSize: 11, fontFamily: "Poppins_400Regular", color: "#888" },

  // Chart
  chartSelector: { flexDirection: "row", justifyContent: "center", gap: 12, marginHorizontal: 16, marginBottom: 12 },
  chartButton: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 9,
    borderRadius: 30, backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#1A237E",
  },
  chartButtonActive:     { backgroundColor: "#1A237E" },
  chartButtonText:       { fontSize: 13, fontFamily: "Poppins_500Medium", color: "#1A237E" },
  chartButtonTextActive: { color: "#fff" },
  section: {
    backgroundColor: "#fff", margin: 16, marginTop: 8, marginBottom: 12,
    borderRadius: 20, padding: 16, elevation: 2,
  },
  sectionTitle:    { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: "#1A237E", marginBottom: 16 },
  titleDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1A237E" },
  centerLabel:     { alignItems: "center", justifyContent: "center" },
  centerLabelTotal:{ fontSize: 26, fontFamily: "Poppins_700Bold", color: "#1A237E" },
  centerLabelText: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "#888", marginTop: 2 },
  emptyText:       { textAlign: "center", color: "#999", fontFamily: "Poppins_400Regular", fontSize: 14, fontStyle: "italic", padding: 30 },

  // Menu
  menuContainer: { margin: 16, marginTop: 4, marginBottom: 30 },
  menuItem: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10,
    flexDirection: "row", alignItems: "center",
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  menuIcon:          { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  menuTextContainer: { flex: 1, marginLeft: 14 },
  menuTitle:         { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: "#1A237E" },
  menuDesc:          { fontSize: 11, fontFamily: "Poppins_400Regular", color: "#888", marginTop: 2 },
  menuArrow: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center",
  },

  // Tooltip
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end", alignItems: "center", paddingBottom: 80,
  },
  tooltipContainer: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 40, paddingHorizontal: 18, paddingVertical: 12,
    alignItems: "center", borderLeftWidth: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
    elevation: 6, gap: 8,
  },
  tooltipLabel:   { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#222" },
  tooltipValue:   { fontSize: 22, fontFamily: "Poppins_700Bold", marginLeft: 4 },
  tooltipPercent: { fontSize: 13, fontFamily: "Poppins_500Medium", color: "#666", marginLeft: 6 },
});