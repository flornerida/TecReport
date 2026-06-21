import { getToken } from './auth.api';
import { API_URL } from '../config/api.config';

export const adminApi = {
  getEstadisticas: async () => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  getUsuarios: async () => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  getTecnicos: async () => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/tecnicos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo técnicos:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  crearUsuario: async (data: {
    nombre: string;
    email: string;
    password: string;
    rol: 'ADMIN' | 'TECNICO' | 'USUARIO';
    telefono?: string;
    areaId?: string;
  }) => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/usuarios`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creando usuario:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  eliminarUsuario: async (usuarioId: string) => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/usuarios/${usuarioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  getTodasIncidencias: async () => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/incidencias`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo incidencias:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },
  getCategorias: async () => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/categorias`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  getPrioridades: async () => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/prioridades`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo prioridades:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  getEstados: async () => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/estados`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estados:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  getAreas: async () => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/areas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo áreas:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },
  cambiarEstadoIncidencia: async (incidenciaId: string, nuevoEstado: string) => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/incidencias/${incidenciaId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      return await response.json();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },
  asignarTecnico: async (incidenciaId: string, tecnicoId: string) => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/incidencias/${incidenciaId}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tecnicoId })
      });
      return await response.json();
    } catch (error) {
      console.error('Error asignando técnico:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  completarIncidencia: async (incidenciaId: string) => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/admin/incidencias/${incidenciaId}/completar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error completando incidencia:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },
  getTodosReportes: async () => {
    console.warn('getTodosReportes está deprecated. Use getTodasIncidencias');
    return adminApi.getTodasIncidencias();
  },

  /** @deprecated Usar getCategorias en su lugar */
  getTiposProblema: async () => {
    console.warn('getTiposProblema está deprecated. Use getCategorias');
    return adminApi.getCategorias();
  },

  /** @deprecated Usar getPrioridades en su lugar */
  getGravedades: async () => {
    console.warn('getGravedades está deprecated. Use getPrioridades');
    return adminApi.getPrioridades();
  },

  /** @deprecated Usar completarIncidencia en su lugar */
  completarReporte: async (reporteId: string) => {
    console.warn('completarReporte está deprecated. Use completarIncidencia');
    return adminApi.completarIncidencia(reporteId);
  }
};

// Export default para importación más limpia
export default adminApi;