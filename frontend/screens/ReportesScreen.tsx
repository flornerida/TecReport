import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Animated,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  obtenerMisIncidencias,
  getCurrentUser,
  Incidencia,
  EstadoIncidencia,
  Prioridad,
  CategoriaIncidencia,
} from "../service/auth.api";
import { useTheme } from "../context/ThemeContext";
import { SkeletonCardList } from "../components/SkeletonLoader";
import { useSidebar } from "../context/SidebarContext";

const AnimatedCard = ({ children, index, onPress }: { children: React.ReactNode; index: number; onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default function MisReportes({ navigation }: any) {
  const { colors, theme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usuarioNombre, setUsuarioNombre] = useState("");

  useFocusEffect(
    useCallback(() => {
      cargarMisIncidencias();
    }, [])
  );

  const cargarMisIncidencias = async () => {
    try {
      setLoading(true);
      const user = getCurrentUser();
      if (user) {
        setUsuarioNombre(user.nombre);
      }
      const res = await obtenerMisIncidencias();
      if (res.success && Array.isArray(res.data)) {
        setIncidencias(res.data);
      } else {
        setIncidencias([]);
      }
    } catch (error) {
      console.error("Error cargando incidencias:", error);
      setIncidencias([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarMisIncidencias();
  };

  const getPrioridadConfig = (prioridad: Prioridad) => {
    switch (prioridad) {
      case "CRITICA": return { color: "#EF4444", bg: "#FEE2E2", label: "Crítica" };
      case "ALTA": return { color: "#F97316", bg: "#FFEDD5", label: "Alta" };
      case "MEDIA": return { color: "#F59E0B", bg: "#FEF3C7", label: "Media" };
      case "BAJA": return { color: "#10B981", bg: "#D1FAE5", label: "Baja" };
      default: return { color: "#64748B", bg: "#F1F5F9", label: prioridad };
    }
  };

  const getEstadoConfig = (estado: EstadoIncidencia) => {
    switch (estado) {
      case "RECIBIDO": return { color: "#3B82F6", bg: "#DBEAFE", label: "Recibido" };
      case "EN_EVALUACION": return { color: "#D97706", bg: "#FEF3C7", label: "Evaluación" };
      case "EN_EJECUCION": return { color: "#8B5CF6", bg: "#EDE9FE", label: "Ejecución" };
      case "FINALIZADO": return { color: "#EF4444", bg: "#FEE2E2", label: "Finalizado" };
      case "COMPLETADO": return { color: "#10B981", bg: "#D1FAE5", label: "Completado" };
      default: return { color: "#64748B", bg: "#F1F5F9", label: estado };
    }
  };

  const getCategoriaTexto = (categoria: CategoriaIncidencia): string => {
    const categorias: Record<CategoriaIncidencia, string> = {
      HARDWARE: "Hardware",
      SOFTWARE: "Software",
      RED: "Red",
      OTRO: "Otro",
    };
    return categorias[categoria] || categoria;
  };

  const getCategoriaIcono = (categoria: CategoriaIncidencia): string => {
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
      return fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const verDetalle = (incidenciaId: string) => {
    navigation.navigate("ReporteDetalle", { reporteId: incidenciaId });
  };

  const canGoBack = navigation.canGoBack();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={canGoBack ? () => navigation.goBack() : toggleSidebar} style={styles.backButton}>
          <Ionicons name={canGoBack ? "arrow-back" : "menu-outline"} size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mis Reportes</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {incidencias.length} {incidencias.length === 1 ? "reporte" : "reportes"}
          </Text>
        </View>
        <TouchableOpacity onPress={cargarMisIncidencias} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <SkeletonCardList />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {incidencias.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="document-text-outline" size={56} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay reportes creados</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aún no has reportado ninguna incidencia técnica.
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate("Report")}
              >
                <Text style={styles.emptyButtonText}>+ Nuevo Reporte</Text>
              </TouchableOpacity>
            </View>
          ) : (
            incidencias.map((incidencia, index) => {
              const priConfig = getPrioridadConfig(incidencia.prioridad);
              const estConfig = getEstadoConfig(incidencia.estado);
              return (
                <AnimatedCard key={incidencia.id} index={index} onPress={() => verDetalle(incidencia.id)}>
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.prioridadIndicator, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons
                          name={getCategoriaIcono(incidencia.categoria) as any}
                          size={20}
                          color={colors.primary}
                        />
                      </View>

                      <View style={styles.cardTitleContainer}>
                        <Text style={[styles.cardTitulo, { color: colors.text }]} numberOfLines={1}>
                          {incidencia.titulo}
                        </Text>
                        <View style={styles.cardMetaRow}>
                          <Text style={[styles.cardCategoria, { backgroundColor: colors.background, color: colors.textSecondary }]}>
                            {getCategoriaTexto(incidencia.categoria)}
                          </Text>
                          {incidencia.equipo && (
                            <Text style={[styles.cardEquipo, { color: colors.textSecondary }]}>
                              <Ionicons name="desktop-outline" size={10} color={colors.textSecondary} />{" "}
                              {incidencia.equipo}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <Text style={[styles.cardDescripcion, { color: colors.textSecondary }]} numberOfLines={2}>
                      {incidencia.descripcion}
                    </Text>

                    <View style={styles.tagsContainer}>
                      <View style={[styles.tag, { backgroundColor: estConfig.bg }]}>
                        <Text style={[styles.tagText, { color: estConfig.color }]}>
                          {estConfig.label}
                        </Text>
                      </View>

                      <View style={[styles.tag, { backgroundColor: priConfig.bg }]}>
                        <Text style={[styles.tagText, { color: priConfig.color }]}>
                          {priConfig.label}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                      <View style={styles.footerLeft}>
                        {incidencia.ubicacion && (
                          <Text style={[styles.footerText, { color: colors.textSecondary }]} numberOfLines={1}>
                            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />{" "}
                            {incidencia.ubicacion}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.footerDate, { color: colors.textSecondary }]}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />{" "}
                        {formatearFecha(incidencia.fechaHora)}
                      </Text>
                    </View>

                    {incidencia.tecnicoAsignado && (
                      <View style={[styles.tecnicoContainer, { borderTopColor: colors.border }]}>
                        <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.tecnicoText, { color: colors.text }]}>
                          Asignado a: {incidencia.tecnicoAsignado.nombre}
                        </Text>
                      </View>
                    )}
                  </View>
                </AnimatedCard>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
  },
  backButton: { padding: 4 },
  refreshButton: { padding: 4 },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Poppins_700Bold" },
  headerSubtitle: { fontSize: 12, fontFamily: "Poppins_400Regular" },

  scrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", marginTop: 8 },
  emptyText: { fontSize: 13, textAlign: "center", marginTop: 4, fontFamily: "Poppins_400Regular" },
  emptyButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },

  // Card
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  prioridadIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitulo: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardCategoria: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontFamily: "Poppins_600SemiBold",
  },
  cardEquipo: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
  cardDescripcion: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
    fontFamily: "Poppins_400Regular",
  },
  tagsContainer: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
    flexWrap: "wrap",
    gap: 8,
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: 11,
  },
  footerDate: {
    fontSize: 11,
  },
  tecnicoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tecnicoText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
});