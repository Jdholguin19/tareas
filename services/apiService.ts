import { CURRENT_USER_ID } from '../constants';
import type { Task } from '../types';
import { TaskState } from '../types';

// --- Mock Database ---
let tasks: Task[] = [
  {
    ID: 1,
    Titulo: "Diseñar el borrador inicial de la nueva interfaz",
    Descripcion: "Crear mockups en Figma para la página de inicio y el dashboard.",
    Estado: TaskState.EN_PROGRESO,
    Porcentaje_Avance: 40,
    Fecha_Creacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    Fecha_Vencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    Usuario_Creador_ID: 1,
    Usuario_Asignado_ID: 1,
    Proyecto: "Nuevo Diseño Web",
    Parent_ID: 0,
    Adjuntos_URL: ['/storage/files/brief_v1.pdf']
  },
  {
    ID: 2,
    Titulo: "Configurar el entorno de desarrollo del backend",
    Descripcion: null,
    Estado: TaskState.PENDIENTE,
    Porcentaje_Avance: 0,
    Fecha_Creacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    Fecha_Vencimiento: null,
    Usuario_Creador_ID: 2,
    Usuario_Asignado_ID: 1,
    Proyecto: "API Refactor",
    Parent_ID: 0,
    Adjuntos_URL: []
  },
  {
    ID: 3,
    Titulo: "Revisar la propuesta del cliente y dar feedback",
    Descripcion: "El documento está en el adjunto.",
    Estado: TaskState.COMPLETADA,
    Porcentaje_Avance: 100,
    Fecha_Creacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    Fecha_Vencimiento: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    Usuario_Creador_ID: 1,
    Usuario_Asignado_ID: 1,
    Proyecto: "General",
    Parent_ID: 0,
    Adjuntos_URL: ['/storage/files/propuesta_cliente.docx']
  }
];
let nextTaskId = 4;

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Mock API Endpoints ---

export const getTasks = async (): Promise<Task[]> => {
  await simulateDelay(500);
  return [...tasks].sort((a, b) => b.ID - a.ID);
};

// POST /api/tareas/rapida
export const createQuickTask = async (titulo: string, adjuntos: string[]): Promise<Task> => {
  await simulateDelay(700);
  const newTask: Task = {
    ID: nextTaskId++,
    Titulo: titulo,
    Descripcion: null,
    Estado: TaskState.PENDIENTE,
    Porcentaje_Avance: 0,
    Fecha_Creacion: new Date().toISOString(),
    Fecha_Vencimiento: null,
    Usuario_Creador_ID: CURRENT_USER_ID,
    Usuario_Asignado_ID: null,
    Proyecto: 'General',
    Parent_ID: 0,
    Adjuntos_URL: adjuntos
  };
  tasks.push(newTask);
  return newTask;
};

// PUT /api/tareas/:id
export const updateTask = async (updatedTask: Task): Promise<Task> => {
  await simulateDelay(600);
  const taskIndex = tasks.findIndex(t => t.ID === updatedTask.ID);
  if (taskIndex === -1) {
    throw new Error("Task not found");
  }
  tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };
  return tasks[taskIndex];
};

// POST /api/subtareas
export const createSubTask = async (parentTaskId: number, title: string): Promise<Task> => {
  await simulateDelay(700);
  const parentTask = tasks.find(t => t.ID === parentTaskId);
  if (!parentTask) {
    throw new Error("Parent task not found");
  }
  const newTask: Task = {
    ID: nextTaskId++,
    Titulo: title,
    Descripcion: null,
    Estado: TaskState.PENDIENTE,
    Porcentaje_Avance: 0,
    Fecha_Creacion: new Date().toISOString(),
    Fecha_Vencimiento: parentTask.Fecha_Vencimiento,
    Usuario_Creador_ID: CURRENT_USER_ID,
    Usuario_Asignado_ID: parentTask.Usuario_Asignado_ID,
    Proyecto: parentTask.Proyecto,
    Parent_ID: parentTaskId,
    Adjuntos_URL: []
  };
  tasks.push(newTask);
  return newTask;
};


// POST /api/transcribir-audio - NOW USES OPENAI WHISPER
export const transcribeAudio = async (audioFile: File): Promise<{ transcription: string }> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.");
    // Fallback to a user-friendly message
    return { transcription: "Error: La clave de API de OpenAI no está configurada." };
  }

  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1');
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from OpenAI API:", errorData);
      throw new Error(`API Error: ${errorData.error.message}`);
    }

    const data = await response.json();
    return { transcription: data.text };
    
  } catch (error) {
    console.error("Failed to transcribe audio:", error);
    throw error;
  }
};

// POST /api/archivos/subir
export const uploadFile = async (file: File): Promise<{ url: string }> => {
  await simulateDelay(1000);
  const randomId = Math.random().toString(36).substring(7);
  const url = `/storage/archivos/${randomId}_${file.name}`;
  console.log(`Simulating upload for: ${file.name}, returning URL: ${url}`);
  return { url };
};