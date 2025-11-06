/**
 * Utility para manejar sesiones expiradas
 * Detecta cuando la API devuelve error de autenticación y redirige al login
 */

export const handleSessionExpired = (error: any): boolean => {
  // Verificar si es un error de autenticación
  if (error?.error === 'Usuario no autenticado' || 
      error?.message?.includes('no autenticado') ||
      error?.message?.includes('unauthorized')) {
    
    console.warn('Sesión expirada. Redirigiendo al login...');
    
    // Limpiar cualquier dato de sesión local
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Forzar recarga para volver al login
    window.location.reload();
    
    return true;
  }
  
  return false;
};

/**
 * Wrapper para fetch que maneja sesiones expiradas automáticamente
 */
export const fetchWithSessionCheck = async (
  url: string, 
  options?: RequestInit
): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include' // Siempre incluir cookies de sesión
    });
    
    // Si la respuesta es 401 (Unauthorized), la sesión expiró
    if (response.status === 401) {
      console.warn('Sesión expirada (HTTP 401). Redirigiendo al login...');
      window.location.reload();
      throw new Error('Sesión expirada');
    }
    
    // Verificar si la respuesta JSON contiene error de autenticación
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const clone = response.clone();
        const data = await clone.json();
        
        if (handleSessionExpired(data)) {
          throw new Error('Sesión expirada');
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error en fetchWithSessionCheck:', error);
    throw error;
  }
};
