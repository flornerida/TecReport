import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  obtenerMisIncidencias,
  getCurrentUser,
  Incidencia,
} from "../service/auth.api";
import socket from "../config/socket";

type Props = {
  navigation: any;
};

const getPrioridadColor = (prioridad: string): string => {
  switch (prioridad) {
    case 'CRITICA': return '#D32F2F';
    case 'ALTA': return '#F44336';
    case 'MEDIA': return '#FF9800';
    case 'BAJA': return '#4CAF50';
    default: return '#9E9E9E';
  }
};

// ✅ ESTADOS ACTUALIZADOS
const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case 'RECIBIDO': return '#2196F3';
    case 'EN_EVALUACION': return '#FFC107';
    case 'EN_EJECUCION': return '#9C27B0';
    case 'FINALIZADO': return '#F44336';
    case 'COMPLETADO': return '#4CAF50';
    default: return '#9E9E9E';
  }
};

const getPrioridadTexto = (prioridad: string): string => {
  const prioridades: Record<string, string> = {
    'CRITICA': 'Crítica',
    'ALTA': 'Alta',
    'MEDIA': 'Media',
    'BAJA': 'Baja'
  };
  return prioridades[prioridad] || prioridad;
};

// ✅ TEXTO DE ESTADOS ACTUALIZADO
const getEstadoTexto = (estado: string): string => {
  const estados: Record<string, string> = {
    'RECIBIDO': 'Recibido',
    'EN_EVALUACION': 'En Evaluación',
    'EN_EJECUCION': 'En Ejecución',
    'FINALIZADO': 'Finalizado',
    'COMPLETADO': 'Completado'
  };
  return estados[estado] || estado;
};

const getCategoriaTexto = (categoria: string): string => {
  const categorias: Record<string, string> = {
    'HARDWARE': 'Hardware',
    'SOFTWARE': 'Software',
    'RED': 'Red',
    'OTRO': 'Otro'
  };
  return categorias[categoria] || categoria;
};

const getCategoriaIcono = (categoria: string): string => {
  switch (categoria) {
    case 'HARDWARE': return 'desktop-outline';
    case 'SOFTWARE': return 'code-slash-outline';
    case 'RED': return 'wifi-outline';
    default: return 'help-buoy-outline';
  }
};

