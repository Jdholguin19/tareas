import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CreateQuickTask } from './components/CreateQuickTask';
import { TaskList } from './components/TaskList';
import { GanttChart } from './components/GanttChart';
import { KanbanBoard } from './components/KanbanBoard';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { Icon } from './components/Icon';
import type { Task, Project, TaskDependency, TaskType } from './types';
import { TaskPriority, TaskImportance } from './types';
import { getTasks, updateTask, createSubTask, getProjects, deleteTask, checkAuth, apiLogout, getMinimalTasks, getAllTaskAssignees, getCurrentUser, getDependencies, createDependency, deleteDependency, getTaskTypes, getUserDepartments } from './services/apiService';
import { calculateTaskProgress, hasSubtasks } from './utils/taskUtils';
import { EditTaskModal } from './components/EditTaskModal';
import { TaskSkeleton } from './components/TaskSkeleton';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<number[]>([1]); // Por defecto solo "tareas" (id=1)
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState<boolean>(false);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskNavigationHistory, setTaskNavigationHistory] = useState<Task[]>([]);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState<boolean>(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const createTaskRef = useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [taskAssigneesRecord, setTaskAssigneesRecord] = useState<Record<number, {id: number, username: string}[]>>({});
  const [isCreateTaskHighlighted, setIsCreateTaskHighlighted] = useState(false);

  // Current user state
  const [currentUser, setCurrentUser] = useState<{id: number, username: string, email: string, rol_id?: number} | null>(null);
  const [userDepartments, setUserDepartments] = useState<{id: number, nombre: string}[]>([]);

  // Page state - para alternar entre Dashboard, Admin y App de Tareas
  const [currentPage, setCurrentPage] = useState<'tasks' | 'dashboard' | 'admin'>('tasks');

  // View state
  const [activeView, setActiveView] = useState<'list' | 'kanban' | 'gantt' | 'matrix'>('list');
  const [ganttFocusedTaskId, setGanttFocusedTaskId] = useState<number | null>(null);

  const PAGE_SIZE = 50;
  const [scheduledPage, setScheduledPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [appliedSearchFilter, setAppliedSearchFilter] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const justSelectedFromDropdownRef = useRef(false); // Use ref instead of state for immediate updates
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search handlers
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 1) {
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
    }
  };

  const handleSearchSelect = (item: { type: 'task' | 'project', id: number, name: string }) => {
    
    justSelectedFromDropdownRef.current = true; // Set ref immediately
    setShowSearchDropdown(false);
    
    if (item.type === 'task') {
      // For tasks, set search to task title and apply filter immediately
      
      setSearchQuery(item.name);
      setAppliedSearchFilter(item.name);
      setSelectedProjectId(null);
    } else {
      // For projects, set project filter only (no additional text search)
      
      setSearchQuery(item.name);
      setSelectedProjectId(parseInt(String(item.id)));
      setAppliedSearchFilter(''); // Clear text search when selecting a project
    }
    
    // Reset the flag after ensuring state updates complete
    setTimeout(() => {
      console.log('Resetting justSelectedFromDropdown flag');
      justSelectedFromDropdownRef.current = false;
    }, 300);
  };

  const handleApplySearch = () => {
    // If we have a project selected and the search query is different from the project name,
    // apply text search within the selected project
    if (selectedProjectId !== null && searchQuery.trim() && searchQuery !== appliedSearchFilter) {
      setAppliedSearchFilter(searchQuery);
    } else if (selectedProjectId === null) {
      // Only apply text search if no project is selected
      setAppliedSearchFilter(searchQuery);
    }
    setShowSearchDropdown(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setAppliedSearchFilter('');
    setSelectedProjectId(null);
    setShowSearchDropdown(false);
  };

  const handleSearchBlur = () => {
    console.log('=== handleSearchBlur CALLED ===', { 
      justSelectedFromDropdown: justSelectedFromDropdownRef.current,
      searchQuery, 
      appliedSearchFilter,
      selectedProjectId 
    });
    // Delay hiding dropdown to allow click on options
    setTimeout(() => {
      setShowSearchDropdown(false);
      // Only auto-apply text search if:
      // 1. We didn't just select from dropdown
      // 2. Search query is different from applied filter
      // 3. No project is currently selected
      if (!justSelectedFromDropdownRef.current && 
          searchQuery.trim() && 
          searchQuery !== appliedSearchFilter && 
          selectedProjectId === null) {
        console.log('Auto-applying search filter:', searchQuery);
        handleApplySearch();
      } else {
        console.log('NOT auto-applying search - conditions not met');
      }
    }, 200);
  };

  useEffect(() => {
    setScheduledPage(1);
    setCompletedPage(1);
  }, [appliedSearchFilter, selectedProjectId, selectedTaskTypes, showOnlyMyTasks]);

  // Allowed task types for the filter (only show these IDs)
  const ALLOWED_TASK_TYPE_IDS = [1, 4, 5];
  const isTidDept = useMemo(
    () => userDepartments.some(d => d.id === 3 || (d.nombre || '').toUpperCase() === 'TID'),
    [userDepartments]
  );
  // Visible task types (only IDs defined above; hide id 4 unless user is TID/dep 3)
  const visibleTaskTypes = useMemo(
    () => taskTypes.filter(t => {
      if (!ALLOWED_TASK_TYPE_IDS.includes(t.id)) return false;
      if (t.id === 4 && !isTidDept) return false;
      return true;
    }),
    [taskTypes, isTidDept]
  );

  // Task type filter handler (guard against toggling invalid ids)
  const handleTaskTypeToggle = (typeId: number) => {
    if (!ALLOWED_TASK_TYPE_IDS.includes(typeId)) return; // ignore toggles for other types
    setSelectedTaskTypes(prev => {
      if (prev.includes(typeId)) {
        // Si es el único seleccionado, no permitir desmarcarlo
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  // Get search suggestions
  const getSearchSuggestions = () => {
    if (!searchQuery.trim() || searchQuery.length < 1) return [];

    const term = searchQuery.toLowerCase().trim();
    const suggestions: { type: 'task' | 'project', id: number, name: string }[] = [];

    // Filter tasks for current user first
    const userTasks = filterTasksForCurrentUser(tasks);

    // Add matching tasks
    userTasks.forEach(task => {
      if (task.Titulo.toLowerCase().includes(term)) {
        suggestions.push({ type: 'task', id: task.ID, name: task.Titulo });
      }
    });

    // Add matching projects
    projects.forEach(project => {
      if (project.nombre.toLowerCase().includes(term)) {
        suggestions.push({ type: 'project', id: project.id, name: project.nombre });
      }
    });

    // Remove duplicates and limit to 10 suggestions
    return suggestions
      .filter((item, index, self) => 
        index === self.findIndex(s => s.id === item.id && s.type === item.type)
      )
      .slice(0, 10);
  };

  // Accordion states - reorganizados según nueva prioridad
  const [isUrgentTasksExpanded, setIsUrgentTasksExpanded] = useState<boolean>(true);
  const [isTodayTasksExpanded, setIsTodayTasksExpanded] = useState<boolean>(true);
  const [isScheduledTasksExpanded, setIsScheduledTasksExpanded] = useState<boolean>(false);
  const [isCompletedTasksExpanded, setIsCompletedTasksExpanded] = useState<boolean>(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const initialTasks = await getMinimalTasks();
      setTasks(initialTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      // Here you could set an error state and display a message to the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const initialProjects = await getProjects();
      console.log('Loaded projects:', initialProjects);
      setProjects(initialProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  const fetchTaskTypes = useCallback(async () => {
    try {
      const types = await getTaskTypes();
      console.log('Loaded task types:', types);
      setTaskTypes(types);

      // Constrain selectedTaskTypes to allowed IDs and set sensible default
      const allowedIds = ALLOWED_TASK_TYPE_IDS;
      const has1 = types.some(t => t.id === 1);
      const has4 = types.some(t => t.id === 4);

      setSelectedTaskTypes(prev => {
        // Keep only allowed ids from previous selection
        const filteredPrev = prev.filter(id => allowedIds.includes(id));
        if (filteredPrev.length > 0) return filteredPrev;
        // If nothing remained, prefer [1] if available, then [4], otherwise fallback to the first allowed type we find
        if (has1) return [1];
        if (has4) return [4];
        const firstAllowed = types.find(t => allowedIds.includes(t.id));
        return firstAllowed ? [firstAllowed.id] : (types.length > 0 ? [types[0].id] : [1]);
      });
    } catch (error) {
      console.error("Failed to fetch task types:", error);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const deps = await getDependencies();
      setDependencies(deps);
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
    }
  }, []);

  const loadUserDepartments = useCallback(async (userId: number) => {
    try {
      const depts = await getUserDepartments(userId);
      setUserDepartments(depts || []);
    } catch (error) {
      console.error('Failed to load user departments:', error);
      setUserDepartments([]);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const init = async () => {
      try {
        const auth = await checkAuth();
        if (abortController.signal.aborted) return;
        
        if (auth && auth.authenticated && isMounted) {
          setIsAuthenticated(true);
          
          // Ejecutar llamadas en paralelo para mejor rendimiento
          const [tasksResult, projectsResult, depsResult, userResult, taskTypesResult] = await Promise.allSettled([
            fetchTasks(),
            fetchProjects(),
            fetchDependencies(),
            getCurrentUser(),
            fetchTaskTypes()
          ]);
          
          if (abortController.signal.aborted) return;
          
          if (userResult.status === 'fulfilled' && isMounted) {
            setCurrentUser(userResult.value);
          } else if (userResult.status === 'rejected') {
            console.error('Error getting current user:', userResult.reason);
          }
          if (depsResult.status === 'rejected') {
            console.error('Error loading dependencies:', depsResult.reason);
          }
        } else if (isMounted) {
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (abortController.signal.aborted) return;
        console.error('Auth check failed', err);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      }
    };

    init();
    
    // Cleanup: cancelar peticiones y marcar como desmontado
    return () => {
      abortController.abort();
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar el componente

  // Asegurar que el valor por defecto de selectedTaskTypes sea correcto cuando taskTypes se carga
  useEffect(() => {
    if (taskTypes.length > 0 && selectedTaskTypes.length === 0) {
      // Si por alguna razón selectedTaskTypes está vacío después de cargar tipos, establecer [1]
      const tareasType = taskTypes.find(t => t.id === 1);
      setSelectedTaskTypes(tareasType ? [1] : [taskTypes[0].id]);
      console.log('Setting default task type filter to:', tareasType ? [1] : [taskTypes[0].id]);
    }
  }, [taskTypes, selectedTaskTypes.length]);

  // Load departments for current user (for conditional task-type visibility)
  useEffect(() => {
    if (currentUser?.id) {
      loadUserDepartments(currentUser.id);
    } else {
      setUserDepartments([]);
    }
  }, [currentUser?.id, loadUserDepartments]);

  // Load task assignees when tasks are loaded and user is authenticated
  useEffect(() => {
    const loadTaskAssignees = async () => {
      if (tasks.length > 0 && currentUser && isAuthenticated && Object.keys(taskAssigneesRecord).length === 0) {
        try {
          const taskIds = tasks.map(task => task.ID);
          const assignees = await getAllTaskAssignees(taskIds);
          setTaskAssigneesRecord(assignees);
        } catch (error) {
          console.error('Error loading task assignees:', error);
        }
      }
    };

    loadTaskAssignees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length, currentUser?.id, isAuthenticated]); // Solo cuando cambian valores específicos

  // Close notification menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setIsNotificationMenuOpen(false);
      }
    };

    if (isNotificationMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationMenuOpen]);

  const handleAddTask = (newTask: Task) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const handleSelectTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSubtaskClick = (subtask: Task) => {
    // Agregar la tarea actual al historial antes de navegar a la subtarea
    if (editingTask) {
      setTaskNavigationHistory(prev => [...prev, editingTask]);
    }
    setEditingTask(subtask);
  };

  const handleCloseModal = () => {
    // Si hay historial, volver a la tarea anterior
    if (taskNavigationHistory.length > 0) {
      const previousTask = taskNavigationHistory[taskNavigationHistory.length - 1];
      setTaskNavigationHistory(prev => prev.slice(0, -1));
      setEditingTask(previousTask);
    } else {
      // Si no hay historial, cerrar el modal completamente
      setEditingTask(null);
    }
  };

  const handleProjectCreated = (project: Project) => {
    // Add to projects list if not already present
    setProjects(prev => {
      if (prev.some(p => p.id === project.id)) return prev;
      return [...prev, project].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  };

  const handleUpdateTask = async (taskToUpdate: Task) => {
    try {
      const savedTask = await updateTask(taskToUpdate);
      
      setTasks(currentTasks => {
        const updatedTasks = currentTasks.map(t => (parseInt(String(t.ID)) === parseInt(String(savedTask.ID)) ? savedTask : t));
        return updatedTasks;
      });
      
      // Keep modal open if it's open, so user can see changes reflected.
      if (editingTask && parseInt(String(editingTask.ID)) === parseInt(String(savedTask.ID))) {
        setEditingTask(savedTask);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      // You could show an error toast here
    }
  };

  // Wrapper function for Gantt chart updates
  const handleGanttTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
    const taskToUpdate = tasks.find(t => parseInt(String(t.ID)) === parseInt(String(taskId)));
    if (!taskToUpdate) {
      console.error("Task not found:", taskId);
      return;
    }
    
    const updatedTask = { ...taskToUpdate, ...updates };
    await handleUpdateTask(updatedTask);
  };

  const handleCreateSubTask = async (parentTaskId: number, title: string) => {
    try {
      const newSubTask = await createSubTask(parentTaskId, title);
      setTasks(currentTasks => [...currentTasks, newSubTask]);
    } catch (error) {
      console.error("Failed to create sub-task:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setTasks(currentTasks => {
        const updatedTasks = currentTasks.filter(task => task.ID !== taskId);

        // Find the deleted task to check if it was a subtask
        const deletedTask = currentTasks.find(task => task.ID === taskId);

        // If the deleted task was a subtask, recalculate parent progress
        if (deletedTask && deletedTask.Parent_ID && deletedTask.Parent_ID !== 0) {
          return updatedTasks.map(task => {
            if (task.ID === deletedTask.Parent_ID && hasSubtasks(task, updatedTasks)) {
              return {
                ...task,
                Porcentaje_Avance: calculateTaskProgress(task, updatedTasks)
              };
            }
            return task;
          });
        }

        // If it wasn't a subtask, just return the filtered tasks
        return updatedTasks;
      });

      setTaskAssigneesRecord(prev => {
        const newRecord = { ...prev };
        delete newRecord[taskId];
        return newRecord;
      });

      // Close modal if the deleted task was being edited
      if (editingTask?.ID === taskId) {
        setEditingTask(null);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
      setIsAuthenticated(false);
      setTasks([]);
    } catch (error) {
      console.error("Failed to logout:", error);
      // Fallback: force logout anyway
      setIsAuthenticated(false);
      setTasks([]);
    }
  };

  const handleRefreshTasks = async () => {
    setIsLoading(true);
    try {
      // Recargar todas las tareas, proyectos, tipos de tarea y dependencias
      await Promise.all([
        fetchTasks(),
        fetchProjects(),
        fetchTaskTypes(),
        fetchDependencies()
      ]);
      
      // Recargar asignaciones de usuarios
      if (currentUser) {
        const taskIds = tasks.map(task => task.ID);
        if (taskIds.length > 0) {
          const assignees = await getAllTaskAssignees(taskIds);
          setTaskAssigneesRecord(assignees);
        }
      }

      // Además, intentar refrescar la sesión en el servidor (puede renovar cookies o session)
      try {
        const auth = await checkAuth();
        if (auth && auth.authenticated) {
          try {
            const user = await getCurrentUser();
            setIsAuthenticated(true);
            setCurrentUser(user);
            // Touch session config to encourage cookie refresh
            try {
              await fetch('/api/check_session_config.php', { credentials: 'include', cache: 'no-store' });
            } catch (e) {
              console.warn('Session refresh ping failed', e);
            }
          } catch (userErr) {
            console.error('Failed to fetch current user after session refresh:', userErr);
          }
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Failed to refresh session cookies:', err);
      }

    } catch (error) {
      console.error("Failed to refresh tasks:", error);
      alert('Error al recargar las tareas. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrollToCreateTask = () => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Highlight create task section
    setIsCreateTaskHighlighted(true);
    
    // Focus on create task input after scroll
    setTimeout(() => {
      if (createTaskRef.current) {
        const input = createTaskRef.current.querySelector('input');
        if (input) {
          input.focus();
        }
      }
    }, 500);
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      setIsCreateTaskHighlighted(false);
    }, 3000);
  };

  const handleExportCSV = () => {
    const headers = [
      "ID", "Titulo", "Descripcion", "Estado", "Porcentaje_Avance", 
      "Fecha_Creacion", "Fecha_Inicio", "Fecha_Completada", "Fecha_Vencimiento", "Usuario_Creador_ID", 
      "Usuario_Asignado_ID", "Proyecto", "Parent_ID", "Adjuntos_URL"
    ];

    const rows = tasks.map(task => [
      task.ID,
      `"${task.Titulo.replace(/"/g, '""')}"`,
      `"${task.Descripcion?.replace(/"/g, '""') || ''}"`,
      task.Estado,
      task.Porcentaje_Avance,
      task.Fecha_Creacion,
      task.Fecha_Inicio || '',
      task.Fecha_Completada || '',
      task.Fecha_Vencimiento || '',
      task.Usuario_Creador_ID,
      task.Usuario_Asignado_ID || '',
      task.Proyecto,
      task.Parent_ID,
      `"${JSON.stringify(task.Adjuntos_URL).replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'tareas.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleGanttFocus = async (taskId: number) => {
    // Cambiar a vista Gantt primero
    setActiveView('gantt');
    
    // Esperar a que la vista Gantt se renderice completamente
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Activar pantalla completa del Gantt
    const ganttRoot = document.querySelector('.gantt-chart');
    if (ganttRoot && (ganttRoot as any).requestFullscreen) {
      try {
        await (ganttRoot as any).requestFullscreen();
        // Esperar a que el fullscreen se complete
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.log('Fullscreen not available, continuing without it');
      }
    }
    
    // Ahora establecer el ID de la tarea a enfocar (después del fullscreen)
    setGanttFocusedTaskId(taskId);
    
    // Limpiar el focusedTaskId después de que se haya procesado
    setTimeout(() => {
      setGanttFocusedTaskId(null);
    }, 5000); // 5 segundos para dar tiempo al highlight
  };

  // Filter functions
  const getCurrentDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getAllDescendants = (parentIds: Set<number>, allTasks: Task[]): Task[] => {
    const descendants: Task[] = [];
    const toProcess = Array.from(parentIds);

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;
      const children = allTasks.filter(task => task.Parent_ID === currentId);

      for (const child of children) {
        descendants.push(child);
        toProcess.push(child.ID);
      }
    }

    return descendants;
  };

  const parseProgress = (p: number | string | undefined) => {
    if (p === undefined || p === null) return 0;
    if (typeof p === 'number') return p;
    // remove possible percent sign and parse float
    const cleaned = String(p).replace('%', '').trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const isCompleted = (task: Task) => parseProgress(task.Porcentaje_Avance) >= 100;

  // Search matching function
  const matchesSearch = (task: Task, searchTerm: string, projects: Project[], selectedProjectId: number | null): boolean => {
    // If a specific project is selected, only show tasks from that project
    if (selectedProjectId !== null) {
      const taskProjectId = task.Proyecto ? parseInt(String(task.Proyecto)) : null;
      const normalizedSelectedProjectId = parseInt(String(selectedProjectId));
      if (taskProjectId !== normalizedSelectedProjectId) return false;

      // If we also have a search term, apply text search within the selected project
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();

        // Check task title
        if (task.Titulo.toLowerCase().includes(term)) return true;

        // Check project name (though it should match the selected project)
        const project = projects.find(p => p.id === Number(task.Proyecto || 0));
        if (project && project.nombre.toLowerCase().includes(term)) return true;

        return false;
      }

      // No search term, just return tasks from selected project
      return true;
    }

    // No project selected, apply text search across all tasks
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();

    // Check task title
    if (task.Titulo.toLowerCase().includes(term)) return true;

    // Check project name
    const project = projects.find(p => p.id === Number(task.Proyecto || 0));
    if (project && project.nombre.toLowerCase().includes(term)) return true;

    return false;
  };  // Filter tasks for current user
  const filterTasksForCurrentUser = (allTasks: Task[]): Task[] => {
    if (!currentUser) return allTasks;
    
    return allTasks.filter(task => {
      // PRIMERO: Filtrar por tipo de tarea
      // Si la tarea no tiene tipo asignado, asumimos que es tipo 1 (tareas genéricas)
      const taskTypeId = task.Tipos_Tareas_ID || 1;
      if (selectedTaskTypes.length > 0 && !selectedTaskTypes.includes(taskTypeId)) {
        return false;
      }
      
      // SEGUNDO: Filtrar por permisos de usuario
      // Si el switch 'Ver solo mis tareas' está activo, incluir:
      // - tareas que me asignaron (estoy en assignees o en Usuario_Asignado_ID)
      // - tareas que yo creé pero que NO asigné a otras personas
      // Ocultar tareas que yo asigné a otros usuarios.
      if (showOnlyMyTasks) {
        const assignees = taskAssigneesRecord[task.ID] || [];
        const normalizedCurrentId = parseInt(String(currentUser.id));

        const assignedViaRecord = assignees.some(assignee => parseInt(String(assignee.id)) === normalizedCurrentId);
        const assignedViaField = task.Usuario_Asignado_ID && parseInt(String(task.Usuario_Asignado_ID)) === normalizedCurrentId;

        // If I'm explicitly assigned, include
        if (assignedViaRecord || assignedViaField) return true;

        // If I'm the creator, include only when there are no assignees or all assignees are me
        if (parseInt(String(task.Usuario_Creador_ID)) === normalizedCurrentId) {
          if (assignees.length === 0) return true;
          const allAssignedToMe = assignees.every(assignee => parseInt(String(assignee.id)) === normalizedCurrentId);
          if (allAssignedToMe) return true;
          // Otherwise I assigned it to others -> hide
          return false;
        }

        // Otherwise not related to me -> hide
        return false;
      }

      // User created the task - NORMALIZAR IDs para compatibilidad producción/local
      if (parseInt(String(task.Usuario_Creador_ID)) === parseInt(String(currentUser.id))) return true;
      
      // User is assigned to the task - NORMALIZAR IDs
      const assignees = taskAssigneesRecord[task.ID] || [];
      if (assignees.some(assignee => parseInt(String(assignee.id)) === parseInt(String(currentUser.id)))) return true;
      
      return false;
    });
  };

  // Nueva función para "Primero Urgente" - combina atrasadas, sin fecha y tareas importantes
  const getUrgentTasks = (allTasks: Task[], searchFilter: string = '') => {
    // First filter by current user
    const userTasks = filterTasksForCurrentUser(allTasks);
    
    const today = getCurrentDate();

   

    // Get all completed task IDs (100% progress)
    const completedTaskIds = new Set(
      userTasks
        .filter(task => isCompleted(task))
        .map(task => task.ID)
    );

    // Filter tasks that qualify for urgent section
    const urgentTasks = userTasks.filter(task => {
      if (completedTaskIds.has(task.ID)) return false;

      // Apply search filter (check if either searchFilter OR selectedProjectId is set)
      if ((searchFilter || selectedProjectId !== null) && !matchesSearch(task, searchFilter, projects, selectedProjectId)) return false;

      // Si tiene Importancia ALTA y Prioridad ALTA -> va a Urgente
      if (task.Importancia === TaskImportance.ALTA && task.Prioridad === TaskPriority.ALTA) {
        return true;
      }

      // Si tiene Importancia ALTA (con Prioridad MEDIA o BAJA) -> va a Importante (excluir de Urgente)
      if (task.Importancia === TaskImportance.ALTA) {
        return false;
      }

      // Si solo tiene Prioridad ALTA (sin Importancia ALTA) -> va a Urgente
      if (task.Prioridad === TaskPriority.ALTA) {
        return true;
      }

      if (!task.Fecha_Vencimiento) {
        // No due date - include in urgent
        return true;
      }

      // Check if overdue (due date before today)
      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    // Separate urgent tasks (Prioridad ALTA) from other urgent tasks
    const urgentPriorityTasks = urgentTasks.filter(task => task.Prioridad === TaskPriority.ALTA);
    const otherUrgentTasks = urgentTasks.filter(task => task.Prioridad !== TaskPriority.ALTA);

    // Sort urgent priority tasks by creation date (newest first) - NO HIERARCHY
    const sortedUrgentTasks = urgentPriorityTasks.sort((a, b) => 
      new Date(b.Fecha_Creacion).getTime() - new Date(a.Fecha_Creacion).getTime()
    );

    // Sort other urgent tasks by creation date (newest first)
    const sortedOtherTasks = otherUrgentTasks.sort((a, b) => 
      new Date(b.Fecha_Creacion).getTime() - new Date(a.Fecha_Creacion).getTime()
    );

    // Return urgent priority tasks first, then other urgent tasks
    const result = [...sortedUrgentTasks, ...sortedOtherTasks];
    return result;
  };

  // Nueva función para "Importantes" - solo tareas de hoy
  const getTodayTasks = (allTasks: Task[], searchFilter: string = '') => {
    // First filter by current user
    const userTasks = filterTasksForCurrentUser(allTasks);
    
    const today = getCurrentDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all completed task IDs (100% progress)
    const completedTaskIds = new Set(
      userTasks
        .filter(task => isCompleted(task))
        .map(task => task.ID)
    );

    // Return tasks that are due today only, excluding important tasks (they go to urgent)
    return userTasks.filter(task => {
      if (completedTaskIds.has(task.ID)) return false;

      // Apply search filter (check if either searchFilter OR selectedProjectId is set)
      if ((searchFilter || selectedProjectId !== null) && !matchesSearch(task, searchFilter, projects, selectedProjectId)) return false;

      // Si tiene Importancia ALTA y Prioridad ALTA -> va a Urgente (excluir de Importante)
      if (task.Importancia === TaskImportance.ALTA && task.Prioridad === TaskPriority.ALTA) {
        return false;
      }

      // Si tiene Importancia ALTA (con Prioridad MEDIA o BAJA) -> va a Importante
      if (task.Importancia === TaskImportance.ALTA) {
        return true;
      }

      // Si solo tiene Prioridad ALTA (sin Importancia ALTA) -> va a Urgente (excluir de Importante)
      if (task.Prioridad === TaskPriority.ALTA) {
        return false;
      }

      if (!task.Fecha_Vencimiento) {
        // No due date - exclude from today tasks (they go to urgent)
        return false;
      }

      // Check if due today (between start of today and end of today)
      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow;
    });
  };

  // Función para "Programadas" - tareas futuras (sin cambios)
  const getScheduledTasks = (allTasks: Task[], searchFilter: string = '') => {
    // First filter by current user
    const userTasks = filterTasksForCurrentUser(allTasks);
    
    const today = getCurrentDate();

    // Get all completed task IDs (100% progress)
    const completedTaskIds = new Set(
      userTasks
        .filter(task => isCompleted(task))
        .map(task => task.ID)
    );

    // Return tasks that are due in the future (tomorrow or later) and NOT completed, excluding important tasks
    const scheduledTasks = userTasks.filter(task => {
      if (completedTaskIds.has(task.ID)) return false;
      
      // Apply search filter (check if either searchFilter OR selectedProjectId is set)
      if ((searchFilter || selectedProjectId !== null) && !matchesSearch(task, searchFilter, projects, selectedProjectId)) return false;
      
      // Exclude tasks with high priority or high importance (those appear in Urgente/Importantes sections)
      const taskPriority = String(task.Prioridad || '').toLowerCase();
      const taskImportance = String(task.Importancia || '').toLowerCase();
      if (taskPriority === 'alta' || taskImportance === 'alta') {
        return false;
      }
      
      if (!task.Fecha_Vencimiento) return false;

      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      const isScheduled = dueDate > today;
      
      return isScheduled;
    });

    return scheduledTasks;
  };

  const getOverdueTasks = (allTasks: Task[], searchFilter: string = '') => {
    // First filter by current user
    const userTasks = filterTasksForCurrentUser(allTasks);
    
    const today = getCurrentDate();

    // Get all overdue tasks that are NOT completed (due date is before today)
    const overdueTasks = userTasks.filter(task => {
      if (!task.Fecha_Vencimiento) return false;
      if (isCompleted(task)) return false;
      
      // Apply search filter (check if either searchFilter OR selectedProjectId is set)
      if ((searchFilter || selectedProjectId !== null) && !matchesSearch(task, searchFilter, projects, selectedProjectId)) return false;
      
      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      // Only consider overdue if due date is before today
      return dueDate < today;
    });

    // For each overdue task, include only the task and its direct parent
    const hierarchyTasks = new Set<number>();

    for (const overdueTask of overdueTasks) {
      // Add the overdue task itself
      hierarchyTasks.add(overdueTask.ID);

      // If it has a parent, add only the direct parent
      if (overdueTask.Parent_ID && overdueTask.Parent_ID !== 0) {
        hierarchyTasks.add(overdueTask.Parent_ID);
      }
    }

    // Return all tasks in the selected hierarchies
    return userTasks.filter(task => hierarchyTasks.has(task.ID));
  };

  const getCompletedTasks = (allTasks: Task[], searchFilter: string = '') => {
    // First filter by current user
    const userTasks = filterTasksForCurrentUser(allTasks);
    
    return userTasks.filter(task => {
      if (!isCompleted(task)) return false;
      
      // Apply search filter (check if either searchFilter OR selectedProjectId is set)
      if ((searchFilter || selectedProjectId !== null) && !matchesSearch(task, searchFilter, projects, selectedProjectId)) return false;
      
      return true;
    });
  };

  // Build notification list: overdue, due today, due in 1 day, due in 7 days (only current user's tasks)
  const getNotificationTasks = (allTasks: Task[]) => {
    const userTasks = filterTasksForCurrentUser(allTasks);
    const today = getCurrentDate();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const notifications: (Task & { notifyType: 'overdue' | 'today' | 'in_1_day' | 'in_3_days' | 'in_7_days' })[] = [];

    for (const task of userTasks) {
      if (!task.Fecha_Vencimiento) continue;
      if (isCompleted(task)) continue;

      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);

      const diff = Math.round((dueDate.getTime() - today.getTime()) / MS_PER_DAY);

      if (diff < 0) {
        notifications.push({ ...task, notifyType: 'overdue' });
      } else if (diff === 0) {
        notifications.push({ ...task, notifyType: 'today' });
      } else if (diff === 1) {
        notifications.push({ ...task, notifyType: 'in_1_day' });
      } else if (diff === 3) {
        notifications.push({ ...task, notifyType: 'in_3_days' });
      } else if (diff === 7) {
        notifications.push({ ...task, notifyType: 'in_7_days' });
      }
    }

    // Sort: overdue (most overdue first), today, in_1_day, in_7_days
    notifications.sort((a, b) => {
      const order = { overdue: 0, today: 1, in_1_day: 2, in_3_days: 3, in_7_days: 4 } as Record<string, number>;
      if (order[a.notifyType] !== order[b.notifyType]) return order[a.notifyType] - order[b.notifyType];
      // Within same category, sort by due date ascending
      return new Date(a.Fecha_Vencimiento).getTime() - new Date(b.Fecha_Vencimiento).getTime();
    });

    return notifications;
  };

  const currentTasks = useMemo(() => getTodayTasks(tasks, appliedSearchFilter), [tasks, appliedSearchFilter, projects, currentUser, taskAssigneesRecord, selectedProjectId, selectedTaskTypes, showOnlyMyTasks]);
  const urgentTasks = useMemo(() => getUrgentTasks(tasks, appliedSearchFilter), [tasks, appliedSearchFilter, projects, currentUser, taskAssigneesRecord, selectedProjectId, selectedTaskTypes, showOnlyMyTasks]);
  const scheduledTasks = useMemo(() => getScheduledTasks(tasks, appliedSearchFilter), [tasks, appliedSearchFilter, projects, currentUser, taskAssigneesRecord, selectedProjectId, selectedTaskTypes, showOnlyMyTasks]);
  const completedTasks = useMemo(() => getCompletedTasks(tasks, appliedSearchFilter), [tasks, appliedSearchFilter, projects, currentUser, taskAssigneesRecord, selectedProjectId, selectedTaskTypes, showOnlyMyTasks]);
  const notificationTasks = useMemo(() => getNotificationTasks(tasks), [tasks, selectedTaskTypes, showOnlyMyTasks]);

  const scheduledTotalPages = Math.max(1, Math.ceil(scheduledTasks.length / PAGE_SIZE));
  const completedTotalPages = Math.max(1, Math.ceil(completedTasks.length / PAGE_SIZE));

  useEffect(() => {
    if (scheduledPage > scheduledTotalPages) {
      setScheduledPage(1);
    }
  }, [scheduledPage, scheduledTotalPages]);

  useEffect(() => {
    if (completedPage > completedTotalPages) {
      setCompletedPage(1);
    }
  }, [completedPage, completedTotalPages]);

  const pagedScheduledTasks = useMemo(() => {
    const start = (scheduledPage - 1) * PAGE_SIZE;
    return scheduledTasks.slice(start, start + PAGE_SIZE);
  }, [scheduledTasks, scheduledPage]);

  const pagedCompletedTasks = useMemo(() => {
    const start = (completedPage - 1) * PAGE_SIZE;
    return completedTasks.slice(start, start + PAGE_SIZE);
  }, [completedTasks, completedPage]);

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    totalItems: number
  ) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, totalItems);

    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Mostrando {start}-{end} de {totalItems}
        </div>
        <div className="flex flex-wrap gap-2">
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-2 py-1 rounded border text-xs ${page === currentPage ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Global subtask counts map (does NOT depend on section filters)
  const subtaskCounts = useMemo(() => {
    const map: Record<number, { total: number; completed: number }> = {};
    for (const t of tasks) {
      if (t.Parent_ID && t.Parent_ID !== 0) {
        const parentId = Number(t.Parent_ID);
        if (!map[parentId]) map[parentId] = { total: 0, completed: 0 };
        map[parentId].total += 1;
        if (isCompleted(t)) {
          map[parentId].completed += 1;
        }
      }
    }
    return map;
  }, [tasks]);
  
  // Filtered tasks for Gantt view - includes all user tasks with search/project filtering
  const filteredTasks = useMemo(() => {
    const userTasks = filterTasksForCurrentUser(tasks);
    
    if (!appliedSearchFilter && selectedProjectId === null) {
      return userTasks;
    }
    
    return userTasks.filter(task => 
      matchesSearch(task, appliedSearchFilter, projects, selectedProjectId)
    );
  }, [tasks, appliedSearchFilter, projects, currentUser, taskAssigneesRecord, selectedProjectId, selectedTaskTypes]);
  const allTaskIds = useMemo(() => tasks.map(t => t.ID), [tasks]);

  // Counter functions for section titles
  const getTodayTasksCount = (allTasks: Task[]) => {
    const today = getCurrentDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return allTasks.filter(task => {
      if (isCompleted(task)) return false;
      
      // Si tiene Importancia ALTA y Prioridad ALTA -> va a Urgente
      if (task.Importancia === TaskImportance.ALTA && task.Prioridad === TaskPriority.ALTA) return false;
      
      // Si tiene Importancia ALTA (con Prioridad MEDIA o BAJA) -> va a Importante
      if (task.Importancia === TaskImportance.ALTA) return true;
      
      // Si solo tiene Prioridad ALTA -> va a Urgente
      if (task.Prioridad === TaskPriority.ALTA) return false;
      
      if (!task.Fecha_Vencimiento) return false;
      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow;
    }).length;
  };

  const getUrgentTasksCount = (allTasks: Task[]) => {
    const today = getCurrentDate();
    return allTasks.filter(task => {
      if (isCompleted(task)) return false;
      
      // Si tiene Importancia ALTA y Prioridad ALTA -> va a Urgente
      if (task.Importancia === TaskImportance.ALTA && task.Prioridad === TaskPriority.ALTA) return true;
      
      // Si tiene Importancia ALTA (sin Prioridad ALTA) -> va a Importante
      if (task.Importancia === TaskImportance.ALTA) return false;
      
      // Si solo tiene Prioridad ALTA -> va a Urgente
      if (task.Prioridad === TaskPriority.ALTA) return true;
      
      // Sin fecha o atrasada
      if (!task.Fecha_Vencimiento) return true;
      
      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;
  };

  const todayCount = getTodayTasksCount(filterTasksForCurrentUser(tasks).filter(task => matchesSearch(task, appliedSearchFilter, projects, selectedProjectId)));
  const urgentCount = getUrgentTasksCount(filterTasksForCurrentUser(tasks).filter(task => matchesSearch(task, appliedSearchFilter, projects, selectedProjectId)));
  const scheduledCount = scheduledTasks.length;
  const completedCount = completedTasks.length;

  return (
    <div className="min-h-screen font-sans">
      {isAuthenticated === null ? (
        // Loading state while checking authentication
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando...</p>
          </div>
        </div>
      ) : isAuthenticated === false ? (
        // show login/register flow
        showRegister ? (
          <RegisterForm onRegistered={() => setShowRegister(false)} onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onLogin={() => window.location.reload()} onSwitchToRegister={() => setShowRegister(true)} />
        )
      ) : currentPage === 'admin' ? (
        // Show Admin Panel
        <AdminPanel 
          currentUser={currentUser}
          onBackToDashboard={() => setCurrentPage('dashboard')}
        />
      ) : currentPage === 'dashboard' ? (
        // Show Dashboard page
        <Dashboard 
          tasks={tasks}
          projects={projects}
          currentUser={currentUser}
          taskAssigneesRecord={taskAssigneesRecord}
          onBackToTasks={() => setCurrentPage('tasks')}
          onGoToAdmin={() => setCurrentPage('admin')}
          onEditTask={(task) => {
            setEditingTask(task);
            // NO cambiar la página, mantener en dashboard
          }}
        />
      ) : (
        // show main app when authenticated
        <>
          <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-900 p-2 rounded-lg">
                    <Icon name="check" className="w-6 h-6 text-white"/>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Mis Planics</h1>
              </div>
              <div className="flex items-center space-x-2">
            <div className="relative" ref={notificationMenuRef}>
              {/** compute badges */}
              {
                (() => {
                  const hasOverdue = notificationTasks.some(t => t.notifyType === 'overdue');
                  const hasAny = notificationTasks.length > 0;
                  const btnClass = hasOverdue
                    ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400'
                    : hasAny
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100 hover:border-yellow-400'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-800';

                  return (
                    <button
                      onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
                      className={`flex items-center space-x-2 px-3 py-2 sm:px-4 rounded-lg border transition-all duration-200 ${btnClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      aria-label="Notificaciones de tareas"
                    >
                      <Icon name="bell" className="w-4 h-4 sm:w-5 sm:h-5"/>
                      {hasAny && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {notificationTasks.length}
                        </span>
                      )}
                    </button>
                  );
                })()
              }

              {/* Notification Dropdown Menu */}
              {isNotificationMenuOpen && (
                <div className="fixed inset-x-4 top-20 sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:inset-x-auto sm:mt-2 w-auto sm:w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-800">Notificaciones ({notificationTasks.length})</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationTasks.length > 0 ? (
                      notificationTasks.map((task) => (
                        <div
                          key={task.ID}
                          className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setIsNotificationMenuOpen(false);
                            handleSelectTask(task);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{task.Titulo}</p>
                              {task.Descripcion && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.Descripcion}</p>}
                              <div className="flex items-center mt-2 space-x-2">
                                {task.notifyType === 'overdue' && (
                                  <span className="text-xs text-red-600 font-medium">Vencida: {new Date(task.Fecha_Vencimiento!).toLocaleDateString('es-ES')}</span>
                                )}
                                {task.notifyType === 'today' && (
                                  <span className="text-xs text-blue-600 font-medium">Hoy: {new Date(task.Fecha_Vencimiento!).toLocaleDateString('es-ES')}</span>
                                )}
                                {task.notifyType === 'in_1_day' && (
                                  <span className="text-xs text-orange-600 font-medium">Vence en 1 día: {new Date(task.Fecha_Vencimiento!).toLocaleDateString('es-ES')}</span>
                                )}
                                {task.notifyType === 'in_3_days' && (
                                  <span className="text-xs text-amber-600 font-medium">Vence en 3 días: {new Date(task.Fecha_Vencimiento!).toLocaleDateString('es-ES')}</span>
                                )}
                                {task.notifyType === 'in_7_days' && (
                                  <span className="text-xs text-yellow-700 font-medium">Vence en 7 días: {new Date(task.Fecha_Vencimiento!).toLocaleDateString('es-ES')}</span>
                                )}
                                {task.Parent_ID && task.Parent_ID !== 0 && <span className="text-xs text-slate-400">Subtarea</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        <p className="text-sm">¡Excelente! No tienes notificaciones.</p>
                      </div>
                    )}
                  </div>
                  {notificationTasks.some(t => t.notifyType === 'overdue') && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setIsNotificationMenuOpen(false);
                          const overdueSection = document.querySelector('[data-section="overdue"]');
                          if (overdueSection) overdueSection.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver todas las tareas vencidas
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleRefreshTasks}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-white text-slate-600 px-3 py-2 sm:px-4 rounded-lg border border-slate-300 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
              aria-label="Recargar tareas y sesión"
              title="Recargar tareas y sesión"
            >
              <Icon name="refresh" className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`}/>
              <span className="font-medium hidden sm:inline"></span>
            </button>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="flex items-center space-x-2 bg-white text-slate-600 px-3 py-2 sm:px-4 rounded-lg border border-slate-300 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={tasks.length === 0}
              aria-label="Ir al Dashboard"
            >
              <Icon name="chart" className="w-4 h-4 sm:w-5 sm:h-5"/>
              <span className="font-medium hidden sm:inline"></span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-2 sm:px-4 rounded-lg border border-red-300 hover:bg-red-100 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 text-sm sm:text-base"
              aria-label="Cerrar sesión"
            >
              <Icon name="logout" className="w-4 h-4 sm:w-5 sm:h-5"/>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Backdrop overlay when create task is highlighted */}
        {isCreateTaskHighlighted && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setIsCreateTaskHighlighted(false)}
          />
        )}
        
        <section 
          ref={createTaskRef}
          aria-labelledby="create-task-heading" 
          className={`mb-12 transition-all duration-500 ${
            isCreateTaskHighlighted 
              ? 'relative z-50 scale-105 ring-4 ring-blue-500 ring-opacity-75 rounded-xl shadow-2xl' 
              : ''
          }`}
        >
           <h2 id="create-task-heading" className="sr-only">Crear nueva tarea</h2>
           <CreateQuickTask onTaskCreated={handleAddTask} />
        </section>

        {/* View Toggle Section */}
        <section className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setActiveView('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeView === 'list'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Vista de Lista"
              >
                <Icon name="list" className="w-5 h-5" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setActiveView('kanban')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeView === 'kanban'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Vista Kanban"
              >
                <Icon name="kanban" className="w-5 h-5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setActiveView('gantt')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeView === 'gantt'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Vista Gantt"
              >
                <Icon name="gantt" className="w-5 h-5" />
                <span className="hidden sm:inline">Gantt</span>
              </button>
              <button
                onClick={() => setActiveView('matrix')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeView === 'matrix'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Matriz de Eisenhower"
              >
                <Icon name="grid" className="w-5 h-5" />
                <span className="hidden sm:inline">Matriz</span>
              </button>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onBlur={handleSearchBlur}
                  placeholder="Buscar por nombre de tarea o proyecto..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showSearchDropdown && getSearchSuggestions().length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {getSearchSuggestions().map((item, index) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevents blur from firing on desktop
                          handleSearchSelect(item);
                        }}
                        onClick={(e) => {
                          e.preventDefault(); // Fallback for touch devices
                          handleSearchSelect(item);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center">
                          <Icon 
                            name={item.type === 'task' ? 'checkSquare' : 'folder'} 
                            className="w-4 h-4 mr-3 text-slate-500" 
                          />
                          <div>
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-sm text-slate-500 capitalize">{item.type === 'task' ? 'Tarea' : 'Proyecto'}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {/*<button
                  onClick={handleApplySearch}
                  disabled={!searchQuery.trim()}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center"
                >
                  <Icon name="search" className="w-4 h-4 mr-2" />
                  Filtrar
                </button>*/}
                {(appliedSearchFilter || selectedProjectId !== null) && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center"
                  >
                    <Icon name="close" className="w-4 h-4 mr-2" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            {(appliedSearchFilter || selectedProjectId !== null) && (
              <div className="mt-3 flex items-center text-sm text-slate-600">
                <Icon name="filter" className="w-4 h-4 mr-2" />
                Filtrando por: <span className="font-medium ml-1">
                  {selectedProjectId !== null 
                    ? `"${projects.find(p => p.id === selectedProjectId)?.nombre || 'Proyecto'}"` 
                    : `"${appliedSearchFilter}"`}
                </span>
                {selectedProjectId && <span className="ml-1 text-blue-600">(Proyecto)</span>}
              </div>
            )}
            
            {/* Task Type Filters */}
            {taskTypes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-medium text-slate-700">Filtrar por tipo:</span>
                  {visibleTaskTypes.map(type => (
                    <label 
                      key={type.id} 
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTaskTypes.includes(type.id)}
                        onChange={() => handleTaskTypeToggle(type.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        style={{ accentColor: type.color }}
                      />
                      <span 
                        className="text-sm font-medium"
                        style={{ color: type.color }}
                      >
                        {type.nombre.charAt(0).toUpperCase() + type.nombre.slice(1)}
                      </span>
                    </label>
                  ))}

                  <label className="ml-auto flex items-center gap-3 cursor-pointer">
                    <span className="text-sm text-slate-700 select-none">Ver solo mis tareas</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={showOnlyMyTasks}
                        onChange={() => setShowOnlyMyTasks(v => !v)}
                        aria-label="Ver solo mis tareas"
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transform transition-transform"></div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Main Content Area - Conditional Rendering Based on Active View */}
        {activeView === 'list' && (
          <>
            {/* 1. PRIMERO URGENTE - Atrasadas y sin fecha */}
            <section aria-labelledby="urgent-tasks-heading" className="mb-12">
                <button
                  onClick={() => setIsUrgentTasksExpanded(!isUrgentTasksExpanded)}
                  className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 rounded-lg p-2 transition-colors"
                  style={{ 
                    backgroundColor: isUrgentTasksExpanded ? 'var(--color-overdue-bg)' : 'transparent',
                    borderColor: 'var(--color-overdue)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-overdue-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isUrgentTasksExpanded ? 'var(--color-overdue-bg)' : 'transparent'}
                  aria-expanded={isUrgentTasksExpanded ? "true" : "false"}
                  aria-controls="urgent-tasks-content"
                >
                  <h2 id="urgent-tasks-heading" className="text-xl font-semibold" style={{ color: 'var(--color-overdue)' }}>
                    Urgente: {urgentCount}
                  </h2>
                  <Icon
                    name={isUrgentTasksExpanded ? "chevronUp" : "chevronDown"}
                    className="w-5 h-5 transition-transform duration-200"
                    style={{ color: 'var(--color-overdue)' }}
                  />
                </button>
                <div
                  id="urgent-tasks-content"
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isUrgentTasksExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                    <div className={`mt-4 ${isLoading ? 'min-h-[200px]' : ''}`}>
                    {isLoading ? (
                        <TaskSkeleton />
                    ) : urgentTasks.length > 0 ? (
                      <TaskList tasks={urgentTasks} allTasksGlobal={tasks} subtaskCounts={subtaskCounts} projects={projects} taskAssigneesRecord={taskAssigneesRecord} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} onDelete={handleDeleteTask} sectionType="urgent" />
                    ) : (
                      <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                        <p className="text-slate-500">¡Excelente! No hay tareas urgentes.</p>
                      </div>
                    )}
                  </div>
                </div>
            </section>

            {/* 2. IMPORTANTES - Solo tareas de hoy */}
            <section aria-labelledby="today-tasks-heading" className="mb-12">
                <button
                  onClick={() => setIsTodayTasksExpanded(!isTodayTasksExpanded)}
                  className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 rounded-lg p-2 transition-colors"
                  style={{ 
                    backgroundColor: isTodayTasksExpanded ? 'var(--color-in-progress-bg)' : 'transparent',
                    borderColor: 'var(--color-in-progress)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-in-progress-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isTodayTasksExpanded ? 'var(--color-in-progress-bg)' : 'transparent'}
                  aria-expanded={isTodayTasksExpanded ? "true" : "false"}
                  aria-controls="today-tasks-content"
                >
                  <h2 id="today-tasks-heading" className="text-xl font-semibold" style={{ color: 'var(--color-in-progress)' }}>
                    Importantes: {todayCount}
                  </h2>
                  <Icon
                    name={isTodayTasksExpanded ? "chevronUp" : "chevronDown"}
                    className="w-5 h-5 transition-transform duration-200"
                    style={{ color: 'var(--color-in-progress)' }}
                  />
                </button>
                <div
                  id="today-tasks-content"
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isTodayTasksExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                    <div className={`mt-4 ${isLoading ? 'min-h-[200px]' : ''}`}>
                    {isLoading ? (
                        <TaskSkeleton />
                    ) : currentTasks.length > 0 ? (
                      <TaskList tasks={currentTasks} allTasksGlobal={tasks} subtaskCounts={subtaskCounts} projects={projects} taskAssigneesRecord={taskAssigneesRecord} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} onDelete={handleDeleteTask} sectionType="today" />
                    ) : (
                      <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                        <p className="text-slate-500">¡Todo al día! No hay tareas importantes para hoy.</p>
                      </div>
                    )}
                  </div>
                </div>
            </section>

            {/* 3. PROGRAMADAS - Tareas futuras */}
            <section aria-labelledby="scheduled-tasks-heading" className="mb-12">
                <button
                  onClick={() => setIsScheduledTasksExpanded(!isScheduledTasksExpanded)}
                  className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 rounded-lg p-2 transition-colors"
                  style={{ 
                    backgroundColor: isScheduledTasksExpanded ? 'var(--color-proximate-bg)' : 'transparent',
                    borderColor: 'var(--color-proximate)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-proximate-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isScheduledTasksExpanded ? 'var(--color-proximate-bg)' : 'transparent'}
                  aria-expanded={isScheduledTasksExpanded ? "true" : "false"}
                  aria-controls="scheduled-tasks-content"
                >
                  <h2 id="scheduled-tasks-heading" className="text-xl font-semibold" style={{ color: 'var(--color-proximate)' }}>
                    Programadas: {scheduledCount}
                  </h2>
                  <Icon
                    name={isScheduledTasksExpanded ? "chevronUp" : "chevronDown"}
                    className="w-5 h-5 transition-transform duration-200"
                    style={{ color: 'var(--color-proximate)' }}
                  />
                </button>
                <div
                  id="scheduled-tasks-content"
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isScheduledTasksExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                    <div className={`mt-4 ${isLoading ? 'min-h-[200px]' : ''}`}>
                    {isLoading ? (
                        <TaskSkeleton />
                    ) : scheduledTasks.length > 0 ? (
                      <>
                        <TaskList tasks={pagedScheduledTasks} allTasksGlobal={tasks} subtaskCounts={subtaskCounts} projects={projects} taskAssigneesRecord={taskAssigneesRecord} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} onDelete={handleDeleteTask} sectionType="scheduled" />
                        {renderPagination(scheduledPage, scheduledTotalPages, setScheduledPage, scheduledTasks.length)}
                      </>
                    ) : (
                      <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                        <p className="text-slate-500">No hay tareas programadas para el futuro.</p>
                      </div>
                    )}
                  </div>
                </div>
            </section>

            {/* 4. COMPLETADAS */}
            <section aria-labelledby="completed-tasks-heading" className="mb-12">
                <button
                  onClick={() => setIsCompletedTasksExpanded(!isCompletedTasksExpanded)}
                  className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 rounded-lg p-2 transition-colors"
                  style={{ 
                    backgroundColor: isCompletedTasksExpanded ? 'var(--color-completed-bg)' : 'transparent',
                    borderColor: 'var(--color-completed)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-completed-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCompletedTasksExpanded ? 'var(--color-completed-bg)' : 'transparent'}
                  aria-expanded={isCompletedTasksExpanded ? "true" : "false"}
                  aria-controls="completed-tasks-content"
                >
                  <h2 id="completed-tasks-heading" className="text-xl font-semibold" style={{ color: 'var(--color-completed)' }}>
                    Completadas: {completedCount}
                  </h2>
                  <Icon
                    name={isCompletedTasksExpanded ? "chevronUp" : "chevronDown"}
                    className="w-5 h-5 transition-transform duration-200"
                    style={{ color: 'var(--color-completed)' }}
                  />
                </button>
                <div
                  id="completed-tasks-content"
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isCompletedTasksExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                    <div className={`mt-4 ${isLoading ? 'min-h-[200px]' : ''}`}>
                    {isLoading ? (
                        <TaskSkeleton />
                    ) : completedTasks.length > 0 ? (
                      <>
                        <TaskList tasks={pagedCompletedTasks} allTasksGlobal={tasks} subtaskCounts={subtaskCounts} projects={projects} taskAssigneesRecord={taskAssigneesRecord} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} onDelete={handleDeleteTask} sectionType="completed" />
                        {renderPagination(completedPage, completedTotalPages, setCompletedPage, completedTasks.length)}
                      </>
                    ) : (
                      <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                        <p className="text-slate-500">Aún no has completado ninguna tarea.</p>
                      </div>
                    )}
                  </div>
                </div>
            </section>
          </>
        )}

        {/* Kanban View */}
        {activeView === 'kanban' && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="kanban" className="w-6 h-6 text-slate-500" />
                <h3 className="text-lg font-semibold text-slate-700">Vista Kanban</h3>
              </div>
              <KanbanBoard
                tasks={filteredTasks}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onProjectFilterChange={setSelectedProjectId}
                onTaskUpdate={handleGanttTaskUpdate}
                onTaskClick={handleSelectTask}
              />
            </div>
          </section>
        )}

        {/* Gantt View */}
        {activeView === 'gantt' && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                  <Icon name="gantt" className="w-6 h-6 mr-2" />
                  Vista Gantt
                </h3>
                <p className="text-slate-600 mt-1">Visualización temporal de tareas y dependencias</p>
              </div>
              {isLoading ? (
                <div className="p-8">
                  <TaskSkeleton />
                </div>
              ) : (
                <GanttChart 
                  tasks={filteredTasks} 
                  allTasks={tasks}
                  dependencies={dependencies}
                  projects={projects}
                  currentUser={currentUser}
                  taskAssigneesRecord={taskAssigneesRecord}
                  onCreateSubTask={handleCreateSubTask}
                  onDeleteTask={handleDeleteTask}
                  focusedTaskId={ganttFocusedTaskId}
                  onFullscreenChange={(isFullscreen) => {
                    // Opcional: manejar cambios de fullscreen si es necesario
                    console.log('Gantt fullscreen:', isFullscreen);
                  }}
                  onTaskUpdate={handleGanttTaskUpdate}
                  onDependencyCreate={async (pre, suc, tipo) => {
                    try {
                      const created = await createDependency(pre, suc, tipo);
                      setDependencies(prev => [...prev, created]);
                    } catch (err) {
                      console.error('Failed to create dependency:', err);
                    }
                  }}
                  onDependencyDelete={async (depId) => {
                    try {
                      await deleteDependency(depId);
                      setDependencies(prev => prev.filter(d => d.id !== depId));
                    } catch (err) {
                      console.error('Failed to delete dependency:', err);
                    }
                  }}
                  onProjectCreated={handleProjectCreated}
                />
              )}
            </div>
          </section>
        )}

        {/* Matrix View - Eisenhower Matrix */}
        {activeView === 'matrix' && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              {isLoading ? (
                <div className="p-8">
                  <TaskSkeleton />
                </div>
              ) : (
                <EisenhowerMatrix
                  tasks={filteredTasks}
                  projects={projects}
                  taskAssigneesRecord={taskAssigneesRecord}
                  onTaskClick={handleSelectTask}
                  onTaskUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              )}
            </div>
          </section>
        )}
        
      </main>

      {/* Floating Scroll to Top Button */}
      <button
        onClick={handleScrollToCreateTask}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
        aria-label="Crear nueva tarea"
        title="Crear nueva tarea"
      >
        <Icon name="plus" className="w-6 h-6" />
      </button>

      <footer className="text-center py-6 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Planics. All rights reserved. Version 1.0.1</p>
      </footer>
        </>
      )}

      {/* EditTaskModal - Renderizado globalmente para funcionar en Dashboard y Tasks */}
      {editingTask && (
        <div className="fixed inset-0 z-[100]">
          <EditTaskModal 
            task={editingTask} 
            allTasks={tasks}
            projects={projects}
            currentUser={currentUser}
            onProjectCreated={handleProjectCreated}
            onClose={handleCloseModal}
            onSave={async (task) => {
              await handleUpdateTask(task);
              handleCloseModal();
            }}
            onTaskUpdate={handleUpdateTask}
            onGanttFocus={handleGanttFocus}
            onCreateSubtask={handleCreateSubTask}
            onDelete={handleDeleteTask}
            onSubtaskClick={handleSubtaskClick}
            hasNavigationHistory={taskNavigationHistory.length > 0}
          />
        </div>
      )}
    </div>
  );
};

export default App;