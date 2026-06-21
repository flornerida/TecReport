import { getToken } from './auth.api';
import { API_URL } from '../config/api.config';
export interface IncidenciaTecnico {
  id: string;
  titulo: string;
  descripcion: string;
  fechaHora: string;
  categoria: string;
  prioridad: string;
  estado: string;
  usuario: { 
    id: string;
    nombre: string; 
    email: string;
  };
  tecnicoAsignado?: {
    id: string;
    nombre: string;
  };
  ubicacion?: string;
  equipo?: string;
  evidencias?: { urlFoto: string; tipo: string }[];
}

export const tecnicosApi = {
  getMisIncidencias: async () => {
    try {
      const token = getToken();
      
      console.log('Tecnicos API - getMisIncidencias');
      console.log('Token enviado:', token ? 'SÍ' : 'NO');
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/tecnicos/mis-incidencias`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('Respuesta:', data);
      return data;
    } catch (error) {
      console.error('Error obteniendo incidencias:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  getIncidenciaDetalle: async (incidenciaId: string) => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/tecnicos/incidencias/${incidenciaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo detalle:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },
  cambiarEstadoIncidencia: async (incidenciaId: string, nuevoEstado: string) => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/tecnicos/incidencias/${incidenciaId}/cambiar-estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nuevoEstado })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },
  agregarEvidencia: async (incidenciaId: string, tipo: 'PROBLEMA' | 'SOLUCION', urlFoto: string, descripcion?: string) => {
    try {
      const token = getToken();
      
      if (!token) {
        return { success: false, message: 'No hay token de autenticación' };
      }
      
      const response = await fetch(`${API_URL}/tecnicos/incidencias/${incidenciaId}/evidencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tipo, urlFoto, descripcion })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error agregando evidencia:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },
  getMisReportes: async () => {
    console.warn('getMisReportes está deprecated. Use getMisIncidencias');
    return tecnicosApi.getMisIncidencias();
  },

  /** @deprecated Usar getIncidenciaDetalle en su lugar */
  getReporteDetalle: async (reporteId: string) => {
    console.warn('getReporteDetalle está deprecated. Use getIncidenciaDetalle');
    return tecnicosApi.getIncidenciaDetalle(reporteId);
  },

  /** @deprecated Usar cambiarEstadoIncidencia en su lugar */
  cambiarEstado: async (reporteId: string, nuevoEstado: string) => {
    console.warn('cambiarEstado está deprecated. Use cambiarEstadoIncidencia');
    return tecnicosApi.cambiarEstadoIncidencia(reporteId, nuevoEstado);
  }
};
export default tecnicosApi;