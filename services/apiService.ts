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
export const apiLogin = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE}/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Login failed');
  return data;
};

export const apiRegister = async (username: string, password: string, confirm: string) => {
  const response = await fetch(`${API_BASE}/register.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password, confirm_password: confirm })
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