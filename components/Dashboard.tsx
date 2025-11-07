import React, { useMemo, useState, useEffect } from 'react';
import { Task, Project, TaskPriority, TaskImportance } from '../types';
import { TaskState } from '../types';
import { Icon } from './Icon';

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  currentUser: { id: number; username: string; email: string } | null;
  taskAssigneesRecord: Record<number, {id: number, username: string}[]>;
  onBackToTasks: () => void;
  onEditTask?: (task: Task) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  projects,
  currentUser,
  taskAssigneesRecord,
  onBackToTasks,
  onEditTask
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMyTasksModalOpen, setIsMyTasksModalOpen] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());

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
      const myTasks = tasks.filter(t => isTaskAssignedToUser(t, false));
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
  }, [isMyTasksModalOpen, currentUser, tasks, taskAssigneesRecord]);

  // Helper function to normalize IDs for comparison
  const normalizeId = (id: any): number => parseInt(String(id));

  // Helper function to check if a task is assigned to the current user (excluding tasks they created)
  const isTaskAssignedToUser = (task: Task, excludeCompleted: boolean = false): boolean => {
    if (!currentUser) return false;
    // Excluir tareas que el usuario creó
    if (normalizeId(task.Usuario_Creador_ID) === normalizeId(currentUser.id)) return false;
    // Excluir tareas completadas si se especifica
    if (excludeCompleted && (task.Estado === TaskState.COMPLETADA || task.Porcentaje_Avance >= 100)) return false;
    const assignees = taskAssigneesRecord[task.ID] || [];
    return assignees.some(assignee => normalizeId(assignee.id) === normalizeId(currentUser.id));
  };

  // Calcular métricas
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total de tareas
    const totalTasks = tasks.length;

    // Tareas por estado
    const completedTasks = tasks.filter(t => t.Estado === TaskState.COMPLETADA || t.Porcentaje_Avance >= 100).length;
    const inProgressTasks = tasks.filter(t => t.Estado === TaskState.EN_PROGRESO && t.Porcentaje_Avance < 100).length;
    const pendingTasks = tasks.filter(t => t.Estado === TaskState.PENDIENTE).length;

    // Tareas urgentes (atrasadas y no completadas)
    const urgentTasks = tasks.filter(t => {
      if (t.Estado === TaskState.COMPLETADA) return false;
      if (!t.Fecha_Vencimiento) return false;
      const dueDate = new Date(t.Fecha_Vencimiento);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;
    
    const importantTasks = tasks.filter(t => 
      t.Importancia === TaskImportance.ALTA && 
      t.Estado !== TaskState.COMPLETADA
    ).length;

    // Tareas sin fecha (TODAS las tareas sin fecha y no completadas, no solo del usuario)
    const tasksWithoutDate = tasks.filter(t => 
      !t.Fecha_Vencimiento && 
      t.Estado !== TaskState.COMPLETADA
    ).length;

    // Tareas del usuario actual (usando taskAssigneesRecord, incluyendo completadas)
    const myTasks = currentUser 
      ? tasks.filter(t => isTaskAssignedToUser(t, false)).length // NO excluir completadas
      : 0;
    
    const myCompletedTasks = currentUser 
      ? tasks.filter(t => 
          isTaskAssignedToUser(t, false) && 
          (t.Estado === TaskState.COMPLETADA || t.Porcentaje_Avance >= 100)
        ).length 
      : 0;

    // Tareas por proyecto
    const tasksByProject = projects.map(project => ({
      id: project.id,
      name: project.nombre,
      count: tasks.filter(t => normalizeId(t.Proyecto) === normalizeId(project.id)).length,
      completed: tasks.filter(t => 
        normalizeId(t.Proyecto) === normalizeId(project.id) && 
        (t.Estado === TaskState.COMPLETADA || t.Porcentaje_Avance >= 100)
      ).length
    })).filter(p => p.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

    // Progreso general
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tareas programadas (con fecha pero no vencidas)
    const scheduledTasks = tasks.filter(t => {
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
      myTasks,
      myCompletedTasks,
      tasksByProject,
      progressPercentage,
      scheduledTasks
    };
  }, [tasks, projects, currentUser, taskAssigneesRecord]);

  // Obtener tareas de un proyecto específico en jerarquía
  const getProjectTasksHierarchy = (projectId: number) => {
    // Obtener TODAS las tareas del proyecto (no filtrar por usuario)
    const projectTasks = tasks.filter(t => normalizeId(t.Proyecto) === normalizeId(projectId));

    // Encontrar tareas raíz (Parent_ID = 0 o null)
    const rootTasks = projectTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);

    // Función recursiva para construir la jerarquía
    const buildHierarchy = (parentId: number): Task[] => {
      return projectTasks
        .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
        .sort((a, b) => a.ID - b.ID);
    };

    return { rootTasks, buildHierarchy, totalTasks: projectTasks.length };
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
            className="flex-1 flex items-center justify-between min-w-0"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">#{task.ID}</span>
                <span className="text-sm text-slate-700 truncate">{task.Titulo}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {task.Estado === TaskState.COMPLETADA ? (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">✓ Completada</span>
              ) : task.Estado === TaskState.EN_PROGRESO ? (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">En Progreso</span>
              ) : (
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">Pendiente</span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToTasks}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Icon name="arrow-left" className="w-5 h-5" />
                <span className="font-medium">Volver a Tareas</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Icon name="user" className="w-4 h-4" />
                <span>{currentUser.username}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Tareas */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Tareas</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.totalTasks}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Icon name="list" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Tareas Completadas */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completadas</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.completedTasks}</p>
                <p className="text-xs text-green-600 mt-1">{metrics.progressPercentage}% del total</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Icon name="check" className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Tareas Urgentes (Atrasadas) */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Atrasadas</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.urgentTasks}</p>
                <p className="text-xs text-red-600 mt-1">Vencidas y pendientes</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Icon name="alert" className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Tareas Sin Fecha */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sin Fecha</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.tasksWithoutDate}</p>
                <p className="text-xs text-orange-600 mt-1">Tareas sin programar</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Icon name="clock" className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Segunda fila de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* En Progreso */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En Progreso</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{metrics.inProgressTasks}</p>
              </div>
              <Icon name="refresh" className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          {/* Programadas */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Programadas</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{metrics.scheduledTasks}</p>
              </div>
              <Icon name="calendar" className="w-5 h-5 text-purple-500" />
            </div>
          </div>

          {/* Importantes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Importantes</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{metrics.importantTasks}</p>
              </div>
              <Icon name="star" className="w-5 h-5 text-yellow-500" />
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
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
          {/* Progreso General */}
          <div className="bg-white rounded-lg shadow-sm p-6">
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

          {/* Mis Tareas (Usuario Actual) - Clickable */}
          {currentUser && (
            <div 
              onClick={() => metrics.myTasks > 0 && setIsMyTasksModalOpen(true)}
              className={`bg-white rounded-lg shadow-sm p-6 transition-all ${metrics.myTasks > 0 ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Mis Tareas Asignadas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total asignadas</span>
                  <span className="text-2xl font-bold text-blue-600">{metrics.myTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Completadas</span>
                  <span className="text-2xl font-bold text-green-600">{metrics.myCompletedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Pendientes</span>
                  <span className="text-2xl font-bold text-orange-600">{metrics.myTasks - metrics.myCompletedTasks}</span>
                </div>
                {metrics.myTasks > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Progreso personal</span>
                      <span className="font-medium">{Math.round((metrics.myCompletedTasks / metrics.myTasks) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(metrics.myCompletedTasks / metrics.myTasks) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              {metrics.myTasks > 0 && (
                <div className="mt-4 text-center text-xs text-slate-500">
                  Haz clic para ver todas tus tareas
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top 5 Proyectos */}
        {metrics.tasksByProject.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Top 5 Proyectos con Más Tareas</h3>
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

        {/* Modal de Mis Tareas Asignadas */}
        {isMyTasksModalOpen && currentUser && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => setIsMyTasksModalOpen(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Mis Tareas Asignadas</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Tareas donde estoy asignado (excluyendo las que yo creé)
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
                  const myTasks = tasks.filter(t => isTaskAssignedToUser(t, false)); // Mostrar TODAS incluyendo completadas
                  
                  console.log('Mis tareas asignadas:', myTasks.length);
                  console.log('Detalles:', myTasks.map(t => ({ id: t.ID, titulo: t.Titulo, estado: t.Estado, parent: t.Parent_ID })));
                  
                  if (myTasks.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="list" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No tienes tareas asignadas</p>
                      </div>
                    );
                  }

                  // Mostrar TODAS las tareas asignadas, incluyendo subtareas huérfanas
                  // Primero las raíz, luego las que tienen parent
                  const rootMyTasks = myTasks.filter(t => !t.Parent_ID || t.Parent_ID === 0);
                  const childMyTasks = myTasks.filter(t => t.Parent_ID && t.Parent_ID !== 0);
                  
                  const buildMyTasksHierarchy = (parentId: number): Task[] => {
                    return myTasks
                      .filter(t => normalizeId(t.Parent_ID) === normalizeId(parentId))
                      .sort((a, b) => a.ID - b.ID);
                  };

                  return (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        Total de tareas asignadas: <span className="font-semibold">{myTasks.length}</span>
                      </div>
                      <div className="space-y-1">
                        {/* Tareas raíz con su jerarquía */}
                        {rootMyTasks.map(task => renderTaskWithChildren(task, buildMyTasksHierarchy, 0))}
                        
                        {/* Tareas huérfanas (tienen parent pero el parent no está asignado al usuario) */}
                        {childMyTasks.filter(childTask => {
                          // Verificar si el parent está en la lista de tareas del usuario
                          const parentExists = myTasks.some(t => t.ID === childTask.Parent_ID);
                          return !parentExists; // Solo mostrar si el parent NO está en la lista
                        }).map(task => renderTaskWithChildren(task, buildMyTasksHierarchy, 0))}
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

        {/* Modal de Tareas del Proyecto */}
        {isProjectModalOpen && selectedProjectId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => {
              setIsProjectModalOpen(false);
              setSelectedProjectId(null);
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
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
              <p className="text-3xl font-bold mt-2">{metrics.progressPercentage}%</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">Tareas Críticas</p>
              <p className="text-3xl font-bold mt-2">{metrics.urgentTasks + metrics.importantTasks}</p>
              <p className="text-xs opacity-75 mt-1">Atrasadas + Importantes</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">Productividad</p>
              <p className="text-3xl font-bold mt-2">
                {metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 10) : 0}/10
              </p>
              <p className="text-xs opacity-75 mt-1">Basado en completadas</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