const formatearFecha = (fechaStr: string) => {
  try {
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diffHoras = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60));
    
    if (diffHoras < 1) return 'Hace unos minutos';
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`;
    if (diffHoras < 48) return 'Ayer';
    
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Fecha no válida';
  }
};

export default function MisReportes({ navigation }: Props) {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usuarioNombre, setUsuarioNombre] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    socket.on('incidenciaActualizada', (data) => {
      setIncidencias(prev => prev.map(inc => inc.id === data.id ? { ...inc, ...data } : inc));
    });
    return () => {
      socket.off('incidenciaActualizada');
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarMisIncidencias();
    }, [])
  );

  const cargarMisIncidencias = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setRefreshing(true);
        setPage(1);
      }
      const currentPage = isLoadMore ? page + 1 : 1;
      
      const user = getCurrentUser();
      if (user) setUsuarioNombre(user.nombre);
      
      const res = await obtenerMisIncidencias(currentPage, 10);
      
      if (res.success && Array.isArray(res.data)) {
        let nuevasIncidencias = [...res.data].sort((a, b) => 
          new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
        );
        
        if (!isLoadMore) {
          setIncidencias(nuevasIncidencias);
        } else {
          setIncidencias(prev => [...prev, ...nuevasIncidencias]);
        }
        
        setPage(currentPage);
        if (res.data.length < 10) setHasMore(false);
        else setHasMore(true);
      } else if (!isLoadMore) {
        setIncidencias([]);
      }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'No se pudieron cargar tus reportes');
      if (!isLoadMore) setIncidencias([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const verDetalle = (incidenciaId: string) => {
    navigation.navigate("ReporteDetalle", { reporteId: incidenciaId });
  };

  // ✅ ESTADÍSTICAS ACTUALIZADAS
  const total = incidencias.length;
  // Pendientes: RECIBIDO + EN_EVALUACION + EN_EJECUCION
  const pendientes = incidencias.filter(i => 
    i.estado === 'RECIBIDO' || i.estado === 'EN_EVALUACION'
  ).length;
  const enProceso = incidencias.filter(i => i.estado === 'EN_EJECUCION').length;
  // Resueltas: FINALIZADO + COMPLETADO
  const resueltas = incidencias.filter(i => 
    i.estado === 'FINALIZADO' || i.estado === 'COMPLETADO'
  ).length;

  const renderIncidencia = ({ item }: { item: Incidencia }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => verDetalle(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name={getCategoriaIcono(item.categoria) as any} size={20} color="#1A237E" />
          <Text style={styles.cardTitulo} numberOfLines={1}>{item.titulo}</Text>
        </View>
        <View style={[styles.prioridadBadge, { backgroundColor: getPrioridadColor(item.prioridad) }]}>
          <Text style={styles.prioridadTexto}>{getPrioridadTexto(item.prioridad)}</Text>
        </View>
      </View>

      <Text style={styles.cardDescripcion} numberOfLines={2}>{item.descripcion}</Text>

      <View style={styles.cardRow}>
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
          <Text style={styles.estadoTexto}>{getEstadoTexto(item.estado)}</Text>
        </View>
        <Text style={styles.cardCategoria}>{getCategoriaTexto(item.categoria)}</Text>
      </View>

      {item.equipo && (
        <View style={styles.infoRow}>
          <Ionicons name="desktop-outline" size={12} color="#666" />
          <Text style={styles.infoTexto}>Equipo: {item.equipo}</Text>
        </View>
      )}

      <Text style={styles.cardFecha}>
        <Ionicons name="time-outline" size={12} color="#999" /> {formatearFecha(item.fechaHora)}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1A237E" />
        <Text style={styles.loadingText}>Cargando tus reportes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Reportes</Text>
        <TouchableOpacity onPress={() => cargarMisIncidencias(false)}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tarjetas de estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statPendiente]}>
          <Text style={[styles.statNumero, { color: '#FF9800' }]}>{pendientes}</Text>
          <Text style={styles.statLabel}>Recibidos</Text>
        </View>
        <View style={[styles.statCard, styles.statProceso]}>
          <Text style={[styles.statNumero, { color: '#2196F3' }]}>{enProceso}</Text>
          <Text style={styles.statLabel}>En Ejecución</Text>
        </View>
        <View style={[styles.statCard, styles.statResuelto]}>
          <Text style={[styles.statNumero, { color: '#4CAF50' }]}>{resueltas}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
      </View>

      {/* Lista de todos los reportes */}
      <FlatList
        data={incidencias}
        keyExtractor={(item) => item.id}
        renderItem={renderIncidencia}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMore && !loading && !refreshing) {
            cargarMisIncidencias(true);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => cargarMisIncidencias(false)} colors={["#1A237E"]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No tienes reportes aún</Text>
            <Text style={styles.emptySubtext}>Tus incidencias aparecerán aquí</Text>
          </View>
        }
      />
    </View>
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
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  header: {
    backgroundColor: "#1A237E",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8eaf6",
  },
  statPendiente: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FFE0B2",
  },
  statProceso: {
    backgroundColor: "#E3F2FD",
    borderColor: "#BBDEFB",
  },
  statResuelto: {
    backgroundColor: "#E8F5E9",
    borderColor: "#C8E6C9",
  },
  statNumero: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A237E",
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8eaf6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A237E",
    flex: 1,
  },
  prioridadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  prioridadTexto: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  cardDescripcion: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoTexto: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "500",
  },
  cardCategoria: {
    fontSize: 11,
    color: "#888",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  infoTexto: {
    fontSize: 11,
    color: "#666",
  },
  cardFecha: {
    fontSize: 11,
    color: "#999",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#bbb",
    marginTop: 8,
    textAlign: "center",
  },
});