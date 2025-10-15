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
      return { statusClass: 'in-progress', statusColor: 'var(--color-in-progress)', isOverdue: false };
    case TaskState.PENDIENTE:
    default:
      return { statusClass: 'pending', statusColor: 'var(--color-pending)', isOverdue: false };
  }
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, allTasks, projects, onTaskClick, onUpdate, onDelete, level }) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditingDate) {
      dateInputRef.current?.focus();
    }
  }, [isEditingDate]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const isCompleted = e.target.checked;
      onUpdate({
          ...task,
          Porcentaje_Avance: isCompleted ? 100 : 0,
          Estado: isCompleted ? TaskState.COMPLETADA : TaskState.PENDIENTE,
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
    updateProgressFromMouse(e);
  };

  const handleProgressMouseMove = (e: MouseEvent) => {
    if (isDraggingProgress) {
      updateProgressFromMouse(e);
    }
  };

  const handleProgressMouseUp = () => {
    setIsDraggingProgress(false);
  };

  const updateProgressFromMouse = (e: React.MouseEvent | MouseEvent) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const roundedPercentage = Math.round(percentage / 5) * 5; // Round to nearest 5%

    if (roundedPercentage !== task.Porcentaje_Avance) {
      onUpdate({
        ...task,
        Porcentaje_Avance: roundedPercentage,
        Estado: roundedPercentage === 100 ? TaskState.COMPLETADA :
               roundedPercentage === 0 ? TaskState.PENDIENTE : TaskState.EN_PROGRESO
      });
    }
  };

  useEffect(() => {
    if (isDraggingProgress) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleProgressMouseMove);
        document.removeEventListener('mouseup', handleProgressMouseUp);
      };
    }
  }, [isDraggingProgress]);

  const handleDeleteConfirm = async () => {
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

  const children = allTasks
    .filter(child => child.Parent_ID === task.ID)
    .sort((a,b) => new Date(a.Fecha_Creacion).getTime() - new Date(b.Fecha_Creacion).getTime());

  const paddingLeft = `${level * 1.5 + 0.75}rem`;

  return (
    <li>
      <div 
        style={{
          paddingLeft,
          borderLeft: `4px solid ${statusColor}`,
          // @ts-ignore
          backgroundColor: `var(--color-${statusClass}-bg)`
        }}
        className={`
          flex flex-col sm:flex-row sm:items-center bg-white rounded-lg shadow-sm p-3 pr-4 gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01]
        `}
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
              className="flex-grow cursor-pointer"
              onClick={() => onTaskClick(task)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTaskClick(task); }}
              role="button"
              tabIndex={0}
              aria-label={`Editar tarea: ${task.Titulo}`}
          >
            <span className={`text-slate-800 ${task.Estado === TaskState.COMPLETADA ? 'line-through text-slate-500' : ''}`}>
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
            onClick={(e) => e.stopPropagation()}
          >
              <div className="h-2 rounded-full" style={{ width: `${task.Porcentaje_Avance}%`, backgroundColor: statusColor }}></div>
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
                    onTaskClick={onTaskClick}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    level={level + 1}
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