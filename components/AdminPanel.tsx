import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface User {
  id: number;
  username: string;
  email: string;
  departamento_id: number | null;
  rol_id: number;
  estado: string;
}

interface Department {
  id: number;
  nombre: string;
  manager_id: number | null;
  manager_name?: string;
}

interface Project {
  id: number;
  nombre: string;
  manager_id: number | null;
  manager_name?: string;
  manager_email?: string;
  total_tareas: number;
  fecha_inicio: string | null;
}

interface AdminPanelProps {
  currentUser: { id: number; username: string; email: string; rol_id?: number } | null;
  onBackToDashboard: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onBackToDashboard }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departments' | 'users' | 'projects'>('departments');
  
  // Estados para crear/editar departamento
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');
  const [editDepartmentManagerId, setEditDepartmentManagerId] = useState<number | null>(null);

  // Estados para editar proyecto
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectManagerId, setEditProjectManagerId] = useState<number | null>(null);

  // Estados para asignar usuarios
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Cargar departamentos
      const deptResponse = await fetch('/api/getDepartments.php', {
        credentials: 'include'
      });
      const deptData = await deptResponse.json();
      setDepartments(deptData || []);

      // Cargar usuarios
      const usersResponse = await fetch('/api/getUsers.php', {
        credentials: 'include'
      });
      const usersData = await usersResponse.json();
      setUsers(usersData || []);

      // Cargar proyectos
      const projectsResponse = await fetch('/api/getAllProjects.php', {
        credentials: 'include'
      });
      const projectsData = await projectsResponse.json();
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) return;

    try {
      const response = await fetch('/api/createDepartment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre: newDepartmentName })
      });

      const data = await response.json();
      if (data.error) {
        alert('Error: ' + data.error);
        return;
      }

      setDepartments([...departments, data]);
      setNewDepartmentName('');
      setIsCreatingDepartment(false);
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Error al crear departamento');
    }
  };

  const handleAssignUserToDepartment = async (userId: number, departmentId: number | null) => {
    try {
      const response = await fetch('/api/assignUserToDepartment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, department_id: departmentId })
      });

      const data = await response.json();
      if (data.error) {
        alert('Error: ' + data.error);
        return;
      }

      // Actualizar lista de usuarios
      setUsers(users.map(u => u.id === userId ? { ...u, departamento_id: departmentId } : u));
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Error al asignar usuario');
    }
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!confirm('¿Estás seguro de eliminar este departamento?')) return;

    try {
      const response = await fetch('/api/deleteDepartment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: departmentId })
      });

      const data = await response.json();
      if (data.error) {
        alert('Error: ' + data.error);
        return;
      }

      setDepartments(departments.filter(d => d.id !== departmentId));
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error al eliminar departamento');
    }
  };

  const handleDepartmentDoubleClick = (department: Department) => {
    setEditingDepartment(department);
    setEditDepartmentName(department.nombre);
    setEditDepartmentManagerId(department.manager_id);
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment || !editDepartmentName.trim()) return;

    try {
      const response = await fetch('/api/updateDepartment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          id: editingDepartment.id,
          nombre: editDepartmentName,
          manager_id: editDepartmentManagerId
        })
      });

      const data = await response.json();
      if (data.error) {
        alert('Error: ' + data.error);
        return;
      }

      setDepartments(departments.map(d => d.id === editingDepartment.id ? data : d));
      setEditingDepartment(null);
      setEditDepartmentName('');
      setEditDepartmentManagerId(null);
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Error al actualizar departamento');
    }
  };

  const handleProjectDoubleClick = (project: Project) => {
    setEditingProject(project);
    setEditProjectName(project.nombre);
    setEditProjectManagerId(project.manager_id);
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editProjectName.trim()) return;

    try {
      const response = await fetch('/api/updateProject.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          id: editingProject.id,
          nombre: editProjectName,
          manager_id: editProjectManagerId
        })
      });

      const data = await response.json();
      if (data.error) {
        alert('Error: ' + data.error);
        return;
      }

      setProjects(projects.map(p => p.id === editingProject.id ? data : p));
      setEditingProject(null);
      setEditProjectName('');
      setEditProjectManagerId(null);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error al actualizar proyecto');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToDashboard}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Icon name="arrow-left" className="w-5 h-5" />
                <span className="font-medium">Volver al Dashboard</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center space-x-2">
                <Icon name="settings" className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
              </div>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Icon name="user" className="w-4 h-4" />
                <span>{currentUser.username}</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">Admin</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('departments')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'departments'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon name="folder" className="w-5 h-5" />
                <span>Departamentos ({departments.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon name="users" className="w-5 h-5" />
                <span>Usuarios ({users.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'projects'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon name="list" className="w-5 h-5" />
                <span>Proyectos ({projects.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Gestión de Departamentos</h2>
              <button
                onClick={() => setIsCreatingDepartment(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Icon name="plus" className="w-5 h-5" />
                <span>Nuevo Departamento</span>
              </button>
            </div>

            {/* Crear Departamento */}
            {isCreatingDepartment && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-slate-900 mb-3">Crear Nuevo Departamento</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="Nombre del departamento"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateDepartment()}
                  />
                  <button
                    onClick={handleCreateDepartment}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Crear
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingDepartment(false);
                      setNewDepartmentName('');
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Departamentos */}
            <div className="space-y-3">
              {departments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Icon name="folder" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>No hay departamentos creados</p>
                  <p className="text-sm mt-1">Crea el primer departamento para empezar</p>
                </div>
              ) : (
                departments.map((dept) => {
                  const deptUsers = users.filter(u => u.departamento_id === dept.id);
                  return (
                    <div 
                      key={dept.id} 
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onDoubleClick={() => handleDepartmentDoubleClick(dept)}
                      title="Doble click para editar"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{dept.nombre}</h3>
                            {dept.manager_name && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Manager: {dept.manager_name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {deptUsers.length} usuario{deptUsers.length !== 1 ? 's' : ''} asignado{deptUsers.length !== 1 ? 's' : ''}
                          </p>
                          {deptUsers.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {deptUsers.map(user => (
                                <span key={user.id} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  {user.username}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDepartment(dept.id);
                          }}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar departamento"
                        >
                          <Icon name="trash" className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Asignación de Usuarios a Departamentos</h2>

            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Icon name="users" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>No hay usuarios registrados</p>
                </div>
              ) : (
                users.map((user) => {
                  const userDept = departments.find(d => d.id === user.departamento_id);
                  return (
                    <div key={user.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon name="user" className="w-5 h-5 text-slate-400" />
                            <h3 className="font-semibold text-slate-900">{user.username}</h3>
                            {parseInt(String(user.rol_id)) === 2 && (
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">Admin</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                          {userDept && (
                            <p className="text-sm text-purple-600 mt-1">
                              Departamento: <span className="font-medium">{userDept.nombre}</span>
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          <select
                            value={user.departamento_id || ''}
                            onChange={(e) => handleAssignUserToDepartment(user.id, e.target.value ? parseInt(e.target.value) : null)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Sin departamento</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Gestión de Proyectos</h2>
            </div>

            {/* Lista de Proyectos */}
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Icon name="list" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>No hay proyectos creados</p>
                </div>
              ) : (
                projects.map((project) => (
                  <div 
                    key={project.id} 
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onDoubleClick={() => handleProjectDoubleClick(project)}
                    title="Doble click para editar"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-slate-900">{project.nombre}</h3>
                          {project.manager_name && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Manager: {project.manager_name}
                            </span>
                          )}
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                            {project.total_tareas} tarea{project.total_tareas !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {project.fecha_inicio && (
                          <p className="text-xs text-slate-500 mt-2">
                            Fecha inicio: {new Date(project.fecha_inicio).toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Edición de Departamento */}
      {editingDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Editar Departamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Departamento
                </label>
                <input
                  type="text"
                  value={editDepartmentName}
                  onChange={(e) => setEditDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nombre del departamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Manager del Departamento
                </label>
                <select
                  value={editDepartmentManagerId || ''}
                  onChange={(e) => setEditDepartmentManagerId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sin manager asignado</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateDepartment}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setEditingDepartment(null);
                  setEditDepartmentName('');
                  setEditDepartmentManagerId(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Proyecto */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Editar Proyecto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Nombre del proyecto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Manager del Proyecto
                </label>
                <select
                  value={editProjectManagerId || ''}
                  onChange={(e) => setEditProjectManagerId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sin manager asignado</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                <p><strong>Total de tareas:</strong> {editingProject.total_tareas}</p>
                {editingProject.fecha_inicio && (
                  <p className="mt-1">
                    <strong>Fecha inicio:</strong> {new Date(editingProject.fecha_inicio).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateProject}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setEditProjectName('');
                  setEditProjectManagerId(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
