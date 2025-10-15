
export enum TaskState {
    PENDIENTE = 'pendiente',
    EN_PROGRESO = 'en_progreso',
    COMPLETADA = 'completada'
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
    Parent_ID: number;
    Adjuntos_URL: string[];
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
