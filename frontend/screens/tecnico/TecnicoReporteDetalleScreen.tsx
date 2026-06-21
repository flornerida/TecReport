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
  FlatList,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getCurrentUser, getToken, obtenerIncidenciaPorId, actualizarEstadoIncidencia, EstadoIncidencia, agregarComentario, obtenerComentarios, subirEvidencia } from "../../service/auth.api";
import { API_URL } from "../../config/api.config";
import { useTheme } from "../../context/ThemeContext";

// ========== FUNCIONES AUXILIARES ==========
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

// ========== COMPONENTE IMAGEN CON MODAL ==========
const ImageViewer = ({ imageUrl, onPress, styles }: { imageUrl: string; onPress: () => void; styles: any }) => {
  const [error, setError] = useState(false);
  if (!imageUrl || error) {
    return (
      <TouchableOpacity style={styles.imagePlaceholder} onPress={onPress} activeOpacity={0.7}>
        <Ionicons name="image-outline" size={40} color="#ccc" />
        <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
      </TouchableOpacity>
    );
  }
  const isBase64 = imageUrl.startsWith('data:image');
  const source = isBase64 ? { uri: imageUrl } : { uri: imageUrl };
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Image source={source} style={styles.evidenciaImage} resizeMode="cover" onError={() => setError(true)} />
    </TouchableOpacity>
  );
};

