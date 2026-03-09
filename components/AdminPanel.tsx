import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Icon } from './Icon';
import { getUserDepartments } from '../services/apiService';

// Component for selecting multiple departments
const DepartmentSelector: React.FC<{
  userId: number;
  currentDepartmentId: number | null;
  departments: Department[];
  onAssign: (userId: number, departmentIds: number[]) => void;
}> = ({ userId, currentDepartmentId, departments, onAssign }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserDepartments = async () => {
      setLoading(true);
      try {
        const userDepts = await getUserDepartments(userId);
        setSelectedDepts(userDepts.map(d => d.id));
      } catch (error) {
        console.error('Error loading user departments:', error);
        // Si falla, usar el departamento actual como fallback
        if (currentDepartmentId) {
          setSelectedDepts([currentDepartmentId]);
        }
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadUserDepartments();
    }
  }, [userId, currentDepartmentId, isOpen]);

  const toggleDepartment = (deptId: number) => {
    setSelectedDepts(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const handleApply = () => {
    onAssign(userId, selectedDepts);
    setIsOpen(false);
  };

  const selectedDeptNames = departments
    .filter(d => selectedDepts.includes(d.id))
    .map(d => d.nombre)
    .join(', ');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white hover:bg-slate-50 flex items-center gap-2 min-w-[200px]"
      >
        <span className="flex-1 text-left text-sm truncate">
          {selectedDepts.length === 0 
            ? 'Sin departamento' 
            : `${selectedDepts.length} departamento${selectedDepts.length > 1 ? 's' : ''}`}
        </span>
        <Icon name="chevron-down" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-20 max-h-96 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-200">
              <h4 className="font-medium text-slate-900">Seleccionar Departamentos</h4>
              {selectedDeptNames && (
                <p className="text-xs text-slate-500 mt-1 truncate" title={selectedDeptNames}>
                  {selectedDeptNames}
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="text-center py-4 text-slate-500">Cargando...</div>
              ) : (
                <div className="space-y-1">
                  {departments.map(dept => (
                    <label
                      key={dept.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepts.includes(dept.id)}
                        onChange={() => toggleDepartment(dept.id)}
                        className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700">{dept.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const DPE_FIELDS: Array<{ key: string; label: string; required?: boolean }> = [
  { key: 'project_name', label: 'Proyecto (proyecto_id)', required: true },
  { key: 'project_end', label: 'Proyecto fecha_vencimiento' },
  { key: 'tipo_objetivo', label: 'tipo_objetivo_id' },
  { key: 'producto', label: 'producto_id' },
  { key: 'etapa', label: 'etapa_id' },
  { key: 'task_title', label: 'titulo', required: true },
  { key: 'task_start', label: 'fecha_inicio' },
  { key: 'task_end', label: 'fecha_vencimiento' },
  { key: 'task_completed', label: 'fecha_completada' },
  { key: 'department', label: 'departamento_id' },
  { key: 'responsable', label: 'creado_por' },
  { key: 'co_responsable', label: 'tareas_asignados' },
  { key: 'estado', label: 'estado' },
  { key: 'observaciones', label: 'descripcion' }
];

const normalizeHeader = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
};

const normalizeNameForMatch = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
};

const normalizeId = (id: any): number => parseInt(String(id), 10);

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
  const [activeTab, setActiveTab] = useState<'departments' | 'users' | 'projects' | 'dpe'>('departments');
  
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

  // Estado para buscador de usuarios
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Estados para importación DPE
  const [dpeFile, setDpeFile] = useState<File | null>(null);
  const [dpeHeaders, setDpeHeaders] = useState<string[]>([]);
  const [dpeRows, setDpeRows] = useState<Record<string, any>[]>([]);
  const [dpeMapping, setDpeMapping] = useState<Record<string, string>>({});
  const [isParsingDpe, setIsParsingDpe] = useState(false);
  const [isImportingDpe, setIsImportingDpe] = useState(false);
  const [dpeImportMessage, setDpeImportMessage] = useState<string | null>(null);
  const [dpeImportWarnings, setDpeImportWarnings] = useState<string[]>([]);
  const [dpeFallbackMemberId, setDpeFallbackMemberId] = useState<number | null>(null);
  const [dpeExtraMemberIds, setDpeExtraMemberIds] = useState<number[]>([]);
  const [dpeDeleteMode, setDpeDeleteMode] = useState<'project' | 'user' | 'global'>('project');
  const [dpeDeleteProjectId, setDpeDeleteProjectId] = useState<number | null>(null);
  const [dpeDeleteUserId, setDpeDeleteUserId] = useState<number | null>(null);
  const [dpeDeleteUsers, setDpeDeleteUsers] = useState<User[]>([]);
  const [isDeletingDpe, setIsDeletingDpe] = useState(false);
  const [dpeDeleteMessage, setDpeDeleteMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const isAdmin = currentUser && parseInt(String(currentUser.rol_id)) === 2;

  const autoMapHeaders = (headers: string[]) => {
    const synonyms: Record<string, string[]> = {
      project_name: ['nombreproyecto', 'proyecto', 'nombreproyecto '],
      project_end: ['fechafinproyecto', 'fecha fin proyecto', 'fechafinproy'],
      tipo_objetivo: ['tipoobjetivo', 'tipo objetivo'],
      producto: ['producto'],
      etapa: ['etapa'],
      task_title: ['nombredpe', 'nombre dpe', 'dpe'],
      task_start: ['fechainiciodpe', 'fecha inicio dpe', 'fechainicio'],
      task_end: ['fechafindpe', 'fecha fin dpe', 'fechafin'],
      task_completed: ['fecharealdpe', 'fecha real dpe'],
      department: ['area', 'área', 'departamento'],
      responsable: ['responsable', 'creadopor', 'creador'],
      co_responsable: ['corresponsable', 'co-responsable', 'co responsable'],
      estado: ['estadodpe', 'estado'],
      observaciones: ['observaciones', 'observacion']
    };

    const normalizedHeaders = headers.map(h => ({ raw: h, norm: normalizeHeader(h) }));
    const mapping: Record<string, string> = {};

    DPE_FIELDS.forEach(field => {
      const candidates = synonyms[field.key] || [];
      const match = normalizedHeaders.find(h => candidates.some(c => normalizeHeader(c) === h.norm));
      if (match) {
        mapping[field.key] = match.raw;
      }
    });

    return mapping;
  };

  const parseDpeFile = async (file: File) => {
    setIsParsingDpe(true);
    setDpeImportMessage(null);
    setDpeImportWarnings([]);
    try {
      const buffer = await file.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(buffer);
      if (text.includes('\u0000') || text.includes('\uFFFD')) {
        try {
          text = new TextDecoder('windows-1252').decode(buffer);
        } catch (e) {
          text = new TextDecoder('iso-8859-1').decode(buffer);
        }
      }

      const result = Papa.parse<Record<string, any>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.replace(/^\uFEFF/, '').trim()
      });

      if (result.errors?.length) {
        setDpeImportWarnings(result.errors.map(e => e.message));
      }

      const headers = result.meta.fields || [];
      setDpeHeaders(headers);
      setDpeRows(result.data || []);
      setDpeMapping(autoMapHeaders(headers));
    } catch (error) {
      console.error('Error parsing DPE file:', error);
      setDpeImportMessage('Error al leer el archivo CSV.');
    } finally {
      setIsParsingDpe(false);
    }
  };

  const handleImportDpe = async () => {
    if (!isAdmin) return;
    setIsImportingDpe(true);
    setDpeImportMessage(null);
    setDpeImportWarnings([]);
    try {
      const response = await fetch('/api/importDpeCsv.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mapping: dpeMapping,
          rows: dpeRows,
          fallbackMemberId: dpeFallbackMemberId,
          extraMemberIds: dpeExtraMemberIds
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Error al importar');
      }
      setDpeImportMessage(`Importación completada. Insertadas: ${data.inserted || 0}.`);
      if (data.warnings?.length) {
        setDpeImportWarnings(data.warnings);
      }
    } catch (error) {
      console.error('Error importing DPE:', error);
      setDpeImportMessage((error as Error).message || 'Error al importar');
    } finally {
      setIsImportingDpe(false);
    }
  };

  const toggleExtraMember = (userId: number) => {
    const targetId = normalizeId(userId);
    setDpeExtraMemberIds(prev => {
      const exists = prev.some(id => normalizeId(id) === targetId);
      return exists
        ? prev.filter(id => normalizeId(id) !== targetId)
        : [...prev, userId];
    });
  };

  const handleDeleteDpe = async () => {
    if (!isAdmin) return;
    setIsDeletingDpe(true);
    setDpeDeleteMessage(null);
    try {
      const response = await fetch('/api/deleteDpeTasks.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: dpeDeleteMode,
          projectId: dpeDeleteProjectId,
          userId: dpeDeleteUserId
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Error al eliminar');
      }
      setDpeDeleteMessage(`Eliminadas: ${data.deleted || 0}`);
      await loadDpeDeleteUsers();
    } catch (error) {
      console.error('Error deleting DPE tasks:', error);
      setDpeDeleteMessage((error as Error).message || 'Error al eliminar');
    } finally {
      setIsDeletingDpe(false);
    }
  };

  const detectedUsers = useMemo(() => {
    const creators = new Map<number, User>();
    const members = new Map<number, User>();
    const missingCreators = new Set<string>();
    const missingMembers = new Set<string>();

    const respHeader = dpeMapping.responsable;
    const coHeader = dpeMapping.co_responsable;

    const findUser = (raw: string): User | null => {
      const target = normalizeNameForMatch(raw);
      if (!target) return null;
      const exact = users.find(u => {
        const uname = normalizeNameForMatch(u.username);
        const email = normalizeNameForMatch(u.email);
        return target === uname || target === email;
      });
      if (exact) return exact;
      return users.find(u => {
        const uname = normalizeNameForMatch(u.username);
        return uname && (uname.includes(target) || target.includes(uname));
      }) || null;
    };

    dpeRows.forEach(row => {
      if (respHeader && row[respHeader]) {
        const raw = String(row[respHeader]).trim();
        if (raw) {
          const found = findUser(raw);
          if (found) creators.set(found.id, found);
          else missingCreators.add(raw);
        }
      }

      if (coHeader && row[coHeader]) {
        const raw = String(row[coHeader]);
        raw.split(/[;,]/).map(v => v.trim()).filter(Boolean).forEach(name => {
          const found = findUser(name);
          if (found) members.set(found.id, found);
          else missingMembers.add(name);
        });
      }
    });

    return {
      creators: Array.from(creators.values()),
      members: Array.from(members.values()),
      missingCreators: Array.from(missingCreators.values()),
      missingMembers: Array.from(missingMembers.values())
    };
  }, [dpeRows, dpeMapping, users]);

  const loadDpeDeleteUsers = async () => {
    if (!isAdmin) {
      setDpeDeleteUsers([]);
      return;
    }

    try {
      const response = await fetch('/api/getDpeUsers.php', {
        credentials: 'include'
      });
      const data = await response.json();
      setDpeDeleteUsers(data || []);
    } catch (error) {
      console.error('Error loading DPE delete users:', error);
      setDpeDeleteUsers([]);
    }
  };

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

      await loadDpeDeleteUsers();

      // Cargar proyectos creados por el usuario (incluye proyectos con 0 tareas)
      const projectsResponse = await fetch('/api/getProjectsByManager.php', {
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

  const handleAssignUserToDepartment = async (userId: number, departmentIds: number[]) => {
    try {
      const response = await fetch('/api/assignUserToDepartment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, department_ids: departmentIds })
      });

      const data = await response.json();
      if (data.error) {
        alert('Error: ' + data.error);
        return;
      }

      // Actualizar lista de usuarios con el primer departamento como principal
      const primaryDeptId = departmentIds.length > 0 ? departmentIds[0] : null;
      setUsers(users.map(u => u.id === userId ? { ...u, departamento_id: primaryDeptId } : u));
      await loadData(); // Recargar para obtener todos los departamentos
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
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center space-x-2">
                <Icon name="settings" className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-slate-900">Administración</h1>
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
            {isAdmin && (
              <button
                onClick={() => setActiveTab('dpe')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'dpe'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="download" className="w-5 h-5" />
                  <span>Importar DPE</span>
                </div>
              </button>
            )}
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

            {/* Buscador en tiempo real */}
            <div className="mb-6">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios por nombre o email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {userSearchQuery && (
                  <button
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <Icon name="close" className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Icon name="users" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>No hay usuarios registrados</p>
                </div>
              ) : (
                (() => {
                  const filteredUsers = users.filter(user => {
                    if (!userSearchQuery) return true;
                    const query = userSearchQuery.toLowerCase();
                    return (
                      user.username.toLowerCase().includes(query) ||
                      user.email.toLowerCase().includes(query)
                    );
                  });

                  if (filteredUsers.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <Icon name="search" className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No se encontraron usuarios que coincidan con "{userSearchQuery}"</p>
                      </div>
                    );
                  }

                  return filteredUsers.map((user) => {
                    const userDept = departments.find(d => d.id === user.departamento_id);
                    return (
                      <div key={user.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                            <DepartmentSelector
                              userId={user.id}
                              currentDepartmentId={user.departamento_id}
                              departments={departments}
                              onAssign={handleAssignUserToDepartment}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
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
            <p className="text-sm text-slate-500 mb-4">Mostrando los proyectos <strong>creados por ti</strong>. Se incluyen proyectos con <strong>0 tareas</strong>.</p>

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

        {/* DPE Import Tab */}
        {activeTab === 'dpe' && isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Importar DPE (CSV)</h2>
                <p className="text-sm text-slate-500 mt-1">Solo administradores. Se validan y homologan columnas del CSV.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="border border-slate-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Archivo CSV</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setDpeFile(file);
                      setDpeHeaders([]);
                      setDpeRows([]);
                      setDpeMapping({});
                      setDpeImportMessage(null);
                      setDpeImportWarnings([]);
                      if (file) {
                        parseDpeFile(file);
                      }
                    }}
                    className="block w-full text-sm text-slate-600"
                  />

                  {isParsingDpe && (
                    <div className="text-xs text-slate-500 mt-2">Leyendo archivo...</div>
                  )}

                  {dpeImportMessage && (
                    <div className="text-xs mt-2 text-slate-700">{dpeImportMessage}</div>
                  )}

                  {dpeImportWarnings.length > 0 && (
                    <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      {dpeImportWarnings.map((w, i) => (
                        <div key={i}>• {w}</div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      onClick={handleImportDpe}
                      disabled={!dpeRows.length || isImportingDpe}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isImportingDpe ? 'Insertando...' : 'Insertar'}
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 mt-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Eliminar tareas DPE</h3>
                  <div className="space-y-3 text-xs">
                    <select
                      value={dpeDeleteMode}
                      onChange={(e) => setDpeDeleteMode(e.target.value as 'project' | 'user' | 'global')}
                      className="w-full px-2 py-1 border rounded"
                    >
                      <option value="project">Por proyecto</option>
                      <option value="user">Por usuario (Responsable)</option>
                      <option value="global">Global (todas)</option>
                    </select>

                    {dpeDeleteMode === 'project' && (
                      <select
                        value={dpeDeleteProjectId || ''}
                        onChange={(e) => setDpeDeleteProjectId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="">Selecciona proyecto</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    )}

                    {dpeDeleteMode === 'user' && (
                      <select
                        value={dpeDeleteUserId || ''}
                        onChange={(e) => setDpeDeleteUserId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="">Selecciona usuario</option>
                        {dpeDeleteUsers.length === 0 ? (
                          <option value="" disabled>Sin usuarios con DPE</option>
                        ) : (
                          dpeDeleteUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))
                        )}
                      </select>
                    )}

                    <button
                      onClick={handleDeleteDpe}
                      disabled={isDeletingDpe || (dpeDeleteMode === 'project' && !dpeDeleteProjectId) || (dpeDeleteMode === 'user' && !dpeDeleteUserId)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeletingDpe ? 'Eliminando...' : 'Eliminar DPE'}
                    </button>

                    {dpeDeleteMessage && (
                      <div className="text-xs text-slate-600">{dpeDeleteMessage}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Mapeo de columnas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {DPE_FIELDS.map(field => (
                      <div key={field.key} className="flex items-center gap-2">
                        <label className="text-xs text-slate-600 w-40">
                          {field.label}{field.required ? ' *' : ''}
                        </label>
                        <select
                          value={dpeMapping[field.key] || ''}
                          onChange={(e) => setDpeMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="flex-1 px-2 py-1 border rounded text-xs"
                        >
                          <option value="">Sin asignar</option>
                          {dpeHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 mt-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Usuarios detectados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-slate-700 mb-2">Creadores (Responsable)</p>
                      {detectedUsers.creators.length === 0 ? (
                        <p className="text-slate-500">Sin coincidencias.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {detectedUsers.creators.map(u => (
                            <span key={u.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                              {u.username}
                            </span>
                          ))}
                        </div>
                      )}
                      {detectedUsers.missingCreators.length > 0 && (
                        <div className="mt-2 text-amber-700">
                          No encontrados: {detectedUsers.missingCreators.join(', ')}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 mb-2">Miembros (CoResponsable)</p>
                      {detectedUsers.members.length === 0 ? (
                        <p className="text-slate-500">Sin coincidencias.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {detectedUsers.members.map(u => (
                            <span key={u.id} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                              {u.username}
                            </span>
                          ))}
                        </div>
                      )}
                      {detectedUsers.missingMembers.length > 0 && (
                        <div className="mt-2 text-amber-700">
                          No encontrados: {detectedUsers.missingMembers.join(', ')}
                        </div>
                      )}
                      {detectedUsers.missingMembers.length > 0 && (
                        <div className="mt-3">
                          <label className="block text-xs text-slate-600 mb-1">
                            Asignar faltantes a:
                          </label>
                          <select
                            value={dpeFallbackMemberId || ''}
                            onChange={(e) => setDpeFallbackMemberId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          >
                            <option value="">Sin asignar</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="mt-4">
                        <label className="block text-xs text-slate-600 mb-1">
                          Agregar miembros a todas las tareas:
                        </label>
                        <div className="max-h-28 overflow-auto border border-slate-200 rounded p-2 bg-slate-50">
                          {users.length === 0 ? (
                            <div className="text-xs text-slate-500">Sin usuarios disponibles.</div>
                          ) : (
                            <div className="space-y-1">
                              {users.map(user => (
                                <label key={user.id} className="flex items-center gap-2 text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={dpeExtraMemberIds.some(id => normalizeId(id) === normalizeId(user.id))}
                                    onChange={() => toggleExtraMember(user.id)}
                                    className="w-3.5 h-3.5"
                                  />
                                  <span>{user.username}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 mt-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Vista previa</h3>
                  {dpeRows.length === 0 ? (
                    <div className="text-xs text-slate-500">Sin datos para mostrar.</div>
                  ) : (
                    <div className="overflow-auto max-h-64 border border-slate-100 rounded">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            {Object.values(dpeMapping).filter(Boolean).slice(0, 6).map((h) => (
                              <th key={h} className="px-2 py-1 text-left text-slate-600">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dpeRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-t">
                              {Object.values(dpeMapping).filter(Boolean).slice(0, 6).map((h) => (
                                <td key={String(h)} className="px-2 py-1 text-slate-700">{String(row[h] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
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
