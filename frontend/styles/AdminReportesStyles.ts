import { StyleSheet, Dimensions } from "react-native";
import { lightColors } from "../context/ThemeContext";

const { width, height } = Dimensions.get('window');

export const getAdminReportesStyles = (colors: typeof lightColors, theme: "light" | "dark") => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff"
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

  // ========== FILTROS ==========
  filtersContainer: {
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme === "dark" ? colors.background : "#f5f5f5",
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  // ========== LISTA DE INCIDENCIAS ==========
  list: {
    padding: 16,
    paddingBottom: 30,
  },
  reporteCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  estadoIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  estadoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cardTitleContainer: {
    flex: 1,
  },
  tipoText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 2,
  },
  usuarioText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tituloText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  descripcionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  tecnicoInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  tecnicoAsignadoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  ubicacionContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  ubicacionText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  fechaText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },

  // ========== MODAL ==========
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.85,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  modalTipoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  modalTipoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalTipoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalEstadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalEstadoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  direccionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  direccionText: {
    fontSize: 14,
    color: colors.primary,
    flex: 1,
    lineHeight: 20,
  },
  modalDescripcion: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // ========== EVIDENCIAS (reemplaza las imágenes) ==========
  evidenciasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  evidenciaItem: {
    alignItems: "center",
    width: 100,
  },
  evidenciaPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: theme === "dark" ? colors.background : "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  evidenciaTipo: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sinImagen: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    backgroundColor: theme === "dark" ? colors.background : "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  sinImagenText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // ========== INFORMACIÓN DEL MODAL ==========
  modalInfoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 100,
  },
  modalInfoValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  
  // ========== TÉCNICOS ==========
  tecnicoAsignadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginBottom: 8,
  },
  tecnicoAsignadoNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  tecnicoAsignadoEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sinTecnicosText: {
    textAlign: "center",
    color: colors.textSecondary,
    padding: 20,
  },
  tecnicoOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tecnicoOptionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tecnicoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tecnicoAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  tecnicoOptionNombre: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  tecnicoOptionEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  // ========== BOTONES DE ACCIÓN ==========
  recibidoButton: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  recibidoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  completarButton: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  completarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // ========== COMENTARIOS ==========
  comentariosList: {
    maxHeight: 200,
    marginBottom: 10,
  },
  comentarioItem: {
    backgroundColor: theme === "dark" ? colors.background : "#f8f9fa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  comentarioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
    flexWrap: "wrap",
  },
  comentarioNombre: {
    fontWeight: "bold",
    fontSize: 13,
    color: colors.primary,
  },
  comentarioRol: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  comentarioFecha: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: "auto",
  },
  comentarioTexto: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  noComentarios: {
    textAlign: "center",
    color: colors.textSecondary,
    fontStyle: "italic",
    marginVertical: 20,
  },
  comentarioInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 16,
  },
  comentarioInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme === "dark" ? colors.background : "#fff",
    maxHeight: 80,
    fontSize: 14,
    color: colors.text,
  },
  enviarComentarioBtn: {
    backgroundColor: colors.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  destinatarioSelector: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  destinatarioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme === "dark" ? colors.background : "#f0f0f0",
    gap: 6,
  },
  destinatarioActive: {
    backgroundColor: colors.primary,
  },
  destinatarioText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  destinatarioTextActive: {
    color: "#fff",
  },
  tagPrivado: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff9800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: "flex-start",
    gap: 4,
  },
  tagPrivadoText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
  },
  filtrosFechaContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
    alignItems: "center",
  },
  fechaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme === "dark" ? colors.background : "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fechaButtonText: {
    fontSize: 12,
    color: colors.text,
  },
  limpiarFiltrosBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme === "dark" ? colors.background : "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  limpiarFiltrosText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // ========== EXPORT BAR - PREMIUM ==========
  exportBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  exportBtnExcel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme === "dark" ? "#064E3B" : "#F0FFF4",
    borderWidth: 1.5,
    borderColor: theme === "dark" ? "#15803D" : "#BBF7D0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    shadowColor: "#1D6F42",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  exportBtnPDF: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme === "dark" ? "#7F1D1D" : "#FFF5F5",
    borderWidth: 1.5,
    borderColor: theme === "dark" ? "#B91C1C" : "#FECACA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    shadowColor: "#C0392B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  exportBtnDisabled: {
    opacity: 0.5,
  },
  exportBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: theme === "dark" ? "#166534" : "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  exportBtnIconPDF: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: theme === "dark" ? "#991B1B" : "#FFE4E6",
    justifyContent: "center",
    alignItems: "center",
  },
  exportBtnLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme === "dark" ? "#86efac" : "#1D6F42",
  },
  exportBtnSub: {
    fontSize: 10,
    color: theme === "dark" ? "#bbf7d0" : "#16A34A",
    marginTop: 1,
  },
  exportBtnLabelPDF: {
    fontSize: 13,
    fontWeight: "700",
    color: theme === "dark" ? "#fca5a5" : "#C0392B",
  },
  exportBtnSubPDF: {
    fontSize: 10,
    color: theme === "dark" ? "#fecaca" : "#DC2626",
    marginTop: 1,
  },
  exportButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
});