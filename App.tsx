import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CreateQuickTask } from './components/CreateQuickTask';
import { TaskList } from './components/TaskList';
import { Icon } from './components/Icon';
import type { Task, Project } from './types';
import { getTasks, updateTask, createSubTask, getProjects, deleteTask, checkAuth, apiLogout } from './services/apiService';
import { calculateTaskProgress, hasSubtasks } from './utils/taskUtils';
import { EditTaskModal } from './components/EditTaskModal';
import { TaskSkeleton } from './components/TaskSkeleton';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState<boolean>(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  // Accordion states
  const [isTodayTasksExpanded, setIsTodayTasksExpanded] = useState<boolean>(true);
  const [isOverdueTasksExpanded, setIsOverdueTasksExpanded] = useState<boolean>(true);
  const [isPendingTasksExpanded, setIsPendingTasksExpanded] = useState<boolean>(true);
  const [isCompletedTasksExpanded, setIsCompletedTasksExpanded] = useState<boolean>(true);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const initialTasks = await getTasks();
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
      setProjects(initialProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const auth = await checkAuth();
        if (auth && auth.authenticated) {
          setIsAuthenticated(true);
          await fetchTasks();
          await fetchProjects();
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check failed', err);
        setIsAuthenticated(false);
      }
    };

    init();
  }, [fetchTasks, fetchProjects]);

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

  const handleCloseModal = () => {
    setEditingTask(null);
  };

  const handleUpdateTask = async (taskToUpdate: Task) => {
    try {
      const savedTask = await updateTask(taskToUpdate);
      setTasks(currentTasks => currentTasks.map(t => (t.ID === savedTask.ID ? savedTask : t)));
      
      // Keep modal open if it's open, so user can see changes reflected.
      if (editingTask && editingTask.ID === savedTask.ID) {
        setEditingTask(savedTask);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      // You could show an error toast here
    }
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
        
        // Find parent tasks that need progress recalculation
        const parentsToUpdate = new Set<number>();
        currentTasks.forEach(task => {
          if (task.Parent_ID && task.Parent_ID !== 0) {
            parentsToUpdate.add(task.Parent_ID);
          }
        });
        
        // Recalculate progress only for parent tasks
        return updatedTasks.map(task => {
          if (parentsToUpdate.has(task.ID) && hasSubtasks(task, updatedTasks)) {
            return {
              ...task,
              Porcentaje_Avance: calculateTaskProgress(task, updatedTasks)
            };
          }
          return task;
        });
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

  const getTasksForTodayAndNoDate = (allTasks: Task[]) => {
    const today = getCurrentDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all completed task IDs (100% progress)
    const completedTaskIds = new Set(
      allTasks
        .filter(task => isCompleted(task))
        .map(task => task.ID)
    );

    // Return tasks that are either:
    // 1. Due today, OR
    // 2. Have no due date
    // AND are NOT completed
    return allTasks.filter(task => {
      if (completedTaskIds.has(task.ID)) return false;

      if (!task.Fecha_Vencimiento) {
        // No due date - include
        return true;
      }

      // Check if due today (between start of today and end of today)
      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow;
    });
  };

  const getPendingTasks = (allTasks: Task[]) => {
    const today = getCurrentDate();

    console.log('=== DEBUG: getPendingTasks ===');

    // Get all completed task IDs (100% progress)
    const completedTaskIds = new Set(
      allTasks
        .filter(task => isCompleted(task))
        .map(task => task.ID)
    );

    // Return tasks that are due in the future (tomorrow or later) and NOT completed
    return allTasks.filter(task => {
      if (completedTaskIds.has(task.ID)) return false;
      if (!task.Fecha_Vencimiento) return false;

      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today;
    });
  };

  const getOverdueTasks = (allTasks: Task[]) => {
    const today = getCurrentDate();

    // Get all overdue tasks that are NOT completed (due date is before today)
    const overdueTasks = allTasks.filter(task => {
      if (!task.Fecha_Vencimiento) return false;
      if (isCompleted(task)) return false;
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
    return allTasks.filter(task => hierarchyTasks.has(task.ID));
  };

  const getCompletedTasks = (allTasks: Task[]) => {
    return allTasks.filter(task => isCompleted(task));
  };

  // Get only truly overdue tasks (without parents) for notifications
  const getOverdueTasksForNotifications = (allTasks: Task[]) => {
    const today = getCurrentDate();
    return allTasks.filter(task => {
      if (!task.Fecha_Vencimiento) return false;
      if (isCompleted(task)) return false;
      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      // Only consider overdue if due date is before today
      return dueDate < today;
    });
  };

  const currentTasks = getTasksForTodayAndNoDate(tasks);
  const overdueTasks = getOverdueTasks(tasks);
  const completedTasks = getCompletedTasks(tasks);
  const overdueTasksForNotifications = getOverdueTasksForNotifications(tasks);
  const pendingTasks = getPendingTasks(tasks);

  // Counter functions for section titles
  const getTodayTasksCount = (allTasks: Task[]) => {
    const today = getCurrentDate();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return allTasks.filter(task => {
      if (!task.Fecha_Vencimiento || isCompleted(task)) return false;
      const dueDate = new Date(task.Fecha_Vencimiento + 'T00:00:00');
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow;
    }).length;
  };

  const getNoDateTasksCount = (allTasks: Task[]) => {
    return allTasks.filter(task => !task.Fecha_Vencimiento && !isCompleted(task)).length;
  };

  const todayCount = getTodayTasksCount(tasks);
  const noDateCount = getNoDateTasksCount(tasks);
  const overdueCount = overdueTasks.length;
  const pendingCount = pendingTasks.length;
  const completedCount = completedTasks.length;

  return (
    <div className="min-h-screen font-sans">
      {isAuthenticated === false && (
        // show login/register flow
        showRegister ? (
          <RegisterForm onRegistered={() => setShowRegister(false)} onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onLogin={() => window.location.reload()} onSwitchToRegister={() => setShowRegister(true)} />
        )
      )}
      {isAuthenticated === true && (
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2 rounded-lg">
                <Icon name="check" className="w-6 h-6 text-white"/>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Mis Tareas</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative" ref={notificationMenuRef}>
              <button
                onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
                className={`flex items-center space-x-2 px-3 py-2 sm:px-4 rounded-lg border transition-all duration-200 ${
                  overdueTasksForNotifications.length > 0
                    ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                aria-label="Notificaciones de tareas vencidas"
              >
                <Icon name="bell" className="w-4 h-4 sm:w-5 sm:h-5"/>
                {overdueTasksForNotifications.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {overdueTasksForNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {isNotificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Tareas Vencidas ({overdueTasksForNotifications.length})
                    </h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {overdueTasksForNotifications.length > 0 ? (
                      overdueTasksForNotifications.map((task) => (
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
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {task.Titulo}
                              </p>
                              {task.Descripcion && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {task.Descripcion}
                                </p>
                              )}
                              <div className="flex items-center mt-2 space-x-2">
                                <span className="text-xs text-red-600 font-medium">
                                  Vencida: {new Date(task.Fecha_Vencimiento!).toLocaleDateString('es-ES')}
                                </span>
                                {task.Parent_ID && task.Parent_ID !== 0 && (
                                  <span className="text-xs text-slate-400">
                                    Subtarea
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        <p className="text-sm">¡Excelente! No tienes tareas vencidas.</p>
                      </div>
                    )}
                  </div>
                  {overdueTasksForNotifications.length > 0 && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setIsNotificationMenuOpen(false);
                          // Scroll to overdue tasks section
                          const overdueSection = document.querySelector('[data-section="overdue"]');
                          if (overdueSection) {
                            overdueSection.scrollIntoView({ behavior: 'smooth' });
                          }
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
              onClick={handleExportCSV}
              className="flex items-center space-x-2 bg-white text-slate-600 px-3 py-2 sm:px-4 rounded-lg border border-slate-300 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={tasks.length === 0}
              aria-label="Exportar tareas a CSV"
            >
              <Icon name="download" className="w-4 h-4 sm:w-5 sm:h-5"/>
              <span className="font-medium hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-2 sm:px-4 rounded-lg border border-red-300 hover:bg-red-100 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 text-sm sm:text-base"
              aria-label="Cerrar sesión"
            >
              <Icon name="logout" className="w-4 h-4 sm:w-5 sm:h-5"/>
              <span className="font-medium hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
  </header>
  )}
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section aria-labelledby="create-task-heading" className="mb-12">
           <h2 id="create-task-heading" className="sr-only">Crear nueva tarea</h2>
           <CreateQuickTask onTaskCreated={handleAddTask} />
        </section>
        
        <section aria-labelledby="current-tasks-heading" className="mb-12">
            <button
              onClick={() => setIsTodayTasksExpanded(!isTodayTasksExpanded)}
              className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-slate-50 transition-colors"
              aria-expanded={isTodayTasksExpanded ? 'true' : 'false'}
              aria-controls="current-tasks-content"
            >
              <h2 id="current-tasks-heading" className="text-xl font-semibold text-slate-800">
                Tareas: Hoy: {todayCount} y sin fecha: {noDateCount}
              </h2>
              <Icon
                name={isTodayTasksExpanded ? "chevronUp" : "chevronDown"}
                className="w-5 h-5 text-slate-600 transition-transform duration-200"
              />
            </button>
            <div
              id="current-tasks-content"
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isTodayTasksExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
                <div className={`mt-4 ${isLoading ? 'min-h-[200px]' : ''}`}>
                {isLoading ? (
                    <TaskSkeleton />
                ) : currentTasks.length > 0 ? (
                  <TaskList tasks={currentTasks} projects={projects} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                ) : (
                  <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                    <p className="text-slate-500">¡Todo al día! No hay tareas pendientes para hoy.</p>
                  </div>
                )}
              </div>
            </div>
        </section>

        <section aria-labelledby="overdue-tasks-heading" data-section="overdue">
            <button
              onClick={() => setIsOverdueTasksExpanded(!isOverdueTasksExpanded)}
              className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg p-2 hover:bg-red-50 transition-colors"
              aria-expanded={isOverdueTasksExpanded ? 'true' : 'false'}
              aria-controls="overdue-tasks-content"
            >
              <h2 id="overdue-tasks-heading" className="text-xl font-semibold text-red-700">
                Tareas atrasadas: {overdueCount}
              </h2>
              <Icon
                name={isOverdueTasksExpanded ? "chevronUp" : "chevronDown"}
                className="w-5 h-5 text-red-600 transition-transform duration-200"
              />
            </button>
            <div
              id="overdue-tasks-content"
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOverdueTasksExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
                <div className={`mt-4 ${isLoading ? 'min-h-[200px]' : ''}`}>
                {isLoading ? (
                    <TaskSkeleton />
                ) : overdueTasks.length > 0 ? (
                  <TaskList tasks={overdueTasks} projects={projects} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                ) : (
                  <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                    <p className="text-slate-500">¡Excelente! No hay tareas vencidas.</p>
                  </div>
                )}
              </div>
            </div>
        </section>

        <section aria-labelledby="pending-tasks-heading" className="mt-12">
            <button
              onClick={() => setIsPendingTasksExpanded(!isPendingTasksExpanded)}
              className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-blue-50 transition-colors"
              aria-expanded={isPendingTasksExpanded ? 'true' : 'false'}
              aria-controls="pending-tasks-content"
            >
              <h2 id="pending-tasks-heading" className="text-xl font-semibold text-blue-700">
                Tareas pendientes: {pendingCount}
              </h2>
              <Icon
                name={isPendingTasksExpanded ? "chevronUp" : "chevronDown"}
                className="w-5 h-5 text-blue-600 transition-transform duration-200"
              />
            </button>
            <div
              id="pending-tasks-content"
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isPendingTasksExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
                <div className={`mt-4 ${isLoading ? 'min-h-[200px]' : ''}`}>
                {isLoading ? (
                    <TaskSkeleton />
                ) : pendingTasks.length > 0 ? (
                  <TaskList tasks={pendingTasks} projects={projects} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                ) : (
                  <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                    <p className="text-slate-500">No hay tareas programadas para el futuro.</p>
                  </div>
                )}
              </div>
            </div>
        </section>

        <section aria-labelledby="completed-tasks-heading" className="mt-12">
            <button
              onClick={() => setIsCompletedTasksExpanded(!isCompletedTasksExpanded)}
              className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg p-2 hover:bg-green-50 transition-colors"
              aria-expanded={isCompletedTasksExpanded ? 'true' : 'false'}
              aria-controls="completed-tasks-content"
            >
              <h2 id="completed-tasks-heading" className="text-xl font-semibold text-green-700">
                Tareas completadas: {completedCount}
              </h2>
              <Icon
                name={isCompletedTasksExpanded ? "chevronUp" : "chevronDown"}
                className="w-5 h-5 text-green-600 transition-transform duration-200"
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
                  <TaskList tasks={completedTasks} projects={projects} onTaskClick={handleSelectTask} onTaskUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                ) : (
                  <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                    <p className="text-slate-500">Aún no has completado ninguna tarea.</p>
                  </div>
                )}
              </div>
            </div>
        </section>
      </main>

      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          allTasks={tasks}
          projects={projects}
          onClose={handleCloseModal}
          onSave={async (task) => {
            await handleUpdateTask(task);
            handleCloseModal();
          }}
          onCreateSubtask={handleCreateSubTask}
          onDelete={handleDeleteTask}
        />
      )}

      <footer className="text-center py-6 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Minimalist Task Manager. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;