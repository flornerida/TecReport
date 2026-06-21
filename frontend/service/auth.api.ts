import { API_URL } from '../config/api.config';
import apiClient from '../config/apiClient';

export type Rol = 'ADMIN' | 'TECNICO' | 'USUARIO';
export type CategoriaIncidencia = 'HARDWARE' | 'SOFTWARE' | 'RED' | 'OTRO';
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type EstadoIncidencia = 'RECIBIDO' | 'EN_EVALUACION' | 'EN_EJECUCION' | 'FINALIZADO' | 'COMPLETADO';

export type TipoEvidencia = 'PROBLEMA' | 'SOLUCION';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: Rol;
  activo: boolean;
  areaId?: string | null;
  area?: Area;
  createdAt: string;
  token?: string;
}

export interface Area {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

export interface Evidencia {
  id: string;
  incidenciaId: string;
  usuarioId: string;
  tipo: TipoEvidencia;
  urlFoto: string;
  descripcion?: string | null;
  fechaSubida: string;
}

export interface Comentario {
  id: string;
  usuarioId: string;
  usuario?: Usuario;
  fechaComentario: string;
  contenido: string;
  incidenciaId: string;
}

export interface Seguimiento {
  id: string;
  incidenciaId: string;
  usuarioId: string;
  usuario?: Usuario;
  accion: string;
  descripcion?: string | null;
  estadoAnterior?: EstadoIncidencia | null;
  estadoNuevo?: EstadoIncidencia | null;
  fecha: string;
}

export interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  fechaHora: string;
  fechaResolucion?: string | null;
  usuarioId: string;
  tecnicoAsignadoId?: string | null;
  categoria: CategoriaIncidencia;
  prioridad: Prioridad;
  estado: EstadoIncidencia;
  ubicacion?: string | null;
  equipo?: string | null;
  entidadId?: string | null;
  areaId?: string | null;
  
  usuario?: Usuario;
  tecnicoAsignado?: Usuario | null;
  area?: Area | null;
  entidad?: Entidad | null;
  evidencias?: Evidencia[];
  comentarios?: Comentario[];
  seguimientos?: Seguimiento[];
  asignaciones?: Asignacion[];
}

export interface Entidad {
  id: string;
  nombre: string;
  tipo: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface Asignacion {
  id: string;
  tecnicoId: string;
  fechaAsignacion: string;
  incidenciaId: string;
  tecnico?: Usuario;
  incidencia?: Incidencia;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  mensaje: string;
  fechaEnvio: string;
  leido: boolean;
  incidenciaId?: string | null;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  area?: string;
  cargo?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ========== ESTADO DE SESIÓN ==========

let currentUser: Usuario | null = null;

export const setCurrentUser = (user: Usuario | null) => {
  currentUser = user;
  if (user) {
    console.log('✅ Usuario guardado:', {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    });
  } else {
    console.log('🔴 Sesión cerrada');
  }
};

export const getCurrentUser = (): Usuario | null => {
  return currentUser;
};

export const getToken = (): string | null => {
  return currentUser?.token || null;
};

export const updateCurrentUser = (updates: Partial<Usuario>) => {
  if (currentUser) {
    currentUser = { ...currentUser, ...updates };
    console.log('✅ Usuario actualizado en contexto:', currentUser);
  }
};

// ========== VERIFICACIÓN DE ROLES ==========

export const isAdmin = (): boolean => {
  return currentUser?.rol === 'ADMIN';
};

export const isTecnico = (): boolean => {
  return currentUser?.rol === 'TECNICO';
};

export const isUsuario = (): boolean => {
  return currentUser?.rol === 'USUARIO';
};

// ========== AUTENTICACIÓN ==========

export const login = async (loginData: LoginData): Promise<ApiResponse<{ token: string; user: Usuario }>> => {
  try {
    console.log('🔐 Intentando login:', loginData.email);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    
    const data = await response.json();
    console.log('📡 Respuesta login:', data);
    
    if (data.success) {
      const user: Usuario = {
        id: data.data.user.id,
        nombre: data.data.user.nombre,
        email: data.data.user.email,
        telefono: data.data.user.telefono,
        rol: data.data.user.rol || 'USUARIO',
        activo: data.data.user.activo ?? true,
        areaId: data.data.user.areaId,
        area: data.data.user.area,
        createdAt: data.data.user.createdAt || new Date().toISOString(),
        token: data.data.token
      };

      setCurrentUser(user);

      return {
        success: true,
        data: {
          token: data.data.token,
          user: user
        }
      };
    }
    return data;
  } catch (error) {
    console.error('❌ Error en login:', error);
    return { success: false, message: 'Error de conexión con el servidor' };
  }
};

export const register = async (registerData: RegisterData): Promise<ApiResponse<Usuario>> => {
  try {
    const payload = {
      nombre: registerData.nombre,
      email: registerData.email,
      password: registerData.password,
      telefono: registerData.telefono,
      area: registerData.area,
      cargo: registerData.cargo
    };

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        data: data.data,
        message: 'Usuario registrado correctamente'
      };
    }
    return data;
  } catch (error) {
    console.error('❌ Error en register:', error);
    return { success: false, message: 'Error de conexión con el servidor' };
  }
};

