import { CURRENT_USER_ID } from '../constants';
import type { Task, Project } from '../types';
import { TaskState } from '../types';

const API_BASE = '/api';

// --- API Functions ---

export const getTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${API_BASE}/getTasks.php`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_BASE}/getProjects.php`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch projects');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// POST /api/tareas/rapida
export const createQuickTask = async (titulo: string, adjuntos: string[]): Promise<Task> => {
  const response = await fetch(`${API_BASE}/createQuickTask.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ titulo, adjuntos })
  });
  if (!response.ok) throw new Error('Failed to create task');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// PUT /api/tareas/:id
export const updateTask = async (updatedTask: Task): Promise<Task> => {
  const response = await fetch(`${API_BASE}/updateTask.php?id=${updatedTask.ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updatedTask)
  });
  if (!response.ok) throw new Error('Failed to update task');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// DELETE /api/tareas/:id
export const deleteTask = async (taskId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/deleteTask.php?id=${taskId}`, {
    method: 'DELETE'
    , credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to delete task');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
};

// POST /api/subtareas
export const createSubTask = async (parentTaskId: number, title: string): Promise<Task> => {
  const response = await fetch(`${API_BASE}/createSubTask.php?parentId=${parentTaskId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ titulo: title })
  });
  if (!response.ok) throw new Error('Failed to create subtask');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};


// Enhanced audio transcription with task context understanding
export const transcribeAudio = async (audioFile: File): Promise<{ transcription: string }> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.");
    return { transcription: "Error: La clave de API de OpenAI no está configurada." };
  }

  try {
    // Step 1: Get raw transcription using Whisper
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json();
      console.error("Error from OpenAI Whisper API:", errorData);
      throw new Error(`Whisper API Error: ${errorData.error.message}`);
    }

    const whisperData = await whisperResponse.json();
    const rawTranscription = whisperData.text;

    // Step 2: Process transcription with GPT to extract task-relevant information
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an assistant specialized in extracting task information from audio conversations in Ecuadorian Spanish.
Your task is to analyze the complete transcription and extract ONLY information relevant to creating tasks.

INSTRUCTIONS:
- Identify specific mentions of tasks, todos, activities or responsibilities
- Ignore casual conversations, greetings, farewells and irrelevant discussions
- Pay special attention to Ecuadorian Spanish expressions and conversational flow
- Look for transition phrases that introduce tasks: "entonces necesito que", "por cierto no te olvides", "okey entonces", "habría que", "o bien", "ya no sería eso si no", "mejor esto de acá"
- If multiple tasks are mentioned, list them clearly
- If no clear tasks are mentioned, indicate that no specific tasks were found
- Keep language natural and concise in Spanish
- If someone assigns a task to another person, include that information
- If dates, deadlines or priorities are mentioned, include them
- ALWAYS respond in Spanish for the extracted tasks

EXAMPLES OF ECUADORIAN SPANISH CONVERSATIONS:

Input: "Hola María, ¿cómo estás? Bien gracias, trabajando. Okey entonces necesito que revises el informe de ventas para mañana. Por cierto no te olvides de comprar los materiales para la reunión."
Output: "- Revisar el informe de ventas (para mañana)
- Comprar los materiales para la reunión"

Input: "Juan, habríamos que cambiar eso o bien apliquemos esos cambios. Ya no sería eso si no mejor esto de acá, ¿no crees?"
Output: "- Cambiar/aplicar los cambios mencionados
- Revisar la alternativa propuesta"

Input: "Entonces, para el proyecto necesitamos que alguien vaya al banco. Por cierto, no te olvides de llamar al cliente nuevo."
Output: "- Ir al banco (para el proyecto)
- Llamar al cliente nuevo"

Input: "¿Qué tal el fin de semana? Fue genial, fuimos al cine. Por cierto, no olvides comprar leche en el super."
Output: "- Comprar leche en el supermercado"

Input: "Hola, ¿cómo va todo? Bien, trabajando en el proyecto. Hablamos después."
Output: "No se encontraron tareas específicas mencionadas."

