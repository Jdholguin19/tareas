import React, { useState } from 'react';
import type { Task, Project } from '../types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  taskAssigneesRecord: Record<number, {id: number, username: string}[]>;
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, projects, taskAssigneesRecord, onTaskClick, onTaskUpdate, onDelete }) => {
  const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);
  const [isDraggingAny, setIsDraggingAny] = useState<boolean>(false);
  const [isRootDragOver, setIsRootDragOver] = useState<boolean>(false);

  const handleFocusTask = (taskId: number) => {
    setFocusedTaskId(taskId);
    // Clear focus after 3 seconds
    window.setTimeout(() => setFocusedTaskId(null), 5000);
  };
  const handleDragStateChange = (dragging: boolean) => {
    // Siempre mostrar el área de soltar cuando se está arrastrando cualquier tarea
    setIsDraggingAny(dragging);
    if (!dragging) {
      setIsRootDragOver(false);
    }
  };
  const handleRootDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsRootDragOver(false);
    let draggedId: number | null = null;
    try {
      const raw = e.dataTransfer.getData('application/json');
      const parsed = raw ? JSON.parse(raw) : null;
      draggedId = parsed && parsed.taskId != null ? Number(parsed.taskId) : null;
    } catch {
      const text = e.dataTransfer.getData('text/plain');
      const num = Number(text);
      draggedId = Number.isFinite(num) ? num : null;
    }
    if (!draggedId) return;
    const draggedTask = tasks.find(t => t.ID === draggedId);
    if (!draggedTask) return;
    const updatedTask = { ...draggedTask, Parent_ID: 0 };
    onTaskUpdate(updatedTask);
    handleFocusTask(draggedId);
    setIsDraggingAny(false);
  };

  // Permitir soltar en el espacio vacío del contenedor para convertir en raíz
  const handleContainerDragOver: React.DragEventHandler<HTMLUListElement> = (e) => {
    if (e.currentTarget === e.target) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsRootDragOver(true);
    }
  };

  const handleContainerDrop: React.DragEventHandler<HTMLUListElement> = (e) => {
    if (e.currentTarget !== e.target) return;
    e.preventDefault();
    setIsRootDragOver(false);

    let draggedId: number | null = null;
    try {
      const raw = e.dataTransfer.getData('application/json');
      const parsed = raw ? JSON.parse(raw) : null;
      draggedId = parsed && parsed.taskId != null ? Number(parsed.taskId) : null;
    } catch {
      const text = e.dataTransfer.getData('text/plain');
      const num = Number(text);
      draggedId = Number.isFinite(num) ? num : null;
    }
    if (!draggedId) return;

    const draggedTask = tasks.find(t => t.ID === draggedId);
    if (!draggedTask) return;

    // Convertir cualquier tarea en tarea principal sin importar su estado actual
    const updatedTask = { ...draggedTask, Parent_ID: 0 };
    onTaskUpdate(updatedTask);
    handleFocusTask(draggedId);
    setIsDraggingAny(false);
  };
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-slate-700">¡Todo listo por hoy!</h3>
        <p className="text-slate-500 mt-2">No tienes tareas pendientes. Añade una nueva para empezar.</p>
      </div>
    );
  }

  // Filter for top-level tasks to start the recursive rendering
  // Include tasks that are root (Parent_ID = 0/null) OR whose parent is not in the list
  const taskIds = new Set(tasks.map(t => t.ID));
  const topLevelTasks = tasks
    .filter(task => {
      // Root tasks
      if (task.Parent_ID === 0 || task.Parent_ID === null) return true;
      // Tasks whose parent is not in this filtered list (orphaned branches)
      return task.Parent_ID && !taskIds.has(task.Parent_ID);
    })
    .sort((a, b) => new Date(b.Fecha_Creacion).getTime() - new Date(a.Fecha_Creacion).getTime());

  return (
    <div>
      {isDraggingAny && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsRootDragOver(true); }}
          onDragLeave={() => setIsRootDragOver(false)}
          onDrop={handleRootDrop}
          className={`mb-2 p-2 text-sm rounded-lg border-2 border-dashed transition-all ${isRootDragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
          title="Arrastra aquí para convertir en tarea principal"
        >
          Soltar aquí para convertir en tarea principal (sin padre)
        </div>
      )}
      <ul className="space-y-2" onDragOver={handleContainerDragOver} onDrop={handleContainerDrop}>
        {topLevelTasks.map(task => (
          <TaskItem
            key={task.ID}
            task={task}
            allTasks={tasks}
            projects={projects}
            taskAssigneesRecord={taskAssigneesRecord}
            onTaskClick={onTaskClick}
            onUpdate={onTaskUpdate}
            onDelete={onDelete}
            level={0}
            focusedTaskId={focusedTaskId}
            onFocusTask={handleFocusTask}
            onDragStateChange={handleDragStateChange}
          />
        ))}
      </ul>
    </div>
  );
};