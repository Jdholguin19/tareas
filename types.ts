
export enum TaskState {
    PENDIENTE = 'pendiente',
    EN_PROGRESO = 'en_progreso',
    EN_ESPERA = 'en_espera',
    COMPLETADA = 'completada'
}

export enum TaskPriority {
    BAJA = 'baja',
    MEDIA = 'media',
    ALTA = 'alta'
}

export enum TaskImportance {
    BAJA = 'baja',
    MEDIA = 'media',
    ALTA = 'alta'
}

export interface TaskType {
    id: number;
    nombre: string;
    descripcion: string;
    color: string;
    icono: string;
    activo: number;
}

// Cuadrantes de la Matriz de Eisenhower
export enum EisenhowerQuadrant {
    URGENTE_IMPORTANTE = 'urgente_importante',     // Alta prioridad + Alta importancia - Hacer ahora
    NO_URGENTE_IMPORTANTE = 'no_urgente_importante', // Baja prioridad + Alta importancia - Programar
    URGENTE_NO_IMPORTANTE = 'urgente_no_importante', // Alta prioridad + Baja importancia - Delegar
    NO_URGENTE_NO_IMPORTANTE = 'no_urgente_no_importante' // Baja prioridad + Baja importancia - Eliminar
}

export interface Task {
    ID: number;
    Titulo: string;
    Descripcion: string | null;
    Estado: TaskState;
    Porcentaje_Avance: number;
    Fecha_Creacion: string; // Using string for simplicity, can be Date object
    Fecha_Inicio: string | null; // Start date, initially same as creation date
    Fecha_Completada: string | null; // Completion date
    Fecha_Vencimiento: string | null; // Using string for simplicity
    Usuario_Creador_ID: number;
    Usuario_Asignado_ID: number | null;
    Proyecto: number;
    proyecto_nombre?: string; // Optional field for displaying project name
    Parent_ID: number;
    Adjuntos_URL: string[];
    asignado_a_username?: string; // Optional field for displaying assigned user name
    Tipos_Tareas_ID?: number; // Optional field for task type
    Prioridad?: TaskPriority; // Optional field for task priority (urgencia)
    Importancia?: TaskImportance; // Optional field for task importance
    TipoObjetivo_ID?: number; // Optional field for DPE mapping
    Producto_ID?: number; // Optional field for DPE mapping
    Etapa_ID?: number; // Optional field for DPE mapping
}

export interface User {
    ID: number;
    Nombre: string;
    Email: string;
}

export interface Project {
    id: number;
    nombre: string;
}

export interface TipoObjetivo {
    id: number;
    nombre: string;
}

export interface Producto {
    id: number;
    nombre: string;
}

export interface Etapa {
    id: number;
    nombre: string;
}

// Tipos para dependencias de tareas (Gantt)
export enum DependencyType {
    FS = 'FS', // Finish-to-Start
    SS = 'SS', // Start-to-Start  
    FF = 'FF', // Finish-to-Finish
    SF = 'SF'  // Start-to-Finish
}

export interface TaskDependency {
    id: number;
    tarea_predecesora_id: number;
    tarea_sucesora_id: number;
    tipo_dependencia: DependencyType;
    retraso_dias: number;
    descripcion?: string;
    fecha_creacion: string;
    tarea_predecesora: {
        titulo: string;
        estado: TaskState;
        fecha_inicio: string | null;
        fecha_fin: string | null;
    };
    tarea_sucesora: {
        titulo: string;
        estado: TaskState;
        fecha_inicio: string | null;
        fecha_fin: string | null;
    };
    proyecto_nombre?: string;
}

// Tipos específicos para el componente Gantt
export interface GanttTask extends Task {
    startDate: Date;
    endDate: Date;
    duration: number; // días
    dependencies: TaskDependency[];
    x: number; // posición X en el timeline
    y: number; // posición Y en el chart
    width: number; // ancho de la barra
}

export interface GanttTimelineScale {
    unit: 'day' | 'week' | 'month';
    format: string;
    step: number;
}