Input: "Okey entonces mañana habría que revisar los documentos. O bien, podemos esperar hasta el viernes para la reunión."
Output: "- Revisar los documentos (mañana)
- Preparar reunión (viernes)"`
          },
          {
            role: 'user',
            content: `Analiza esta transcripción de audio y extrae únicamente las tareas o pendientes mencionados:\n\n"${rawTranscription}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!gptResponse.ok) {
      const errorData = await gptResponse.json();
      console.error("Error from OpenAI GPT API:", errorData);
      // Fallback to raw transcription if GPT fails
      return { transcription: rawTranscription };
    }

    const gptData = await gptResponse.json();
    const processedTranscription = gptData.choices[0]?.message?.content?.trim() || rawTranscription;

    return { transcription: processedTranscription };

  } catch (error) {
    console.error("Failed to transcribe audio:", error);
    throw error;
  }
};

// POST /api/archivos/subir
export const uploadFile = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/uploadFile.php`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  if (!response.ok) throw new Error('Failed to upload file');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// --- Auth helpers ---
export const apiLogin = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Login failed');
  return data;
};

export const apiRegister = async (username: string, email: string, password: string, confirm: string) => {
  const response = await fetch(`${API_BASE}/register.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, email, password, confirm_password: confirm })
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Register failed');
  return data;
};

export const apiLogout = async () => {
  const res = await fetch(`${API_BASE}/logout.php`, { method: 'POST', credentials: 'include' });
  return await res.json();
};

export const checkAuth = async () => {
  const res = await fetch(`${API_BASE}/checkAuth.php`, { credentials: 'include' });
  return await res.json();
};

export const searchUsers = async (query: string): Promise<{id: number, username: string, email: string}[]> => {
  const response = await fetch(`${API_BASE}/searchUsers.php?q=${encodeURIComponent(query)}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to search users');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const getTaskAssignees = async (taskId: number): Promise<{id: number, username: string, email: string, fecha_asignacion: string}[]> => {
  const response = await fetch(`${API_BASE}/getTaskAssignees.php?taskId=${taskId}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to get task assignees');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const assignUserToTask = async (taskId: number, assigneeId: number): Promise<{success: boolean, message: string}> => {
  const response = await fetch(`${API_BASE}/assignUserToTask.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ taskId, assigneeId })
  });
  if (!response.ok) throw new Error('Failed to assign user');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const unassignUserFromTask = async (taskId: number, assigneeId: number): Promise<{success: boolean, message: string}> => {
  const response = await fetch(`${API_BASE}/unassignUserFromTask.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ taskId, assigneeId })
  });
  if (!response.ok) throw new Error('Failed to unassign user');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const getTaskAssigneesForDisplay = async (taskId: number): Promise<{id: number, username: string}[]> => {
  const response = await fetch(`${API_BASE}/getTaskAssignees.php?taskId=${taskId}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to get task assignees');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.map((user: any) => ({ id: user.id, username: user.username }));
};

export const getCurrentUser = async (): Promise<{id: number, username: string, email: string}> => {
  const response = await fetch(`${API_BASE}/getCurrentUser.php`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to get current user');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// Create a new project
export const createProject = async (nombre: string): Promise<Project> => {
  const response = await fetch(`${API_BASE}/createProject.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ nombre })
  });
  if (!response.ok) throw new Error('Failed to create project');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const getMinimalTasks = getTasks;

export const getTaskDetails = async (id: number): Promise<Task> => {
  const tasks = await getTasks();
  const task = tasks.find(t => t.ID === id);
  if (!task) throw new Error('Task not found');
  return task;
};

export const getAllTaskAssignees = async (taskIds: number[]): Promise<Record<number, {id: number, username: string}[]>> => {
  const result: Record<number, {id: number, username: string}[]> = {};
  for (const taskId of taskIds) {
    try {
      result[taskId] = await getTaskAssigneesForDisplay(taskId);
    } catch (error) {
      console.error(`Failed to load assignees for task ${taskId}:`, error);
      result[taskId] = [];
    }
  }
  return result;
};