import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { 
  getCurrentUser, 
  setCurrentUser, 
  getToken, 
  obtenerIncidencias, 
  obtenerUsuarios, 
  Usuario, 
  Incidencia,
} from "../../service/auth.api";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { getAdminReportesStyles } from "../../styles/AdminReportesStyles";
import { useTheme } from "../../context/ThemeContext";

const { width, height } = Dimensions.get('window');

type IncidenciaConComentarios = Incidencia & {
  comentariosList?: any[];
  direccion?: string;
};
import { API_URL } from "../../config/api.config";
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

const getColorByEstado = (estado: string): string => {
  switch (estado) {
    case 'RECIBIDO': return '#2196F3';
    case 'EN_EVALUACION': return '#FFC107';
    case 'EN_EJECUCION': return '#9C27B0';
    case 'FINALIZADO': return '#F44336';
    case 'COMPLETADO': return '#4CAF50';
    default: return '#999';
  }
};

export default function AdminReportesScreen({ navigation }: any) {
  const { colors, theme } = useTheme();
  const styles = getAdminReportesStyles(colors, theme);
  const [incidencias, setIncidencias] = useState<IncidenciaConComentarios[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('todos');

  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'desde' | 'hasta' | null>(null);
  const [exportando, setExportando] = useState(false);
  const [exportModal, setExportModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        Alert.alert("Error", "No estás autenticado.");
        navigation.replace("Login");
        return;
      }

      const resIncidencias = await obtenerIncidencias();
      const resTecnicos = await obtenerUsuarios();

      if (resIncidencias.success && resIncidencias.data) {
        setIncidencias(resIncidencias.data as IncidenciaConComentarios[]);
      }

      if (resTecnicos.success && resTecnicos.data) {
        const tecnicosFiltrados = resTecnicos.data.filter(
          (t: Usuario) => t.rol === "TECNICO"
        );
        setTecnicos(tecnicosFiltrados);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      setExportando(true);
      const token = getToken();
      
      if (!token) {
        Alert.alert("Error", "No tienes una sesión activa");
        return;
      }

      const filename = `reporte_incidencias_${new Date().toISOString().split('T')[0]}.xlsx`;
      const path = FileSystem.documentDirectory + filename;
      
      let downloadUrl = `${API_URL}/admin/exportar-incidencias?estado=${filter}&token=${token}`;
      if (fechaDesde) {
        downloadUrl += `&fechaDesde=${fechaDesde.toISOString()}`;
      }
      if (fechaHasta) {
        downloadUrl += `&fechaHasta=${fechaHasta.toISOString()}`;
      }
      
      const result = await FileSystem.downloadAsync(
        downloadUrl,
        path,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Exportar reporte Excel Premium',
          UTI: 'com.microsoft.excel.xlsx',
        });
      } else {
        Alert.alert('Excel Premium generado', `Archivo guardado en: ${result.uri}`);
      }
    } catch (error) {
      console.error('Error exportando Excel Premium:', error);
      Alert.alert('Error', 'No se pudo descargar el archivo Excel Premium');
    } finally {
      setExportando(false);
    }
  };

  const exportarPDF = async () => {
    try {
      setExportando(true);
      const data = incidenciasFiltradas;

      const total = data.length;
      const completados = data.filter(i => i.estado === 'COMPLETADO').length;
      const enProceso = data.filter(i => ['EN_EVALUACION','EN_EJECUCION'].includes(i.estado)).length;
      const criticos = data.filter(i => i.prioridad === 'CRITICA').length;
      const recibidos = data.filter(i => i.estado === 'RECIBIDO').length;

      const estadoConfig: Record<string, {label:string; color:string; bg:string; icon:string}> = {
        'RECIBIDO':     { label:'Recibido',      color:'#1565C0', bg:'#E3F2FD', icon:'○' },
        'EN_EVALUACION':{ label:'En Evaluación', color:'#E65100', bg:'#FFF3E0', icon:'⧖' },
        'EN_EJECUCION': { label:'En Ejecución',  color:'#6A1B9A', bg:'#F3E5F5', icon:'▶' },
        'FINALIZADO':   { label:'Finalizado',    color:'#B71C1C', bg:'#FFEBEE', icon:'■' },
        'COMPLETADO':   { label:'Completado',    color:'#1B5E20', bg:'#E8F5E9', icon:'✓' },
      };

      const prioridadConfig: Record<string, {label:string; color:string; bg:string}> = {
        'CRITICA': { label:'Crítica', color:'#B71C1C', bg:'#FFCDD2' },
        'ALTA':    { label:'Alta',    color:'#E64A19', bg:'#FFE0B2' },
        'MEDIA':   { label:'Media',   color:'#F57F17', bg:'#FFF9C4' },
        'BAJA':    { label:'Baja',    color:'#2E7D32', bg:'#DCEDC8' },
      };

      const filas = data.map(inc => {
        const est = estadoConfig[inc.estado] || { label: inc.estado, color:'#555', bg:'#eee', icon:'?' };
        const pri = prioridadConfig[inc.prioridad] || { label: inc.prioridad, color:'#555', bg:'#eee' };
        return `
          <tr>
            <td style="font-size:11px;color:#666;">${inc.id.substring(0,8)}...</td>
            <td style="font-weight:600;color:#1A237E;font-size:12px;">${inc.titulo}</td>
            <td>
              <span style="background:${est.bg};color:${est.color};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">${est.icon} ${est.label}</span>
            </td>
            <td>
              <span style="background:${pri.bg};color:${pri.color};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">${pri.label}</span>
            </td>
            <td style="font-size:11px;color:#333;">${inc.categoria}</td>
            <td style="font-size:11px;color:#333;">${inc.usuario?.nombre || 'N/A'}</td>
            <td style="font-size:11px;color:#555;">${inc.tecnicoAsignado?.nombre || '<em>Sin asignar</em>'}</td>
            <td style="font-size:11px;color:#333;">${inc.area?.nombre || inc.usuario?.area?.nombre || 'N/A'}</td>
            <td style="font-size:11px;color:#888;">${new Date(inc.fechaHora).toLocaleDateString('es-PE')}</td>
          </tr>`;
      }).join('');

      const pct = (n: number) => total > 0 ? Math.round((n/total)*100) : 0;

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte TecReport</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page {
      size: letter portrait;
      margin: 0;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      color: #1E293B;
      padding: 0;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 100%;
      max-width: 100%;
      height: 98vh;
      background: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      padding: 0;
    }
    /* Header */
    .header {
      background: linear-gradient(135deg, #1A237E 0%, #283593 50%, #3949AB 100%);
      padding: 14px 20px;
      color: #fff;
    }
    .header-top { display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .brand span { color: #90CAF9; }
    .badge-gen {
      background: rgba(255,255,255,0.15);
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 9px;
      border: 1px solid rgba(255,255,255,0.25);
    }
    .report-title { margin-top: 4px; font-size: 14px; font-weight: 600; opacity: 0.9; }
    .report-sub { margin-top: 2px; font-size: 10px; opacity: 0.7; }
    
    /* KPI Cards */
    .kpi-section { background: #F8FAFC; padding: 10px 20px; border-bottom: 1px solid #E2E8F0; }
    .kpi-title { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 6px; }
    .kpi-grid { display: flex; gap: 10px; }
    .kpi-card { flex: 1; background: #fff; border-radius: 8px; padding: 8px 10px;
      border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .kpi-num { font-size: 18px; font-weight: 800; line-height: 1; }
    .kpi-label { font-size: 9px; color: #64748B; margin-top: 2px; font-weight: 500; }
    .kpi-bar { height: 3px; border-radius: 1.5px; margin-top: 4px; background: #E2E8F0; }
    .kpi-fill { height: 3px; border-radius: 1.5px; }
    
    /* Table */
    .table-section { padding: 10px 20px; flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .section-title { font-size: 12px; font-weight: 700; color: #1A237E; }
    .count-badge { background: #EEF2FF; color: #3949AB; padding: 2px 6px;
      border-radius: 10px; font-size: 9px; font-weight: 600; }
    .table-container { width: 100%; overflow: hidden; border-radius: 6px; border: 1px solid #E2E8F0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1A237E; color: #fff; padding: 5px 6px;
      font-size: 8.5px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    tr:nth-child(even) td { background: #F8FAFC; }
    td { padding: 4px 6px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; font-size: 8.5px; }
    
    /* Status breakdown */
    .breakdown { padding: 0 20px 10px; }
    .breakdown-title { font-size: 10px; font-weight: 700; color: #64748B;
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .breakdown-row { display: flex; align-items: center; margin-bottom: 3px; gap: 6px; }
    .breakdown-label { font-size: 9px; width: 100px; color: #334155; font-weight: 500; }
    .breakdown-track { flex: 1; height: 5px; background: #E2E8F0; border-radius: 2.5px; }
    .breakdown-fill { height: 5px; border-radius: 2.5px; }
    .breakdown-count { font-size: 9px; color: #64748B; width: 25px; text-align: right; }
    
    /* Footer */
    .footer { background: #F8FAFC; padding: 8px 20px;
      border-top: 1px solid #E2E8F0; text-align: center;
      font-size: 8px; color: #94A3B8; }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-top">
      <div class="brand">Tec<span>Report</span></div>
      <div class="badge-gen">Generado: ${new Date().toLocaleString('es-PE')}</div>
    </div>
    <div class="report-title">Reporte de Incidencias Técnicas</div>
    <div class="report-sub">Filtro: ${filter === 'todos' ? 'Todos los estados' : (estadoConfig[filter]?.label || filter)} &bull; ${total} registros${fechaDesde || fechaHasta ? ` &bull; Periodo: ${fechaDesde ? fechaDesde.toLocaleDateString('es-PE') : '...'} - ${fechaHasta ? fechaHasta.toLocaleDateString('es-PE') : '...'}` : ''}</div>
  </div>

  <!-- KPI Cards -->
  <div class="kpi-section">
    <div class="kpi-title">Resumen Analítico</div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-num" style="color:#1A237E">${total}</div>
        <div class="kpi-label">Total Incidencias</div>
        <div class="kpi-bar"><div class="kpi-fill" style="width:100%;background:#3949AB"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num" style="color:#2E7D32">${completados}</div>
        <div class="kpi-label">Completadas (${pct(completados)}%)</div>
        <div class="kpi-bar"><div class="kpi-fill" style="width:${pct(completados)}%;background:#4CAF50"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num" style="color:#E65100">${enProceso}</div>
        <div class="kpi-label">En Proceso</div>
        <div class="kpi-bar"><div class="kpi-fill" style="width:${pct(enProceso)}%;background:#FF9800"></div></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num" style="color:#B71C1C">${criticos}</div>
        <div class="kpi-label">Críticas</div>
        <div class="kpi-bar"><div class="kpi-fill" style="width:${pct(criticos)}%;background:#F44336"></div></div>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="table-section">
    <div class="section-header">
      <div class="section-title">📋 Detalle de Incidencias</div>
      <div class="count-badge">${total} registros</div>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Título</th><th>Estado</th><th>Prioridad</th>
            <th>Categoría</th><th>Usuario</th><th>Técnico</th><th>Área</th><th>Fecha</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  </div>

  <!-- Breakdown por estado -->
  <div class="breakdown">
    <div class="breakdown-title">Distribución por Estado</div>
    ${Object.entries(estadoConfig).map(([key, cfg]) => {
      const count = data.filter(i => i.estado === key).length;
      return `
      <div class="breakdown-row">
        <div class="breakdown-label">${cfg.icon} ${cfg.label}</div>
        <div class="breakdown-track"><div class="breakdown-fill" style="width:${pct(count)}%;background:${cfg.color}"></div></div>
        <div class="breakdown-count">${count}</div>
      </div>`;
    }).join('')}
  </div>

  <div class="footer">TecReport &mdash; Reportes e Incidentes Técnicos &bull; Generado automáticamente</div>
</div>
</body></html>`;

      // Generar archivo PDF real usando expo-print
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exportar reporte PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF generado', `Archivo PDF guardado: ${uri}`);
      }
    } catch (error) {
      console.error('Error exportando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el reporte PDF');
    } finally {
      setExportando(false);
    }
  };

  // (mantener exportarReportes original por compatibilidad)
  const exportarReportes = exportarExcel;

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
          },
        },
      ]
    );
  };

  const getPrioridadColor = (prioridad: string): string => {
    switch (prioridad) {
      case "CRITICA": return "#D32F2F";
      case "ALTA": return "#F44336";
      case "MEDIA": return "#FF9800";
      case "BAJA": return "#4CAF50";
      default: return "#999";
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

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const incidenciasFiltradas = incidencias.filter((i) => {
    // 1. Filtro de estado
    if (filter !== "todos" && i.estado !== filter) return false;

    // 2. Filtro de fecha desde
    if (fechaDesde) {
      const fechaIncidencia = new Date(i.fechaHora);
      const desde = new Date(fechaDesde);
      desde.setHours(0, 0, 0, 0);
      if (fechaIncidencia < desde) return false;
    }

    // 3. Filtro de fecha hasta
    if (fechaHasta) {
      const fechaIncidencia = new Date(i.fechaHora);
      const hasta = new Date(fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      if (fechaIncidencia > hasta) return false;
    }

    return true;
  });

  const renderIncidencia = ({ item }: { item: IncidenciaConComentarios }) => (
    <TouchableOpacity
      style={styles.reporteCard}
      onPress={() => {
        // Navegar a TecnicoDetalle con el ID de la incidencia
        navigation.navigate("TecnicoDetalle", {
          incidenciaId: item.id
        });
      }}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.estadoIndicator,
            { backgroundColor: getColorByEstado(item.estado) }
          ]}
        >
          <Text style={styles.estadoText}>{getEstadoTexto(item.estado).charAt(0)}</Text>
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.tipoText}>{getCategoriaTexto(item.categoria)}</Text>
          <Text style={styles.usuarioText}>Por: {item.usuario?.nombre || "Usuario"}</Text>
        </View>
      </View>

      <Text style={styles.tituloText} numberOfLines={1}>{item.titulo}</Text>
      <Text style={styles.descripcionText} numberOfLines={2}>
        {item.descripcion}
      </Text>

      <View style={styles.tagsContainer}>
        <View
          style={[
            styles.tag,
            { backgroundColor: getColorByEstado(item.estado) }
          ]}
        >
          <Text style={styles.tagText}>{getEstadoTexto(item.estado)}</Text>
        </View>
        <View
          style={[
            styles.tag,
            { backgroundColor: getPrioridadColor(item.prioridad) }
          ]}
        >
          <Text style={styles.tagText}>{getPrioridadTexto(item.prioridad)}</Text>
        </View>
      </View>

      {item.tecnicoAsignado && (
        <View style={styles.tecnicoInfo}>
          <Ionicons name="person" size={14} color={colors.primary} />
          <Text style={styles.tecnicoAsignadoText}>
            Asignado a: {item.tecnicoAsignado.nombre}
          </Text>
        </View>
      )}

      {item.equipo && (
        <View style={styles.tecnicoInfo}>
          <Ionicons name="desktop-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.tecnicoAsignadoText}>
            Equipo: {item.equipo}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        {item.ubicacion && (
          <View style={styles.ubicacionContainer}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.ubicacionText} numberOfLines={1}>
              {item.ubicacion}
            </Text>
          </View>
        )}
        <Text style={styles.fechaText}>{formatFecha(item.fechaHora)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando incidencias...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incidencias</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={cargarDatos} style={styles.headerButton}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros de fecha */}
      <View style={styles.filtrosFechaContainer}>
        <TouchableOpacity style={styles.fechaButton} onPress={() => setShowDatePicker('desde')}>
          <Ionicons name="calendar-outline" size={16} color="#1A237E" />
          <Text style={styles.fechaButtonText}>{fechaDesde ? fechaDesde.toLocaleDateString() : 'Desde'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fechaButton} onPress={() => setShowDatePicker('hasta')}>
          <Ionicons name="calendar-outline" size={16} color="#1A237E" />
          <Text style={styles.fechaButtonText}>{fechaHasta ? fechaHasta.toLocaleDateString() : 'Hasta'}</Text>
        </TouchableOpacity>
        {(fechaDesde || fechaHasta) && (
          <TouchableOpacity style={styles.limpiarFiltrosBtn} onPress={() => { setFechaDesde(null); setFechaHasta(null); }}>
            <Ionicons name="close-circle" size={18} color="#999" />
            <Text style={styles.limpiarFiltrosText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'desde' ? (fechaDesde || new Date()) : (fechaHasta || new Date())}
          mode="date"
          display="default"
          onChange={(event: any, selectedDate?: Date) => {
            setShowDatePicker(null);
            if (selectedDate) {
              if (showDatePicker === 'desde') setFechaDesde(selectedDate);
              else setFechaHasta(selectedDate);
            }
          }}
        />
      )}

      {/* Filtros por estado */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["todos", "RECIBIDO", "EN_EVALUACION", "EN_EJECUCION", "FINALIZADO", "COMPLETADO"]}
          renderItem={({ item: estado }) => (
            <TouchableOpacity
              style={[styles.filterButton, filter === estado && styles.filterButtonActive]}
              onPress={() => setFilter(estado as any)}
            >
              <Text style={[styles.filterText, filter === estado && styles.filterTextActive]}>
                {estado === "todos" ? "Todos" : getEstadoTexto(estado)}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* Botones de Exportación - diseño premium */}
      <View style={styles.exportBar}>
        <TouchableOpacity
          style={[styles.exportBtnExcel, exportando && styles.exportBtnDisabled]}
          onPress={exportarExcel}
          disabled={exportando}
          activeOpacity={0.85}
        >
          {exportando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <View style={styles.exportBtnIcon}>
                <Ionicons name="grid-outline" size={18} color="#1D6F42" />
              </View>
              <View>
                <Text style={styles.exportBtnLabel}>Exportar Excel</Text>
                <Text style={styles.exportBtnSub}>Formato .xlsx Premium</Text>
              </View>
              <Ionicons name="download-outline" size={16} color="#1D6F42" style={{ marginLeft: 'auto' }} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportBtnPDF, exportando && styles.exportBtnDisabled]}
          onPress={exportarPDF}
          disabled={exportando}
          activeOpacity={0.85}
        >
          {exportando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <View style={styles.exportBtnIconPDF}>
                <Ionicons name="document-text-outline" size={18} color="#C0392B" />
              </View>
              <View>
                <Text style={styles.exportBtnLabelPDF}>Exportar PDF</Text>
                <Text style={styles.exportBtnSubPDF}>Reporte .pdf Profesional</Text>
              </View>
              <Ionicons name="share-outline" size={16} color="#C0392B" style={{ marginLeft: 'auto' }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de incidencias */}
      <FlatList
        data={incidenciasFiltradas}
        renderItem={renderIncidencia}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No hay incidencias</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}