export const logout = (): void => {
  setCurrentUser(null);
  console.log('🔴 Sesión cerrada manualmente');
};

// ========== INCIDENCIAS ==========

export const obtenerDatosReferencia = async (): Promise<ApiResponse<{
  areas: Area[];
  categorias: { value: CategoriaIncidencia; label: string }[];
  prioridades: { value: Prioridad; label: string }[];
  estados: { value: EstadoIncidencia; label: string }[];
}>> => {
  try {
    const response = await fetch(`${API_URL}/reportes/datos-referencia`);
    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo datos referencia:', error);
    return { success: false, message: 'Error de conexión con el servidor' };
  }
};

export interface CrearIncidenciaData {
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidencia;
  prioridad: Prioridad;
  ubicacion?: string;
  equipo?: string;
  entidadId?: string;
  areaId?: string;
  evidencias?: string[];
}

export const crearIncidencia = async (incidencia: CrearIncidenciaData): Promise<ApiResponse<Incidencia>> => {
  try {
    const user = getCurrentUser();
    const token = getToken();

    if (!user) {
      return { success: false, message: "Debes iniciar sesión" };
    }

    if (!incidencia.titulo || !incidencia.descripcion || !incidencia.categoria || !incidencia.prioridad) {
      return {
        success: false,
        message: "Faltan datos requeridos: título, descripción, categoría o prioridad"
      };
    }

    console.log('📸 Enviando al backend:', {
      titulo: incidencia.titulo,
      categoria: incidencia.categoria,
      prioridad: incidencia.prioridad,
      evidenciasCount: incidencia.evidencias?.length || 0
    });

    const response = await fetch(`${API_URL}/reportes/crear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        titulo: incidencia.titulo,
        descripcion: incidencia.descripcion,
        categoria: incidencia.categoria,
        prioridad: incidencia.prioridad,
        ubicacion: incidencia.ubicacion,
        equipo: incidencia.equipo,
        areaId: incidencia.areaId,
        evidencias: incidencia.evidencias || []
      })
    });

    const data = await response.json();
    console.log('📡 Respuesta crear incidencia:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en crearIncidencia:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error de conexión con el servidor'
    };
  }
};

export const obtenerIncidencias = async (filtros?: {
  estado?: EstadoIncidencia;
  prioridad?: Prioridad;
  categoria?: CategoriaIncidencia;
  areaId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Incidencia[]>> => {
  try {
    console.log('📋 Obteniendo incidencias...', filtros);

    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = `/reportes`;
    if (filtros && Object.keys(filtros).length > 0) {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.areaId) params.append('areaId', filtros.areaId);
      if (filtros.page) params.append('page', filtros.page.toString());
      if (filtros.limit) params.append('limit', filtros.limit.toString());
      url += `?${params.toString()}`;
    }

    const response = await apiClient.get(url);
    const data = response.data;

    console.log('📡 Respuesta del servidor:', {
      success: data.success,
      total: data.data?.length || 0
    });

    return {
      success: data.success || false,
      data: Array.isArray(data.data) ? data.data : [],
      message: data.message
    };
  } catch (error) {
    console.error('❌ Error obteniendo incidencias:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

export const obtenerMisIncidencias = async (page = 1, limit = 10): Promise<ApiResponse<Incidencia[]>> => {
  try {
    const user = getCurrentUser();
    const token = getToken();

    if (!user) {
      return { success: false, message: "No autenticado", data: [] };
    }

    const response = await apiClient.get(`/reportes?page=${page}&limit=${limit}`);
    const data = response.data;

    if (data.success && Array.isArray(data.data)) {
      const misIncidencias = data.data.filter((inc: any) => inc.usuarioId === user.id);
      return {
        success: true,
        data: misIncidencias,
        message: data.message
      };
    }

    return {
      success: data.success || false,
      data: [],
      message: data.message
    };
  } catch (error) {
    console.error('❌ Error obteniendo mis incidencias:', error);
    return { success: false, data: [], message: 'Error de conexión' };
  }
};

export const obtenerIncidenciaPorId = async (id: string): Promise<ApiResponse<Incidencia>> => {
  try {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/reportes/${id}`, { headers });
    const data = await response.json();

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo incidencia:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

export const actualizarEstadoIncidencia = async (
  incidenciaId: string,
  nuevoEstado: EstadoIncidencia,
  comentario?: string,
  diagnostico?: string
): Promise<ApiResponse<Incidencia>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/reportes/${incidenciaId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado, comentario, diagnostico })
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

export const asignarTecnico = async (
  incidenciaId: string,
  tecnicoId: string
): Promise<ApiResponse<Asignacion>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/reportes/${incidenciaId}/asignar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tecnicoId })
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error asignando técnico:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

