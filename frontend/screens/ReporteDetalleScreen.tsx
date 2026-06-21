import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getToken, getCurrentUser, isAdmin, isTecnico } from "../service/auth.api";
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../config/api.config";
import { useToast } from "../components/CustomToast";

const { width } = Dimensions.get("window");

interface Evidencia {
  id: string;
  urlFoto: string;
  tipo: "PROBLEMA" | "SOLUCION";
  descripcion?: string;
}
interface Comentario {
  id: string;
  usuarioId: string;
  usuario: {
    id: string;
    nombre: string;
    rol: string;
  };
  contenido: string;
  fechaComentario: string;
}
interface Seguimiento {
  id: string;
  accion: string;
  descripcion?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  fecha: string;
  usuario: {
    nombre: string;
  };
}
interface IncidenciaDetalle {
  id: string;
  titulo: string;
  descripcion: string;
  fechaHora: string;
  fechaResolucion?: string;
  categoria: string;
  prioridad: string;
  estado: string;
  ubicacion?: string;
  equipo?: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  tecnicoAsignado?: {
    id: string;
    nombre: string;
    email: string;
  };
  area?: {
    id: string;
    nombre: string;
  };
  evidencias: Evidencia[];
  diagnostico?: string;
}

const getPrioridadConfig = (prioridad: string) => {
  switch (prioridad) {
    case "CRITICA": return { color: "#EF4444", bg: "#FEE2E2", label: "Crítica" };
    case "ALTA": return { color: "#F97316", bg: "#FFEDD5", label: "Alta" };
    case "MEDIA": return { color: "#F59E0B", bg: "#FEF3C7", label: "Media" };
    case "BAJA": return { color: "#10B981", bg: "#D1FAE5", label: "Baja" };
    default: return { color: "#64748B", bg: "#F1F5F9", label: prioridad };
  }
};

const getEstadoConfig = (estado: string) => {
  switch (estado) {
    case "RECIBIDO": return { color: "#3B82F6", bg: "#DBEAFE", label: "Recibido" };
    case "EN_EVALUACION": return { color: "#D97706", bg: "#FEF3C7", label: "Evaluación" };
    case "EN_EJECUCION": return { color: "#8B5CF6", bg: "#EDE9FE", label: "Ejecución" };
    case "FINALIZADO": return { color: "#EF4444", bg: "#FEE2E2", label: "Finalizado" };
    case "COMPLETADO": return { color: "#10B981", bg: "#D1FAE5", label: "Completado" };
    default: return { color: "#64748B", bg: "#F1F5F9", label: estado };
  }
};

const getCategoriaTexto = (categoria: string): string => {
  const categorias: Record<string, string> = {
    HARDWARE: "Hardware",
    SOFTWARE: "Software",
    RED: "Red",
    OTRO: "Otro",
  };
  return categorias[categoria] || categoria;
};

const ImageViewer = ({ imageUrl }: { imageUrl: string }) => {
  const [error, setError] = useState(false);
  const { colors } = useTheme();

  if (!imageUrl || error) {
    return (
      <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
        <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
        <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>No disponible</Text>
      </View>
    );
  }
  const isBase64 = imageUrl.startsWith("data:image") || imageUrl.startsWith("/9j/");
  const source = isBase64
    ? { uri: imageUrl }
    : { uri: imageUrl.startsWith("http") ? imageUrl : `${API_URL}${imageUrl}` };

  return (
    <Image
      source={source}
      style={styles.evidenciaImage}
      resizeMode="cover"
      onError={() => {
        setError(true);
      }}
    />
  );
};

