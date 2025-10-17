const API_BASE = 'http://localhost:3000/api';

async function testCreateTask() {
  try {
    const response = await fetch(`${API_BASE}/createQuickTask.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        titulo: 'Test Task with Project',
        adjuntos: []
      })
    });

    const result = await response.json();
    console.log('Task created:', result);
    console.log('Proyecto value:', result.Proyecto);
    console.log('proyecto_nombre value:', result.proyecto_nombre);
  } catch (error) {
    console.error('Error:', error);
  }
}

testCreateTask();