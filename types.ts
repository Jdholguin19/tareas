
export enum TaskState {
    PENDIENTE = 'Pendiente',
    EN_PROGRESO = 'En Progreso',
    COMPLETADA = 'Completada'
}

export interface Task {
    ID: number;
    Titulo: string;
    Descripcion: string | null;
    Estado: TaskState;
    Porcentaje_Avance: number;
    Fecha_Creacion: string; // Using string for simplicity, can be Date object
    Fecha_Vencimiento: string | null; // Using string for simplicity
    Usuario_Creador_ID: number;
    Usuario_Asignado_ID: number | null;
    Proyecto: string;
    Parent_ID: number;
    Adjuntos_URL: string[];
}

export interface User {
    ID: number;
    Nombre: string;
    Email: string;
}
