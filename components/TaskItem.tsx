import React, { useState, useRef, useEffect } from 'react';
import type { Task, Project } from '../types';
import { TaskState } from '../types';
import { Icon } from './Icon';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  level: number;
  taskAssigneesRecord: Record<number, {id: number, username: string}[]>;
  focusedTaskId?: number | null;
  onFocusTask?: (taskId: number) => void;
}

const getTaskStatusInfo = (task: Task): { statusClass: string, statusColor: string, isOverdue: boolean } => {
  // Only consider overdue if due date is before today (not including today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = task.Fecha_Vencimiento ? new Date(task.Fecha_Vencimiento + 'T00:00:00') < today && task.Estado !== TaskState.COMPLETADA : false;

  if (isOverdue) {
    return { statusClass: 'overdue', statusColor: 'var(--color-overdue)', isOverdue: true };
  }
  
  switch (task.Estado) {
    case TaskState.COMPLETADA:
      return { statusClass: 'completed', statusColor: 'var(--color-completed)', isOverdue: false };
    case TaskState.EN_PROGRESO:
      // For in-progress tasks, use proximate color if due in future, else in-progress color
      if (task.Fecha_Vencimiento) {
        const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate > today) {
          return { statusClass: 'proximate', statusColor: 'var(--color-proximate)', isOverdue: false };
        }
      }
      return { statusClass: 'in-progress', statusColor: 'var(--color-in-progress)', isOverdue: false };
    case TaskState.PENDIENTE:
      // For pending tasks, use proximate color if due in future, else pending color
      if (task.Fecha_Vencimiento) {
        const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate > today) {
          return { statusClass: 'proximate', statusColor: 'var(--color-proximate)', isOverdue: false };
        }
      }
      return { statusClass: 'pending', statusColor: 'var(--color-pending)', isOverdue: false };
    default:
      return { statusClass: 'pending', statusColor: 'var(--color-pending)', isOverdue: false };

  }
};


