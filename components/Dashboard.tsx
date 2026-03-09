import React, { useMemo, useState, useEffect } from 'react';
import { Task, Project, TaskPriority, TaskImportance } from '../types';
import { TaskState } from '../types';
import { Icon } from './Icon';
import { getTasksByUser, getProjectsByUser, getProjectTasksForUser, getAllTaskAssignees } from '../services/apiService';

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  currentUser: { id: number; username: string; email: string; rol_id?: number } | null;
  taskAssigneesRecord: Record<number, {id: number, username: string}[]>;
  onBackToTasks: () => void;
  onEditTask?: (task: Task) => void;
  onGoToAdmin?: () => void;
}

import Settings from './Settings';

export const Dashboard: React.FC<DashboardProps> = ({
  tasks: initialTasks,
  projects: initialProjects,
  currentUser,
  taskAssigneesRecord,
  onBackToTasks,
  onEditTask,
  onGoToAdmin
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMyTasksModalOpen, setIsMyTasksModalOpen] = useState(false);
  const [isAllTasksModalOpen, setIsAllTasksModalOpen] = useState(false);
  const [isOverdueTasksModalOpen, setIsOverdueTasksModalOpen] = useState(false);
  const [isImportantTasksModalOpen, setIsImportantTasksModalOpen] = useState(false);
  const [isScheduledTasksModalOpen, setIsScheduledTasksModalOpen] = useState(false);
  const [isCompletedTasksModalOpen, setIsCompletedTasksModalOpen] = useState(false);
  const [isNoDateTasksModalOpen, setIsNoDateTasksModalOpen] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());
  const [showAllProjects, setShowAllProjects] = useState(false); // Nuevo estado para mostrar todos los proyectos
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Estados para filtros de fecha
  type DateFilterType = '7days' | 'lastMonth' | 'customRange';
  type DateOrderType = 'inicio' | 'fin' | 'creacion' | 'completada';
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilterType>('7days');
  const [dateOrderFilter, setDateOrderFilter] = useState<DateOrderType>('fin'); // Por defecto ordena por fecha fin
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  
  // Estados para el menú de usuarios
  const [availableUsers, setAvailableUsers] = useState<Array<{id: number, username: string, email: string, departamento_nombre: string | null}>>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null | 'department'>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Estado local de tareas y proyectos que se actualizan cuando cambia el usuario seleccionado
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]); // Tareas de todos los proyectos donde estoy asignado
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  
  // Estado local de asignados - se actualiza cuando cambia el usuario seleccionado
  const [localTaskAssigneesRecord, setLocalTaskAssigneesRecord] = useState<Record<number, {id: number, username: string}[]>>(taskAssigneesRecord);

  // Cargar tareas y proyectos cuando cambia el usuario seleccionado
  useEffect(() => {
    const loadDataForUser = async () => {
      if (!selectedUserId) return;
      
      setIsLoadingTasks(true);
      try {
        // Si se selecciona "Todo el Departamento"
        if (selectedUserId === 'department') {
          // Obtener todas las tareas de todos los usuarios disponibles
          const allDepartmentTasks: Task[] = [];
          const allDepartmentProjects: Project[] = [];
          
          for (const user of availableUsers) {
            const [userTasks, userProjects] = await Promise.all([
              getTasksByUser(user.id),
              getProjectsByUser(user.id)
            ]);
            allDepartmentTasks.push(...userTasks);
            allDepartmentProjects.push(...userProjects);
          }
          
          // Eliminar duplicados de proyectos
          const uniqueProjects = allDepartmentProjects.filter((project, index, self) =>
            index === self.findIndex(p => normalizeId(p.id) === normalizeId(project.id))
          );
          
          // Eliminar duplicados de tareas
          const uniqueTasks = allDepartmentTasks.filter((task, index, self) =>
            index === self.findIndex(t => normalizeId(t.ID) === normalizeId(task.ID))
          );
          
          
          
          setTasks(uniqueTasks);
          setProjects(uniqueProjects);
          
          // Cargar asignados
          if (uniqueTasks.length > 0) {
            const taskIds = uniqueTasks.map(t => t.ID);
            const assigneesData = await getAllTaskAssignees(taskIds);
            setLocalTaskAssigneesRecord(assigneesData);
          } else {
            setLocalTaskAssigneesRecord({});
          }
          
          setProjectTasks([]);
        } else {
          // Caso normal: usuario específico
          const isCurrentUser = currentUser && normalizeId(selectedUserId) === normalizeId(currentUser.id);
          
          // Cargar tareas del usuario y proyectos en paralelo
          const [userTasks, userProjects] = await Promise.all([
            getTasksByUser(selectedUserId),
            getProjectsByUser(selectedUserId)
          ]);
          
          console.log('Loaded tasks for user', selectedUserId, ':', userTasks.length, 'tasks');
          console.log('Loaded projects for user', selectedUserId, ':', userProjects.length, 'projects');
          
          setTasks(userTasks);
          setProjects(userProjects);
          
          // Cargar los asignados de las tareas del usuario seleccionado
          if (userTasks.length > 0) {
            const taskIds = userTasks.map(t => t.ID);
            const assigneesData = await getAllTaskAssignees(taskIds);
            console.log('Loaded task assignees for user', selectedUserId, ':', Object.keys(assigneesData).length, 'tasks with assignees');
            setLocalTaskAssigneesRecord(assigneesData);
          } else {
            setLocalTaskAssigneesRecord({});
          }
          
          // Si es el usuario actual, también cargar todas las tareas de sus proyectos
          if (isCurrentUser) {
            const allProjectTasks = await getProjectTasksForUser();
            console.log('Loaded all project tasks:', allProjectTasks.length, 'tasks');
            setProjectTasks(allProjectTasks);
          } else {
            setProjectTasks([]);
          }
        }
      } catch (error) {
        console.error('Error loading data for user:', error);
        // Si hay error, usar los datos iniciales
        setTasks(initialTasks);
        setProjects(initialProjects);
        setProjectTasks([]);
        setLocalTaskAssigneesRecord(taskAssigneesRecord);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    
    loadDataForUser();
  }, [selectedUserId, currentUser, availableUsers]);

  // Cargar usuarios disponibles según permisos
  useEffect(() => {
    const loadAvailableUsers = async () => {
      if (!currentUser) return;
      
      try {
        const response = await fetch('/api/getUsersByDepartment.php', {
          credentials: 'include'
        });
        const data = await response.json();
        if (!data.error) {
          setAvailableUsers(data);
        }
      } catch (error) {
        console.error('Error loading available users:', error);
      }
    };
    
    loadAvailableUsers();
  }, [currentUser]);

  // Establecer el usuario actual como seleccionado por defecto cuando currentUser cambie
  useEffect(() => {
    if (currentUser && !selectedUserId) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser]);

  // Inicializar fechas del rango personalizado con el mes actual
  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setCustomStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setCustomEndDate(lastDayOfMonth.toISOString().split('T')[0]);
  }, []);

  // Función para obtener el rango de fechas según el filtro activo
  const getDateRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    if (activeDateFilter === '7days') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      return { startDate, endDate: now };
    }
    
    if (activeDateFilter === 'lastMonth') {
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }
    
    // customRange - usar fechas seleccionadas o mes actual
    const startDate = customStartDate 
      ? new Date(customStartDate + 'T00:00:00') 
      : new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = customEndDate 
      ? new Date(customEndDate + 'T23:59:59.999') 
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  };

  // Función para filtrar tareas por el rango de fechas activo
  const filterTasksByDateRange = (tasksToFilter: Task[]): Task[] => {
    const { startDate, endDate } = getDateRange();
    
    return tasksToFilter.filter(task => {
      // Usar el campo de fecha según el filtro activo
      let taskDateString: string | null = null;
      
      if (dateOrderFilter === 'inicio') {
        taskDateString = task.Fecha_Inicio;
      } else if (dateOrderFilter === 'fin') {
        taskDateString = task.Fecha_Vencimiento;
      } else if (dateOrderFilter === 'creacion') {
        taskDateString = task.Fecha_Creacion;
      } else if (dateOrderFilter === 'completada') {
        taskDateString = task.Fecha_Completada;
      }
      
      // Si no tiene fecha, se incluye
      if (!taskDateString) return true;
      
      const taskDate = new Date(taskDateString);
      taskDate.setHours(12, 0, 0, 0); // Normalizar a mediodía para evitar problemas de timezone
      
      return taskDate >= startDate && taskDate <= endDate;
    });
  };

  // Tareas filtradas por el rango de fechas activo
  const filteredTasks = useMemo(() => {
    return filterTasksByDateRange(tasks);
  }, [tasks, activeDateFilter, dateOrderFilter, customStartDate, customEndDate]);

  const handleUserSelect = (userId: number | 'department') => {
    setSelectedUserId(userId);
    setIsUserMenuOpen(false);
  };

  const handleDepartmentSelect = () => {
    setSelectedUserId('department');
    setIsUserMenuOpen(false);
  };

  const getSelectedUserName = () => {
    if (!selectedUserId) return currentUser?.username || 'Usuario';
    if (selectedUserId === 'department') return 'Todo el Departamento';
    const user = availableUsers.find(u => u.id === selectedUserId);
    if (!user) return currentUser?.username || 'Usuario';
    
    // Formato: "Nombre - Departamento" o solo "Nombre" si no tiene departamento
    return user.departamento_nombre 
      ? `${user.username} - ${user.departamento_nombre}`
      : user.username;
  };

  const getSelectedUserInitials = () => {
    if (!selectedUserId) {
      const name = currentUser?.username || '';
      return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
    }

    const user = availableUsers.find(u => u.id === selectedUserId);
    const name = user?.username || currentUser?.username || '';
    return name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  };

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isUserMenuOpen && !target.closest('.relative')) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Cerrar el dropdown de fechas cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isCustomRangeOpen && !target.closest('.date-range-dropdown')) {
        setIsCustomRangeOpen(false);
      }
    };

    if (isCustomRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomRangeOpen]);

  // Expandir todas las tareas cuando se abre un modal
  useEffect(() => {
    if (isProjectModalOpen && selectedProjectId) {
      const { rootTasks, buildHierarchy } = getProjectTasksHierarchy(selectedProjectId);
      const allTaskIds = new Set<number>();
      
      const collectAllTaskIds = (task: Task) => {
        allTaskIds.add(task.ID);
        const children = buildHierarchy(task.ID);
        children.forEach(child => collectAllTaskIds(child));
      };
      
      rootTasks.forEach(task => collectAllTaskIds(task));
      setExpandedTaskIds(allTaskIds);
    }
  }, [isProjectModalOpen, selectedProjectId, tasks]);

  // Expandir todas las tareas del usuario cuando se abre el modal de "Mis Tareas"
  useEffect(() => {
    if (isMyTasksModalOpen && currentUser) {
      const myTasks = filteredTasks.filter(t => isTaskAssignedToUser(t, false));
      const allTaskIds = new Set<number>();
      
      const buildMyTasksHierarchy = (parentId: number): Task[] => {
        return myTasks
          .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
          .sort((a, b) => a.ID - b.ID);
      };
      
      const collectAllTaskIds = (task: Task) => {
        allTaskIds.add(task.ID);
        const children = buildMyTasksHierarchy(task.ID);
        children.forEach(child => collectAllTaskIds(child));
      };
      
      myTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0).forEach(task => collectAllTaskIds(task));
      setExpandedTaskIds(allTaskIds);
    }
  }, [isMyTasksModalOpen, currentUser, filteredTasks, localTaskAssigneesRecord]);

  // Expandir todas las tareas del usuario seleccionado cuando se abre el modal de "Total de Tareas"
  useEffect(() => {
    if (isAllTasksModalOpen && selectedUserId) {
      // Las tareas ya están filtradas por el usuario seleccionado y por fecha
      const userTasks = filteredTasks;
      const allTaskIds = new Set<number>();
      
      const buildUserTasksHierarchy = (parentId: number): Task[] => {
        return userTasks
          .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
          .sort((a, b) => a.ID - b.ID);
      };
      
      const collectAllTaskIds = (task: Task) => {
        allTaskIds.add(task.ID);
        const children = buildUserTasksHierarchy(task.ID);
        children.forEach(child => collectAllTaskIds(child));
      };
      
      userTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0).forEach(task => collectAllTaskIds(task));
      setExpandedTaskIds(allTaskIds);
    }
  }, [isAllTasksModalOpen, selectedUserId, filteredTasks, localTaskAssigneesRecord]);

  // Expandir todas las tareas atrasadas cuando se abre el modal
  useEffect(() => {
    if (isOverdueTasksModalOpen) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueTasks = filteredTasks.filter(t => {
        if (t.Estado === TaskState.COMPLETADA) return false;
        if (!t.Fecha_Vencimiento) return false;
        const dueDate = new Date(t.Fecha_Vencimiento);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });
      
      const allTaskIds = new Set<number>();
      const buildHierarchy = (parentId: number): Task[] => {
        return overdueTasks.filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId)).sort((a, b) => a.ID - b.ID);
      };
      
      const collectAllTaskIds = (task: Task) => {
        allTaskIds.add(task.ID);
        buildHierarchy(task.ID).forEach(child => collectAllTaskIds(child));
      };
      
      overdueTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0).forEach(task => collectAllTaskIds(task));
      setExpandedTaskIds(allTaskIds);
    }
  }, [isOverdueTasksModalOpen, filteredTasks]);

  // Expandir todas las tareas importantes cuando se abre el modal
  useEffect(() => {
    if (isImportantTasksModalOpen) {
      const importantTasks = filteredTasks.filter(t => {
        if (t.Estado === TaskState.COMPLETADA) return false;
        return t.Importancia === TaskImportance.ALTA || t.Prioridad === TaskPriority.ALTA;
      });
      const allTaskIds = new Set<number>();
      const buildHierarchy = (parentId: number): Task[] => {
        return importantTasks.filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId)).sort((a, b) => a.ID - b.ID);
      };
      
      const collectAllTaskIds = (task: Task) => {
        allTaskIds.add(task.ID);
        buildHierarchy(task.ID).forEach(child => collectAllTaskIds(child));
      };
      
      importantTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0).forEach(task => collectAllTaskIds(task));
      setExpandedTaskIds(allTaskIds);
    }
  }, [isImportantTasksModalOpen, filteredTasks]);

  // Expandir todas las tareas programadas cuando se abre el modal
  useEffect(() => {
    if (isScheduledTasksModalOpen) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scheduledTasks = filteredTasks.filter(t => {
        if (t.Estado === TaskState.COMPLETADA) return false;
        if (!t.Fecha_Vencimiento) return false;
        const dueDate = new Date(t.Fecha_Vencimiento);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
      });
      
      const allTaskIds = new Set<number>();
      const buildHierarchy = (parentId: number): Task[] => {
        return scheduledTasks.filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId)).sort((a, b) => a.ID - b.ID);
      };
      
      const collectAllTaskIds = (task: Task) => {
        allTaskIds.add(task.ID);
        buildHierarchy(task.ID).forEach(child => collectAllTaskIds(child));
      };
      
      scheduledTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0).forEach(task => collectAllTaskIds(task));
      setExpandedTaskIds(allTaskIds);
    }
  }, [isScheduledTasksModalOpen, filteredTasks]);

  // Expandir todas las tareas completadas cuando se abre el modal
  useEffect(() => {
    if (isCompletedTasksModalOpen) {
      const completedTasks = filteredTasks.filter(t => t.Estado === TaskState.COMPLETADA || t.Porcentaje_Avance >= 100);
      const allTaskIds = new Set<number>();
      const buildHierarchy = (parentId: number): Task[] => {
        return completedTasks.filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId)).sort((a, b) => a.ID - b.ID);
      };
      
      const collectAllTaskIds = (task: Task) => {
        allTaskIds.add(task.ID);
        buildHierarchy(task.ID).forEach(child => collectAllTaskIds(child));
      };
      
      completedTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0).forEach(task => collectAllTaskIds(task));
      setExpandedTaskIds(allTaskIds);
    }
  }, [isCompletedTasksModalOpen, filteredTasks]);

  // Expandir todas las tareas sin fecha cuando se abre el modal
  useEffect(() => {
    if (isNoDateTasksModalOpen) {
      const noDateTasks = filteredTasks.filter(t => !t.Fecha_Vencimiento && t.Estado !== TaskState.COMPLETADA);
      const allTaskIds = new Set<number>();
      const buildHierarchy = (parentId: number): Task[] => {
        return noDateTasks.filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId)).sort((a, b) => a.ID - b.ID);
      };
      
      const collectAllTaskIds = (task: Task) => {
        allTaskIds.add(task.ID);
        buildHierarchy(task.ID).forEach(child => collectAllTaskIds(child));
      };
      
      noDateTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0).forEach(task => collectAllTaskIds(task));
      setExpandedTaskIds(allTaskIds);
    }
  }, [isNoDateTasksModalOpen, filteredTasks]);


  // Helper function to normalize IDs for comparison
  const normalizeId = (id: any): number => parseInt(String(id));

  // Helper function to check if a task is ONLY assigned to a user (NOT created by them)
  const isTaskAssignedToUserOnly = (task: Task, userId: number | 'department'): boolean => {
    // Si es vista de departamento, incluir todas las tareas asignadas
    if (userId === 'department') return true;
    
    // NO incluir tareas que el usuario creó
    if (normalizeId(task.Usuario_Creador_ID) === normalizeId(userId)) return false;
    // Solo tareas asignadas al usuario
    const assignees = localTaskAssigneesRecord[task.ID] || [];
    return assignees.some(assignee => normalizeId(assignee.id) === normalizeId(userId));
  };

  // Helper function to check if a task belongs to the selected user (creadas O asignadas)
  const isTaskForSelectedUser = (task: Task, userId: number | 'department'): boolean => {
    // Si es vista de departamento, incluir todas las tareas
    if (userId === 'department') return true;
    
    const normalizedUserId = normalizeId(userId);
    const normalizedCreatorId = normalizeId(task.Usuario_Creador_ID);
    
    // Tareas creadas por el usuario
    if (normalizedCreatorId === normalizedUserId) return true;
    
    // Tareas asignadas al usuario
    const assignees = localTaskAssigneesRecord[task.ID] || [];
    const isAssigned = assignees.some(assignee => {
      const normalizedAssigneeId = normalizeId(assignee.id);
      return normalizedAssigneeId === normalizedUserId;
    });
    
    return isAssigned;
  };

  // Helper function to check if a task is assigned to the current user (excluding tasks they created)
  const isTaskAssignedToUser = (task: Task, excludeCompleted: boolean = false): boolean => {
    if (!currentUser) return false;
    // Excluir tareas que el usuario creó
    if (normalizeId(task.Usuario_Creador_ID) === normalizeId(currentUser.id)) return false;
    // Excluir tareas completadas si se especifica
    if (excludeCompleted && (task.Estado === TaskState.COMPLETADA || task.Porcentaje_Avance >= 100)) return false;
    const assignees = localTaskAssigneesRecord[task.ID] || [];
    return assignees.some(assignee => normalizeId(assignee.id) === normalizeId(currentUser.id));
  };

  // Calcular métricas para el usuario seleccionado
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Usar las tareas filtradas por fecha para todas las métricas
    const userOwnTasks = filteredTasks;

    // Total de tareas - SOLO tareas propias
    const totalTasks = userOwnTasks.length;

    // Tareas por estado - SOLO tareas propias
    const completedTasks = userOwnTasks.filter(t => t.Estado === TaskState.COMPLETADA || t.Porcentaje_Avance >= 100).length;
    const inProgressTasks = userOwnTasks.filter(t => t.Estado === TaskState.EN_PROGRESO && t.Porcentaje_Avance < 100).length;
    const pendingTasks = userOwnTasks.filter(t => t.Estado === TaskState.PENDIENTE).length;

    // Tareas urgentes (atrasadas y no completadas) - SOLO tareas propias
    const urgentTasks = userOwnTasks.filter(t => {
      if (t.Estado === TaskState.COMPLETADA) return false;
      if (!t.Fecha_Vencimiento) return false;
      const dueDate = new Date(t.Fecha_Vencimiento);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;
    
    const importantTasks = userOwnTasks.filter(t => {
      if (t.Estado === TaskState.COMPLETADA) return false;
      return t.Importancia === TaskImportance.ALTA || t.Prioridad === TaskPriority.ALTA;
    }).length;

    // Tareas sin fecha - SOLO tareas propias
    const tasksWithoutDate = userOwnTasks.filter(t => 
      !t.Fecha_Vencimiento && 
      t.Estado !== TaskState.COMPLETADA
    ).length;

    // Tareas por proyecto - usar filteredTasks también
    // EXCEPCIÓN: Proyecto General (id=1) solo cuenta tareas propias, no todas las del proyecto
    const filteredProjectTasks = filterTasksByDateRange(projectTasks);
    const tasksForProjectCalculation = filteredProjectTasks.length > 0 ? filteredProjectTasks : filteredTasks;
    
    const tasksByProject = projects.map(project => {
      const projectId = normalizeId(project.id);
      const isGeneralProject = projectId === 1;
      
      // Para proyecto General, usar solo filteredTasks (tareas propias)
      // Para otros proyectos, usar tasksForProjectCalculation (todas las tareas si estoy asignado)
      const sourceTasksForProject = isGeneralProject ? filteredTasks : tasksForProjectCalculation;
      const filteredProjectTasks = sourceTasksForProject.filter(t => normalizeId(t.Proyecto) === projectId);
      
      return {
        id: project.id,
        name: project.nombre,
        count: filteredProjectTasks.length,
        completed: filteredProjectTasks.filter(t => 
          t.Estado === TaskState.COMPLETADA || t.Porcentaje_Avance >= 100
        ).length
      };
    }).filter(p => p.count > 0).sort((a, b) => b.count - a.count);
    
    // Top 5 o todos los proyectos según el estado
    const displayedProjects = showAllProjects ? tasksByProject : tasksByProject.slice(0, 5);

    // Progreso general
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tareas programadas (con fecha pero no vencidas) - SOLO tareas propias
    const scheduledTasks = userOwnTasks.filter(t => {
      if (t.Estado === TaskState.COMPLETADA) return false;
      if (!t.Fecha_Vencimiento) return false;
      const dueDate = new Date(t.Fecha_Vencimiento);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today;
    }).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      urgentTasks,
      importantTasks,
      tasksWithoutDate,
      tasksByProject: displayedProjects,
      allProjects: tasksByProject, // Lista completa para saber si hay más de 5
      progressPercentage,
      scheduledTasks
    };
  }, [filteredTasks, projects, projectTasks, showAllProjects, activeDateFilter, customStartDate, customEndDate]);

  // Obtener tareas de un proyecto específico en jerarquía
  const getProjectTasksHierarchy = (projectId: number) => {
    // 1. Determinar la fuente de tareas
    const isGeneralProject = normalizeId(projectId) === 1;
    let sourceTasks: Task[] = [];
    
    if (isGeneralProject) {
      sourceTasks = tasks.filter(t => normalizeId(t.Proyecto) === normalizeId(projectId));
    } else if (currentUser && selectedUserId && normalizeId(selectedUserId) === normalizeId(currentUser.id)) {
      sourceTasks = projectTasks.filter(t => normalizeId(t.Proyecto) === normalizeId(projectId));
    } else {
      sourceTasks = tasks.filter(t => normalizeId(t.Proyecto) === normalizeId(projectId));
    }

    // 2. Filtrar para mostrar la jerarquía completa de las tareas relevantes
    let filteredProjectTasks = sourceTasks;

    // Solo aplicar filtro de jerarquía si estamos usando la lista completa (projectTasks) 
    // y no es el proyecto general.
    if (!isGeneralProject && currentUser && selectedUserId && normalizeId(selectedUserId) === normalizeId(currentUser.id)) {
      const taskMap = new Map<number, Task>();
      sourceTasks.forEach(t => taskMap.set(t.ID, t));

      // Identificar tareas donde el usuario está involucrado (asignado o creador)
      const userRelevantTaskIds = sourceTasks
        .filter(t => isTaskAssignedToUser(t, false) || normalizeId(t.Usuario_Creador_ID) === normalizeId(currentUser.id))
        .map(t => t.ID);

      // Encontrar los Roots de estas tareas
      const relevantRootIds = new Set<number>();
      
      const findRootId = (taskId: number, visited = new Set<number>()): number => {
        if (visited.has(taskId)) return taskId;
        visited.add(taskId);
        
        const task = taskMap.get(taskId);
        if (!task) return taskId;
        if (!task.Parent_ID || task.Parent_ID === 0) return task.ID;
        
        if (!taskMap.has(task.Parent_ID)) return task.ID;
        
        return findRootId(task.Parent_ID, visited);
      };

      userRelevantTaskIds.forEach(tid => {
        relevantRootIds.add(findRootId(tid));
      });

      // Filtrar tareas: mantener si su Root está en relevantRootIds
      filteredProjectTasks = sourceTasks.filter(t => {
        const rootId = findRootId(t.ID);
        return relevantRootIds.has(rootId);
      });
    }

    // Encontrar tareas raíz (Parent_ID = 0 o null)
    const rootTasks = filteredProjectTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);

    // Función recursiva para construir la jerarquía
    const buildHierarchy = (parentId: number): Task[] => {
      return filteredProjectTasks
        .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
        .sort((a, b) => a.ID - b.ID);
    };

    return { rootTasks, buildHierarchy, totalTasks: filteredProjectTasks.length };
  };

  // Toggle de expansión de tareas
  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Renderizar tarea con sus subtareas
  const renderTaskWithChildren = (task: Task, buildHierarchy: (id: number) => Task[], level: number = 0) => {
    const children = buildHierarchy(task.ID);
    const hasChildren = children.length > 0;
    const isExpanded = expandedTaskIds.has(task.ID);
    
    // Obtener información del creador
    const creator = availableUsers.find(u => normalizeId(u.id) === normalizeId(task.Usuario_Creador_ID));
    const creatorName = creator?.username || 'Desconocido';
    
    // Obtener asignados
    const assignees = (localTaskAssigneesRecord[normalizeId(task.ID)] || [])
      .map(a => a.username)
      .join(', ');

    return (
      <div key={task.ID}>
        <div
          className="flex items-center py-2 px-3 hover:bg-slate-50 cursor-pointer transition-colors rounded-md group"
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {/* Chevron para expandir/contraer */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskExpansion(task.ID);
              }}
              className="mr-2 flex-shrink-0 hover:bg-slate-200 rounded p-0.5 transition-colors"
            >
              <Icon 
                name={isExpanded ? "chevronDown" : "chevron-right"} 
                className="w-4 h-4 text-slate-400 transition-transform" 
              />
            </button>
          )}
          
          {/* Contenido de la tarea */}
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              onEditTask && onEditTask(task);
            }}
            className="flex-1 flex items-center justify-between min-w-0 gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400">#{task.ID}</span>
                <span className="text-sm text-slate-700 truncate flex-1">{task.Titulo}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Icon name="user" className="w-3 h-3" />
                  {assignees ? `Asignada a: ${assignees}` : `Creada por: ${creatorName}`}
                </span>
                {task.Fecha_Vencimiento && (
                  <span className="flex items-center gap-1">
                    <Icon name="calendar" className="w-3 h-3" />
                    {new Date(task.Fecha_Vencimiento + 'T12:00:00').toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {task.Estado === TaskState.COMPLETADA ? (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">✓ Completada</span>
              ) : task.Estado === TaskState.EN_PROGRESO ? (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">En Progreso</span>
              ) : task.Estado === TaskState.EN_ESPERA ? (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded whitespace-nowrap">En Espera</span>
              ) : (
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded whitespace-nowrap">Pendiente</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Subtareas (solo si está expandido) */}
        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderTaskWithChildren(child, buildHierarchy, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Función para exportar tareas a Excel (CSV)
  const handleExportToExcel = () => {
    const tasksToExport = filteredTasks;
    
    if (tasksToExport.length === 0) {
      alert('No hay tareas para exportar');
      return;
    }

    // Preparar datos para CSV
    const rows = tasksToExport.map(task => {
      const project = projects.find(p => normalizeId(p.id) === normalizeId(task.Proyecto));
      const assignees = (localTaskAssigneesRecord[normalizeId(task.ID)] || [])
        .map(a => a.username)
        .join('; ');
      
      // Obtener nombre del creador (si está disponible en task.asignado_a_username o buscar en availableUsers)
      const creator = availableUsers.find(u => normalizeId(u.id) === normalizeId(task.Usuario_Creador_ID));
      
      return {
        Proyecto: project?.nombre || task.proyecto_nombre || 'Sin proyecto',
        'Creador': creator?.username || `Usuario ${task.Usuario_Creador_ID}`,
        'Nombre de la tarea': task.Titulo || '',
        'Fecha inicio': task.Fecha_Inicio || '',
        'Fecha fin': task.Fecha_Vencimiento || '',
        'Fecha completada': task.Fecha_Completada || '',
        'Asignado/s': assignees || 'Sin asignar',
        Estado: task.Estado || '',
        'Prioridad/Urgencia': task.Importancia || task.Prioridad || 'Normal'
      };
    });

    // Generar CSV
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          const value = String(row[header as keyof typeof row] || '');
          // Escapar comillas y envolver en comillas si contiene coma o comilla
          return value.includes(',') || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Crear y descargar archivo
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tareas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 z-10">
              <button
                onClick={onBackToTasks}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
                title="Volver a Tareas"
              >
                <Icon name="arrow-left" className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Volver a Tareas</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-slate-500 hover:text-slate-700 p-1 rounded"
                  title="Configuración"
                >
                  <Icon name="settings" className="w-5 h-5" />
                </button>
              </div>
              
              {/* Botón Admin - Solo visible para admins */}
              {currentUser && parseInt(String(currentUser.rol_id)) === 2 && onGoToAdmin && (
                <>
                  <div className="h-6 w-px bg-slate-300"></div>
                  <button
                    onClick={onGoToAdmin}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                    title="Panel de Administración"
                  >
                    <Icon name="settings" className="w-5 h-5" />
                    <span className="font-medium hidden sm:inline">Admin</span>
                  </button>
                </>
              )}
            </div>
              {currentUser && (
              <div className="relative z-10">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors max-w-[180px] sm:max-w-full"
                >
                  <Icon name="user" className="w-4 h-4" />
                  {/* Truncate name on small screens so header doesn't overflow */}
                  <span className="truncate hidden xs:inline-block sm:inline-block md:inline">{getSelectedUserName()}</span>
                  <span className="sm:hidden text-xs text-slate-500">{getSelectedUserInitials ? getSelectedUserInitials() : ''}</span>
                  <Icon name="chevron-down" className="w-4 h-4" />
                </button>
                
                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-[70vh] overflow-y-auto">
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Usuarios disponibles
                      </div>
                      {availableUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleUserSelect(user.id)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                            normalizeId(selectedUserId) === normalizeId(user.id)
                              ? 'bg-purple-50 text-purple-700'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon name="user" className="w-4 h-4" />
                            <div className="flex-1">
                              <div className="font-medium">{user.username}</div>
                              {user.departamento_nombre && (
                                <div className="text-xs text-slate-500">{user.departamento_nombre}</div>
                              )}
                            </div>
                            {normalizeId(selectedUserId) === normalizeId(user.id) && (
                              <Icon name="check" className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                        </button>
                      ))}
                      
                      {/* Separador */}
                      <div className="my-2 border-t border-slate-200"></div>
                      
                      {/* Opción: Todo el Departamento */}
                      <button
                        onClick={handleDepartmentSelect}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedUserId === 'department'
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon name="users" className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="font-medium">Todo el Departamento</div>
                            <div className="text-xs text-slate-500">Ver todas las tareas del departamento</div>
                          </div>
                          {selectedUserId === 'department' && (
                            <Icon name="check" className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </header>

      {/* Main Content */}
      {!isSettingsOpen && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros de Fecha */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          {/* Switch de orden de fecha y filtros en una sola fila responsive */}
          <div className="mb-4 pb-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <span className="text-sm font-medium text-slate-600 block mb-2">Orden de filtro en fechas:</span>
                <div className="inline-flex rounded-lg border border-slate-300 p-1 bg-slate-50 w-full sm:w-auto">
                  <button
                    onClick={() => setDateOrderFilter('inicio')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                      dateOrderFilter === 'inicio'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Inicio
                  </button>
                  <button
                    onClick={() => setDateOrderFilter('fin')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                      dateOrderFilter === 'fin'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Fin
                  </button>
                  <button
                    onClick={() => setDateOrderFilter('creacion')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                      dateOrderFilter === 'creacion'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Creación
                  </button>
                  <button
                    onClick={() => setDateOrderFilter('completada')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                      dateOrderFilter === 'completada'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Completada
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                <span className="text-sm font-medium text-slate-600">Filtrar por fecha:</span>

                <button
                  onClick={() => setActiveDateFilter('7days')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeDateFilter === '7days'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="calendar" className="w-4 h-4" />
                    <span>Últimos 7 días</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveDateFilter('lastMonth')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeDateFilter === 'lastMonth'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="calendar" className="w-4 h-4" />
                    <span>Mes Anterior</span>
                  </div>
                </button>

                <div className="relative date-range-dropdown">
                  <button
                    onClick={() => {
                      setActiveDateFilter('customRange');
                      setIsCustomRangeOpen(!isCustomRangeOpen);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeDateFilter === 'customRange'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="calendar" className="w-4 h-4" />
                      <span>Rango Personalizado</span>
                      <Icon name="chevron-down" className="w-4 h-4" />
                    </div>
                  </button>

                  {isCustomRangeOpen && activeDateFilter === 'customRange' && (
                    <div className="absolute top-full left-2 right-2 sm:left-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50 sm:min-w-[280px] w-[calc(100%-32px)] sm:w-auto">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Fecha inicio</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Fecha fin</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => setIsCustomRangeOpen(false)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-auto text-xs text-slate-500 mt-2 sm:mt-0">
                  {activeDateFilter === '7days' && (
                    <span>Mostrando: {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')} - {new Date().toLocaleDateString('es-ES')}</span>
                  )}
                  {activeDateFilter === 'lastMonth' && (() => {
                    const now = new Date();
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                    return <span>Mostrando: {lastMonth.toLocaleDateString('es-ES')} - {lastDayOfLastMonth.toLocaleDateString('es-ES')}</span>;
                  })()}
                  {activeDateFilter === 'customRange' && (
                    <span>
                      Mostrando: {customStartDate ? new Date(customStartDate + 'T12:00:00').toLocaleDateString('es-ES') : 'Inicio del mes'} - {customEndDate ? new Date(customEndDate + 'T12:00:00').toLocaleDateString('es-ES') : 'Fin del mes'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total de Tareas - Clickable */}
          <div 
            onClick={() => currentUser && setIsAllTasksModalOpen(true)}
            className={`bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 transition-all ${currentUser ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Tareas</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{metrics.totalTasks}</p>
                {currentUser && (
                  <p className="text-xs text-blue-600 mt-1">Haz clic para ver todas</p>
                )}
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Icon name="list" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Importantes - Clickable */}
          <div 
            onClick={() => setIsImportantTasksModalOpen(true)}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Importantes</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{metrics.importantTasks}</p>
                <p className="text-xs text-yellow-600 mt-1">Alta prioridad</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Icon name="star" className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Segunda fila de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Tareas Urgentes (Atrasadas) - Clickable */}
          <div 
            onClick={() => setIsOverdueTasksModalOpen(true)}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{metrics.urgentTasks}</p>
                <p className="text-xs text-red-600 mt-1">Vencidas</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Icon name="alert" className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          {/* Tareas Sin Fecha - Clickable */}
          <div 
            onClick={() => setIsNoDateTasksModalOpen(true)}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sin Fecha</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{metrics.tasksWithoutDate}</p>
                <p className="text-xs text-orange-600 mt-1">Sin programar</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Icon name="clock" className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Tareas Completadas - Clickable */}
          <div 
            onClick={() => setIsCompletedTasksModalOpen(true)}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{metrics.completedTasks}</p>
                <p className="text-xs text-green-600 mt-1">{metrics.progressPercentage}% del total</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Icon name="check" className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Programadas - Clickable */}
          <div 
            onClick={() => setIsScheduledTasksModalOpen(true)}
            className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pendientes</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{metrics.scheduledTasks}</p>
                <p className="text-xs text-purple-600 mt-1">Con fecha futura</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Icon name="calendar" className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Pendientes (oculto - comentado) */}
          <div className="hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pendientes</p>
                <p className="text-2xl font-bold text-slate-600 mt-2">{metrics.pendingTasks}</p>
              </div>
              <Icon name="list" className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Gráficas y detalles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Progreso General - OCULTO */}
          <div className="hidden bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Progreso General</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Completadas</span>
                  <span className="font-medium text-green-600">{metrics.completedTasks} / {metrics.totalTasks}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Pendientes</span>
                  <span className="font-medium text-slate-700">{metrics.totalTasks - metrics.completedTasks}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-slate-400 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${100 - metrics.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tareas del Usuario Seleccionado - OCULTO */}
          {currentUser && selectedUserId && (
            <div 
              onClick={() => metrics.totalTasks > 0 && setIsAllTasksModalOpen(true)}
              className={`hidden bg-white rounded-lg shadow-sm p-6 transition-all ${metrics.totalTasks > 0 ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {normalizeId(selectedUserId) === normalizeId(currentUser.id) ? 'Mis Tareas' : `Tareas de ${getSelectedUserName()}`}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total</span>
                  <span className="text-2xl font-bold text-blue-600">{metrics.totalTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Completadas</span>
                  <span className="text-2xl font-bold text-green-600">{metrics.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Pendientes</span>
                  <span className="text-2xl font-bold text-orange-600">{metrics.totalTasks - metrics.completedTasks}</span>
                </div>
                {metrics.totalTasks > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Progreso</span>
                      <span className="font-medium">{Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(metrics.completedTasks / metrics.totalTasks) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              {metrics.totalTasks > 0 && (
                <div className="mt-4 text-center text-xs text-slate-500">
                  Haz clic para ver todas las tareas
                </div>
              )}
            </div>
          )}

          {/* Todas Las Tareas - Resumen General */}
          {currentUser && (
            <div 
              onClick={() => setIsAllTasksModalOpen(true)}
              className="bg-white rounded-lg shadow-sm p-6 transition-all cursor-pointer hover:shadow-md hover:scale-[1.02]"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Todas Las Tareas
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total de tareas</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {metrics.totalTasks}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Completadas</span>
                  <span className="text-2xl font-bold text-green-600">
                    {metrics.completedTasks}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Pendientes</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {metrics.urgentTasks + metrics.tasksWithoutDate}
                  </span>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-slate-500">
                Haz clic para ver todas las tareas
              </div>
            </div>
          )}

          {/* Tareas Asignadas - Visible para todos los usuarios */}
          {currentUser && selectedUserId && (
            <div 
              onClick={() => setIsMyTasksModalOpen(true)}
              className="bg-white rounded-lg shadow-sm p-6 transition-all cursor-pointer hover:shadow-md hover:scale-[1.02]"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {normalizeId(selectedUserId) === normalizeId(currentUser.id) 
                  ? 'Mis Tareas Asignadas' 
                  : `Tareas Asignadas a ${getSelectedUserName()}`}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total asignadas</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {filteredTasks.filter(t => isTaskAssignedToUserOnly(t, selectedUserId!)).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Completadas</span>
                  <span className="text-2xl font-bold text-green-600">
                    {filteredTasks.filter(t => 
                      isTaskAssignedToUserOnly(t, selectedUserId!) && 
                      (t.Estado === TaskState.COMPLETADA || t.Porcentaje_Avance >= 100)
                    ).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Pendientes</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {filteredTasks.filter(t => 
                      isTaskAssignedToUserOnly(t, selectedUserId!) && 
                      t.Estado !== TaskState.COMPLETADA && 
                      t.Porcentaje_Avance < 100
                    ).length}
                  </span>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-slate-500">
                Haz clic para ver tareas asignadas
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Proyectos o Todos los Proyectos */}
        {metrics.tasksByProject.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Todos los Proyectos
              </h3>
              {metrics.allProjects.length > 5 && (
                <button
                  onClick={() => setShowAllProjects(!showAllProjects)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showAllProjects ? (
                    <>
                      <Icon name="chevron-up" className="w-4 h-4" />
                      <span>Ver menos</span>
                    </>
                  ) : (
                    <>
                      <Icon name="list" className="w-4 h-4" />
                      <span>Ver todo ({metrics.allProjects.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {metrics.tasksByProject.map((project, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setIsProjectModalOpen(true);
                        }}
                        className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                      >
                        {project.name}
                      </button>
                      <span className="text-xs text-slate-500">
                        {project.completed} / {project.count} completadas
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(project.completed / project.count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Tareas Asignadas */}
        {isMyTasksModalOpen && currentUser && selectedUserId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[60] p-4"
            onClick={() => setIsMyTasksModalOpen(false)}
          >
            <div 
              className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[80vh] flex flex-col h-full sm:h-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {normalizeId(selectedUserId) === normalizeId(currentUser.id) 
                      ? 'Mis Tareas Asignadas' 
                      : `Tareas Asignadas a ${getSelectedUserName()}`}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {normalizeId(selectedUserId) === normalizeId(currentUser.id)
                      ? 'Tareas donde estoy asignado (excluyendo las que yo creé)'
                      : 'Tareas asignadas a este usuario (excluyendo las que él creó)'}
                  </p>
                </div>
                <button
                  onClick={() => setIsMyTasksModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>

              {/* Body del Modal - Lista de Tareas */}
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  // Filtrar tareas asignadas al usuario seleccionado (no creadas por él)
                  const assignedTasks = filteredTasks.filter(t => isTaskAssignedToUserOnly(t, selectedUserId!));
                  
                  if (assignedTasks.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="list" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>
                          {normalizeId(selectedUserId) === normalizeId(currentUser.id)
                            ? 'No tienes tareas asignadas'
                            : 'Este usuario no tiene tareas asignadas'}
                        </p>
                      </div>
                    );
                  }

                  // Mostrar TODAS las tareas asignadas, incluyendo subtareas huérfanas
                  const rootAssignedTasks = assignedTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);
                  const childAssignedTasks = assignedTasks.filter(t => t.Parent_ID && t.Parent_ID !== 0);
                  
                  const buildAssignedTasksHierarchy = (parentId: number): Task[] => {
                    return assignedTasks
                      .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
                      .sort((a, b) => a.ID - b.ID);
                  };

                  return (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        Total de tareas asignadas: <span className="font-semibold">{assignedTasks.length}</span>
                      </div>
                      <div className="space-y-1">
                        {/* Tareas raíz con su jerarquía */}
                        {rootAssignedTasks.map(task => renderTaskWithChildren(task, buildAssignedTasksHierarchy, 0))}
                        
                        {/* Tareas huérfanas (tienen parent pero el parent no está asignado al usuario) */}
                        {childAssignedTasks.filter(childTask => {
                          const parentExists = assignedTasks.some(t => t.ID === childTask.Parent_ID);
                          return !parentExists;
                        }).map(task => renderTaskWithChildren(task, buildAssignedTasksHierarchy, 0))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Footer del Modal */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setIsMyTasksModalOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Todas las Tareas del Usuario Seleccionado */}
        {isAllTasksModalOpen && currentUser && selectedUserId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[60] p-4"
            onClick={() => setIsAllTasksModalOpen(false)}
          >
            <div 
              className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[80vh] flex flex-col h-full sm:h-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    {normalizeId(selectedUserId) === normalizeId(currentUser.id) 
                      ? 'Todas Mis Tareas' 
                      : `Tareas de ${getSelectedUserName()}`}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {normalizeId(selectedUserId) === normalizeId(currentUser.id)
                      ? 'Tareas que he creado o donde estoy asignado'
                      : 'Tareas creadas o asignadas a este usuario'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Icon name="download" className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar Excel</span>
                  </button>
                  <button
                    onClick={() => setIsAllTasksModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Icon name="close" className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body del Modal - Lista de Tareas */}
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  // Las tareas ya están filtradas por el usuario seleccionado y por fecha
                  const userTasks = filteredTasks;
                  
                  if (userTasks.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="list" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>
                          {normalizeId(selectedUserId) === normalizeId(currentUser.id)
                            ? 'No tienes tareas'
                            : 'Este usuario no tiene tareas'}
                        </p>
                      </div>
                    );
                  }

                  // Mostrar todas las tareas con jerarquía
                  const rootUserTasks = userTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);
                  const childUserTasks = userTasks.filter(t => t.Parent_ID && t.Parent_ID !== 0);
                  
                  const buildUserTasksHierarchy = (parentId: number): Task[] => {
                    return userTasks
                      .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
                      .sort((a, b) => a.ID - b.ID);
                  };

                  return (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        Total de tareas: <span className="font-semibold">{userTasks.length}</span>
                        <span className="text-slate-400 ml-2">
                          (Creadas: {filteredTasks.filter(t => normalizeId(t.Usuario_Creador_ID) === normalizeId(currentUser.id)).length}, 
                          Asignadas: {filteredTasks.filter(t => isTaskAssignedToUser(t, false)).length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {/* Tareas raíz con su jerarquía */}
                        {rootUserTasks.map(task => renderTaskWithChildren(task, buildUserTasksHierarchy, 0))}
                        
                        {/* Tareas huérfanas */}
                        {childUserTasks.filter(childTask => {
                          const parentExists = userTasks.some(t => t.ID === childTask.Parent_ID);
                          return !parentExists;
                        }).map(task => renderTaskWithChildren(task, buildUserTasksHierarchy, 0))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Footer del Modal */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setIsAllTasksModalOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Tareas del Proyecto */}
        {isProjectModalOpen && selectedProjectId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[60] p-4"
            onClick={() => {
              setIsProjectModalOpen(false);
              setSelectedProjectId(null);
            }}
          >
            <div 
              className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[80vh] flex flex-col h-full sm:h-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {projects.find(p => p.id === selectedProjectId)?.nombre}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Todas las tareas del proyecto
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    setSelectedProjectId(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>

              {/* Body del Modal - Lista de Tareas */}
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const { rootTasks, buildHierarchy, totalTasks } = getProjectTasksHierarchy(selectedProjectId);
                  
                  if (rootTasks.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="folder" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No hay tareas en este proyecto</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        Total de tareas: <span className="font-semibold">{totalTasks}</span>
                      </div>
                      <div className="space-y-1">
                        {rootTasks.map(task => renderTaskWithChildren(task, buildHierarchy, 0))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Footer del Modal */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    setSelectedProjectId(null);
                  }}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Salud */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Estado de Salud del Proyecto</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">Tasa de Completación</p>
              <p className="text-2xl sm:text-3xl font-bold mt-2">{metrics.progressPercentage}%</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">Tareas Críticas</p>
              <p className="text-2xl sm:text-3xl font-bold mt-2">{metrics.urgentTasks + metrics.importantTasks}</p>
              <p className="text-xs opacity-75 mt-1">Atrasadas + Importantes</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">Productividad</p>
              <p className="text-2xl sm:text-3xl font-bold mt-2">
                {metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 10) : 0}/10
              </p>
              <p className="text-xs opacity-75 mt-1">Basado en completadas</p>
            </div>
          </div>
        </div>

        {/* Modal de Tareas Atrasadas */}
        {isOverdueTasksModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[60] p-4"
            onClick={() => setIsOverdueTasksModalOpen(false)}
          >
            <div 
              className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[80vh] flex flex-col h-full sm:h-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Tareas Atrasadas</h2>
                  <p className="text-sm text-slate-500 mt-1">Tareas vencidas y no completadas</p>
                </div>
                <button
                  onClick={() => setIsOverdueTasksModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const overdueTasks = filteredTasks.filter(t => {
                    if (t.Estado === TaskState.COMPLETADA) return false;
                    if (!t.Fecha_Vencimiento) return false;
                    const dueDate = new Date(t.Fecha_Vencimiento);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate < today;
                  });

                  if (overdueTasks.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="check" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No hay tareas atrasadas</p>
                      </div>
                    );
                  }

                  const rootOverdueTasks = overdueTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);
                  const childOverdueTasks = overdueTasks.filter(t => t.Parent_ID && t.Parent_ID !== 0);
                  const buildOverdueHierarchy = (parentId: number): Task[] => {
                    return overdueTasks
                      .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
                      .sort((a, b) => a.ID - b.ID);
                  };

                  return (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        Total de tareas atrasadas: <span className="font-semibold text-red-600">{overdueTasks.length}</span>
                      </div>
                      <div className="space-y-1">
                        {/* Tareas raíz con su jerarquía */}
                        {rootOverdueTasks.map(task => renderTaskWithChildren(task, buildOverdueHierarchy, 0))}
                        
                        {/* Tareas huérfanas (tienen parent pero el parent no está en la lista) */}
                        {childOverdueTasks.filter(childTask => {
                          const parentExists = overdueTasks.some(t => t.ID === childTask.Parent_ID);
                          return !parentExists;
                        }).map(task => renderTaskWithChildren(task, buildOverdueHierarchy, 0))}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setIsOverdueTasksModalOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Tareas Importantes */}
        {isImportantTasksModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[60] p-4"
            onClick={() => setIsImportantTasksModalOpen(false)}
          >
            <div 
              className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[80vh] flex flex-col h-full sm:h-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Tareas Importantes</h2>
                  <p className="text-sm text-slate-500 mt-1">Tareas de alta importancia no completadas</p>
                </div>
                <button
                  onClick={() => setIsImportantTasksModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const importantTasks = filteredTasks.filter(t => {
                    if (t.Estado === TaskState.COMPLETADA) return false;
                    return t.Importancia === TaskImportance.ALTA || t.Prioridad === TaskPriority.ALTA;
                  });

                  if (importantTasks.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="star" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No hay tareas importantes pendientes</p>
                      </div>
                    );
                  }

                  const rootImportantTasks = importantTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);
                  const childImportantTasks = importantTasks.filter(t => t.Parent_ID && t.Parent_ID !== 0);
                  const buildImportantHierarchy = (parentId: number): Task[] => {
                    return importantTasks
                      .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
                      .sort((a, b) => a.ID - b.ID);
                  };

                  return (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        Total de tareas importantes: <span className="font-semibold text-yellow-600">{importantTasks.length}</span>
                      </div>
                      <div className="space-y-1">
                        {/* Tareas raíz con su jerarquía */}
                        {rootImportantTasks.map(task => renderTaskWithChildren(task, buildImportantHierarchy, 0))}
                        
                        {/* Tareas huérfanas */}
                        {childImportantTasks.filter(childTask => {
                          const parentExists = importantTasks.some(t => t.ID === childTask.Parent_ID);
                          return !parentExists;
                        }).map(task => renderTaskWithChildren(task, buildImportantHierarchy, 0))}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setIsImportantTasksModalOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Tareas Programadas */}
        {isScheduledTasksModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[60] p-4"
            onClick={() => setIsScheduledTasksModalOpen(false)}
          >
            <div 
              className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[80vh] flex flex-col h-full sm:h-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Tareas Programadas</h2>
                  <p className="text-sm text-slate-500 mt-1">Tareas con fecha de vencimiento futura</p>
                </div>
                <button
                  onClick={() => setIsScheduledTasksModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const scheduledTasks = filteredTasks.filter(t => {
                    if (t.Estado === TaskState.COMPLETADA) return false;
                    if (!t.Fecha_Vencimiento) return false;
                    const dueDate = new Date(t.Fecha_Vencimiento);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate >= today;
                  });

                  if (scheduledTasks.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="calendar" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No hay tareas programadas</p>
                      </div>
                    );
                  }

                  const rootScheduledTasks = scheduledTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);
                  const childScheduledTasks = scheduledTasks.filter(t => t.Parent_ID && t.Parent_ID !== 0);
                  const buildScheduledHierarchy = (parentId: number): Task[] => {
                    return scheduledTasks
                      .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
                      .sort((a, b) => a.ID - b.ID);
                  };

                  return (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        Total de tareas programadas: <span className="font-semibold text-purple-600">{scheduledTasks.length}</span>
                      </div>
                      <div className="space-y-1">
                        {/* Tareas raíz con su jerarquía */}
                        {rootScheduledTasks.map(task => renderTaskWithChildren(task, buildScheduledHierarchy, 0))}
                        
                        {/* Tareas huérfanas */}
                        {childScheduledTasks.filter(childTask => {
                          const parentExists = scheduledTasks.some(t => t.ID === childTask.Parent_ID);
                          return !parentExists;
                        }).map(task => renderTaskWithChildren(task, buildScheduledHierarchy, 0))}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setIsScheduledTasksModalOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Tareas Completadas */}
        {isCompletedTasksModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => setIsCompletedTasksModalOpen(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Tareas Completadas</h2>
                  <p className="text-sm text-slate-500 mt-1">Todas las tareas finalizadas</p>
                </div>
                <button
                  onClick={() => setIsCompletedTasksModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const completedTasks = filteredTasks.filter(t => 
                    t.Estado === TaskState.COMPLETADA || t.Porcentaje_Avance >= 100
                  );

                  if (completedTasks.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="check" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No hay tareas completadas</p>
                      </div>
                    );
                  }

                  const rootCompletedTasks = completedTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);
                  const childCompletedTasks = completedTasks.filter(t => t.Parent_ID && t.Parent_ID !== 0);
                  const buildCompletedHierarchy = (parentId: number): Task[] => {
                    return completedTasks
                      .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
                      .sort((a, b) => a.ID - b.ID);
                  };

                  return (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        Total de tareas completadas: <span className="font-semibold text-green-600">{completedTasks.length}</span>
                      </div>
                      <div className="space-y-1">
                        {/* Tareas raíz con su jerarquía */}
                        {rootCompletedTasks.map(task => renderTaskWithChildren(task, buildCompletedHierarchy, 0))}
                        
                        {/* Tareas huérfanas */}
                        {childCompletedTasks.filter(childTask => {
                          const parentExists = completedTasks.some(t => t.ID === childTask.Parent_ID);
                          return !parentExists;
                        }).map(task => renderTaskWithChildren(task, buildCompletedHierarchy, 0))}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setIsCompletedTasksModalOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Tareas Sin Fecha */}
        {isNoDateTasksModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => setIsNoDateTasksModalOpen(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Tareas Sin Fecha</h2>
                  <p className="text-sm text-slate-500 mt-1">Tareas sin fecha de vencimiento asignada</p>
                </div>
                <button
                  onClick={() => setIsNoDateTasksModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Icon name="close" className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const noDateTasks = filteredTasks.filter(t => 
                    !t.Fecha_Vencimiento && 
                    t.Estado !== TaskState.COMPLETADA
                  );

                  if (noDateTasks.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="calendar" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>Todas las tareas tienen fecha asignada</p>
                      </div>
                    );
                  }

                  const rootNoDateTasks = noDateTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);
                  const childNoDateTasks = noDateTasks.filter(t => t.Parent_ID && t.Parent_ID !== 0);
                  const buildNoDateHierarchy = (parentId: number): Task[] => {
                    return noDateTasks
                      .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
                      .sort((a, b) => a.ID - b.ID);
                  };

                  return (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        Total de tareas sin fecha: <span className="font-semibold text-orange-600">{noDateTasks.length}</span>
                      </div>
                      <div className="space-y-1">
                        {/* Tareas raíz con su jerarquía */}
                        {rootNoDateTasks.map(task => renderTaskWithChildren(task, buildNoDateHierarchy, 0))}
                        
                        {/* Tareas huérfanas */}
                        {childNoDateTasks.filter(childTask => {
                          const parentExists = noDateTasks.some(t => t.ID === childTask.Parent_ID);
                          return !parentExists;
                        }).map(task => renderTaskWithChildren(task, buildNoDateHierarchy, 0))}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setIsNoDateTasksModalOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      )}

      {isSettingsOpen && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Settings onBack={() => setIsSettingsOpen(false)} />
        </main>
      )}
    </div>
  );
};
