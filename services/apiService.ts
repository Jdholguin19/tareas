import { CURRENT_USER_ID } from '../constants';
import type { Task, Project, TaskDependency } from '../types';
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
  try {
    // Send audio to PHP backend for transcription
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(`${API_BASE}/transcribeAudio.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || 'Failed to transcribe audio');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return { transcription: data.transcription || 'No se pudo transcribir el audio.' };

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
  const promises = taskIds.map(id => getTaskAssigneesForDisplay(id));
  const results = await Promise.all(promises);
  const assigneesMap: Record<number, {id: number, username: string}[]> = {};
  taskIds.forEach((id, index) => {
    assigneesMap[id] = results[index];
  });
  return assigneesMap;
};

// --- Dependency API Functions ---

export const getDependencies = async (): Promise<TaskDependency[]> => {
  const response = await fetch(`${API_BASE}/getDependencies.php`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch dependencies');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  // PHP returns { success, dependencies, total }
  return Array.isArray(data?.dependencies)
    ? data.dependencies.map((d: any) => ({
        ...d,
        id: d?.id != null ? Number(d.id) : d?.id,
        tarea_predecesora_id: d?.tarea_predecesora_id != null ? Number(d.tarea_predecesora_id) : d?.tarea_predecesora_id,
        tarea_sucesora_id: d?.tarea_sucesora_id != null ? Number(d.tarea_sucesora_id) : d?.tarea_sucesora_id,
        retraso_dias: d?.retraso_dias != null ? Number(d.retraso_dias) : 0,
        tipo_dependencia: (d?.tipo_dependencia || 'FS').toUpperCase().trim()
      }))
    : [];
};

export const createDependency = async (
  predecessorId: number, 
  successorId: number, 
  type: string = 'FS', 
  delayDays: number = 0,
  description?: string
): Promise<TaskDependency> => {
  const response = await fetch(`${API_BASE}/createDependency.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      tarea_predecesora_id: predecessorId,
      tarea_sucesora_id: successorId,
      tipo_dependencia: type,
      retraso_dias: delayDays,
      descripcion: description
    })
  });
  if (!response.ok) throw new Error('Failed to create dependency');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  // PHP returns wrapper with new dep in data
  const dep = data?.data;
  // Fallback shape to match TaskDependency minimally used by Gantt
  return {
    id: dep?.id != null ? Number(dep.id) : dep?.id,
    tarea_predecesora_id: dep?.tarea_predecesora_id != null ? Number(dep.tarea_predecesora_id) : dep?.tarea_predecesora_id,
    tarea_sucesora_id: dep?.tarea_sucesora_id != null ? Number(dep.tarea_sucesora_id) : dep?.tarea_sucesora_id,
    tipo_dependencia: (dep?.tipo_dependencia || type).toUpperCase().trim(),
    retraso_dias: dep?.retraso_dias != null ? Number(dep.retraso_dias) : delayDays,
    descripcion: dep?.descripcion,
    fecha_creacion: new Date().toISOString(),
    tarea_predecesora: { titulo: '', estado: TaskState.PENDIENTE, fecha_inicio: null, fecha_fin: null },
    tarea_sucesora: { titulo: '', estado: TaskState.PENDIENTE, fecha_inicio: null, fecha_fin: null },
    proyecto_nombre: undefined
  } as TaskDependency;
};

export const deleteDependency = async (dependencyId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/deleteDependency.php?id=${dependencyId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to delete dependency');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
};