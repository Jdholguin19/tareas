import React, { useState, useEffect, useRef } from 'react';
import type { Task, Project } from '../types';
import { TaskState } from '../types';
import { Icon } from './Icon';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { searchUsers, getTaskAssignees, assignUserToTask, unassignUserFromTask, getCurrentUser, createProject } from '../services/apiService';

interface EditTaskModalProps {
  task: Task;
  allTasks: Task[];
  projects: Project[];
  onProjectCreated?: (project: Project) => void;
  onClose: () => void;
  onSave: (updatedTask: Task) => Promise<void>;
  onCreateSubtask: (parentTaskId: number, title: string) => Promise<void>;
  onDelete: (taskId: number) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, allTasks, projects, onClose, onSave, onCreateSubtask, onDelete, onProjectCreated }) => {
  const [formData, setFormData] = useState<Task>({ ...task });
  const [isSaving, setIsSaving] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<{id: number, username: string, email: string}[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<{id: number, username: string, email: string, fecha_asignacion: string}[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: number, username: string, email: string} | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [taskCreator, setTaskCreator] = useState<{id: number, username: string, email: string} | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectSearchResults, setProjectSearchResults] = useState<{id: number, nombre: string}[]>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isSearchingProjects, setIsSearchingProjects] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('EditTaskModal - task received:', task);
    console.log('EditTaskModal - task.Proyecto:', task.Proyecto);
    console.log('EditTaskModal - Number(task.Proyecto):', Number(task.Proyecto));
    setFormData({
      ...task,
      Fecha_Inicio: task.Fecha_Inicio || task.Fecha_Creacion,
      Proyecto: Number(task.Proyecto) // Ensure Proyecto is always a number
    });
    // Load assigned users and current user
    loadAssignedUsers();
    loadCurrentUser();
    loadTaskCreator();
  }, [task]);

  const loadAssignedUsers = async () => {
    setIsLoadingAssignees(true);
    try {
      const assignees = await getTaskAssignees(task.ID);
      setAssignedUsers(assignees);
    } catch (error) {
      console.error('Error loading assigned users:', error);
    } finally {
      setIsLoadingAssignees(false);
    }
  };

  const loadCurrentUser = async () => {
    setIsLoadingUser(true);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadTaskCreator = async () => {
    setIsLoadingCreator(true);
    try {
      // We need to get the creator info. Since we don't have a direct API, we'll use the task's creator ID
      // For now, we'll assume the creator info is available or we can fetch it
      // Since we have the creator ID in task.Usuario_Creador_ID, we could create an API endpoint
      // But for simplicity, let's create a simple fetch to get user by ID
      const response = await fetch(`/api/getUserById.php?id=${task.Usuario_Creador_ID}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to get task creator');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setTaskCreator(data);
    } catch (error) {
      console.error('Error loading task creator:', error);
      // Fallback: set creator as unknown
      setTaskCreator({ id: task.Usuario_Creador_ID, username: 'Usuario desconocido', email: '' });
    } finally {
      setIsLoadingCreator(false);
    }
  };

  const handleProjectSearch = async (query: string) => {
    setProjectSearchQuery(query);

    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    if (query.length < 1) {
      setProjectSearchResults([]);
      setShowProjectDropdown(false);
      return;
    }

    userSearchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingProjects(true);
      try {
        // Filter projects locally since we already have them
        const filteredProjects = projects.filter(project =>
          project.nombre.toLowerCase().includes(query.toLowerCase())
        );
        setProjectSearchResults(filteredProjects);
        setShowProjectDropdown(true);
      } catch (error) {
        console.error('Error searching projects:', error);
        setProjectSearchResults([]);
      } finally {
        setIsSearchingProjects(false);
      }
    }, 300);
  };

  const handleProjectSelect = (project: {id: number, nombre: string}) => {
    setFormData(prev => ({ ...prev, Proyecto: project.id }));
    setProjectSearchQuery('');
    setShowProjectDropdown(false);
    setProjectSearchResults([]);
  };

  const handleClearProject = async () => {
    const updatedTask = { ...formData, Proyecto: null as any };
    setFormData(updatedTask);
    // keep search query cleared
    setProjectSearchQuery('');
    try {
      await onSave(updatedTask);
    } catch (error) {
      console.error('Error removing project:', error);
      // Revert on error
      setFormData(formData);
      alert('Error al quitar el proyecto');
    }
  };

  const handleCreateProject = async (nombre: string) => {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    setIsCreatingProject(true);
    try {
      const created = await createProject(trimmed);
      // select created project
      setFormData(prev => ({ ...prev, Proyecto: created.id }));
      setProjectSearchQuery('');
      setShowProjectDropdown(false);
      setProjectSearchResults([]);
      // notify parent so it can refresh cached list
      if (onProjectCreated) onProjectCreated(created as Project);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('No se pudo crear el proyecto');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleProjectSearchBlur = () => {
    // Delay hiding dropdown to allow click on options
    setTimeout(() => setShowProjectDropdown(false), 150);
  };
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
    let newStatus = TaskState.PENDIENTE;
    let fechaCompletada = null;
    if (value === 100) {
      newStatus = TaskState.COMPLETADA;
      fechaCompletada = new Date().toISOString();
    } else if (value > 0) {
      newStatus = TaskState.EN_PROGRESO;
    }
    
    setFormData(prev => ({ 
      ...prev, 
      Porcentaje_Avance: value,
      Estado: newStatus,
      Fecha_Completada: fechaCompletada
    }));
  };

  const handleCompletedToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      if (isChecked) {
          setFormData(prev => ({
              ...prev,
              Porcentaje_Avance: 100,
              Estado: TaskState.COMPLETADA,
              Fecha_Completada: new Date().toISOString()
          }));
      } else {
          setFormData(prev => ({
              ...prev,
              Porcentaje_Avance: 0,
              Estado: TaskState.PENDIENTE,
              Fecha_Completada: null
          }));
      }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    // Reload page to ensure all changes are visually reflected
    window.location.reload();
  };
  
  const handleAddNewSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    setIsAddingSubtask(true);
    await onCreateSubtask(task.ID, newSubtaskTitle);
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    if (query.length < 1) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }

    userSearchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const results = await searchUsers(query);
        setUserSearchResults(results);
        setShowUserDropdown(true);
      } catch (error) {
        console.error('Error searching users:', error);
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
  };

  const handleUserSelect = async (user: {id: number, username: string, email: string}) => {
    // Check if user is already assigned
    if (assignedUsers.some(assigned => assigned.id === user.id)) {
      setUserSearchQuery('');
      setShowUserDropdown(false);
      setUserSearchResults([]);
      return;
    }

    try {
      await assignUserToTask(task.ID, user.id);
      setAssignedUsers(prev => [...prev, { ...user, fecha_asignacion: new Date().toISOString() }]);
      setUserSearchQuery('');
      setShowUserDropdown(false);
      setUserSearchResults([]);
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Error al asignar usuario');
    }
  };

  const handleRemoveAssignee = async (assigneeId: number) => {
    try {
      await unassignUserFromTask(task.ID, assigneeId);
      setAssignedUsers(prev => prev.filter(user => user.id !== assigneeId));
    } catch (error) {
      console.error('Error unassigning user:', error);
      alert('Error al quitar asignación');
    }
  };

  const handleUserSearchBlur = () => {
    // Delay hiding dropdown to allow click on options
    setTimeout(() => setShowUserDropdown(false), 150);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

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

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const isCreator = currentUser && currentUser.id === task.Usuario_Creador_ID;
  const isAssigned = currentUser && assignedUsers.some(user => user.id === currentUser.id);
  const canEdit = isCreator || isAssigned;
  const canAssign = isCreator || isAssigned;
  const canUnassign = isCreator; // Solo el creador puede quitar asignaciones
  const canDelete = isCreator; // Solo el creador puede eliminar la tarea

  const isCompleted = formData.Porcentaje_Avance === 100;
  const subtasks = allTasks.filter(t => t.Parent_ID === task.ID);

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-2 sm:p-4" 
        onClick={onClose} 
        aria-modal="true" 
        role="dialog"
    >
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl p-4 sm:p-6 lg:p-6 xl:p-8 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start pb-3 sm:pb-4 border-b border-slate-200">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800 truncate">Editar Tarea</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Modifica los detalles de tu tarea.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                className="p-1.5 sm:p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                title="Eliminar tarea"
                aria-label="Eliminar tarea"
              >
                <Icon name="trash" className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100" aria-label="Cerrar modal">
               <Icon name="close" className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </button>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 lg:mt-6 xl:mt-8 space-y-4 sm:space-y-6 lg:space-y-6 xl:space-y-8 max-h-[60vh] sm:max-h-[65vh] lg:max-h-[70vh] xl:max-h-[75vh] overflow-y-auto">
          {/* Main Form Fields */}
          <div>
            <label htmlFor="Titulo" className="block text-sm font-medium text-slate-700 mb-1">
              {isLoadingCreator ? 'Tarea creada por...' : taskCreator ? `Tarea creada por ${taskCreator.username}` : 'Tarea creada por Desconocido'}
            </label>
            <textarea
              id="Titulo"
              name="Titulo"
              value={formData.Titulo}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              disabled={!canEdit}
            />
          </div>
          
          <div>
            <label htmlFor="Descripcion" className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              id="Descripcion"
              name="Descripcion"
              value={formData.Descripcion || ''}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              disabled={!canEdit}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/*<div> Desactivo por el momento
              <label htmlFor="Estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select id="Estado" name="Estado" value={formData.Estado} onChange={handleChange} className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base" disabled={!canEdit}>
                {Object.values(TaskState).map(state => (<option key={state} value={state}>{state}</option>))}
              </select>
            </div> Estado */}
          </div>

          {/* Campo de proyecto - movido arriba de asignar usuarios */}
          <div>
            <label htmlFor="projectSearch" className="block text-sm font-medium text-slate-700 mb-1">Proyecto</label>

              {/* Mostrar proyecto seleccionado */}
              {formData.Proyecto ? (
                <>
                  {console.log('EditTaskModal - formData.Proyecto:', formData.Proyecto, 'projects:', projects.map(p => ({id: p.id, nombre: p.nombre})))}
                <div className="mb-3 flex items-center space-x-2">
                  <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm w-fit">
                    <Icon name="folder" className="w-4 h-4 mr-2"/>
                    <span>{task.proyecto_nombre || projects.find(p => p.id === Number(formData.Proyecto))?.nombre || 'Proyecto desconocido'}</span>
                  </div>
                  {canEdit && (
                    <button type="button" onClick={handleClearProject} className="p-1 rounded-md hover:bg-slate-100" title="Quitar proyecto">
                      <Icon name="close" className="w-4 h-4 text-slate-500" />
                    </button>
                  )}
                </div>
                </>
              ) : (
                <div className="mb-3">
                  <div className="flex items-center bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm w-fit">
                    <Icon name="folder" className="w-4 h-4 mr-2"/>
                    <span>No hay proyectos seleccionados</span>
                  </div>
                </div>
              )}

              {/* Campo de búsqueda para cambiar proyecto */}
              <div className="relative">
                <input
                  type="text"
                  id="projectSearch"
                  value={projectSearchQuery}
                  onChange={(e) => handleProjectSearch(e.target.value)}
                  onBlur={handleProjectSearchBlur}
                  placeholder="Buscar proyecto..."
                  className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                  disabled={!canEdit}
                />
                {isSearchingProjects && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}
                {showProjectDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {projectSearchResults.length > 0 ? (
                      projectSearchResults.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleProjectSelect(project)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0"
                        >
                          <div className="font-medium text-slate-900">{project.nombre}</div>
                        </button>
                      ))
                    ) : (
                      <div className="w-full text-left px-3 py-2 flex items-center justify-between">
                        <div className="text-sm text-slate-700">No hay proyectos</div>
                        <button 
                          type="button" 
                          onClick={() => handleCreateProject(projectSearchQuery)} 
                          disabled={isCreatingProject}
                          className="ml-2 inline-flex items-center px-2 py-1 border border-slate-200 rounded text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCreatingProject ? (
                            <div className="w-3 h-3 border border-slate-400 border-t-green-600 rounded-full animate-spin mr-1"></div>
                          ) : (
                            <span className="text-green-600 font-bold mr-1">+</span>
                          )}
                          {isCreatingProject ? 'Creando...' : 'Crear'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          <div>
            <label htmlFor="assignedUser" className="block text-sm font-medium text-slate-700 mb-1">Asignar usuarios</label>
            
            {/* Mostrar usuarios asignados */}
            {assignedUsers.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-slate-600 mb-2">Usuarios asignados:</h4>
                <div className="flex flex-wrap gap-2">
                  {assignedUsers.map((user) => (
                    <div key={user.id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span>{user.username}</span>
                      {canUnassign && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignee(user.id)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          title="Quitar asignación"
                        >
                          <Icon name="close" className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campo de búsqueda para asignar nuevos usuarios */}
            {canAssign && (
              <div className="relative">
                <input
                  type="text"
                  id="assignedUser"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  onBlur={handleUserSearchBlur}
                  placeholder="Buscar usuario para asignar..."
                  className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                />
                {isSearchingUsers && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}
                {showUserDropdown && userSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {userSearchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-900">{user.username}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="Fecha_Inicio" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Inicio</label>
              <input type="date" id="Fecha_Inicio" name="Fecha_Inicio" value={formatDateForInput(formData.Fecha_Inicio)} onChange={handleChange} className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base" disabled={!canEdit} />
            </div>
            <div>
              <label htmlFor="Fecha_Vencimiento" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
              <input type="date" id="Fecha_Vencimiento" name="Fecha_Vencimiento" value={formatDateForInput(formData.Fecha_Vencimiento)} onChange={handleChange} min={formData.Fecha_Inicio ? formData.Fecha_Inicio.split('T')[0] : undefined} className="w-full p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base" disabled={!canEdit} />
            </div>
          </div>
          
          <div className="flex items-center p-2 sm:p-3 bg-slate-50 rounded-lg">
            <input type="checkbox" id="isCompletedCheckbox" checked={isCompleted} onChange={handleCompletedToggle} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" disabled={!canEdit} />
            <label htmlFor="isCompletedCheckbox" className="ml-2 sm:ml-3 block text-sm font-medium text-slate-700">Marcar como completada</label>
          </div>

          <div>
            <label htmlFor="Porcentaje_Avance" className="block text-sm font-medium text-slate-700 mb-2">
              Progreso: 
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={formData.Porcentaje_Avance} 
                onChange={handleProgressChange} 
                className="inline-block w-16 ml-2 px-2 py-1 text-sm font-bold text-blue-600 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                disabled={!canEdit}
              />%
            </label>
            <div className="relative">
              <input 
                type="range" 
                id="Porcentaje_Avance" 
                name="Porcentaje_Avance" 
                min="0" 
                max="100" 
                step="5" 
                value={formData.Porcentaje_Avance} 
                onChange={handleProgressChange} 
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer range-thumb-blue disabled:opacity-50" 
                disabled={isCompleted || !canEdit}
              />
            </div>
          </div>

          {/* Sub-tasks Section */}
          <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-200">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-700 mb-2 sm:mb-3">Sub-tareas</h3>
              {subtasks.length > 0 && (
                  <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      {subtasks.map(st => (
                          <li key={st.ID} className={`flex items-center justify-between bg-slate-50 p-2 sm:p-2.5 rounded-md text-xs sm:text-sm ${st.Estado === TaskState.COMPLETADA ? 'text-slate-500' : 'text-slate-800'}`}>
                              <span className={`truncate mr-2 ${st.Estado === TaskState.COMPLETADA ? 'line-through' : ''}`}>{st.Titulo}</span>
                              <div className="w-12 sm:w-16 bg-slate-200 rounded-full h-1 sm:h-1.5 flex-shrink-0">
                                <div className="progress-bar-fill"></div>
                              </div>
                          </li>
                      ))}
                  </ul>
              )}
              <div className="flex gap-2">
                  <input 
                      type="text"
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNewSubtask()}
                      placeholder="Añadir nueva sub-tarea..."
                      className="flex-grow p-2 sm:p-2.5 border border-slate-300 bg-slate-50 text-slate-900 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                      disabled={isAddingSubtask || !canEdit}
                  />
                  <button
                      onClick={handleAddNewSubtask}
                      disabled={!newSubtaskTitle.trim() || isAddingSubtask || !canEdit}
                      className="px-3 sm:px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 disabled:bg-slate-300 flex items-center transition-colors text-sm sm:text-base"
                  >
                      {isAddingSubtask ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Icon name="plus" className="w-4 h-4 sm:w-5 sm:h-5"/>}
                  </button>
              </div>
          </div>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center pt-4 sm:pt-6 lg:pt-6 xl:pt-8 mt-4 sm:mt-6 lg:mt-6 xl:mt-8 border-t border-slate-200 space-y-2 sm:space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3">
          <button onClick={onClose} className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold transition-all text-sm sm:text-base">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving || !canEdit} className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center shadow-sm hover:shadow-md transition-all text-sm sm:text-base">
             {isSaving ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <Icon name="save" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
            Guardar Cambios
          </button>
        </div>
      </div>
      <style>{`
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .range-thumb-blue::-webkit-slider-thumb { background-color: #2563eb; cursor: pointer; }
        .range-thumb-blue::-moz-range-thumb { background-color: #2563eb; cursor: pointer; }
        .progress-bar-fill { background-color: #2563eb; height: 100%; border-radius: 9999px; }
      `}</style>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        taskTitle={task.Titulo}
        isDeleting={isDeleting}
      />
    </div>
  );
};