const CommentInput = ({ onSend, isLoading }: { onSend: (text: string) => Promise<void>; isLoading: boolean }) => {
  const [text, setText] = useState("");
  const { colors } = useTheme();

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <View style={[styles.comentarioInputContainer, { borderTopColor: colors.border }]}>
      <TextInput
        style={[styles.comentarioInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
        placeholder="Escribe un comentario..."
        placeholderTextColor={colors.textSecondary}
        value={text}
        onChangeText={setText}
        multiline
      />
      <TouchableOpacity
        style={[styles.enviarComentarioBtn, { backgroundColor: colors.primary }]}
        onPress={handleSend}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="send" size={18} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const EvidenciasSection = ({ evidencias }: { evidencias: Evidencia[] }) => {
  const { colors } = useTheme();

  if (!evidencias || evidencias.length === 0) {
    return (
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Ionicons name="camera-outline" size={18} color={colors.primary} /> Evidencias
        </Text>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No hay evidencias adjuntas</Text>
      </View>
    );
  }

  const deProblema = evidencias.filter(e => e.tipo === "PROBLEMA");
  const deSolucionActivas = evidencias.filter(e => e.tipo === "SOLUCION" && !e.descripcion?.includes("[RECHAZADA]"));
  const deSolucionRechazadas = evidencias.filter(e => e.tipo === "SOLUCION" && e.descripcion?.includes("[RECHAZADA]"));

  return (
    <>
      {/* Evidencias del Problema */}
      {deProblema.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="camera-outline" size={18} color={colors.primary} /> Evidencias del Problema ({deProblema.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasScroll}>
            {deProblema.map((ev, index) => (
              <View key={ev.id || index} style={[styles.evidenciaItem, { borderColor: colors.border }]}>
                <ImageViewer imageUrl={ev.urlFoto} />
                <View style={styles.evidenciaInfo}>
                  <Text style={[styles.evidenciaTipo, { color: colors.text }]}>📷 Problema</Text>
                  {ev.descripcion && (
                    <Text style={[styles.evidenciaDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {ev.descripcion}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Evidencias de la Solución */}
      {deSolucionActivas.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" /> Evidencias de la Solución ({deSolucionActivas.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasScroll}>
            {deSolucionActivas.map((ev, index) => (
              <View key={ev.id || index} style={[styles.evidenciaItem, { borderColor: colors.border }]}>
                <ImageViewer imageUrl={ev.urlFoto} />
                <View style={styles.evidenciaInfo}>
                  <Text style={[styles.evidenciaTipo, { color: colors.text }]}>✅ Solución</Text>
                  {ev.descripcion && (
                    <Text style={[styles.evidenciaDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {ev.descripcion}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Evidencias de Soluciones Rechazadas */}
      {deSolucionRechazadas.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" /> Soluciones Anteriores Rechazadas ({deSolucionRechazadas.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasScroll}>
            {deSolucionRechazadas.map((ev, index) => (
              <View key={ev.id || index} style={[styles.evidenciaItem, { borderColor: colors.border }]}>
                <ImageViewer imageUrl={ev.urlFoto} />
                <View style={styles.evidenciaInfo}>
                  <Text style={[styles.evidenciaTipo, { color: "#EF4444" }]}>❌ Rechazada</Text>
                  {ev.descripcion && (
                    <Text style={[styles.evidenciaDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {ev.descripcion}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const SeguimientoSection = ({ seguimientos }: { seguimientos: Seguimiento[] }) => {
  const { colors } = useTheme();

  if (!seguimientos || seguimientos.length === 0) return null;

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        <Ionicons name="time-outline" size={18} color={colors.primary} /> Línea de Tiempo
      </Text>
      <View style={styles.timelineContainer}>
        {seguimientos.map((seg, index) => {
          const isLast = index === seguimientos.length - 1;
          return (
            <View key={seg.id || index} style={styles.timelineItem}>
              {/* Timeline Connector Line */}
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
              </View>

              <View style={styles.timelineRight}>
                <View style={styles.timelineHeader}>
                  <Text style={[styles.timelineUsuario, { color: colors.text }]}>{seg.usuario.nombre}</Text>
                  <Text style={[styles.timelineFecha, { color: colors.textSecondary }]}>
                    {new Date(seg.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <Text style={[styles.timelineAccion, { color: colors.primary }]}>{seg.accion}</Text>
                {seg.descripcion && <Text style={[styles.timelineDesc, { color: colors.textSecondary }]}>{seg.descripcion}</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const EstadoSelector = ({
  estadoActual,
  incidenciaId,
  onEstadoChange,
}: {
  estadoActual: string;
  incidenciaId: string;
  onEstadoChange: (nuevoEstado: string) => void;
}) => {
  const { colors } = useTheme();
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const estados = ["RECIBIDO", "EN_EVALUACION", "EN_EJECUCION", "FINALIZADO", "COMPLETADO"];
  const estadosLabels: Record<string, string> = {
    RECIBIDO: "Recibido",
    EN_EVALUACION: "Evaluación",
    EN_EJECUCION: "Ejecución",
    FINALIZADO: "Finalizado",
    COMPLETADO: "Completado",
  };

  const cambiarEstado = async (nuevoEstado: string, comentario?: string) => {
    if (nuevoEstado === estadoActual) {
      setMostrarOpciones(false);
      return;
    }
    setCargando(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/reportes/${incidenciaId}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado, comentario }),
      });
      const data = await response.json();
      if (data.success) {
        onEstadoChange(nuevoEstado);
        setMostrarOpciones(false);
      } else {
        Alert.alert("Error", data.message || "No se pudo actualizar el estado");
      }
    } catch {
      Alert.alert("Error", "Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  if (estadoActual === "FINALIZADO" && isAdmin()) {
    return (
      <View style={{ width: "100%", paddingVertical: 10 }}>
        <Text style={{ fontSize: 13, fontFamily: "Poppins_700Bold", color: colors.text, marginBottom: 10, textAlign: "center" }}>
          Revisión de la Solución del Técnico
        </Text>
        
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          {/* Aprobar */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#10B981",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              borderRadius: 12,
              gap: 6
            }}
            onPress={() => {
              Alert.alert(
                "Aprobar Solución",
                "¿Está seguro de que la solución técnica es correcta y desea completar esta incidencia?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { 
                    text: "Sí, Aprobar", 
                    onPress: () => cambiarEstado("COMPLETADO") 
                  }
                ]
              );
            }}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 12 }}>Aprobar y Completar</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Rechazar */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#EF4444",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              borderRadius: 12,
              gap: 6
            }}
            onPress={() => {
              setMotivoRechazo("");
              setMostrarModalRechazo(true);
            }}
            disabled={cargando}
          >
            <Ionicons name="alert-circle-outline" size={20} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 12 }}>Rechazar y Re-hacer</Text>
          </TouchableOpacity>
        </View>

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
              width: "100%",
              padding: 20,
              borderWidth: 1.5,
              borderColor: colors.border
            }}>
              <Text style={{ fontSize: 15, fontFamily: "Poppins_700Bold", color: colors.text, marginBottom: 8 }}>
                Rechazar Solución Técnica
              </Text>
              <Text style={{ fontSize: 11, fontFamily: "Poppins_400Regular", color: colors.textSecondary, marginBottom: 16 }}>
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
                  backgroundColor: colors.background,
                  fontFamily: "Poppins_400Regular",
                  fontSize: 13,
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
                  <Text style={{ color: colors.textSecondary, fontFamily: "Poppins_700Bold", fontSize: 13 }}>Cancelar</Text>
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
                    cambiarEstado("EN_EJECUCION", motivoRechazo.trim());
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 13 }}>Enviar Rechazo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.estadoSelectorContainer}>
      <TouchableOpacity
        style={[styles.estadoSelectorButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setMostrarOpciones(!mostrarOpciones)}
      >
        <Text style={[styles.estadoSelectorText, { color: colors.primary }]}>
          Actualizar Estado: {estadosLabels[estadoActual] || estadoActual}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.primary} />
      </TouchableOpacity>

      {mostrarOpciones && (
        <View style={[styles.estadoOpciones, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {estados.map((estado) => (
            <TouchableOpacity
              key={estado}
              style={[
                styles.estadoOpcion,
                { borderBottomColor: colors.border },
                estadoActual === estado && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => cambiarEstado(estado)}
              disabled={cargando}
            >
              <Text style={[styles.estadoOpcionText, { color: colors.text }, estadoActual === estado && { color: colors.primary, fontWeight: "bold" }]}>
                {estadosLabels[estado]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function ReporteDetalleScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const incidenciaId = route.params.reporteId || route.params.incidenciaId;

  const [incidencia, setIncidencia] = useState<IncidenciaDetalle | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  useEffect(() => {
    if (!incidenciaId) {
      showToast("ID de reporte ausente", "error");
      navigation.goBack();
      return;
    }
    cargarDetalle();
  }, []);

  const cargarDetalle = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/reportes/${incidenciaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setIncidencia(data.data);
        if (data.data.comentarios) {
          setComentarios(data.data.comentarios);
        }
        if (data.data.seguimientos) {
          setSeguimientos(data.data.seguimientos);
        }
      } else {
        showToast("Error al obtener detalles", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarComentarios = async () => {
    setCargandoComentarios(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/comentarios/incidencia/${incidenciaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setComentarios(data.data || []);
      }
    } catch {
      console.log("Error comments fetch");
    } finally {
      setCargandoComentarios(false);
    }
  };

  const cargarSeguimiento = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/seguimientos/incidencia/${incidenciaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSeguimientos(data.data || []);
      }
    } catch {
      console.log("Error tracking fetch");
    }
  };

  const enviarComentario = async (texto: string) => {
    setEnviandoComentario(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/comentarios/agregar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ incidenciaId, contenido: texto }),
      });
      const data = await response.json();
      if (data.success) {
        setComentarios([data.data, ...comentarios]);
        showToast("Comentario agregado", "success");
      }
    } catch {
      showToast("Error al enviar comentario", "error");
    } finally {
      setEnviandoComentario(false);
    }
  };

  const actualizarEstado = (nuevoEstado: string) => {
    if (incidencia) {
      setIncidencia({ ...incidencia, estado: nuevoEstado });
      cargarSeguimiento();
      showToast("Estado actualizado correctamente", "success");
    }
  };

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha no válida";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando incidencia...</Text>
      </SafeAreaView>
    );
  }

  if (!incidencia) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={[styles.emptyText, { color: colors.text }]}>No se encontró la incidencia</Text>
        <TouchableOpacity
          style={[styles.backButtonCenter, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const priConfig = getPrioridadConfig(incidencia.prioridad);
  const estConfig = getEstadoConfig(incidencia.estado);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            Incidencia #{incidencia.id.substring(0, 8).toUpperCase()}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {/* Primary Info Card */}
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.tituloContainer}>
                  <Text style={[styles.titulo, { color: colors.text }]}>{incidencia.titulo}</Text>
                  <View style={[styles.prioridadBadge, { backgroundColor: priConfig.bg }]}>
                    <Text style={[styles.prioridadTexto, { color: priConfig.color }]}>{priConfig.label}</Text>
                  </View>
                </View>

                <Text style={[styles.descripcion, { color: colors.textSecondary }]}>{incidencia.descripcion}</Text>

                <View style={[styles.metaGrid, { borderTopColor: colors.border }]}>
                  <View style={styles.metaItem}>
                    <Ionicons name="folder-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.text }]}>
                      Categoría: {getCategoriaTexto(incidencia.categoria)}
                    </Text>
                  </View>
                  {incidencia.equipo && (
                    <View style={styles.metaItem}>
                      <Ionicons name="desktop-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.text }]}>Equipo: {incidencia.equipo}</Text>
                    </View>
                  )}
                  {incidencia.ubicacion && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.text }]}>Ubicación: {incidencia.ubicacion}</Text>
                    </View>
                  )}
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.text }]}>Reportado: {formatearFecha(incidencia.fechaHora)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.text }]}>Creador: {incidencia.usuario.nombre}</Text>
                  </View>
                </View>

                <View style={[styles.tecnicoAsignadoRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="construct-outline" size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tecnicoLabel, { color: colors.textSecondary }]}>Técnico Responsable</Text>
                    <Text style={[styles.tecnicoVal, { color: colors.text }]}>
                      {incidencia.tecnicoAsignado?.nombre || "Por determinar"}
                    </Text>
                  </View>
                  <View style={[styles.estadoPill, { backgroundColor: estConfig.bg }]}>
                    <Text style={[styles.estadoPillText, { color: estConfig.color }]}>{estConfig.label}</Text>
                  </View>
                </View>
              </View>

              {/* Diagnóstico técnico */}
              {incidencia.diagnostico && (
                <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>
                    <Ionicons name="construct-outline" size={18} color="#10B981" /> Diagnóstico y Acciones Aplicadas
                  </Text>
                  <Text style={[styles.descripcion, { color: colors.text, fontWeight: 'bold' }]}>
                    {incidencia.diagnostico}
                  </Text>
                </View>
              )}

              {/* State Updater for Tech/Admin */}
              {(isAdmin() || isTecnico()) && (
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <EstadoSelector
                    estadoActual={incidencia.estado}
                    incidenciaId={incidencia.id}
                    onEstadoChange={actualizarEstado}
                  />
                </View>
              )}

              <EvidenciasSection evidencias={incidencia.evidencias} />
              <SeguimientoSection seguimientos={seguimientos} />

              {/* Comments Section */}
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 30 }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} /> Conversación ({comentarios.length})
                </Text>
                {cargandoComentarios ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
                ) : (
                  <FlatList
                    data={comentarios}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    scrollEnabled={false}
                    ListEmptyComponent={
                      <Text style={[styles.noComentarios, { color: colors.textSecondary }]}>
                        No hay comentarios todavía. Comienza la conversación abajo.
                      </Text>
                    }
                    renderItem={({ item }) => {
                      const isOwn = item.usuarioId === getCurrentUser()?.id;
                      return (
                        <View style={[styles.comentarioItem, { backgroundColor: colors.background }, isOwn && { borderLeftColor: colors.primary }]}>
                          <View style={styles.comentarioHeader}>
                            <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.comentarioNombre, { color: colors.text }]}>{item.usuario?.nombre}</Text>
                            <View style={[styles.roleLabelBadge, { backgroundColor: colors.primaryLight }]}>
                              <Text style={[styles.roleLabelText, { color: colors.primary }]}>{item.usuario?.rol}</Text>
                            </View>
                            <Text style={[styles.comentarioFecha, { color: colors.textSecondary }]}>
                              {new Date(item.fechaComentario).toLocaleDateString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </Text>
                          </View>
                          <Text style={[styles.comentarioTexto, { color: colors.text }]}>{item.contenido}</Text>
                        </View>
                      );
                    }}
                  />
                )}
                <CommentInput onSend={enviarComentario} isLoading={enviandoComentario} />
              </View>
            </>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 40 : 20 }}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 13, fontFamily: "Poppins_500Medium" },
  emptyText: { fontSize: 16, fontFamily: "Poppins_700Bold", marginTop: 12 },
  backButtonCenter: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  backButtonText: { color: "#FFFFFF", fontFamily: "Poppins_700Bold" },

  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", flex: 1, textAlign: "center" },

  // Info Card
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  tituloContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  titulo: { fontSize: 18, fontFamily: "Poppins_700Bold", flex: 1, marginRight: 10 },
  prioridadBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  prioridadTexto: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  descripcion: { fontSize: 14, fontFamily: "Poppins_400Regular", lineHeight: 20, marginBottom: 16 },

  metaGrid: {
    borderTopWidth: 1.5,
    paddingTop: 12,
    gap: 8,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaText: { fontSize: 13, fontFamily: "Poppins_400Regular" },

  tecnicoAsignadoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 16,
    gap: 12,
  },
  tecnicoLabel: { fontSize: 10, fontFamily: "Poppins_400Regular" },
  tecnicoVal: { fontSize: 13, fontFamily: "Poppins_700Bold" },
  estadoPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  estadoPillText: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },

  // Sections
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", marginBottom: 16 },
  noDataText: { fontSize: 13, textAlign: "center", marginVertical: 12, fontFamily: "Poppins_400Regular" },

  // Evidence
  evidenciasScroll: { flexDirection: "row" },
  evidenciaItem: { marginRight: 12, width: 140, borderRadius: 12, overflow: "hidden", borderWidth: 1 },
  evidenciaImage: { width: 140, height: 110 },
  imagePlaceholder: { width: 140, height: 110, justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 10, fontFamily: "Poppins_500Medium" },
  evidenciaInfo: { padding: 8, gap: 2 },
  evidenciaTipo: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  evidenciaDesc: { fontSize: 9, fontFamily: "Poppins_400Regular", lineHeight: 12 },

  // Timeline
  timelineContainer: { gap: 10 },
  timelineItem: { flexDirection: "row", minHeight: 60 },
  timelineLeft: { width: 20, alignItems: "center", marginRight: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineRight: { flex: 1 },
  timelineHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timelineUsuario: { fontSize: 12, fontFamily: "Poppins_700Bold" },
  timelineFecha: { fontSize: 10, fontFamily: "Poppins_400Regular" },
  timelineAccion: { fontSize: 13, fontFamily: "Poppins_600SemiBold", marginTop: 2 },
  timelineDesc: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },

  // State Selector
  estadoSelectorContainer: { width: "100%" },
  estadoSelectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  estadoSelectorText: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  estadoOpciones: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  estadoOpcion: { padding: 12, borderBottomWidth: 1.5 },
  estadoOpcionText: { fontSize: 13, fontFamily: "Poppins_500Medium" },

  // Comments
  noComentarios: { textAlign: "center", fontSize: 12, fontFamily: "Poppins_400Regular", paddingVertical: 20 },
  comentarioItem: { padding: 12, borderRadius: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: "transparent" },
  comentarioHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  comentarioNombre: { fontSize: 12, fontFamily: "Poppins_700Bold" },
  roleLabelBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  roleLabelText: { fontSize: 8, fontFamily: "Poppins_600SemiBold", textTransform: "uppercase" },
  comentarioFecha: { fontSize: 10, fontFamily: "Poppins_400Regular", marginLeft: "auto" },
  comentarioTexto: { fontSize: 13, fontFamily: "Poppins_400Regular", lineHeight: 18 },

  comentarioInputContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, borderTopWidth: 1.5, paddingTop: 12 },
  comentarioInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  enviarComentarioBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});