// ========== COMPONENTE PRINCIPAL ==========
export default function TecnicoReporteDetalleScreen({ navigation, route }: any) {
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);
  const { reporteId } = route.params;
  const [incidencia, setIncidencia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cambiando, setCambiando] = useState(false);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  // Nuevas fotos seleccionadas (temporal)
  const [nuevasFotos, setNuevasFotos] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState<any>(null);
  const [diagnostico, setDiagnostico] = useState("");

  // Modal para imagen ampliada
  const [imagenAmpliadaVisible, setImagenAmpliadaVisible] = useState(false);
  const [imagenAmpliadaUrl, setImagenAmpliadaUrl] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    setUsuarioActual(user);
    cargarDetalle();
  }, []);

  // Cargar incidencia actual
  const cargarDetalle = async () => {
    try {
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado.");
        navigation.goBack();
        return;
      }
      const res = await obtenerIncidenciaPorId(reporteId);
      if (res.success) {
        setIncidencia(res.data);
        if (res.data && res.data.comentarios) {
          setComentarios(res.data.comentarios);
        }
      } else {
        Alert.alert("Error", res.message || "No se pudo cargar la incidencia");
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const cargarComentarios = async () => {
    setCargandoComentarios(true);
    try {
      const token = getToken();
      const res = await obtenerComentarios(reporteId);
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
    if (!nuevoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const token = getToken();
      const res = await agregarComentario({
        incidenciaId: reporteId,
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

  // --- Lógica de fotos ---
  const fotosGuardadasCount = incidencia?.evidencias?.filter((e: any) => e.tipo === 'SOLUCION' && !e.descripcion?.includes('[RECHAZADA]')).length || 0;
  const MAX_FOTOS = 3;
  const disponibles = MAX_FOTOS - fotosGuardadasCount;

  const seleccionarMultiplesImagenes = async () => {
    if (disponibles <= 0) {
      Alert.alert("Límite alcanzado", "Ya tienes 3 fotos de solución. No puedes agregar más.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitas permitir acceso a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets) {
      let nuevas = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
      if (nuevas.length > disponibles) {
        Alert.alert("Límite", `Solo puedes agregar ${disponibles} foto(s) más.`);
        nuevas = nuevas.slice(0, disponibles);
      }
      setNuevasFotos(prev => [...prev, ...nuevas]);
    }
  };

  const tomarFoto = async () => {
    if (disponibles <= 0) {
      Alert.alert("Límite alcanzado", "Ya tienes 3 fotos de solución. No puedes agregar más.");
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitas permitir acceso a la cámara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const nuevaFoto = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setNuevasFotos(prev => [...prev, nuevaFoto]);
    }
  };

  const eliminarFotoNueva = (index: number) => {
    const nuevas = [...nuevasFotos];
    nuevas.splice(index, 1);
    setNuevasFotos(nuevas);
  };

  const subirFotosYFinalizar = async () => {
    if (nuevasFotos.length === 0) {
      Alert.alert("Requisito", "Debes subir al menos 1 foto de evidencia de la solución");
      return;
    }
    if (!diagnostico.trim()) {
      Alert.alert("Requisito", "Por favor ingresa un diagnóstico y resumen de las acciones realizadas");
      return;
    }
    setSubiendoFotos(true);
    try {
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        return;
      }
      let fotosSubidas = 0;
      for (const foto of nuevasFotos) {
        const res = await subirEvidencia({
          incidenciaId: reporteId,
          tipo: 'SOLUCION',
          urlFoto: foto,
          descripcion: `Evidencia de solución - ${new Date().toLocaleString()}`
        });
        if (res.success) fotosSubidas++;
      }
      if (fotosSubidas > 0) {
        const resEstado = await actualizarEstadoIncidencia(reporteId, 'FINALIZADO', undefined, diagnostico.trim());
        if (resEstado.success) {
          Alert.alert("Éxito", `Trabajo finalizado con ${fotosSubidas} evidencia(s) y diagnóstico registrado.`);
          setModalVisible(false);
          setNuevasFotos([]);
          setDiagnostico("");
          await cargarDetalle(); // refresca lista de fotos
        } else {
          Alert.alert("Error", resEstado.message || "No se pudo cambiar el estado");
        }
      } else {
        Alert.alert("Error", "No se pudieron subir las evidencias");
      }
    } catch (error) {
      console.error("Error subiendo fotos:", error);
      Alert.alert("Error", "Error al subir las evidencias");
    } finally {
      setSubiendoFotos(false);
    }
  };

  const agregarEvidenciasAdicionales = async () => {
    if (nuevasFotos.length === 0) {
      Alert.alert("Requisito", "Selecciona al menos una foto adicional");
      return;
    }
    setSubiendoFotos(true);
    try {
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        return;
      }
      let fotosSubidas = 0;
      for (const foto of nuevasFotos) {
        const res = await subirEvidencia({
          incidenciaId: reporteId,
          tipo: 'SOLUCION',
          urlFoto: foto,
          descripcion: `Evidencia adicional - ${new Date().toLocaleString()}`
        });
        if (res.success) fotosSubidas++;
      }
      if (fotosSubidas > 0) {
        Alert.alert("Éxito", `Se agregaron ${fotosSubidas} evidencia(s) adicionales`);
        setModalVisible(false);
        setNuevasFotos([]);
        await cargarDetalle(); // actualiza en tiempo real
      } else {
        Alert.alert("Error", "No se pudieron subir las evidencias");
      }
    } catch (error) {
      console.error("Error subiendo fotos adicionales:", error);
      Alert.alert("Error", "Error al subir las evidencias");
    } finally {
      setSubiendoFotos(false);
    }
  };

  // Cambio de estado
  const cambiarEstado = async (nuevoEstado: EstadoIncidencia) => {
    if (nuevoEstado === 'FINALIZADO') {
      setModalVisible(true);
      return;
    }
    if (nuevoEstado === 'COMPLETADO') {
      Alert.alert("Acceso Denegado", "Solo el administrador puede completar la incidencia.");
      return;
    }
    setCambiando(true);
    try {
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado");
        return;
      }
      const res = await actualizarEstadoIncidencia(reporteId, nuevoEstado);
      if (res.success) {
        Alert.alert("Éxito", `Estado actualizado a ${getEstadoTexto(nuevoEstado)}`);
        await cargarDetalle();
      } else {
        Alert.alert("Error", res.message || "No se pudo cambiar el estado");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cambiar el estado");
    } finally {
      setCambiando(false);
    }
  };

  const getSiguientesEstados = (estadoActual: string) => {
    const opciones: { [key: string]: Array<{ nombre: EstadoIncidencia; color: string; label: string }> } = {
      RECIBIDO: [{ nombre: "EN_EVALUACION", color: "#FFC107", label: "Iniciar Evaluación" }],
      EN_EVALUACION: [{ nombre: "EN_EJECUCION", color: "#9C27B0", label: "Iniciar Ejecución" }],
      EN_EJECUCION: [{ nombre: "FINALIZADO", color: "#F44336", label: "Finalizar Trabajo" }],
      FINALIZADO: [],
      COMPLETADO: [],
    };
    return opciones[estadoActual] || [];
  };

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha no válida";
    }
  };

  const abrirImagenGrande = (url: string) => {
    setImagenAmpliadaUrl(url);
    setImagenAmpliadaVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando detalle...</Text>
      </SafeAreaView>
    );
  }

  if (!incidencia) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Incidencia no encontrada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.primary }]}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const evidenciasSolucionGuardadas = incidencia.evidencias?.filter((e: any) => e.tipo === 'SOLUCION' && !e.descripcion?.includes('[RECHAZADA]')) || [];
  const evidenciasRechazadas = incidencia.evidencias?.filter((e: any) => e.tipo === 'SOLUCION' && e.descripcion?.includes('[RECHAZADA]')) || [];
  const totalFotosActual = evidenciasSolucionGuardadas.length;
  const puedeAgregarEvidencias = incidencia.estado === 'FINALIZADO' && usuarioActual?.rol === 'TECNICO' && totalFotosActual < MAX_FOTOS;

  // Buscar el motivo de rechazo en los comentarios
  const comentarioRechazo = comentarios.find((c: any) => c.contenido?.includes("Solución rechazada. Motivo:"));
  const motivoTexto = comentarioRechazo 
    ? comentarioRechazo.contenido.replace("Solución rechazada. Motivo:", "").trim()
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle de Incidencia</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Estado */}
        <View style={styles.estadoContainer}>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(incidencia.estado) }]}>
            <Text style={styles.estadoText}>{getEstadoTexto(incidencia.estado)}</Text>
          </View>
        </View>

        {motivoTexto && incidencia.estado === 'EN_EJECUCION' && (
          <View style={{
            backgroundColor: "#FEE2E2",
            borderColor: "#EF4444",
            borderWidth: 1.5,
            borderRadius: 16,
            padding: 16,
            marginHorizontal: 16,
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

        {/* Información principal */}
        <View style={styles.infoCard}>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Categoría</Text>
              <Text style={styles.value}>{getCategoriaTexto(incidencia.categoria)}</Text>
            </View>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Prioridad</Text>
              <Text style={[styles.value, { color: getPrioridadColor(incidencia.prioridad) }]}>
                {getPrioridadTexto(incidencia.prioridad)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Título</Text>
          <Text style={styles.titulo}>{incidencia.titulo}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Descripción</Text>
          <Text style={styles.descripcion}>{incidencia.descripcion}</Text>
        </View>

        {incidencia.equipo && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Equipo afectado</Text>
            <View style={styles.infoRow}>
              <Ionicons name="desktop-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{incidencia.equipo}</Text>
            </View>
          </View>
        )}

        {incidencia.ubicacion && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Ubicación</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{incidencia.ubicacion}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.label}>Información del reporte</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#666" />
            <Text style={styles.infoText}>Reportado por: {incidencia.usuario?.nombre || "Anónimo"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#666" />
            <Text style={styles.infoText}>Fecha: {formatearFecha(incidencia.fechaHora)}</Text>
          </View>
          {incidencia.tecnicoAsignado && (
            <View style={styles.infoRow}>
              <Ionicons name="construct-outline" size={18} color="#666" />
              <Text style={styles.infoText}>Técnico asignado: {incidencia.tecnicoAsignado.nombre}</Text>
            </View>
          )}
          {incidencia.area && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={18} color="#666" />
              <Text style={styles.infoText}>Área: {incidencia.area.nombre}</Text>
            </View>
          )}
          {incidencia.fechaResolucion && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-done-outline" size={18} color="#4CAF50" />
              <Text style={styles.infoText}>Resuelto: {formatearFecha(incidencia.fechaResolucion)}</Text>
            </View>
          )}
        </View>

        {/* Evidencias del problema */}
        {incidencia.evidencias && incidencia.evidencias.filter((e: any) => e.tipo === 'PROBLEMA').length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Evidencias del Problema</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasScroll}>
              {incidencia.evidencias.filter((e: any) => e.tipo === 'PROBLEMA').map((ev: any, idx: number) => (
                <View key={ev.id || idx} style={styles.evidenciaItem}>
                  <ImageViewer imageUrl={ev.urlFoto} onPress={() => abrirImagenGrande(ev.urlFoto)} styles={styles} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Diagnóstico técnico */}
        {incidencia.diagnostico && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Diagnóstico y Acciones Aplicadas</Text>
            <View style={styles.infoRow}>
              <Ionicons name="construct" size={18} color="#4CAF50" style={{ marginRight: 6 }} />
              <Text style={[styles.infoText, { fontWeight: 'bold', color: '#4CAF50' }]}>{incidencia.diagnostico}</Text>
            </View>
          </View>
        )}

        {/* Evidencias de solución guardadas */}
        {evidenciasSolucionGuardadas.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Evidencias de la Solución ({evidenciasSolucionGuardadas.length}/3)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasScroll}>
              {evidenciasSolucionGuardadas.map((ev: any, idx: number) => (
                <View key={ev.id || idx} style={styles.evidenciaItem}>
                  <ImageViewer imageUrl={ev.urlFoto} onPress={() => abrirImagenGrande(ev.urlFoto)} styles={styles} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Evidencias Rechazadas */}
        {evidenciasRechazadas.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={[styles.label, { color: '#EF5350', fontWeight: 'bold' }]}>Evidencias de Solución Rechazadas (Volver a Corregir)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenciasScroll}>
              {evidenciasRechazadas.map((ev: any, idx: number) => (
                <View key={ev.id || idx} style={styles.evidenciaItem}>
                  <ImageViewer imageUrl={ev.urlFoto} onPress={() => abrirImagenGrande(ev.urlFoto)} styles={styles} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Botón para agregar más evidencias */}
        {puedeAgregarEvidencias && (
          <TouchableOpacity
            style={styles.agregarEvidenciasButton}
            onPress={() => {
              setNuevasFotos([]);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#1A237E" />
            <Text style={styles.agregarEvidenciasText}>Agregar más evidencias ({disponibles} disponible(s))</Text>
          </TouchableOpacity>
        )}

        {/* Comentarios */}
        <View style={styles.comentariosSection}>
          <Text style={styles.comentariosTitle}>Comentarios ({comentarios.length})</Text>
          {cargandoComentarios ? (
            <ActivityIndicator size="small" color="#1A237E" />
          ) : (
            <FlatList
              data={comentarios}
              keyExtractor={(item, idx) => item.id || idx.toString()}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 10 }}
              ListEmptyComponent={<Text style={styles.noComentarios}>No hay comentarios aún</Text>}
              renderItem={({ item }) => (
                <View style={styles.comentarioItem}>
                  <View style={styles.comentarioHeader}>
                    <Ionicons name="person-circle" size={20} color="#1A237E" />
                    <Text style={styles.comentarioNombre}>{item.usuario?.nombre || "Usuario"}</Text>
                    <Text style={styles.comentarioRol}>({item.usuario?.rol || "USUARIO"})</Text>
                    <Text style={styles.comentarioFecha}>{new Date(item.fechaComentario).toLocaleString()}</Text>
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
            <TouchableOpacity style={styles.enviarComentarioBtn} onPress={enviarComentario} disabled={enviandoComentario}>
              {enviandoComentario ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Botones de acciones */}
        {getSiguientesEstados(incidencia.estado).length > 0 && (
          <View style={styles.actionsContainer}>
            {getSiguientesEstados(incidencia.estado).map((opcion, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.actionButton, { backgroundColor: opcion.color }]}
                onPress={() => cambiarEstado(opcion.nombre)}
                disabled={cambiando || subiendoFotos}
              >
                {cambiando ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>{opcion.label}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mensajes informativos */}
        {incidencia.estado === 'FINALIZADO' && (
          <View style={styles.infoMensaje}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.infoMensajeTexto}>Esta incidencia está pendiente de revisión por el administrador.</Text>
          </View>
        )}
        {incidencia.estado === 'COMPLETADO' && (
          <View style={[styles.infoMensaje, styles.infoMensajeCompletado]}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={[styles.infoMensajeTexto, { color: '#4CAF50' }]}>Incidencia completada y verificada por el administrador.</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal para agregar nuevas fotos (finalizar o añadir) */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {incidencia.estado === 'FINALIZADO' ? "Agregar Evidencias" : "Finalizar Trabajo"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              {incidencia.estado === 'FINALIZADO'
                ? `Puedes agregar hasta ${disponibles} foto(s) más.`
                : "Sube evidencia de la solución (mínimo 1 foto, máximo 3)"}
            </Text>

            {incidencia.estado !== 'FINALIZADO' && (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  Diagnóstico y Acciones Realizadas *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    padding: 10,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    backgroundColor: theme === 'dark' ? colors.background : '#fff',
                    color: colors.text
                  }}
                  placeholder="Explica qué problema encontraste y cómo lo solucionaste..."
                  placeholderTextColor="#999"
                  value={diagnostico}
                  onChangeText={setDiagnostico}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.fotoButtonsContainer}>
              <TouchableOpacity style={styles.fotoButton} onPress={tomarFoto}>
                <Ionicons name="camera" size={28} color="#1A237E" />
                <Text style={styles.fotoButtonText}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fotoButton} onPress={seleccionarMultiplesImagenes}>
                <Ionicons name="images" size={28} color="#1A237E" />
                <Text style={styles.fotoButtonText}>Galería (varias)</Text>
              </TouchableOpacity>
            </View>

            {nuevasFotos.length > 0 && (
              <ScrollView horizontal style={styles.previewScroll}>
                {nuevasFotos.map((foto, idx) => (
                  <View key={idx} style={styles.previewItem}>
                    <Image source={{ uri: foto }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.previewDelete} onPress={() => eliminarFotoNueva(idx)}>
                      <Ionicons name="close-circle" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancelar]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonTextCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirmar,
                  nuevasFotos.length === 0 && styles.modalButtonDisabled
                ]}
                onPress={() => {
                  if (incidencia.estado === 'FINALIZADO') agregarEvidenciasAdicionales();
                  else subirFotosYFinalizar();
                }}
                disabled={nuevasFotos.length === 0 || subiendoFotos}
              >
                {subiendoFotos ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextConfirmar}>
                    {incidencia.estado === 'FINALIZADO'
                      ? `Agregar ${nuevasFotos.length} foto(s)`
                      : `Finalizar (${nuevasFotos.length}/1)`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para ver imagen a pantalla completa */}
      <Modal
        visible={imagenAmpliadaVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImagenAmpliadaVisible(false)}
      >
        <View style={styles.fullScreenModal}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setImagenAmpliadaVisible(false)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {imagenAmpliadaUrl ? (
            <Image
              source={{ uri: imagenAmpliadaUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
              onError={() => setImagenAmpliadaVisible(false)}
            />
          ) : (
            <View style={styles.fullScreenPlaceholder}>
              <Ionicons name="image-outline" size={60} color="#ccc" />
              <Text style={styles.imagePlaceholderText}>No se pudo cargar la imagen</Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ========== ESTILOS ==========
const getStyles = (colors: any, theme: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary },
  backText: { marginTop: 16, color: colors.primary, fontWeight: "bold" },
  header: {
    backgroundColor: colors.primary,
    padding: 15,
    paddingTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  estadoContainer: { alignItems: "center", marginVertical: 15 },
  estadoBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  estadoText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  infoCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
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
  titulo: { fontSize: 18, fontWeight: "bold", color: colors.text, marginTop: 4 },
  descripcion: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 6, gap: 8 },
  infoText: { fontSize: 14, color: colors.text, flex: 1 },
  evidenciasScroll: { flexDirection: "row", marginTop: 8 },
  evidenciaItem: { alignItems: "center", marginRight: 12, width: 120 },
  evidenciaImage: { width: 120, height: 100, borderRadius: 8, backgroundColor: theme === "dark" ? colors.background : "#f5f5f5" },
  imagePlaceholder: { width: 120, height: 100, borderRadius: 8, backgroundColor: theme === "dark" ? colors.background : "#f5f5f5", justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  actionsContainer: { paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  actionButton: { paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  infoMensaje: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoMensajeCompletado: { backgroundColor: "#E8F5E9" },
  infoMensajeTexto: { flex: 1, fontSize: 13, color: "#FF9800" },
  comentariosSection: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: colors.card, borderRadius: 20, width: "90%", maxHeight: "80%", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: colors.primary },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  fotoButtonsContainer: { flexDirection: "row", justifyContent: "center", gap: 20, marginBottom: 20 },
  fotoButton: { alignItems: "center", backgroundColor: theme === "dark" ? colors.background : "#f5f5f5", padding: 15, borderRadius: 12, width: 100 },
  fotoButtonText: { marginTop: 8, fontSize: 12, color: colors.primary, fontWeight: "500" },
  previewScroll: { flexDirection: "row", marginBottom: 20 },
  previewItem: { position: "relative", marginRight: 10 },
  previewImage: { width: 100, height: 100, borderRadius: 10 },
  previewDelete: { position: "absolute", top: -8, right: -8, backgroundColor: "#fff", borderRadius: 12 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 10 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  modalButtonCancelar: { backgroundColor: theme === "dark" ? colors.background : "#f5f5f5", borderWidth: 1, borderColor: colors.border },
  modalButtonConfirmar: { backgroundColor: "#4CAF50" },
  modalButtonDisabled: { backgroundColor: "#ccc" },
  modalButtonTextCancelar: { color: colors.textSecondary, fontWeight: "500" },
  modalButtonTextConfirmar: { color: "#fff", fontWeight: "bold" },
  agregarEvidenciasButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  agregarEvidenciasText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "90%",
  },
  fullScreenPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 25,
    padding: 8,
  },
});