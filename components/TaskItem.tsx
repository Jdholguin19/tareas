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
  const taskRef = useRef<HTMLDivElement>(null);

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

  // Get all descendant tasks (subtasks and their subtasks recursively)
  const getAllDescendants = (taskId: number): Task[] => {
    const descendants: Task[] = [];
    const stack: number[] = [parseInt(String(taskId))];
    const visited = new Set<number>();
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      
      const children = allTasks.filter(t => parseInt(String(t.Parent_ID)) === current);
      for (const child of children) {
        descendants.push(child);
        stack.push(parseInt(String(child.ID)));
      }
    }
    
    return descendants;
  };

  // Touch events for mobile drag and drop
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    //console.log('🟢 TOUCH START TRIGGERED for task:', task.ID);
    
    const touch = e.touches[0];
    const startTime = Date.now();
    const startPos = { x: touch.clientX, y: touch.clientY };
    const element = e.currentTarget; // Capturar referencia del elemento antes del timer
    
    //console.log('Touch start position:', startPos, 'time:', startTime);
    
    setTouchStartPos(startPos);
    setTouchStartTime(startTime);
    setIsDraggingTouch(false);
    
    // Clear any existing timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    // Set a timer for 2 seconds to enable drag mode
    const timer = setTimeout(() => {
      //console.log('⏰ Timer fired! Checking conditions...');
      //console.log('startTime:', startTime, 'isDraggingTouch:', isDraggingTouch);
      
      // Use local variables instead of state to avoid race conditions
      // Check if not already dragging (state might have changed)
      if (!isDraggingTouch) {
        //console.log('✅ Long press activated for task:', task.ID);
        setIsDraggingTouch(true);
        
        // Add visual feedback using captured element reference
        element.classList.add('touch-dragging');
        
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      } else {
        console.log('❌ Long press conditions not met - already dragging');
      }
    }, 2000);
    
    setLongPressTimer(timer);
    //console.log('Timer set for 2 seconds');
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    //console.log('🔄 TOUCH MOVE - touchStartPos:', touchStartPos, 'isDraggingTouch:', isDraggingTouch);
    
    if (!touchStartPos || !touchStartTime) {
      //console.log('❌ No touchStartPos or touchStartTime, returning');
      return;
    }
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    //console.log('Touch move delta:', { deltaX, deltaY });
    
    // If user moves too much before 2 seconds, cancel drag mode
    // Increased threshold for real mobile devices (40px instead of 20px)
    // Also add a minimum time check to prevent immediate cancellation
    const currentTime = Date.now();
    const timeSinceStart = currentTime - touchStartTime;
    
    if ((deltaX > 40 || deltaY > 40) && !isDraggingTouch && timeSinceStart > 100) {
      //console.log('🚫 Movement too large, canceling drag mode');
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setTouchStartPos(null);
      setTouchStartTime(null);
      return;
    }
    
    // Only handle drag if we're in drag mode
    if (isDraggingTouch) {
      //console.log('🎯 In drag mode, finding target...');
      
      // Prevent scrolling during drag
      e.preventDefault();
      
      // Auto-scroll when near edges
      const scrollThreshold = 100; // pixels from edge
      const scrollSpeed = 10; // pixels per scroll
      const viewportHeight = window.innerHeight;
      const touchY = touch.clientY;
      
      // Scroll up when near top
      if (touchY < scrollThreshold) {
        window.scrollBy(0, -scrollSpeed);
        console.log('📜 Auto-scroll UP');
      }
      // Scroll down when near bottom
      else if (touchY > viewportHeight - scrollThreshold) {
        window.scrollBy(0, scrollSpeed);
        console.log('📜 Auto-scroll DOWN');
      }
      
      // Find element under touch point
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const taskItemBelow = elementBelow?.closest('[data-task-id]') as HTMLElement;
      
      // Remove previous drag over effects
      document.querySelectorAll('.touch-drag-over').forEach(el => {
        el.classList.remove('touch-drag-over');
      });
      
      // Add drag over effect to target
      if (taskItemBelow && taskItemBelow !== e.currentTarget) {
        taskItemBelow.classList.add('touch-drag-over');
        //console.log('🎯 Drag over target:', taskItemBelow.getAttribute('data-task-id'));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    //console.log('🔚 Touch end - isDraggingTouch:', isDraggingTouch, 'touchStartPos:', touchStartPos);
    //console.log('🔚 Touch end - touchStartTime:', touchStartTime);
    //console.log('🔚 Touch end - longPressTimer:', !!longPressTimer);
    
    // Clear the long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (!touchStartPos) {
      console.log('❌ No touchStartPos, exiting');
      setTouchStartTime(null);
      setIsDraggingTouch(false);
      return;
    }
    
    // Check if we should be in drag mode based on time elapsed
    const currentTime = Date.now();
    const timeElapsed = touchStartTime ? currentTime - touchStartTime : 0;
    //console.log('⏱️ Time elapsed since touch start:', timeElapsed, 'ms');
    
    // If enough time has passed (2+ seconds) and we have valid touch data, we should be dragging
    const shouldBeDragging = timeElapsed >= 2000 && touchStartPos && touchStartTime;
    //console.log('🤔 Should be dragging:', shouldBeDragging, 'isDraggingTouch:', isDraggingTouch);
    
    if (!isDraggingTouch && !shouldBeDragging) {
      console.log('❌ Not in dragging mode and not enough time elapsed, exiting');
      setTouchStartPos(null);
      setTouchStartTime(null);
      setIsDraggingTouch(false);
      return;
    }
    
    // Force drag mode if conditions are met but state is wrong
    if (!isDraggingTouch && shouldBeDragging) {
      console.log('🔧 Forcing drag mode activation');
      setIsDraggingTouch(true);
    }
    
    const touch = e.changedTouches[0];
    console.log('📍 Touch end position:', { x: touch.clientX, y: touch.clientY });
    
    // Try multiple methods to find the element below
    let elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    console.log('🎯 Element below (first attempt):', elementBelow?.tagName, elementBelow?.className);
    
    // If first attempt fails, try with a small offset
    if (!elementBelow || !elementBelow.closest('[data-task-id]')) {
      console.log('🔄 Trying with offset...');
      elementBelow = document.elementFromPoint(touch.clientX + 1, touch.clientY + 1) ||
                   document.elementFromPoint(touch.clientX - 1, touch.clientY - 1) ||
                   document.elementFromPoint(touch.clientX, touch.clientY + 5) ||
                   document.elementFromPoint(touch.clientX, touch.clientY - 5);
      console.log('🎯 Element below (with offset):', elementBelow?.tagName, elementBelow?.className);
    }
    
    const taskItemBelow = elementBelow?.closest('[data-task-id]') as HTMLElement;
    
    //('🎯 Drop target found:', taskItemBelow?.getAttribute('data-task-id'));
    //console.log('📱 User agent:', navigator.userAgent);
    //console.log('📱 Touch support:', 'ontouchstart' in window);
    
    // Reset visual feedback
    if (draggedElement) {
      draggedElement.style.opacity = '';
      draggedElement.style.transform = '';
      draggedElement.classList.remove('touch-dragging');
    }
    
    // Remove all drag over effects
    document.querySelectorAll('.touch-drag-over').forEach(el => {
      el.classList.remove('touch-drag-over');
    });
    
    // Handle drop
    if (taskItemBelow && taskItemBelow !== e.currentTarget) {
      const targetTaskId = parseInt(taskItemBelow.getAttribute('data-task-id') || '0');
      const targetTask = allTasks.find(t => parseInt(String(t.ID)) === targetTaskId);
      
      //console.log('🎯 Attempting to drop task', task.ID, 'onto task', targetTaskId);
      //console.log('🎯 Target task found:', !!targetTask);
      //console.log('🎯 Target task details:', targetTask ? { ID: targetTask.ID, Proyecto: targetTask.Proyecto } : 'null');
      //console.log('🎯 Current task details:', { ID: task.ID, Parent_ID: task.Parent_ID, Proyecto: task.Proyecto });
      
      if (targetTask && parseInt(String(targetTaskId)) !== parseInt(String(task.ID))) {
        // Prevent cycles
        if (isTargetInDraggedSubtree(parseInt(String(task.ID)), targetTaskId)) {
          console.log('🚫 Cycle detected, preventing drop');
          alert('No puedes mover una tarea dentro de sus propias subtareas.');
        } else {
          console.log('🔄 Creating updated task object...');
          const updatedTask: Task = {
            ...task,
            Parent_ID: targetTaskId,
            Proyecto: parseInt(String(targetTask.Proyecto))
          };
          
          //console.log('✅ Calling onUpdate with task:', updatedTask);
          //console.log('✅ onUpdate function exists:', typeof onUpdate === 'function');
          
          try {
            onUpdate(updatedTask);
            //console.log('✅ onUpdate called successfully');
          } catch (error) {
            console.error('❌ Error calling onUpdate:', error);
          }
          
          // Update descendants
          const descendants = getAllDescendants(parseInt(String(task.ID)));
          console.log('📝 Updating descendants:', descendants.length);
          descendants.forEach((descendant, index) => {
            const updatedDescendant: Task = {
              ...descendant,
              Proyecto: parseInt(String(targetTask.Proyecto))
            };
            console.log(`📝 Updating descendant ${index + 1}/${descendants.length}:`, updatedDescendant.ID);
            try {
              onUpdate(updatedDescendant);
              console.log(`✅ Descendant ${updatedDescendant.ID} updated successfully`);
            } catch (error) {
              console.error(`❌ Error updating descendant ${updatedDescendant.ID}:`, error);
            }
          });
          
          console.log('🎉 Drop completed successfully!');
          if (onFocusTask) {
            //console.log('🎯 Calling onFocusTask with:', task.ID);
            onFocusTask(task.ID);
          } else {
            console.log('❌ onFocusTask not available');
          }
        }
      } else {
        console.log('❌ Invalid drop target or same task');
        console.log('❌ targetTask exists:', !!targetTask);
        console.log('❌ targetTaskId !== task.ID:', parseInt(String(targetTaskId)) !== parseInt(String(task.ID)));
      }
    } else {
      console.log('❌ No valid drop target found');
      console.log('❌ taskItemBelow:', !!taskItemBelow);
      console.log('❌ taskItemBelow !== e.currentTarget:', taskItemBelow !== e.currentTarget);
      console.log('❌ e.currentTarget:', e.currentTarget);
    }
    
    setTouchStartPos(null);
    setTouchStartTime(null);
    setIsDraggingTouch(false);
    setDraggedElement(null);
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
    if (isTargetInDraggedSubtree(draggedId, parseInt(String(task.ID)))) {
      alert('No puedes mover una tarea dentro de sus propias subtareas.');
      return;
    }

    const updatedTask: Task = {
      ...draggedTask,
      Parent_ID: parseInt(String(task.ID)),
      Proyecto: parseInt(String(task.Proyecto))
    };

    // Update the main task
    onUpdate(updatedTask);

    // Get all descendants (subtasks) of the moved task and update their project
    const descendants = getAllDescendants(draggedId);
    descendants.forEach(descendant => {
      const updatedDescendant: Task = {
        ...descendant,
        Proyecto: parseInt(String(task.Proyecto))
      };
      onUpdate(updatedDescendant);
    });

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

  // Add touch event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const element = taskRef.current;
    if (!element) return;

    const handleTouchMovePassive = (e: TouchEvent) => {
      // Convert native event to React event-like object
      const reactEvent = {
        ...e,
        currentTarget: element,
        preventDefault: () => e.preventDefault(),
        touches: e.touches
      } as any;
      
      handleTouchMove(reactEvent);
    };

    // Add non-passive touch move listener
    element.addEventListener('touchmove', handleTouchMovePassive, { passive: false });

    return () => {
      element.removeEventListener('touchmove', handleTouchMovePassive);
    };
  }, [isDraggingTouch, touchStartPos, touchStartTime, longPressTimer]);

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
        ref={taskRef}
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
        data-task-id={task.ID}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {level > 0 && <Icon name="subtask" className="w-4 h-4 text-slate-400 shrink-0 -ml-1 hidden sm:block" />}
        
        <div className="flex items-center gap-3 flex-grow">
           <input 
              type="checkbox"
              checked={task.Estado === TaskState.COMPLETADA}
              onChange={handleCheckboxChange}
              onClick={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
              onTouchEnd={e => e.stopPropagation()}
              style={{ color: statusColor }}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
              aria-label={`Marcar tarea ${task.Titulo} como completada`}
          />

          <div 
              className="flex-grow cursor-pointer min-w-0"
              onClick={() => onTaskClick(task)}
              onTouchStart={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
              onTouchEnd={e => e.stopPropagation()}
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