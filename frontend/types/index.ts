export type ProblemType = 
  | 'señal_dañada'
  | 'hueco'
  | 'semaforo_inoperativo'
  | 'obstaculo'
  | 'pintado_borrado'
  | 'deterioro'
  | 'otro';

export type SeverityLevel = 'bajo' | 'medio' | 'alto' | 'critico';

export type ReportStatus = 
  | 'recibido'
  | 'en_evaluacion'
  | 'programado'
  | 'en_reparacion'
  | 'resuelto'
  | 'descartado';

export interface Report {
  id: string;
  fecha: string;
  ubicacion: {
    lat: number;
    lng: number;
    direccion: string;
  };
  tipo: ProblemType;
  gravedad: SeverityLevel;
  fotos: string[];
  descripcion: string;
  estado: ReportStatus;
  usuarioId?: string;
}