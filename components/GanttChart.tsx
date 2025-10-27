import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskDependency, GanttTask, GanttTimelineScale, TaskState, Project } from '../types';
import { EditTaskModal } from './EditTaskModal';
import { createSubTask, deleteTask } from '../services/apiService';

interface GanttChartProps {
    tasks: Task[];
    dependencies: TaskDependency[];
    projects: Project[];
    onTaskUpdate?: (taskId: number, updates: Partial<Task>) => void;
    onDependencyCreate?: (predecesora: number, sucesora: number, tipo: string) => void;
    onDependencyDelete?: (dependencyId: number) => void;
    currentUser?: {id: number, username: string, email: string} | null;
    onProjectCreated?: (project: Project) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({
    tasks = [],
    dependencies = [],
    projects = [],
    onTaskUpdate,
    onDependencyCreate,
    onDependencyDelete,
    currentUser,
    onProjectCreated
}) => {
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [timelineScale, setTimelineScale] = useState<GanttTimelineScale>({
        unit: 'day',
        format: 'DD/MM',
        step: 1
    });
    const [viewStartDate, setViewStartDate] = useState<Date>(new Date());
    const [viewEndDate, setViewEndDate] = useState<Date>(new Date());
    const [draggedTask, setDraggedTask] = useState<number | null>(null);
    const [isCreatingDependency, setIsCreatingDependency] = useState(false);
    const [dependencySource, setDependencySource] = useState<number | null>(null);
    
    // Estados adicionales para acordeón y edición
    const [collapsedTasks, setCollapsedTasks] = useState<Set<number>>(new Set());
    const [editingTask, setEditingTask] = useState<number | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Constantes para el layout
    const TASK_HEIGHT = 32;
    const TASK_MARGIN = 8;
    const ROW_HEIGHT = TASK_HEIGHT + TASK_MARGIN;
    const TIMELINE_HEIGHT = 60;
    const SIDEBAR_WIDTH = window.innerWidth < 1024 ? 320 : 480; // Responsive sidebar width
    const DAY_WIDTH = window.innerWidth < 640 ? 20 : 30; // Smaller day width on mobile

    // Función para calcular duración en días
    const calculateDuration = (startDate: string | null, endDate: string | null): string => {
        if (!startDate || !endDate) return '-';
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return `${diffDays}d`;
    };

    // Filtrar tareas por proyecto seleccionado
    const filteredTasks = useMemo(() => {
        if (selectedProjectId === null) {
            return tasks;
        }
        return tasks.filter(task => task.Proyecto === selectedProjectId);
    }, [tasks, selectedProjectId]);

    // Función para alternar colapso de tareas padre
    const toggleTaskCollapse = (taskId: number) => {
        setCollapsedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    // Función para verificar si una tarea debe estar visible (no colapsada por su padre)
    const isTaskVisible = (task: Task): boolean => {
        let currentTask = task;
        while (currentTask.Parent_ID && currentTask.Parent_ID !== 0) {
            const parentTask = filteredTasks.find(t => t.ID === currentTask.Parent_ID);
            if (!parentTask) break;
            
            if (collapsedTasks.has(parentTask.ID)) {
                return false;
            }
            currentTask = parentTask;
        }
        return true;
    };

    // Función para verificar si una tarea tiene hijos
    const hasChildren = (taskId: number): boolean => {
        return filteredTasks.some(task => task.Parent_ID === taskId);
    };

    // Función para ordenar tareas por jerarquía padre-hijo
    const getHierarchicalTasks = useMemo(() => {
        const taskMap = new Map(filteredTasks.map(task => [task.ID, task]));
        const result: Task[] = [];
        const processed = new Set<number>();

        // Función recursiva para agregar tarea y sus hijos
        const addTaskWithChildren = (task: Task, level: number = 0) => {
            if (processed.has(task.ID)) return;
            
            processed.add(task.ID);
            result.push({ ...task, level } as Task & { level: number });

            // Encontrar y agregar hijos ordenados por fecha de creación
            const children = filteredTasks
                .filter(t => t.Parent_ID === task.ID)
                .sort((a, b) => new Date(a.Fecha_Creacion).getTime() - new Date(b.Fecha_Creacion).getTime());

            children.forEach(child => addTaskWithChildren(child, level + 1));
        };

        // Primero agregar tareas padre (sin Parent_ID o Parent_ID = 0)
        const parentTasks = filteredTasks
            .filter(task => !task.Parent_ID || task.Parent_ID === 0)
            .sort((a, b) => new Date(a.Fecha_Creacion).getTime() - new Date(b.Fecha_Creacion).getTime());

        parentTasks.forEach(task => addTaskWithChildren(task));

        // Agregar tareas huérfanas (cuyo padre no está en filteredTasks)
        const taskIds = new Set(filteredTasks.map(t => t.ID));
        const orphanTasks = filteredTasks.filter(task => 
            task.Parent_ID && 
            task.Parent_ID !== 0 && 
            !taskIds.has(task.Parent_ID) && 
            !processed.has(task.ID)
        );

        orphanTasks.forEach(task => addTaskWithChildren(task));

        return result;
    }, [filteredTasks]);

    // Función para obtener tareas visibles (considerando acordeón)
    const getVisibleHierarchicalTasks = useMemo(() => {
        return getHierarchicalTasks.filter(task => isTaskVisible(task));
    }, [getHierarchicalTasks, collapsedTasks]);

    // Calcular fechas del proyecto basado en tareas filtradas
    const projectDates = useMemo(() => {
        if (filteredTasks.length === 0) {
            const today = new Date();
            return {
                start: today,
                end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 días
            };
        }

        const dates = filteredTasks
            .filter(task => task.Fecha_Inicio || task.Fecha_Vencimiento)
            .flatMap(task => [
                task.Fecha_Inicio ? new Date(task.Fecha_Inicio) : null,
                task.Fecha_Vencimiento ? new Date(task.Fecha_Vencimiento) : null
            ])
            .filter(date => date !== null) as Date[];

        if (dates.length === 0) {
            const today = new Date();
            return {
                start: today,
                end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
            };
        }

        const start = new Date(Math.min(...dates.map(d => d.getTime())));
        const end = new Date(Math.max(...dates.map(d => d.getTime())));
        
        // Agregar margen de 7 días antes y después
        start.setDate(start.getDate() - 7);
        end.setDate(end.getDate() + 7);

        return { start, end };
    }, [filteredTasks]);

    // Actualizar vista cuando cambien las fechas del proyecto
    useEffect(() => {
        setViewStartDate(projectDates.start);
        setViewEndDate(projectDates.end);
    }, [projectDates]);

    // Convertir tareas a formato Gantt usando el orden jerárquico y visibilidad
    const ganttTasks = useMemo((): GanttTask[] => {
        return getVisibleHierarchicalTasks.map((task, index) => {
            const startDate = task.Fecha_Inicio ? new Date(task.Fecha_Inicio) : new Date();
            const endDate = task.Fecha_Vencimiento ? new Date(task.Fecha_Vencimiento) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
            
            // Calcular posición y ancho basado en la escala de tiempo
            let x = 0;
            let width = 0;
            
            if (timelineScale.unit === 'day') {
                const daysDiff = Math.floor((startDate.getTime() - viewStartDate.getTime()) / (24 * 60 * 60 * 1000));
                const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
                x = daysDiff * DAY_WIDTH;
                width = Math.max(duration * DAY_WIDTH, 20);
            } else if (timelineScale.unit === 'week') {
                const weeksDiff = Math.floor((startDate.getTime() - viewStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                const durationWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                x = weeksDiff * DAY_WIDTH * 7;
                width = Math.max(durationWeeks * DAY_WIDTH * 7, DAY_WIDTH * 7);
            } else if (timelineScale.unit === 'month') {
                const monthsDiff = (startDate.getFullYear() - viewStartDate.getFullYear()) * 12 + (startDate.getMonth() - viewStartDate.getMonth());
                const endMonthsDiff = (endDate.getFullYear() - viewStartDate.getFullYear()) * 12 + (endDate.getMonth() - viewStartDate.getMonth());
                const durationMonths = Math.max(endMonthsDiff - monthsDiff + 1, 1);
                x = monthsDiff * DAY_WIDTH * 30;
                width = durationMonths * DAY_WIDTH * 30;
            }
            
            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
            
            const taskDependencies = dependencies.filter(
                dep => dep.tarea_predecesora_id === task.ID || dep.tarea_sucesora_id === task.ID
            );

            return {
                ...task,
                startDate,
                endDate,
                duration,
                dependencies: taskDependencies,
                x: Math.max(x, 0),
                y: index * ROW_HEIGHT,
                width,
                level: (task as any).level || 0 // Preservar el nivel de jerarquía
            };
        });
    }, [getVisibleHierarchicalTasks, dependencies, viewStartDate, DAY_WIDTH, ROW_HEIGHT, timelineScale.unit]);

    // Generar timeline basado en la escala seleccionada
    const timelineDays = useMemo(() => {
        const days = [];
        const totalDays = Math.ceil((viewEndDate.getTime() - viewStartDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (timelineScale.unit === 'day') {
            // Vista por días (actual)
            for (let i = 0; i < totalDays; i++) {
                const date = new Date(viewStartDate);
                date.setDate(date.getDate() + i);
                days.push({
                    date,
                    day: date.getDate().toString(),
                    month: date.toLocaleDateString('es-ES', { month: 'short' }),
                    x: i * DAY_WIDTH,
                    isWeekend: date.getDay() === 0 || date.getDay() === 6
                });
            }
        } else if (timelineScale.unit === 'week') {
            // Vista por semanas
            const startOfWeek = new Date(viewStartDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Ir al domingo
            
            const totalWeeks = Math.ceil(totalDays / 7);
            for (let i = 0; i < totalWeeks; i++) {
                const weekStart = new Date(startOfWeek);
                weekStart.setDate(weekStart.getDate() + (i * 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                days.push({
                    date: weekStart,
                    day: `S${i + 1}`,
                    month: weekStart.toLocaleDateString('es-ES', { month: 'short' }),
                    x: i * DAY_WIDTH * 7, // Cada semana ocupa 7 días de ancho
                    isWeekend: false,
                    weekEnd: weekEnd
                });
            }
        } else if (timelineScale.unit === 'month') {
            // Vista por meses
            const currentDate = new Date(viewStartDate.getFullYear(), viewStartDate.getMonth(), 1);
            const endDate = new Date(viewEndDate.getFullYear(), viewEndDate.getMonth() + 1, 0);
            
            let monthIndex = 0;
            while (currentDate <= endDate) {
                const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                
                days.push({
                    date: new Date(currentDate),
                    day: currentDate.toLocaleDateString('es-ES', { month: 'short' }),
                    month: currentDate.getFullYear().toString(),
                    x: monthIndex * DAY_WIDTH * 30, // Aproximadamente 30 días por mes
                    isWeekend: false,
                    daysInMonth: daysInMonth
                });
                
                currentDate.setMonth(currentDate.getMonth() + 1);
                monthIndex++;
            }
        }
        
        return days;
    }, [viewStartDate, viewEndDate, DAY_WIDTH, timelineScale.unit]);

    // Obtener color por estado de tarea
    const getTaskColor = (estado: TaskState, progreso: number) => {
        switch (estado) {
            case TaskState.COMPLETADA:
                return 'bg-green-500';
            case TaskState.EN_PROGRESO:
                return 'bg-blue-500';
            case TaskState.PENDIENTE:
                return 'bg-gray-400';
            default:
                return 'bg-gray-400';
        }
    };

    // Estados para drag y resize
    const [dragState, setDragState] = useState<{
        taskId: number;
        mode: 'move' | 'resize-start' | 'resize-end';
        startX: number;
        originalStartDate: Date;
        originalEndDate: Date;
    } | null>(null);

    // Estados para crear dependencias
    const [dependencyCreationState, setDependencyCreationState] = useState<{
        sourceTaskId: number;
        isActive: boolean;
        currentMousePos: { x: number; y: number };
    } | null>(null);

    // Manejar drag de tareas y creación de dependencias
    const handleTaskMouseDown = (taskId: number, e: React.MouseEvent) => {
        e.preventDefault();
        
        // Si se mantiene presionada la tecla Ctrl/Cmd, iniciar creación de dependencia
        if (e.ctrlKey || e.metaKey) {
            setDependencyCreationState({
                sourceTaskId: taskId,
                isActive: true,
                currentMousePos: { x: e.clientX, y: e.clientY }
            });
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const taskWidth = rect.width;
        
        const task = ganttTasks.find(t => t.ID === taskId);
        if (!task) return;

        let mode: 'move' | 'resize-start' | 'resize-end' = 'move';
        
        // Determinar si es resize o move basado en la posición del click
        if (clickX < 10) {
            mode = 'resize-start';
        } else if (clickX > taskWidth - 10) {
            mode = 'resize-end';
        }

        setDragState({
            taskId,
            mode,
            startX: e.clientX,
            originalStartDate: task.startDate,
            originalEndDate: task.endDate
        });

        setDraggedTask(taskId);
    };

    // Manejar hover sobre tareas durante creación de dependencias
    const handleTaskMouseEnter = (taskId: number) => {
        if (dependencyCreationState && dependencyCreationState.isActive) {
            // Resaltar tarea como posible destino
        }
    };

    // Manejar doble clic para editar tarea
    const handleTaskDoubleClick = (taskId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingTask(taskId);
        setShowEditModal(true);
    };

    // Manejar cierre del modal de edición
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingTask(null);
    };

    // Manejar actualización de tarea desde el modal
    const handleTaskUpdateFromModal = async (taskId: number, updates: Partial<Task>) => {
        if (onTaskUpdate) {
            await onTaskUpdate(taskId, updates);
        }
        handleCloseEditModal();
    };

    // Obtener la tarea que se está editando
    const taskToEdit = editingTask ? tasks.find(t => t.ID === editingTask) : null;

    // Manejar click en tarea durante creación de dependencias
    const handleTaskClick = (taskId: number, e: React.MouseEvent) => {
        if (dependencyCreationState && dependencyCreationState.isActive) {
            e.preventDefault();
            e.stopPropagation();
            
            if (taskId !== dependencyCreationState.sourceTaskId) {
                // Crear dependencia
                if (onDependencyCreate) {
                    onDependencyCreate(dependencyCreationState.sourceTaskId, taskId, 'FS');
                }
            }
            
            // Finalizar creación de dependencia
            setDependencyCreationState(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Actualizar posición del mouse para creación de dependencias
        if (dependencyCreationState && dependencyCreationState.isActive) {
            setDependencyCreationState(prev => prev ? {
                ...prev,
                currentMousePos: { x: e.clientX, y: e.clientY }
            } : null);
        }

        // Lógica de drag existente
        if (!dragState || !draggedTask) return;

        const deltaX = e.clientX - dragState.startX;
        const daysDelta = Math.round(deltaX / DAY_WIDTH);
        
        if (daysDelta === 0) return;

        const task = ganttTasks.find(t => t.ID === draggedTask);
        if (!task) return;

        let newStartDate = new Date(dragState.originalStartDate);
        let newEndDate = new Date(dragState.originalEndDate);

        switch (dragState.mode) {
            case 'move':
                // Mover toda la tarea
                newStartDate.setDate(newStartDate.getDate() + daysDelta);
                newEndDate.setDate(newEndDate.getDate() + daysDelta);
                break;
            case 'resize-start':
                // Cambiar fecha de inicio
                newStartDate.setDate(newStartDate.getDate() + daysDelta);
                // Asegurar que la fecha de inicio no sea posterior a la de fin
                if (newStartDate >= newEndDate) {
                    newStartDate = new Date(newEndDate);
                    newStartDate.setDate(newStartDate.getDate() - 1);
                }
                break;
            case 'resize-end':
                // Cambiar fecha de fin
                newEndDate.setDate(newEndDate.getDate() + daysDelta);
                // Asegurar que la fecha de fin no sea anterior a la de inicio
                if (newEndDate <= newStartDate) {
                    newEndDate = new Date(newStartDate);
                    newEndDate.setDate(newEndDate.getDate() + 1);
                }
                break;
        }

        // Actualizar visualmente (esto se podría optimizar con un estado temporal)
        if (onTaskUpdate) {
            onTaskUpdate(draggedTask, {
                Fecha_Inicio: newStartDate.toISOString().split('T')[0],
                Fecha_Vencimiento: newEndDate.toISOString().split('T')[0]
            });
        }
    };

    const handleMouseUp = () => {
        setDraggedTask(null);
        setDragState(null);
    };

    // Formatear fecha para mostrar
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit' 
        });
    };

    return (
        <div className="gantt-chart bg-white border rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="gantt-header bg-gray-50 border-b p-2 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Vista Gantt</h3>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
                        {/* Project Selector */}
                        <select 
                            value={selectedProjectId || ''}
                            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                            className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm w-full sm:w-auto"
                        >
                            <option value="">Todos los proyectos</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.nombre}
                                </option>
                            ))}
                        </select>
                        
                        {/* Timeline Scale Selector */}
                        <select 
                            value={timelineScale.unit}
                            onChange={(e) => setTimelineScale(prev => ({ 
                                ...prev, 
                                unit: e.target.value as 'day' | 'week' | 'month' 
                            }))}
                            className="px-2 sm:px-3 py-1 border rounded text-xs sm:text-sm w-full sm:w-auto"
                        >
                            <option value="day">Días</option>
                            <option value="week">Semanas</option>
                            <option value="month">Meses</option>
                        </select>
                        
                        <span className="text-xs sm:text-sm text-gray-600">
                            {filteredTasks.length} tareas
                            {selectedProjectId && (
                                <span className="ml-1 hidden sm:inline">
                                    ({projects.find(p => p.id === selectedProjectId)?.nombre})
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="gantt-content flex flex-col lg:flex-row min-h-0 flex-1">
                {/* Sidebar con lista de tareas */}
                <div className="gantt-sidebar bg-gray-50 border-r lg:border-b-0 border-b overflow-y-auto" 
                     style={{ 
                         width: '100%', 
                         maxWidth: SIDEBAR_WIDTH,
                         minWidth: '320px'
                     }}>
                    {/* Timeline header con columnas */}
                    <div className="h-[60px] border-b bg-gray-100 flex items-center sticky top-0 z-10">
                        <div className="flex-1 px-2 sm:px-4">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Tareas</span>
                        </div>
                        <div className="w-12 sm:w-16 lg:w-20 px-1 sm:px-2 border-l text-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-600">Inicio</span>
                        </div>
                        <div className="w-12 sm:w-16 lg:w-20 px-1 sm:px-2 border-l text-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-600">Fin</span>
                        </div>
                        <div className="w-12 sm:w-16 lg:w-20 px-1 sm:px-2 border-l text-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-600">Duración</span>
                        </div>
                    </div>
                    
                    {/* Task list con jerarquía, fechas y acordeón */}
                    <div className="gantt-task-list">
                        {ganttTasks.map((task) => {
                            const level = (task as any).level || 0;
                            const indentWidth = level * 12; // Reducido para móviles
                            const taskHasChildren = hasChildren(task.ID);
                            const isCollapsed = collapsedTasks.has(task.ID);
                            
                            // Ancho dinámico basado en el nivel de jerarquía
                            const taskNameMaxWidth = level > 0 ? '120px' : '160px'; // Subtareas más limitadas
                            
                            return (
                                <div 
                                    key={task.ID}
                                    className="gantt-task-row border-b hover:bg-gray-100 flex items-center"
                                    style={{ height: ROW_HEIGHT }}
                                    onDoubleClick={(e) => handleTaskDoubleClick(task.ID, e)}
                                >
                                    {/* Columna de tarea con indentación y acordeón */}
                                    <div className="flex-1 flex items-center h-full px-1 sm:px-2" style={{ paddingLeft: `${4 + indentWidth}px` }}>
                                        {/* Botón de acordeón para tareas padre */}
                                        {taskHasChildren && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleTaskCollapse(task.ID);
                                                }}
                                                className="mr-1 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                                                title={isCollapsed ? "Expandir subtareas" : "Colapsar subtareas"}
                                            >
                                                <svg 
                                                    className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                                    fill="currentColor" 
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                        
                                        {/* Espaciador si no tiene hijos */}
                                        {!taskHasChildren && <div className="w-4 sm:w-5 flex-shrink-0"></div>}
                                        
                                        {/* Indicador de jerarquía */}
                                        {level > 0 && (
                                            <div className="flex items-center mr-1 sm:mr-2 flex-shrink-0">
                                                <div className="w-2 sm:w-3 h-px bg-gray-300"></div>
                                                <div className="w-1 sm:w-2 h-1 sm:h-2 border-l border-b border-gray-300 rounded-bl-sm"></div>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0 mr-1 sm:mr-2" style={{ maxWidth: taskNameMaxWidth }}>
                                            <div className={`text-xs sm:text-sm truncate ${level === 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`} title={task.Titulo}>
                                                {task.Titulo}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate hidden sm:block" title={task.proyecto_nombre || 'Sin proyecto'}>
                                                {task.proyecto_nombre || 'Sin proyecto'}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-shrink-0">
                                            <span className={`inline-block w-2 sm:w-3 h-2 sm:h-3 rounded-full ${getTaskColor(task.Estado, task.Porcentaje_Avance)}`}></span>
                                        </div>
                                    </div>
                                    
                                    {/* Columna fecha inicio - FIJA */}
                                    <div className="w-12 sm:w-16 lg:w-20 px-1 sm:px-2 border-l text-center flex-shrink-0">
                                        <span className="text-xs text-gray-600">
                                            {task.Fecha_Inicio ? formatDate(new Date(task.Fecha_Inicio)) : '-'}
                                        </span>
                                    </div>
                                    
                                    {/* Columna fecha fin - FIJA */}
                                    <div className="w-12 sm:w-16 lg:w-20 px-1 sm:px-2 border-l text-center flex-shrink-0">
                                        <span className="text-xs text-gray-600">
                                            {task.Fecha_Vencimiento ? formatDate(new Date(task.Fecha_Vencimiento)) : '-'}
                                        </span>
                                    </div>
                                    
                                    {/* Columna duración - NUEVA */}
                                    <div className="w-12 sm:w-16 lg:w-20 px-1 sm:px-2 border-l text-center flex-shrink-0">
                                        <span className="text-xs text-gray-600 font-medium">
                                            {calculateDuration(task.Fecha_Inicio, task.Fecha_Vencimiento)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Timeline y Chart */}
                <div className="gantt-timeline-container flex-1 overflow-x-auto min-h-0">
                    {/* Timeline Header */}
                    <div className="gantt-timeline-header bg-gray-100 border-b overflow-x-auto sticky top-0 z-10" style={{ height: TIMELINE_HEIGHT }}>
                        <div className="relative" style={{ width: Math.max(timelineDays.length * DAY_WIDTH, 320) }}>
                            {timelineDays.map((day, index) => (
                                <div
                                    key={index}
                                    className={`absolute top-0 border-r text-xs text-center py-2 ${
                                        day.isWeekend ? 'bg-gray-200' : 'bg-gray-100'
                                    }`}
                                    style={{
                                        left: index * (timelineScale.unit === 'week' ? DAY_WIDTH * 7 : timelineScale.unit === 'month' ? DAY_WIDTH * 30 : DAY_WIDTH),
                                        width: timelineScale.unit === 'week' ? DAY_WIDTH * 7 : timelineScale.unit === 'month' ? DAY_WIDTH * 30 : DAY_WIDTH,
                                        height: TIMELINE_HEIGHT
                                    }}
                                >
                                    <div className="font-medium">{formatDate(day.date)}</div>
                                    <div className="text-gray-500">{day.date.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div 
                        className="gantt-chart-area relative bg-white overflow-x-auto"
                        style={{ 
                            width: Math.max(timelineDays.length * DAY_WIDTH, 320),
                            height: Math.max(ganttTasks.length * ROW_HEIGHT, 200),
                            minHeight: '200px'
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        {/* Grid lines */}
                        {timelineDays.map((day, index) => (
                            <div
                                key={`grid-${index}`}
                                className={`absolute top-0 bottom-0 border-r ${
                                    day.isWeekend ? 'bg-gray-50' : ''
                                }`}
                                style={{
                                    left: index * (timelineScale.unit === 'week' ? DAY_WIDTH * 7 : timelineScale.unit === 'month' ? DAY_WIDTH * 30 : DAY_WIDTH),
                                    width: timelineScale.unit === 'week' ? DAY_WIDTH * 7 : timelineScale.unit === 'month' ? DAY_WIDTH * 30 : DAY_WIDTH
                                }}
                            />
                        ))}

                        {/* Task bars */}
                        {ganttTasks.map((task) => {
                            const isDragging = draggedTask === task.ID;
                            const isSourceTask = dependencyCreationState?.sourceTaskId === task.ID;
                            const isPotentialTarget = dependencyCreationState?.isActive && dependencyCreationState.sourceTaskId !== task.ID;
                            
                            let cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-grab hover:cursor-grab';
                            if (dependencyCreationState?.isActive) {
                                cursorClass = isSourceTask ? 'cursor-crosshair' : 'cursor-pointer';
                            }
                            
                            return (
                                <div
                                    key={task.ID}
                                    className={`absolute rounded shadow-sm hover:shadow-md transition-all ${getTaskColor(task.Estado, task.Porcentaje_Avance)} ${cursorClass} ${
                                        isDragging ? 'opacity-80 z-10' : ''
                                    } ${
                                        isSourceTask ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
                                    } ${
                                        isPotentialTarget ? 'ring-2 ring-green-400 ring-opacity-50 hover:ring-green-500' : ''
                                    }`}
                                    style={{
                                        left: task.x,
                                        top: task.y + TASK_MARGIN / 2,
                                        width: task.width,
                                        height: TASK_HEIGHT
                                    }}
                                    onMouseDown={(e) => handleTaskMouseDown(task.ID, e)}
                                    onMouseEnter={() => handleTaskMouseEnter(task.ID)}
                                    onClick={(e) => handleTaskClick(task.ID, e)}
                                    onDoubleClick={(e) => handleTaskDoubleClick(task.ID, e)}
                                    title={`${task.Titulo} (${task.duration} días)${dependencyCreationState?.isActive ? '\nCtrl+Click para crear dependencia' : '\nDoble clic para editar'}`}
                                >
                                    {/* Resize handles - solo mostrar si no estamos creando dependencias */}
                                    {!dependencyCreationState?.isActive && (
                                        <>
                                            <div className="absolute left-0 top-0 w-2 h-full cursor-w-resize hover:bg-black hover:bg-opacity-20 rounded-l" />
                                            <div className="absolute right-0 top-0 w-2 h-full cursor-e-resize hover:bg-black hover:bg-opacity-20 rounded-r" />
                                        </>
                                    )}
                                    
                                    {/* Progress bar */}
                                    <div 
                                        className="h-full bg-black bg-opacity-20 rounded"
                                        style={{ width: `${task.Porcentaje_Avance}%` }}
                                    />
                                    
                                    {/* Task label */}
                                    <div className="absolute inset-0 flex items-center px-2">
                                        <span className="text-white text-xs font-medium truncate">
                                            {task.Titulo}
                                        </span>
                                    </div>

                                    {/* Indicador de conexión para tarea fuente */}
                                    {isSourceTask && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                                    )}
                                </div>
                            );
                        })}

                        {/* Dependency lines */}
                        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                            {dependencies.map((dep) => {
                                const sourceTask = ganttTasks.find(t => t.ID === dep.tarea_predecesora_id);
                                const targetTask = ganttTasks.find(t => t.ID === dep.tarea_sucesora_id);
                                
                                if (!sourceTask || !targetTask) return null;

                                // Calcular puntos de conexión basados en el tipo de dependencia
                                let x1, y1, x2, y2;
                                const sourceY = sourceTask.y + TASK_HEIGHT / 2;
                                const targetY = targetTask.y + TASK_HEIGHT / 2;

                                switch (dep.tipo_dependencia) {
                                    case 'FS': // Finish to Start (por defecto)
                                        x1 = sourceTask.x + sourceTask.width;
                                        y1 = sourceY;
                                        x2 = targetTask.x;
                                        y2 = targetY;
                                        break;
                                    case 'SS': // Start to Start
                                        x1 = sourceTask.x;
                                        y1 = sourceY;
                                        x2 = targetTask.x;
                                        y2 = targetY;
                                        break;
                                    case 'FF': // Finish to Finish
                                        x1 = sourceTask.x + sourceTask.width;
                                        y1 = sourceY;
                                        x2 = targetTask.x + targetTask.width;
                                        y2 = targetY;
                                        break;
                                    case 'SF': // Start to Finish
                                        x1 = sourceTask.x;
                                        y1 = sourceY;
                                        x2 = targetTask.x + targetTask.width;
                                        y2 = targetY;
                                        break;
                                    default:
                                        x1 = sourceTask.x + sourceTask.width;
                                        y1 = sourceY;
                                        x2 = targetTask.x;
                                        y2 = targetY;
                                }

                                // Crear path con curvas para mejor visualización
                                const midX = (x1 + x2) / 2;
                                const controlOffset = Math.abs(x2 - x1) * 0.3;
                                
                                const pathData = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

                                // Color basado en el tipo de dependencia
                                const getDepColor = (tipo: string) => {
                                    switch (tipo) {
                                        case 'FS': return '#3B82F6'; // Azul
                                        case 'SS': return '#10B981'; // Verde
                                        case 'FF': return '#F59E0B'; // Amarillo
                                        case 'SF': return '#EF4444'; // Rojo
                                        default: return '#3B82F6';
                                    }
                                };

                                const color = getDepColor(dep.tipo_dependencia);

                                return (
                                    <g key={dep.id}>
                                        {/* Línea principal */}
                                        <path
                                            d={pathData}
                                            stroke={color}
                                            strokeWidth="2"
                                            fill="none"
                                            markerEnd={`url(#arrowhead-${dep.tipo_dependencia})`}
                                            className="hover:stroke-4 transition-all"
                                        />
                                        
                                        {/* Línea invisible más gruesa para mejor hover */}
                                         <path
                                             d={pathData}
                                             stroke="transparent"
                                             strokeWidth="8"
                                             fill="none"
                                             className="cursor-pointer"
                                             onClick={(e) => {
                                                 e.preventDefault();
                                                 e.stopPropagation();
                                                 onDependencyDelete && onDependencyDelete(dep.id);
                                             }}
                                         >
                                             <title>{`${dep.tipo_dependencia}: ${sourceTask.Titulo} → ${targetTask.Titulo}${dep.descripcion ? ` (${dep.descripcion})` : ''}`}</title>
                                         </path>

                                        {/* Etiqueta del tipo de dependencia */}
                                        <text
                                            x={midX}
                                            y={Math.min(y1, y2) - 5}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fill={color}
                                            className="font-medium"
                                        >
                                            {dep.tipo_dependencia}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Línea temporal para creación de dependencias */}
                            {dependencyCreationState && dependencyCreationState.isActive && (() => {
                                const sourceTask = ganttTasks.find(t => t.ID === dependencyCreationState.sourceTaskId);
                                if (!sourceTask) return null;

                                const chartRect = document.querySelector('.gantt-chart-area')?.getBoundingClientRect();
                                if (!chartRect) return null;

                                const x1 = sourceTask.x + sourceTask.width;
                                const y1 = sourceTask.y + TASK_HEIGHT / 2;
                                const x2 = dependencyCreationState.currentMousePos.x - chartRect.left;
                                const y2 = dependencyCreationState.currentMousePos.y - chartRect.top;

                                return (
                                    <g key="temp-dependency">
                                        <line
                                            x1={x1}
                                            y1={y1}
                                            x2={x2}
                                            y2={y2}
                                            stroke="#3B82F6"
                                            strokeWidth="2"
                                            strokeDasharray="5,5"
                                            opacity="0.7"
                                        />
                                        <circle
                                            cx={x2}
                                            cy={y2}
                                            r="4"
                                            fill="#3B82F6"
                                            opacity="0.7"
                                        />
                                    </g>
                                );
                            })()}
                            
                            {/* Arrow marker definitions para cada tipo */}
                            <defs>
                                {['FS', 'SS', 'FF', 'SF'].map(tipo => {
                                    const color = tipo === 'FS' ? '#3B82F6' : 
                                                 tipo === 'SS' ? '#10B981' : 
                                                 tipo === 'FF' ? '#F59E0B' : '#EF4444';
                                    return (
                                        <marker
                                            key={tipo}
                                            id={`arrowhead-${tipo}`}
                                            markerWidth="10"
                                            markerHeight="7"
                                            refX="9"
                                            refY="3.5"
                                            orient="auto"
                                        >
                                            <polygon
                                                points="0 0, 10 3.5, 0 7"
                                                fill={color}
                                            />
                                        </marker>
                                    );
                                })}
                            </defs>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Empty state */}
            {tasks.length === 0 && (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                        <div className="text-lg font-medium mb-2">No hay tareas para mostrar</div>
                        <div className="text-sm">Crea algunas tareas con fechas para ver el diagrama Gantt</div>
                    </div>
                </div>
            )}

            {/* Modal de edición de tarea */}
             {showEditModal && taskToEdit && (
                 <EditTaskModal
                     task={taskToEdit}
                     allTasks={tasks}
                     projects={projects}
                     currentUser={currentUser}
                     onSave={async (updatedTask) => {
                         if (onTaskUpdate) {
                             await onTaskUpdate(updatedTask.ID, updatedTask);
                         }
                         handleCloseEditModal();
                     }}
                     onClose={handleCloseEditModal}
                     onCreateSubtask={async (parentTaskId: number, title: string) => {
                         await createSubTask(parentTaskId, title);
                         // Refresh tasks would be handled by parent component
                     }}
                     onDelete={async (taskId: number) => {
                         await deleteTask(taskId);
                         handleCloseEditModal();
                         // Refresh tasks would be handled by parent component
                     }}
                     onProjectCreated={onProjectCreated}
                 />
             )}
        </div>
    );
};

export default GanttChart;
export { GanttChart };