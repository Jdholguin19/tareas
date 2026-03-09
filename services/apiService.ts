import { CURRENT_USER_ID } from '../constants';
import type { Task, Project, TaskDependency, TaskType } from '../types';
import { TaskState } from '../types';
import { fetchWithSessionCheck, handleSessionExpired } from '../utils/sessionUtils';

const API_BASE = '/api';

// --- API Functions ---

export const getTasks = async (): Promise<Task[]> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/getTasks.php`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  const data = await response.json();
  if (data.error) {
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  return data;
};

export const getTasksByUser = async (userId?: number): Promise<Task[]> => {
  const url = userId 
    ? `${API_BASE}/getTasksByUser.php?userId=${userId}`
    : `${API_BASE}/getTasksByUser.php`;
  const response = await fetchWithSessionCheck(url);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  const data = await response.json();
  if (data.error) {
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  return data;
};

export const getProjectTasksForUser = async (): Promise<Task[]> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/getProjectTasksForUser.php`);
  if (!response.ok) throw new Error('Failed to fetch project tasks');
  const data = await response.json();
  if (data.error) {
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  return data;
};

export const getProjects = async (): Promise<Project[]> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/getProjects.php`);
  if (!response.ok) throw new Error('Failed to fetch projects');
  const data = await response.json();
  if (data.error) {
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  return data;
};

export const getAllProjects = async (): Promise<Project[]> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/getAllProjects.php`);
  if (!response.ok) throw new Error('Failed to fetch all projects');
  const data = await response.json();
  if (data.error) {
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  return data;
};

export const getProjectsByUser = async (userId?: number): Promise<Project[]> => {
  const url = userId 
    ? `${API_BASE}/getProjectsByUser.php?userId=${userId}`
    : `${API_BASE}/getProjectsByUser.php`;
  const response = await fetchWithSessionCheck(url);
  if (!response.ok) throw new Error('Failed to fetch projects');
  const data = await response.json();
  if (data.error) {
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  return data;
};

// Get projects where current user is manager (includes projects with 0 tasks)
export const getProjectsByManager = async (): Promise<Project[]> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/getProjectsByManager.php`);
  if (!response.ok) throw new Error('Failed to fetch projects by manager');
  const data = await response.json();
  if (data.error) {
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  return data;
};

export const getTaskTypes = async (): Promise<TaskType[]> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/getTaskTypes.php`);
  if (!response.ok) throw new Error('Failed to fetch task types');
  const data = await response.json();
  if (data.error) {
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  return data;
};

// POST /api/tareas/rapida
export const createQuickTask = async (titulo: string, adjuntos: string[]): Promise<Task> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/createQuickTask.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, adjuntos })
  });
  if (!response.ok) throw new Error('Failed to create task');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// PUT /api/tareas/:id
export const updateTask = async (updatedTask: Task): Promise<Task> => {
  // Normalize empty date strings to null so backend stores NULL rather than '0000-00-00'
  const payload: any = { ...updatedTask };
  ['Fecha_Inicio', 'Fecha_Vencimiento', 'Fecha_Completada'].forEach(k => {
    if ((payload as any)[k] === '') (payload as any)[k] = null;
  });

  const response = await fetchWithSessionCheck(`${API_BASE}/updateTask.php?id=${updatedTask.ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    console.error('updateTask failed with status:', response.status);
    throw new Error('Failed to update task');
  }
  const data = await response.json();
  if (data.error) {
    console.error('updateTask error from backend:', data.error);
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  console.log('updateTask success:', data);
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

export const getTaskComments = async (taskId: number, sinceId?: number): Promise<{id:number,tarea_id:number,usuario_id:number,username:string,contenido:string,fecha_creacion:string}[]> => {
  const qs = sinceId ? `?taskId=${taskId}&since_id=${sinceId}` : `?taskId=${taskId}`;
  const response = await fetch(`${API_BASE}/getComments.php${qs}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to get comments');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const addTaskComment = async (taskId: number, content: string) => {
  const response = await fetch(`${API_BASE}/addComment.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ taskId, content })
  });
  if (!response.ok) throw new Error('Failed to add comment');
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

export const updateUserName = async ({ name }: { name: string }) => {
  const response = await fetch(`${API_BASE}/updateUserName.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) throw new Error('Failed to update user name');
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

export const getProjectById = async (projectId: number) => {
  const response = await fetch(`${API_BASE}/getProjectById.php?projectId=${projectId}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to get project');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const updateProjectByOwner = async (payload: { id: number; nombre: string }) => {
  const response = await fetch(`${API_BASE}/updateProjectByOwner.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to update project');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const deleteProjectByOwner = async (payload: { id: number; force_delete_tasks?: boolean }) => {
  const response = await fetch(`${API_BASE}/deleteProjectByOwner.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to delete project');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const moveProjectTasks = async (payload: { from_project_id: number; to_project_id: number }) => {
  const response = await fetch(`${API_BASE}/moveProjectTasks.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to move tasks');
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
  // Usar el nuevo endpoint que obtiene todos los asignados en una sola petición
  const response = await fetchWithSessionCheck(`${API_BASE}/getAllTaskAssignees.php`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to get task assignees');
  const data = await response.json();
  if (data.error) {
    handleSessionExpired(data);
    throw new Error(data.error);
  }
  
  // El endpoint retorna un objeto con taskId como clave
  // Asegurar que todas las tareas tengan un array (vacío si no tienen asignados)
  const assigneesMap: Record<number, {id: number, username: string}[]> = {};
  taskIds.forEach(id => {
    assigneesMap[id] = data[id] || [];
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

// Admin functions
export const assignUserToDepartments = async (userId: number, departmentIds: number[]): Promise<{success: boolean, message: string}> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/assignUserToDepartment.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, department_ids: departmentIds })
  });
  if (!response.ok) throw new Error('Failed to assign departments');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export const getUserDepartments = async (userId: number): Promise<{id: number, nombre: string}[]> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/getUserDepartments.php?user_id=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user departments');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// ===================================
// FUNCIONES PARA ADJUNTOS
// ===================================

export interface Attachment {
  id: number;
  nombre_archivo: string;
  tipo_archivo: 'imagen' | 'documento';
  extension: string;
  tamano_bytes: number;
  tamano_formateado: string;
  mime_type: string;
  fecha_subida: string;
  subido_por: {
    id: number;
    username: string;
  };
  url_descarga: string | null;
  sharepoint_url: string;
  drive_item_id: string;
  error?: string;
}

export const uploadAttachment = async (tareaId: number, file: File): Promise<Attachment> => {
  const formData = new FormData();
  formData.append('tarea_id', tareaId.toString());
  formData.append('file', file);

  const response = await fetchWithSessionCheck(`${API_BASE}/uploadToSharePoint.php`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al subir archivo');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Error al subir archivo');
  }

  return data;
};

export const getTaskAttachments = async (tareaId: number): Promise<Attachment[]> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/getTaskAttachments.php?tarea_id=${tareaId}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener adjuntos');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Error al obtener adjuntos');
  }

  return data.attachments || [];
};

export const deleteAttachment = async (attachmentId: number): Promise<void> => {
  const response = await fetchWithSessionCheck(`${API_BASE}/deleteTaskAttachment.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ attachment_id: attachmentId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar adjunto');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Error al eliminar adjunto');
  }
};