// ========== EVIDENCIAS ==========
export interface SubirEvidenciaData {
  incidenciaId: string;
  tipo: TipoEvidencia;
  urlFoto: string;
  descripcion?: string;
}

export const subirEvidencia = async (evidencia: SubirEvidenciaData): Promise<ApiResponse<Evidencia>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/evidencias/subir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(evidencia)
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error subiendo evidencia:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

export const obtenerEvidencias = async (incidenciaId: string): Promise<ApiResponse<Evidencia[]>> => {
  try {
    const token = getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/evidencias/incidencia/${incidenciaId}`, { headers });
    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo evidencias:', error);
    return { success: false, data: [], message: 'Error de conexión' };
  }
};

// ========== COMENTARIOS ==========
export interface AgregarComentarioData {
  incidenciaId: string;
  contenido: string;
}

export const agregarComentario = async (comentario: AgregarComentarioData): Promise<ApiResponse<Comentario>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/comentarios/agregar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(comentario)
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error agregando comentario:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

export const obtenerComentarios = async (incidenciaId: string): Promise<ApiResponse<Comentario[]>> => {
  try {
    const token = getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/comentarios/incidencia/${incidenciaId}`, { headers });
    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo comentarios:', error);
    return { success: false, data: [], message: 'Error de conexión' };
  }
};

// ========== SEGUIMIENTO ==========
export const obtenerHistorialSeguimiento = async (incidenciaId: string): Promise<ApiResponse<Seguimiento[]>> => {
  try {
    const token = getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/seguimientos/incidencia/${incidenciaId}`, { headers });
    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo seguimiento:', error);
    return { success: false, data: [], message: 'Error de conexión' };
  }
};

// ========== ADMINISTRACIÓN ==========
export const obtenerUsuarios = async (): Promise<ApiResponse<Usuario[]>> => {
  try {
    const user = getCurrentUser();
    const token = getToken();

    if (!user || user.rol !== 'ADMIN') {
      return { success: false, message: 'No autorizado - Se requiere rol ADMIN', data: [] };
    }

    const response = await fetch(`${API_URL}/admin/usuarios`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    return { success: false, message: 'Error de conexión', data: [] };
  }
};

export const obtenerTecnicos = async (): Promise<ApiResponse<Usuario[]>> => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/admin/tecnicos`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo técnicos:', error);
    return { success: false, data: [], message: 'Error de conexión' };
  }
};

export const obtenerAreas = async (): Promise<ApiResponse<Area[]>> => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/admin/areas`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo áreas:', error);
    return { success: false, data: [], message: 'Error de conexión' };
  }
};

export const crearUsuario = async (usuarioData: {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  rol: Rol;
  areaId?: string;
}): Promise<ApiResponse<Usuario>> => {
  try {
    const user = getCurrentUser();
    const token = getToken();

    if (!user || user.rol !== 'ADMIN') {
      return { success: false, message: 'No autorizado - Se requiere rol ADMIN' };
    }

    const bodyData = {
      nombre: usuarioData.nombre,
      correo: usuarioData.email,
      password: usuarioData.password,
      telefono: usuarioData.telefono || null,
      rol: usuarioData.rol,
      areaId: usuarioData.areaId || null
    };

    console.log('📦 Enviando al backend:', bodyData);

    const response = await fetch(`${API_URL}/admin/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(bodyData)
    });

    const data = await response.json();
    console.log('📡 Respuesta crear usuario:', data);

    return {
      success: data.success === true,
      data: data.data || null,
      message: data.message || (data.success ? 'Usuario creado correctamente' : 'Error al crear usuario')
    };
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error de conexión' 
    };
  }
};

