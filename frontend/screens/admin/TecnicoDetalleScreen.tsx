import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { 
  getToken, 
  obtenerIncidencias, 
  obtenerIncidenciaPorId, 
  actualizarEstadoIncidencia, 
  asignarTecnico,
  agregarComentario,
  obtenerComentarios,
  obtenerUsuarios,
  Usuario,
  Incidencia 
} from "../../service/auth.api";
import { useTheme } from "../../context/ThemeContext";

const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case 'RECIBIDO': return '#2196F3';
    case 'EN_EVALUACION': return '#FFC107';
    case 'EN_EJECUCION': return '#9C27B0';
    case 'FINALIZADO': return '#F44336';
    case 'COMPLETADO': return '#4CAF50';
    default: return '#999';
  }
};

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

const getPrioridadColor = (prioridad: string): string => {
  switch (prioridad) {
    case 'CRITICA': return '#D32F2F';
    case 'ALTA': return '#F44336';
    case 'MEDIA': return '#FF9800';
    case 'BAJA': return '#4CAF50';
    default: return '#999';
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

const getCategoriaTexto = (categoria: string): string => {
  const categorias: Record<string, string> = {
    'HARDWARE': 'Hardware',
    'SOFTWARE': 'Software',
    'RED': 'Red',
    'OTRO': 'Otro'
  };
  return categorias[categoria] || categoria;
};

const ImageModal = ({ visible, imageUrl, onClose, styles }: { visible: boolean; imageUrl: string; onClose: () => void; styles: any }) => {
  const [error, setError] = useState(false);
  
  if (!imageUrl || error) return null;
  
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="contain" onError={() => setError(true)} />
        </View>
      </View>
    </Modal>
  );
};

export default function TecnicoDetalleScreen({ navigation, route }: any) {
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);
  const { tecnicoId, tecnicoNombre, incidenciaId } = route.params || {};
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [incidenciaUnica, setIncidenciaUnica] = useState<Incidencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [completandoId, setCompletandoId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [isListMode, setIsListMode] = useState(false);
  const [currentTecnicoId, setCurrentTecnicoId] = useState<string>("");
  const [currentTecnicoNombre, setCurrentTecnicoNombre] = useState<string>("");

  // Estados para comentarios
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  // Estados para asignar técnico
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [modalTecnicosVisible, setModalTecnicosVisible] = useState(false);
  const [asignando, setAsignando] = useState(false);

  // Estados para rechazo de incidencia
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (incidenciaId) {
        setIsListMode(false);
        cargarIncidenciaUnica(incidenciaId);
        cargarTecnicos(); // Cargar técnicos para asignar
      } else if (tecnicoId) {
        setIsListMode(true);
        setCurrentTecnicoId(tecnicoId);
        setCurrentTecnicoNombre(tecnicoNombre || "Técnico");
        cargarIncidenciasPorTecnico(tecnicoId);
      } else {
        Alert.alert("Error", "No se recibieron datos");
        navigation.goBack();
      }
    }, [incidenciaId, tecnicoId])
  );

  const cargarTecnicos = async () => {
    try {
      const res = await obtenerUsuarios();
      if (res.success && res.data) {
        const tecnicosFiltrados = res.data.filter(
          (t: Usuario) => t.rol === "TECNICO"
        );
        setTecnicos(tecnicosFiltrados);
      }
    } catch (error) {
      console.error("Error cargando técnicos:", error);
    }
  };

  const cargarIncidenciaUnica = async (id: string) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        navigation.goBack();
        return;
      }
      
      const res = await obtenerIncidenciaPorId(id);
      if (res.success && res.data) {
        setIncidenciaUnica(res.data);
        if (res.data.comentarios) {
          setComentarios(res.data.comentarios);
        }
      } else {
        Alert.alert("Error", "No se pudo cargar la incidencia");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const cargarIncidenciasPorTecnico = async (id: string) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        navigation.goBack();
        return;
      }
      
      const res = await obtenerIncidencias();
      if (res.success && res.data) {
        const incidenciasTecnico = res.data.filter(
          (inc: Incidencia) => inc.tecnicoAsignadoId === id
        );
        setIncidencias(incidenciasTecnico);
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const cargarComentarios = async (id: string) => {
    setCargandoComentarios(true);
    try {
      const token = getToken();
      const res = await obtenerComentarios(id);
      if (res.success) {
        setComentarios(res.data || []);
      }
    } catch (error) {
      console.error("Error cargando comentarios:", error);
    } finally {
      setCargandoComentarios(false);
    }
  };

  const enviarComentario = async () => {
    if (!nuevoComentario.trim() || !incidenciaUnica) return;
    setEnviandoComentario(true);
    try {
      const token = getToken();
      const res = await agregarComentario({
        incidenciaId: incidenciaUnica.id,
        contenido: nuevoComentario.trim()
      });
      if (res.success) {
        setComentarios([res.data, ...comentarios]);
        setNuevoComentario("");
      } else {
        Alert.alert("Error", res.message || "No se pudo enviar el comentario");
      }
    } catch (error) {
      console.error("Error enviando comentario:", error);
      Alert.alert("Error", "No se pudo enviar el comentario");
    } finally {
      setEnviandoComentario(false);
    }
  };

  // ✅ Función para asignar técnico
  const handleAsignarTecnico = async (tecnicoSeleccionadoId: string) => {
    if (!incidenciaUnica) return;
    setAsignando(true);
    try {
      const res = await asignarTecnico(incidenciaUnica.id, tecnicoSeleccionadoId);
      if (res.success) {
        Alert.alert("Éxito", "Técnico asignado correctamente");
        setModalTecnicosVisible(false);
        cargarIncidenciaUnica(incidenciaUnica.id); // Recargar para mostrar el técnico asignado
      } else {
        Alert.alert("Error", res.message || "No se pudo asignar");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo asignar el técnico");
    } finally {
      setAsignando(false);
    }
  };

  const completarIncidencia = async (id: string) => {
    setCompletandoId(id);
    try {
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        return;
      }
      
      const res = await actualizarEstadoIncidencia(id, 'COMPLETADO');
      
      if (res.success) {
        Alert.alert("Éxito", "Incidencia marcada como completada");
        if (!isListMode) {
          navigation.goBack();
        } else {
          cargarIncidenciasPorTecnico(currentTecnicoId);
        }
      } else {
        Alert.alert("Error", res.message || "No se pudo completar la incidencia");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Error al completar la incidencia");
    } finally {
      setCompletandoId(null);
    }
  };

  const rechazarIncidencia = async (id: string, motivo: string) => {
    setCompletandoId(id);
    try {
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        return;
      }
      
      const res = await actualizarEstadoIncidencia(id, 'EN_EJECUCION', motivo);
      
      if (res.success) {
        Alert.alert("Éxito", "Solución rechazada. La incidencia regresó a Ejecución.");
        if (!isListMode) {
          cargarIncidenciaUnica(id);
        } else {
          cargarIncidenciasPorTecnico(currentTecnicoId);
        }
      } else {
        Alert.alert("Error", res.message || "No se pudo rechazar la incidencia");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Error al rechazar la incidencia");
    } finally {
      setCompletandoId(null);
    }
  };

  const formatFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no válida';
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  // Render para el detalle de UNA incidencia
  const renderIncidenciaUnica = () => {
    if (!incidenciaUnica) return null;
    
    const evidenciasList = incidenciaUnica.evidencias || [];
    const evidenciasProblema = evidenciasList.filter(ev => ev.tipo === 'PROBLEMA');
    const evidenciasSolucionActivas = evidenciasList.filter(ev => ev.tipo === 'SOLUCION' && !ev.descripcion?.includes('[RECHAZADA]'));
    const evidenciasSolucionRechazadas = evidenciasList.filter(ev => ev.tipo === 'SOLUCION' && ev.descripcion?.includes('[RECHAZADA]'));
    const isFinalizado = incidenciaUnica.estado === 'FINALIZADO';
    const tieneTecnico = incidenciaUnica.tecnicoAsignado !== null && incidenciaUnica.tecnicoAsignado !== undefined;
    const puedeAsignar = !tieneTecnico && incidenciaUnica.estado !== 'COMPLETADO';

    // Buscar el motivo de rechazo en los comentarios
    const comentarioRechazo = comentarios.find(c => c.contenido?.includes("Solución rechazada. Motivo:"));
    const motivoTexto = comentarioRechazo 
      ? comentarioRechazo.contenido.replace("Solución rechazada. Motivo:", "").trim()
      : null;
    
    return (
      <ScrollView style={styles.detailContainer}>
        <View style={styles.estadoContainer}>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(incidenciaUnica.estado) }]}>
            <Text style={styles.estadoText}>{getEstadoTexto(incidenciaUnica.estado)}</Text>
          </View>
        </View>

        {motivoTexto && (
          <View style={{
            backgroundColor: "#FEE2E2",
            borderColor: "#EF4444",
            borderWidth: 1.5,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12
          }}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#EF4444", textTransform: "uppercase" }}>
                Motivo de Rechazo (Re-hacer Incidencia)
              </Text>
              <Text style={{ fontSize: 14, color: "#1F2937", marginTop: 4, fontWeight: "500" }}>
                "{motivoTexto}"
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Categoría</Text>
              <Text style={styles.value}>{getCategoriaTexto(incidenciaUnica.categoria)}</Text>
            </View>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Prioridad</Text>
              <Text style={[styles.value, { color: getPrioridadColor(incidenciaUnica.prioridad) }]}>
                {getPrioridadTexto(incidenciaUnica.prioridad)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Título</Text>
          <Text style={styles.tituloText}>{incidenciaUnica.titulo}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Descripción</Text>
          <Text style={styles.descripcionText}>{incidenciaUnica.descripcion}</Text>
        </View>

        {incidenciaUnica.equipo && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Equipo afectado</Text>
            <View style={styles.infoRow}>
              <Ionicons name="desktop-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{incidenciaUnica.equipo}</Text>
            </View>
          </View>
        )}

        {incidenciaUnica.ubicacion && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Ubicación</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{incidenciaUnica.ubicacion}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.label}>Información del reporte</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#666" />
            <Text style={styles.infoText}>Reportado por: {incidenciaUnica.usuario?.nombre || "Anónimo"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#666" />
            <Text style={styles.infoText}>Fecha: {formatFecha(incidenciaUnica.fechaHora)}</Text>
          </View>
          {incidenciaUnica.tecnicoAsignado && (
            <View style={styles.infoRow}>
              <Ionicons name="construct-outline" size={18} color="#666" />
              <Text style={styles.infoText}>Técnico: {incidenciaUnica.tecnicoAsignado.nombre}</Text>
            </View>
          )}
        </View>

        {/* ✅ Botón para asignar técnico (solo si no tiene técnico y no está completado) */}
        {puedeAsignar && (
          <TouchableOpacity
            style={styles.asignarButton}
            onPress={() => setModalTecnicosVisible(true)}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.asignarButtonText}>Asignar Técnico</Text>
          </TouchableOpacity>
        )}

        {evidenciasProblema.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Evidencias del Problema</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasScroll}>
              {evidenciasProblema.map((ev, index) => (
                <TouchableOpacity key={ev.id || index} style={styles.evidenciaItem} onPress={() => openImageModal(ev.urlFoto)}>
                  <Image source={{ uri: ev.urlFoto }} style={styles.evidenciaImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {evidenciasSolucionActivas.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={[styles.label, { color: '#4CAF50' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" /> Evidencias de la Solución ({evidenciasSolucionActivas.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasScroll}>
              {evidenciasSolucionActivas.map((ev, index) => (
                <TouchableOpacity key={ev.id || index} style={styles.evidenciaItem} onPress={() => openImageModal(ev.urlFoto)}>
                  <Image source={{ uri: ev.urlFoto }} style={styles.evidenciaImage} />
                  <Text style={styles.evidenciaFecha}>{new Date(ev.fechaSubida).toLocaleDateString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {evidenciasSolucionRechazadas.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={[styles.label, { color: '#EF5350', fontWeight: 'bold' }]}>
              <Ionicons name="alert-circle" size={14} color="#EF5350" /> Evidencias de Solución Rechazadas (Volver a Corregir)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasScroll}>
              {evidenciasSolucionRechazadas.map((ev, index) => (
                <TouchableOpacity key={ev.id || index} style={styles.evidenciaItem} onPress={() => openImageModal(ev.urlFoto)}>
                  <Image source={{ uri: ev.urlFoto }} style={styles.evidenciaImage} />
                  <Text style={styles.evidenciaFecha}>{new Date(ev.fechaSubida).toLocaleDateString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sección de comentarios */}
        <View style={styles.comentariosSection}>
          <Text style={styles.comentariosTitle}>Comentarios ({comentarios.length})</Text>

          {cargandoComentarios ? (
            <ActivityIndicator size="small" color="#1A237E" />
          ) : (
            <FlatList
              data={comentarios}
              keyExtractor={(item, index) => item.id || index.toString()}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 10 }}
              ListEmptyComponent={
                <Text style={styles.noComentarios}>No hay comentarios aún</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.comentarioItem}>
                  <View style={styles.comentarioHeader}>
                    <Ionicons name="person-circle" size={20} color="#1A237E" />
                    <Text style={styles.comentarioNombre}>{item.usuario?.nombre || "Usuario"}</Text>
                    <Text style={styles.comentarioRol}>({item.usuario?.rol || "USUARIO"})</Text>
                    <Text style={styles.comentarioFecha}>
                      {new Date(item.fechaComentario).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.comentarioTexto}>{item.contenido}</Text>
                </View>
              )}
            />
          )}

          <View style={styles.comentarioInputContainer}>
            <TextInput
              style={styles.comentarioInput}
              placeholder="Escribe un comentario..."
              value={nuevoComentario}
              onChangeText={setNuevoComentario}
              multiline
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.enviarComentarioBtn}
              onPress={enviarComentario}
              disabled={enviandoComentario}
            >
              {enviandoComentario ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isFinalizado && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 15, marginBottom: 30 }}>
            {/* Rechazar */}
            <TouchableOpacity
              style={[styles.completarButton, { flex: 1, backgroundColor: "#F44336", marginTop: 0, marginBottom: 0 }]}
              onPress={() => {
                setMotivoRechazo("");
                setMostrarModalRechazo(true);
              }}
              disabled={completandoId === incidenciaUnica.id}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.completarButtonText}>Rechazar y Re-hacer</Text>
            </TouchableOpacity>

            {/* Aprobar */}
            <TouchableOpacity
              style={[styles.completarButton, { flex: 1, backgroundColor: "#4CAF50", marginTop: 0, marginBottom: 0 }]}
              onPress={() => completarIncidencia(incidenciaUnica.id)}
              disabled={completandoId === incidenciaUnica.id}
            >
              {completandoId === incidenciaUnica.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.completarButtonText}>Marcar como Completada</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  // Render para la LISTA de incidencias de un técnico
  const renderIncidenciaItem = ({ item }: { item: Incidencia }) => {
    const evidenciasSolucion = item.evidencias?.filter(ev => ev.tipo === 'SOLUCION') || [];
    const isFinalizado = item.estado === 'FINALIZADO';
    
    return (
      <TouchableOpacity 
        style={styles.incidenciaCard} 
        onPress={() => {
          navigation.push("TecnicoDetalle", {
            incidenciaId: item.id
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
            <Text style={styles.estadoText}>{getEstadoTexto(item.estado)}</Text>
          </View>
          <View style={[styles.prioridadBadge, { backgroundColor: getPrioridadColor(item.prioridad) }]}>
            <Text style={styles.prioridadText}>{getPrioridadTexto(item.prioridad)}</Text>
          </View>
        </View>
        
        <Text style={styles.tituloText}>{item.titulo}</Text>
        <Text style={styles.categoriaText}>
          <Ionicons name="folder-outline" size={12} color="#666" /> {getCategoriaTexto(item.categoria)}
        </Text>
        <Text style={styles.descripcionText} numberOfLines={2}>{item.descripcion}</Text>
        
        <View style={styles.footer}>
          <View style={styles.usuarioContainer}>
            <Ionicons name="person-outline" size={12} color="#1A237E" />
            <Text style={styles.usuarioText}>{item.usuario?.nombre || "Usuario"}</Text>
          </View>
          <Text style={styles.fechaText}>{formatFecha(item.fechaHora)}</Text>
        </View>

        {evidenciasSolucion.length > 0 && (
          <View style={styles.evidenciasSection}>
            <Text style={[styles.evidenciasTitle, { color: '#4CAF50' }]}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#4CAF50" /> Solución ({evidenciasSolucion.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasContainer}>
              {evidenciasSolucion.map((ev, index) => (
                <TouchableOpacity key={ev.id || index} onPress={() => openImageModal(ev.urlFoto)}>
                  <Image source={{ uri: ev.urlFoto }} style={styles.evidenciaSmallImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {isFinalizado && (
          <View style={styles.badgePendiente}>
            <Ionicons name="time-outline" size={12} color="#fff" />
            <Text style={styles.badgePendienteText}>Pendiente de revisión</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando...</Text>
      </SafeAreaView>
    );
  }

  const title = !isListMode 
    ? "Detalle de Incidencia" 
    : currentTecnicoNombre;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {!isListMode ? (
        renderIncidenciaUnica()
      ) : (
        <FlatList
          data={incidencias}
          renderItem={renderIncidenciaItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={60} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No tiene incidencias asignadas</Text>
            </View>
          }
        />
      )}

      {/* Modal para seleccionar técnico */}
      <Modal
        visible={modalTecnicosVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalTecnicosVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asignar Técnico</Text>
              <TouchableOpacity onPress={() => setModalTecnicosVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={tecnicos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.tecnicoOption}
                  onPress={() => handleAsignarTecnico(item.id)}
                  disabled={asignando}
                >
                  <View style={styles.tecnicoOptionInfo}>
                    <View style={styles.tecnicoAvatar}>
                      <Text style={styles.tecnicoAvatarText}>{item.nombre.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.tecnicoOptionNombre}>{item.nombre}</Text>
                      <Text style={styles.tecnicoOptionEmail}>{item.email}</Text>
                    </View>
                  </View>
                  <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noTecnicos}>No hay técnicos disponibles</Text>
              }
            />
          </View>
        </View>
      </Modal>

      <ImageModal visible={modalVisible} imageUrl={selectedImage} onClose={() => setModalVisible(false)} styles={styles} />

      {/* Modal de Motivo de Rechazo */}
      <Modal
        visible={mostrarModalRechazo}
        animationType="fade"
        transparent
        onRequestClose={() => setMostrarModalRechazo(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20
        }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            width: "90%",
            padding: 20,
            borderWidth: 1.5,
            borderColor: colors.border
          }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
              Rechazar Solución Técnica
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
              Ingrese el motivo del rechazo. El técnico deberá corregir el trabajo y subir nuevas evidencias.
            </Text>

            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                minHeight: 100,
                textAlignVertical: "top",
                color: colors.text,
                backgroundColor: theme === "dark" ? colors.background : "#fff",
                fontSize: 14,
                marginBottom: 20
              }}
              placeholder="Ej: El equipo sigue sin encender..."
              placeholderTextColor={colors.textSecondary}
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
              multiline
              numberOfLines={4}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center"
                }}
                onPress={() => setMostrarModalRechazo(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "bold", fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#EF4444",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center"
                }}
                onPress={() => {
                  if (!motivoRechazo.trim()) {
                    Alert.alert("Requisito", "Debe ingresar el motivo de rechazo");
                    return;
                  }
                  setMostrarModalRechazo(false);
                  if (incidenciaUnica) {
                    rechazarIncidencia(incidenciaUnica.id, motivoRechazo.trim());
                  }
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 14 }}>Enviar Rechazo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary },
  header: {
    backgroundColor: colors.primary,
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
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  detailContainer: { padding: 16 },
  estadoContainer: { alignItems: "center", marginVertical: 15 },
  estadoBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  estadoText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  infoCard: {
    backgroundColor: colors.card,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  halfColumn: { flex: 1 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontWeight: "500" },
  value: { fontSize: 16, color: colors.text, fontWeight: "500" },
  tituloText: { fontSize: 18, fontWeight: "bold", color: colors.text, marginTop: 4 },
  descripcionText: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 6, gap: 8 },
  infoText: { fontSize: 14, color: colors.text, flex: 1 },
  evidenciasScroll: { flexDirection: "row", marginTop: 8 },
  evidenciaItem: { marginRight: 12 },
  evidenciaImage: { width: 120, height: 100, borderRadius: 8, backgroundColor: theme === "dark" ? colors.background : "#f5f5f5" },
  evidenciaSmallImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: theme === "dark" ? colors.background : "#f5f5f5", marginRight: 8 },
  evidenciaFecha: { fontSize: 10, color: colors.textSecondary, marginTop: 4, textAlign: "center" },
  completarButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
    gap: 8,
  },
  completarButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  asignarButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    gap: 8,
  },
  asignarButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  badgePendiente: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F44336",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  badgePendienteText: { color: "#fff", fontSize: 10, fontWeight: "500" },
  incidenciaCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 },
  prioridadBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  prioridadText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  categoriaText: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  usuarioContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  usuarioText: { fontSize: 12, color: colors.primary },
  fechaText: { fontSize: 11, color: colors.textSecondary },
  evidenciasSection: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  evidenciasTitle: { fontSize: 11, fontWeight: "600", marginBottom: 6 },
  evidenciasContainer: { flexDirection: "row" },
  list: { padding: 16, paddingBottom: 30 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { marginTop: 10, fontSize: 16, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: colors.card, borderRadius: 20, width: "90%", maxHeight: "80%", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.primary },
  tecnicoOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tecnicoOptionInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  tecnicoAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tecnicoAvatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  tecnicoOptionNombre: { fontSize: 16, fontWeight: "600", color: colors.text },
  tecnicoOptionEmail: { fontSize: 12, color: colors.textSecondary },
  noTecnicos: { textAlign: "center", color: colors.textSecondary, marginTop: 20 },
  modalClose: { position: "absolute", top: 50, right: 20, zIndex: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 8 },
  modalImage: { width: "100%", height: "80%" },
  modalContainer: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  comentariosSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  comentariosTitle: { fontSize: 18, fontWeight: "bold", color: colors.primary, marginBottom: 12 },
  comentarioItem: { backgroundColor: theme === "dark" ? colors.background : "#f8f9fa", borderRadius: 8, padding: 10, marginBottom: 8 },
  comentarioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 6,
    flexWrap: "wrap",
  },
  comentarioNombre: { fontWeight: "bold", fontSize: 14, color: colors.primary },
  comentarioRol: { fontSize: 12, color: colors.textSecondary },
  comentarioFecha: { fontSize: 10, color: colors.textSecondary, marginLeft: "auto" },
  comentarioTexto: { fontSize: 14, color: colors.text },
  noComentarios: { textAlign: "center", color: colors.textSecondary, fontStyle: "italic", marginVertical: 10 },
  comentarioInputContainer: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 8 },
  comentarioInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme === "dark" ? colors.background : "#fff",
    color: colors.text,
    maxHeight: 80,
  },
  enviarComentarioBtn: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});