export const TaskItem: React.FC<TaskItemProps> = ({ task, allTasks, projects, onTaskClick, onUpdate, onDelete, level, taskAssigneesRecord, focusedTaskId, onFocusTask }) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const dragProgressRef = useRef<number>(task.Porcentaje_Avance);

  // Usar los asignados del prop en lugar de cargarlos individualmente
  const assignedUsers = taskAssigneesRecord[task.ID] || [];
  const isLoadingAssignees = false; // Ya no cargamos, usamos el prop

  useEffect(() => {
    if (isEditingDate) {
      dateInputRef.current?.focus();
    }
  }, [isEditingDate]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const isCompleted = e.target.checked;
      const todayStr = new Date().toISOString().slice(0,10);
      onUpdate({
          ...task,
          Porcentaje_Avance: isCompleted ? 100 : 0,
          Estado: isCompleted ? TaskState.COMPLETADA : TaskState.PENDIENTE,
          Fecha_Completada: isCompleted ? new Date().toISOString() : null,
          // Si no tiene fecha de vencimiento, al completar se establece hoy
          Fecha_Vencimiento: isCompleted
            ? (task.Fecha_Vencimiento && task.Fecha_Vencimiento.trim() !== ''
                ? task.Fecha_Vencimiento
                : todayStr)
            : task.Fecha_Vencimiento,
      });
  };
  
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.stopPropagation();
      onUpdate({ ...task, Proyecto: parseInt(e.target.value, 10) });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      // Only update if value is different to avoid unnecessary re-renders on blur
      if (e.target.value !== (task.Fecha_Vencimiento || '')) {
         onUpdate({ ...task, Fecha_Vencimiento: e.target.value || null });
      }
      setIsEditingDate(false); // Hide input after selection or blur
  };
  
  const handleDateBlur = () => {
    setIsEditingDate(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingProgress(true);
    dragProgressRef.current = task.Porcentaje_Avance;
    updateProgressFromMouse(e);
  };

  const handleProgressMouseMove = (e: MouseEvent) => {
    if (isDraggingProgress) {
      updateProgressFromMouse(e);
    }
  };

  const handleProgressMouseUp = () => {
    setIsDraggingProgress(false);
    // Update the task only when drag ends
    const newPercentage = dragProgressRef.current;
    const newStatus = newPercentage === 100 ? TaskState.COMPLETADA :
                     newPercentage === 0 ? TaskState.PENDIENTE : TaskState.EN_PROGRESO;
    const fechaCompletada = newStatus === TaskState.COMPLETADA ? new Date().toISOString() : null;
    onUpdate({
      ...task,
      Porcentaje_Avance: newPercentage,
      Estado: newStatus,
      Fecha_Completada: fechaCompletada
    });
  };

  const handleProgressTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingProgress(true);
    dragProgressRef.current = task.Porcentaje_Avance;
    updateProgressFromMouse(e);
  };

  const handleProgressTouchMove = (e: TouchEvent) => {
    if (isDraggingProgress) {
      e.preventDefault();
      updateProgressFromMouse(e);
    }
  };

  const handleProgressTouchEnd = () => {
    setIsDraggingProgress(false);
    // Update the task only when drag ends
    const newPercentage = dragProgressRef.current;
    const newStatus = newPercentage === 100 ? TaskState.COMPLETADA :
                     newPercentage === 0 ? TaskState.PENDIENTE : TaskState.EN_PROGRESO;
    const fechaCompletada = newStatus === TaskState.COMPLETADA ? new Date().toISOString() : null;
    onUpdate({
      ...task,
      Porcentaje_Avance: newPercentage,
      Estado: newStatus,
      Fecha_Completada: fechaCompletada
    });
  };

  // --- Drag & Drop helpers ---
  const isTargetInDraggedSubtree = (draggedId: number, targetId: number): boolean => {
    // Check if targetId is inside the subtree of draggedId
    const stack: number[] = [parseInt(String(draggedId))];
    const visited = new Set<number>();
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const children = allTasks.filter(t => parseInt(String(t.Parent_ID)) === current);
      for (const child of children) {
        if (parseInt(String(child.ID)) === parseInt(String(targetId))) return true;
        stack.push(parseInt(String(child.ID)));
      }
    }
    return false;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    try {
      e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.ID }));
    } catch {}
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    let draggedId: number | null = null;
    try {
      const raw = e.dataTransfer.getData('application/json');
      const parsed = raw ? JSON.parse(raw) : null;
      draggedId = parsed && parsed.taskId != null ? parseInt(String(parsed.taskId)) : null;
    } catch {
      const text = e.dataTransfer.getData('text/plain');
      const num = parseInt(String(text));
      draggedId = Number.isFinite(num) ? num : null;
    }

    if (!draggedId || parseInt(String(draggedId)) === parseInt(String(task.ID))) return;
    const draggedTask = allTasks.find(t => parseInt(String(t.ID)) === parseInt(String(draggedId)));
    if (!draggedTask) return;

    // Prevent cycles: don't allow dropping into its own subtree
    if (isTargetInDraggedSubtree(draggedId, task.ID)) {
      alert('No puedes mover una tarea dentro de sus propias subtareas.');
      return;
    }

    const updatedTask: Task = {
      ...draggedTask,
      Parent_ID: parseInt(String(task.ID)),
      Proyecto: parseInt(String(task.Proyecto))
    };

    onUpdate(updatedTask);
    if (onFocusTask) onFocusTask(parseInt(String(draggedId)));
  };

  const updateProgressFromMouse = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if (!progressBarRef.current || !progressFillRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const roundedPercentage = Math.round(percentage / 5) * 5; // Round to nearest 5%

    dragProgressRef.current = roundedPercentage;
    progressFillRef.current.style.width = `${roundedPercentage}%`;
    if (progressBarRef.current) {
      progressBarRef.current.title = `${roundedPercentage}% completado - Arrastra para cambiar`;
    }
  };

  useEffect(() => {
    if (isDraggingProgress) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);
      document.addEventListener('touchmove', handleProgressTouchMove, { passive: false });
      document.addEventListener('touchend', handleProgressTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleProgressMouseMove);
        document.removeEventListener('mouseup', handleProgressMouseUp);
        document.removeEventListener('touchmove', handleProgressTouchMove);
        document.removeEventListener('touchend', handleProgressTouchEnd);
      };
    }
  }, [isDraggingProgress]);  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.ID);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      // Keep modal open on error so user can try again or cancel
      alert('Error al eliminar la tarea. Por favor, inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    // Adjust for timezone offset to compare dates correctly
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    today.setHours(0,0,0,0);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  const { statusClass, statusColor, isOverdue } = getTaskStatusInfo(task);
  const isFocused = parseInt(String(focusedTaskId)) === parseInt(String(task.ID));

  const children = allTasks
    .filter(child => parseInt(String(child.Parent_ID)) === parseInt(String(task.ID)))
    .sort((a,b) => new Date(a.Fecha_Creacion).getTime() - new Date(b.Fecha_Creacion).getTime());

  const paddingLeft = `${level * 1.5 + 0.75}rem`;

  const taskAssignees = taskAssigneesRecord[task.ID] || [];

  return (
    <li>
      <div 
        style={{
          paddingLeft,
          borderLeft: `4px solid ${statusColor}`,
          // @ts-ignore
          backgroundColor: `var(--color-${statusClass}-bg)`,
          // Visual focus overlay (semi-transparent dark gray)
          boxShadow: isFocused ? 'inset 0 0 0 999px rgba(55, 65, 81, 0.18)' : undefined
        }}
        className={`
          flex flex-col sm:flex-row sm:items-center bg-white rounded-lg shadow-sm p-3 pr-4 gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01]
          ${isDragOver ? 'ring-2 ring-blue-400/60' : ''}
        `}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {level > 0 && <Icon name="subtask" className="w-4 h-4 text-slate-400 shrink-0 -ml-1 hidden sm:block" />}
        
        <div className="flex items-center gap-3 flex-grow">
           <input 
              type="checkbox"
              checked={task.Estado === TaskState.COMPLETADA}
              onChange={handleCheckboxChange}
              onClick={e => e.stopPropagation()}
              style={{ color: statusColor }}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
              aria-label={`Marcar tarea ${task.Titulo} como completada`}
          />

          <div 
              className="flex-grow cursor-pointer min-w-0"
              onClick={() => onTaskClick(task)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTaskClick(task); }}
              role="button"
              tabIndex={0}
              aria-label={`Editar tarea: ${task.Titulo}`}
          >
            <span
              className={`text-slate-800 ${task.Estado === TaskState.COMPLETADA ? 'line-through text-slate-500' : ''}`}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word'
              }}
            >
              {task.Titulo}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 text-sm text-slate-600 shrink-0 pl-8 sm:pl-0 flex-wrap">
          {level === 0 && (
            <div className="relative group flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-full cursor-pointer hover:border-blue-500" onClick={e => e.stopPropagation()}>
                <Icon name="folder" className="w-4 h-4 text-slate-500"/>
                <select 
                  value={task.Proyecto}
                  onChange={handleProjectChange}
                  className="appearance-none bg-transparent font-medium focus:outline-none cursor-pointer pr-1"
                  aria-label="Cambiar proyecto"
                >
                   {projects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
            </div>
          )}

          {/* Mostrar usuarios asignados */}
          {assignedUsers.length > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <Icon name={assignedUsers.length === 1 ? "user" : "users"} className="w-4 h-4 text-blue-600"/>
                <span className="text-xs font-medium text-blue-700">
                  {assignedUsers.length === 1 
                    ? assignedUsers[0].username 
                    : `${assignedUsers.length} asignados`}
                </span>
            </div>
          )}
           
           <div className={`relative flex items-center gap-1.5 font-medium group ${isOverdue ? 'text-red-600' : 'text-slate-500'}`} onClick={e => e.stopPropagation()}>
                <Icon name="calendar" className="w-4 h-4"/>
                {isEditingDate ? (
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={task.Fecha_Vencimiento?.split('T')[0] || ''}
                    onChange={handleDateChange}
                    onBlur={handleDateBlur}
                    className="bg-white border border-slate-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Cambiar fecha de vencimiento"
                  />
                ) : (
                  <button 
                    type="button"
                    onClick={() => setIsEditingDate(true)}
                    className="bg-transparent border-none p-0 font-medium cursor-pointer hover:underline"
                    aria-label={`Fecha de vencimiento: ${task.Fecha_Vencimiento ? formatDate(task.Fecha_Vencimiento) : 'Sin fecha'}. Clic para cambiar.`}
                  >
                    {task.Fecha_Vencimiento ? formatDate(task.Fecha_Vencimiento) : 'Sin fecha'}
                  </button>
                )}
            </div>

          <div 
            ref={progressBarRef}
            title={`${task.Porcentaje_Avance}% completado - Arrastra para cambiar`}
            className={`w-24 bg-slate-200/80 rounded-full h-2 hidden md:block relative cursor-pointer hover:bg-slate-300/80 transition-colors ${isDraggingProgress ? 'bg-slate-300/80' : ''}`}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
            onClick={(e) => e.stopPropagation()}
          >
              <div ref={progressFillRef} className="h-2 rounded-full" style={{ width: `${task.Porcentaje_Avance}%`, backgroundColor: statusColor }}></div>
          </div>

          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors opacity-60 hover:opacity-100"
            title="Eliminar tarea"
            aria-label="Eliminar tarea"
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {children.length > 0 && (
        <ul className="mt-2 space-y-2">
            {children.map(child => (
                <TaskItem
                    key={child.ID}
                    task={child}
                    allTasks={allTasks}
                    projects={projects}
                    taskAssigneesRecord={taskAssigneesRecord}
                    onTaskClick={onTaskClick}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    level={level + 1}
                    focusedTaskId={focusedTaskId}
                    onFocusTask={onFocusTask}
                />
            ))}
        </ul>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        taskTitle={task.Titulo}
        isDeleting={isDeleting}
      />
    </li>
  );
};