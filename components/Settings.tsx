import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import * as apiService from '../services/apiService';

type Project = {
  id: number;
  nombre: string;
  total_tareas?: number;
};

const Settings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<'profile'|'projects'>('profile');
  const [user, setUser] = useState<any>(null);
  const [nameEdit, setNameEdit] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number|null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project|null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [moveTargetId, setMoveTargetId] = useState<number|null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadProfile(); loadProjects(); }, []);

  const loadProfile = async () => {
    try {
      const res = await apiService.getCurrentUser();
      setUser(res);
      setNameEdit(res?.username || '');
    } catch (e) { console.error(e); }
  };

  const saveName = async () => {
    if (!user) return;
    try {
      await apiService.updateUserName({ name: nameEdit });
      await loadProfile();
      // small inline confirmation
      const el = document.createElement('div');
      el.textContent = 'Nombre actualizado';
      el.className = 'fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-up';
      document.body.appendChild(el);
      setTimeout(()=>document.body.removeChild(el), 1800);
    } catch (e:any) { console.error(e); alert(e?.message || 'Error actualizando nombre'); }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      // Load projects created/managed by the current user (include projects with 0 tasks)
      const res = await apiService.getProjectsByManager();
      const detailed = await Promise.all(res.map(async (p:any) => {
        const r = await apiService.getProjectById(p.id).catch(()=>null);
        return { ...p, total_tareas: r?.total_tareas ?? 0 };
      }));
      setProjects(detailed);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const startEditProject = (p: Project) => { setEditingProjectId(p.id); setEditingProjectName(p.nombre); };
  const saveProjectName = async () => {
    if (!editingProjectId) return;
    try {
      const updated = await apiService.updateProjectByOwner({ id: editingProjectId, nombre: editingProjectName });
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingProjectId(null); setEditingProjectName('');
    } catch (e:any) { console.error(e); alert(e?.message || 'Error actualizando proyecto'); }
  };

  const startDelete = (p: Project) => { setDeleteTarget(p); setConfirmText(''); setMoveTargetId(null); };
  const confirmDelete = async (action: 'delete'|'move', moveToId?: number, forceDeleteTasks?: boolean) => {
    if (!deleteTarget) return;
    try {
      if (action === 'move' && moveToId) {
        await apiService.moveProjectTasks({ from_project_id: deleteTarget.id, to_project_id: moveToId });
        await apiService.deleteProjectByOwner({ id: deleteTarget.id });
      } else {
        await apiService.deleteProjectByOwner({ id: deleteTarget.id, force_delete_tasks: !!forceDeleteTasks });
      }
      setDeleteTarget(null); await loadProjects();
    } catch (e:any) { console.error(e); alert(e?.message || 'Error eliminando proyecto'); }
  };

  const filteredProjects = projects.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-slate-50 min-h-[600px] rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200/60 backdrop-blur-sm flex flex-col">
        <div className="p-4 md:p-6">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 md:mb-6 group">
            <div className="p-1 rounded-md group-hover:bg-slate-200 transition-colors">
              <Icon name="arrow-left" className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">Volver</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight px-1 hidden md:block">Configuración</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1 pb-4 md:pb-0 flex md:block overflow-x-auto md:overflow-visible gap-2 md:gap-0">
          <button 
            onClick={()=>setTab('profile')} 
            className={`flex-shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab==='profile' 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${tab==='profile' ? 'bg-blue-500' : 'bg-transparent'}`} />
            Perfil
          </button>
          <button 
            onClick={()=>setTab('projects')} 
            className={`flex-shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab==='projects' 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${tab==='projects' ? 'bg-blue-500' : 'bg-transparent'}`} />
            <span className="text-left">Proyectos</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-auto md:ml-0">{projects.length}</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-white">
        <div className="h-full flex flex-col">
          {/* Header Area */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {tab === 'profile' ? 'Perfil de Usuario' : 'Administrar Proyectos'}
            </h2>
          </div>

          <div className="p-8 flex-1 overflow-y-auto">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="max-w-xl">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nombre Completo</label>
                    <input 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800" 
                      value={nameEdit} 
                      onChange={(e)=>setNameEdit(e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
                    <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 select-none">
                      {user?.email || '-'}
                    </div>
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={saveName} 
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl shadow-sm shadow-blue-200 transition-all transform active:scale-95"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {tab === 'projects' && (
              <div className="max-w-3xl">
                <div className="mb-6 relative group">
                  <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Buscar proyectos..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12 text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-3"></div>
                    Cargando...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProjects.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        No se encontraron proyectos
                      </div>
                    ) : (
                      filteredProjects.map(p => (
                        <div key={p.id} className="group bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-blue-200 transition-all duration-200">
                          <div className="flex-1 min-w-0 pr-4">
                            {editingProjectId === p.id ? (
                              <div className="flex items-center gap-2 animate-fade-in">
                                <input 
                                  value={editingProjectName} 
                                  onChange={(e)=>setEditingProjectName(e.target.value)} 
                                  className="px-3 py-1.5 bg-slate-50 border border-blue-300 rounded-lg text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                                  autoFocus
                                />
                                <button onClick={saveProjectName} className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" title="Guardar">
                                  <Icon name="save" className="w-4 h-4" />
                                </button>
                                <button onClick={()=>setEditingProjectId(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="Cancelar">
                                  <Icon name="close" className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold text-slate-800 truncate">{p.nombre}</div>
                                <div className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                                  <span className={p.total_tareas && p.total_tareas > 0 ? "text-blue-500" : ""}>{p.total_tareas ?? 0} tareas</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {!editingProjectId && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={()=>startEditProject(p)} 
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                Editar
                              </button>
                              <button 
                                onClick={()=>startDelete(p)} 
                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" 
                                title="Eliminar"
                              >
                                <Icon name="trash" className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Modal (Mac Style) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-scale-in border border-slate-100">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Icon name="trash" className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar "{deleteTarget.nombre}"?</h3>
              
              {(deleteTarget.total_tareas ?? 0) > 0 ? (
                <div className="text-left bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                  <p className="text-sm text-slate-600 mb-4 text-center">
                    Este proyecto contiene <strong className="text-slate-900">{deleteTarget.total_tareas} tareas</strong>. <br/>
                    ¿Qué deseas hacer con ellas?
                  </p>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Mover tareas a:</label>
                      <select 
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none" 
                        value={moveTargetId ?? ''} 
                        onChange={(e)=>setMoveTargetId(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Seleccionar proyecto destino...</option>
                        {projects.filter(pp=>pp.id !== deleteTarget.id).map(pp=> <option key={pp.id} value={pp.id}>{pp.nombre}</option>)}
                      </select>
                      <Icon name="chevronDown" className="w-4 h-4 text-slate-400 absolute right-3 top-[2.2rem] pointer-events-none" />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-6">
                  Esta acción es irreversible. El proyecto será eliminado permanentemente.
                </p>
              )}

              {/* Action Buttons */}
              {(deleteTarget.total_tareas ?? 0) > 0 ? (
                <div className="flex flex-col gap-3">
                  <button 
                    disabled={!moveTargetId} 
                    onClick={()=>confirmDelete('move', moveTargetId!)} 
                    className={`w-full py-2.5 rounded-xl font-medium text-white transition-all shadow-sm ${
                      moveTargetId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Mover tareas y Eliminar
                  </button>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <button 
                      onClick={()=>setDeleteTarget(null)} 
                      className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={()=>confirmDelete('delete', undefined, true)} 
                      className="flex-1 py-2.5 bg-red-50 border border-transparent text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                    >
                      Eliminar Todo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                   {/* For empty projects, simple confirmation */}
                   <div className="flex gap-3">
                      <button 
                        onClick={()=>setDeleteTarget(null)} 
                        className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={()=>confirmDelete('delete')} 
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 shadow-sm shadow-red-200 transition-colors"
                      >
                        Eliminar
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
