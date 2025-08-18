const { ipcMain } = require('electron');
const railwayService = require('./railwayService');

// Registrar todos los handlers IPC para Railway
function registerRailwayHandlers() {
  console.log('🔧 Registrando handlers IPC para Railway...');

  // Test de conexión
  ipcMain.handle('railway:test-connection', async () => {
    try {
      console.log('🔍 Handler: Probando conexión Railway...');
      const result = await railwayService.testConnection();
      return { success: result };
    } catch (error) {
      console.error('❌ Handler: Error en test de conexión:', error);
      return { success: false, error: error.message };
    }
  });

  // Guardar PDF
  ipcMain.handle('railway:save-pdf', async (event, fumigationData, pdfBufferArray, hasMapImage) => {
    try {
      console.log('💾 Handler: Guardando PDF en Railway...', {
        fumigationId: fumigationData.id,
        pdfSize: pdfBufferArray.length
      });

      // Convertir array a Buffer
      const pdfBuffer = Buffer.from(pdfBufferArray);
      
      const result = await railwayService.savePdf(fumigationData, pdfBuffer, hasMapImage);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Handler: Error guardando PDF:', error);
      return { success: false, error: error.message };
    }
  });

  // Descargar PDF
  ipcMain.handle('railway:download-pdf', async (event, fumigationId) => {
    try {
      console.log('📥 Handler: Descargando PDF desde Railway...', fumigationId);
      
      const result = await railwayService.downloadPdf(fumigationId);
      
      // Convertir Buffer a Array para envío IPC
      const pdfArray = Array.from(result.pdfBuffer);
      
      return { 
        success: true, 
        data: {
          ...result,
          pdfBuffer: pdfArray // Enviar como array
        }
      };
    } catch (error) {
      console.error('❌ Handler: Error descargando PDF:', error);
      return { success: false, error: error.message };
    }
  });

  // Verificar si existe PDF
  ipcMain.handle('railway:pdf-exists', async (event, fumigationId) => {
    try {
      console.log('🔍 Handler: Verificando existencia de PDF...', fumigationId);
      
      const result = await railwayService.pdfExists(fumigationId);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Handler: Error verificando PDF:', error);
      return { success: false, error: error.message };
    }
  });

  // Obtener metadatos del PDF
  ipcMain.handle('railway:get-pdf-metadata', async (event, fumigationId) => {
    try {
      console.log('📋 Handler: Obteniendo metadatos del PDF...', fumigationId);
      
      const result = await railwayService.getPdfMetadata(fumigationId);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Handler: Error obteniendo metadatos:', error);
      return { success: false, error: error.message };
    }
  });

  // Eliminar PDF
  ipcMain.handle('railway:delete-pdf', async (event, fumigationId) => {
    try {
      console.log('🗑️ Handler: Eliminando PDF...', fumigationId);
      
      const result = await railwayService.deletePdf(fumigationId);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Handler: Error eliminando PDF:', error);
      return { success: false, error: error.message };
    }
  });

  console.log('✅ Handlers IPC para Railway registrados exitosamente');
}

// Cleanup handlers al cerrar
function unregisterRailwayHandlers() {
  console.log('🧹 Limpiando handlers IPC de Railway...');
  
  ipcMain.removeAllListeners('railway:test-connection');
  ipcMain.removeAllListeners('railway:save-pdf');
  ipcMain.removeAllListeners('railway:download-pdf');
  ipcMain.removeAllListeners('railway:pdf-exists');
  ipcMain.removeAllListeners('railway:get-pdf-metadata');
  ipcMain.removeAllListeners('railway:delete-pdf');
  
  // Desconectar de Railway
  railwayService.disconnect();
  
  console.log('✅ Cleanup de Railway completado');
}

module.exports = {
  registerRailwayHandlers,
  unregisterRailwayHandlers
};