export const eliminarUsuario = async (usuarioId: string): Promise<ApiResponse<any>> => {
  try {
    const user = getCurrentUser();
    const token = getToken();

    if (!user || user.rol !== 'ADMIN') {
      return { success: false, message: 'No autorizado' };
    }

    const response = await fetch(`${API_URL}/admin/usuarios/${usuarioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

// ========== PERFIL ==========
export interface PerfilData {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  areaId?: string;
  area?: Area;
  fotoPerfil?: string;
}

export const obtenerPerfil = async (): Promise<ApiResponse<PerfilData>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/auth/perfil`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

export const actualizarPerfil = async (data: {
  nombre?: string;
  telefono?: string;
  areaId?: string;
  fotoPerfil?: string;
}): Promise<ApiResponse<PerfilData>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/auth/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (result.success && result.data?.nombre && currentUser) {
      updateCurrentUser({ nombre: result.data.nombre });
    }
    return result;
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

export const cambiarPassword = async (
  passwordActual: string,
  nuevaPassword: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/auth/cambiar-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ passwordActual, nuevaPassword })
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

// ========== NOTIFICACIONES ==========
export const obtenerNotificaciones = async (soloNoLeidas: boolean = false): Promise<ApiResponse<Notificacion[]>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado", data: [] };
    }

    const url = soloNoLeidas ? `${API_URL}/notificaciones?noLeidas=true` : `${API_URL}/notificaciones`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    return { success: false, data: [], message: 'Error de conexión' };
  }
};

export const marcarNotificacionLeida = async (notificacionId: string): Promise<ApiResponse<any>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/notificaciones/${notificacionId}/leer`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error marcando notificación:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

// ========== FUNCIONES ADMIN ADICIONALES ==========
export const obtenerEstadisticas = async (): Promise<ApiResponse<{
  totalUsuarios: number;
  totalIncidencias: number;
  incidenciasPorEstado: { estado: string; cantidad: number }[];
  incidenciasPorPrioridad: { prioridad: string; cantidad: number }[];
}>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/admin/estadisticas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

export const completarIncidencia = async (incidenciaId: string): Promise<ApiResponse<Incidencia>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado" };
    }

    const response = await fetch(`${API_URL}/admin/incidencias/${incidenciaId}/completar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error completando incidencia:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

export const obtenerTodasIncidenciasAdmin = async (filtros?: {
  estado?: EstadoIncidencia;
  prioridad?: Prioridad;
  tecnicoId?: string;
}): Promise<ApiResponse<Incidencia[]>> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, message: "No autenticado", data: [] };
    }

    let url = `${API_URL}/admin/incidencias`;
    if (filtros && Object.keys(filtros).length > 0) {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
      if (filtros.tecnicoId) params.append('tecnicoId', filtros.tecnicoId);
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo incidencias admin:', error);
    return { success: false, data: [], message: 'Error de conexión' };
  }
};

// ========== FUNCIÓN DE UTILIDAD PARA MAPEAR ESTADOS ==========
export const mapEstadoToBackend = (estadoFrontend: string): string => {
  const estadoMap: Record<string, string> = {
    'RECIBIDO': 'RECIBIDO',
    'EN_EVALUACION': 'EN_EVALUACION',
    'EN_EJECUCION': 'EN_EJECUCION',
    'FINALIZADO': 'FINALIZADO',
    'COMPLETADO': 'COMPLETADO'
  };
  return estadoMap[estadoFrontend] || estadoFrontend;
};

// ========== EXPORT DEFAULT ==========
export default {
  setCurrentUser,
  getCurrentUser,
  getToken,
  updateCurrentUser,
  isAdmin,
  isTecnico,
  isUsuario,
  login,
  register,
  logout,
  obtenerDatosReferencia,
  crearIncidencia,
  obtenerIncidencias,
  obtenerMisIncidencias,
  obtenerIncidenciaPorId,
  actualizarEstadoIncidencia,
  asignarTecnico,
  subirEvidencia,
  obtenerEvidencias,
  agregarComentario,
  obtenerComentarios,
  obtenerHistorialSeguimiento,
  obtenerUsuarios,
  obtenerTecnicos,
  obtenerAreas,
  crearUsuario,
  eliminarUsuario,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  obtenerNotificaciones,
  marcarNotificacionLeida,
  obtenerEstadisticas,
  completarIncidencia,
  obtenerTodasIncidenciasAdmin,
  mapEstadoToBackend
};