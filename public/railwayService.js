const { Client } = require('pg');

class ElectronRailwayService {
  constructor() {
    this.client = null;
    this.config = {
      host: '35.212.6.172',
      port: 52263,
      database: 'railway',
      user: 'postgres',
      password: 'ruxIcuiniuQhKaoAzQqSuJyAZPYcqfLB',
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    };
  }

  // Conectar a Railway
  async connect() {
    try {
      if (!this.client) {
        this.client = new Client(this.config);
        await this.client.connect();
        console.log('✅ Electron conectado a Railway PostgreSQL');
      }
      return true;
    } catch (error) {
      console.error('❌ Error conectando a Railway desde Electron:', error);
      this.client = null;
      throw error;
    }
  }

  // Desconectar
  async disconnect() {
    try {
      if (this.client) {
        await this.client.end();
        this.client = null;
        console.log('✅ Electron desconectado de Railway');
      }
    } catch (error) {
      console.error('❌ Error desconectando de Railway:', error);
    }
  }

  // Ejecutar consulta con reconexión automática
  async executeQuery(query, params = []) {
    try {
      // Asegurar conexión
      if (!this.client) {
        await this.connect();
      }

      const result = await this.client.query(query, params);
      return result;
    } catch (error) {
      console.error('❌ Error ejecutando query:', error);
      
      // Intentar reconectar una vez si es error de conexión
      if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
        try {
          console.log('🔄 Intentando reconectar...');
          this.client = null;
          await this.connect();
          const result = await this.client.query(query, params);
          return result;
        } catch (retryError) {
          console.error('❌ Error en reintento:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  // Guardar PDF en Railway
  async savePdf(fumigationData, pdfBuffer, hasMapImage = false) {
    try {
      console.log('📤 Guardando PDF en Railway desde Electron...', {
        fumigationId: fumigationData.id,
        pdfSize: pdfBuffer.length,
        hasMapImage
      });

      // Verificar si ya existe
      const existingPdf = await this.getPdfMetadata(fumigationData.id);
      
      const query = existingPdf ? 
        // UPDATE si ya existe
        `UPDATE fumigation_pdfs 
         SET pdf_data = $1, pdf_size = $2, has_map_image = $3, updated_at = NOW(),
             fumigation_date = $4, field_name = $5, crop = $6, applicator = $7, 
             total_surface = $8, surface_unit = $9
         WHERE fumigation_id = $10
         RETURNING id, created_at, updated_at` :
        // INSERT si no existe
        `INSERT INTO fumigation_pdfs 
         (fumigation_id, fumigation_date, field_name, crop, applicator, total_surface, 
          surface_unit, pdf_data, pdf_size, has_map_image)
         VALUES ($10, $4, $5, $6, $7, $8, $9, $1, $2, $3)
         RETURNING id, created_at, updated_at`;

      const params = [
        pdfBuffer,                                    // $1
        pdfBuffer.length,                             // $2  
        hasMapImage,                                  // $3
        fumigationData.date || new Date(),           // $4
        fumigationData.fieldName || null,            // $5
        fumigationData.crop || null,                 // $6
        fumigationData.applicator || null,           // $7
        fumigationData.totalSurface || null,         // $8
        fumigationData.surfaceUnit || 'ha',          // $9
        fumigationData.id                            // $10
      ];

      const result = await this.executeQuery(query, params);
      
      console.log('✅ PDF guardado exitosamente en Railway desde Electron');

      return {
        success: true,
        id: result.rows[0].id,
        fumigationId: fumigationData.id,
        action: existingPdf ? 'updated' : 'created',
        size: pdfBuffer.length
      };

    } catch (error) {
      console.error('❌ Error guardando PDF en Railway desde Electron:', error);
      throw new Error(`Error guardando PDF: ${error.message}`);
    }
  }

  // Descargar PDF desde Railway
  async downloadPdf(fumigationId) {
    try {
      console.log('📥 Descargando PDF desde Railway (Electron):', fumigationId);

      const query = `
        SELECT pdf_data, pdf_size, has_map_image, created_at, updated_at,
               field_name, crop, applicator, total_surface, surface_unit
        FROM fumigation_pdfs 
        WHERE fumigation_id = $1
      `;

      const result = await this.executeQuery(query, [fumigationId]);

      if (result.rows.length === 0) {
        throw new Error('PDF no encontrado en Railway');
      }

      const pdfData = result.rows[0];
      
      console.log('✅ PDF descargado exitosamente desde Railway (Electron)');

      return {
        success: true,
        pdfBuffer: pdfData.pdf_data,
        metadata: {
          fumigationId,
          size: pdfData.pdf_size,
          hasMapImage: pdfData.has_map_image,
          createdAt: pdfData.created_at,
          updatedAt: pdfData.updated_at,
          fieldName: pdfData.field_name,
          crop: pdfData.crop,
          applicator: pdfData.applicator,
          totalSurface: pdfData.total_surface,
          surfaceUnit: pdfData.surface_unit
        }
      };

    } catch (error) {
      console.error('❌ Error descargando PDF desde Railway (Electron):', error);
      throw new Error(`Error descargando PDF: ${error.message}`);
    }
  }

  // Verificar si existe PDF
  async pdfExists(fumigationId) {
    try {
      const query = `
        SELECT id, created_at, updated_at, pdf_size, has_map_image
        FROM fumigation_pdfs 
        WHERE fumigation_id = $1
      `;

      const result = await this.executeQuery(query, [fumigationId]);
      return result.rows.length > 0 ? result.rows[0] : null;

    } catch (error) {
      console.error('❌ Error verificando existencia de PDF:', error);
      return null;
    }
  }

  // Obtener metadatos del PDF
  async getPdfMetadata(fumigationId) {
    try {
      const query = `
        SELECT id, fumigation_id, fumigation_date, field_name, crop, applicator,
               total_surface, surface_unit, pdf_size, has_map_image, 
               created_at, updated_at
        FROM fumigation_pdfs 
        WHERE fumigation_id = $1
      `;

      const result = await this.executeQuery(query, [fumigationId]);
      return result.rows.length > 0 ? result.rows[0] : null;

    } catch (error) {
      console.error('❌ Error obteniendo metadatos:', error);
      return null;
    }
  }

  // Test de conexión
  async testConnection() {
    try {
      const result = await this.executeQuery('SELECT NOW() as current_time');
      console.log('✅ Test de conexión Railway exitoso desde Electron:', result.rows[0].current_time);
      return true;
    } catch (error) {
      console.error('❌ Test de conexión falló desde Electron:', error.message);
      return false;
    }
  }

  // Eliminar PDF
  async deletePdf(fumigationId) {
    try {
      console.log('🗑️ Eliminando PDF de Railway (Electron):', fumigationId);

      const query = `DELETE FROM fumigation_pdfs WHERE fumigation_id = $1 RETURNING id`;
      const result = await this.executeQuery(query, [fumigationId]);

      if (result.rows.length === 0) {
        throw new Error('PDF no encontrado para eliminar');
      }

      console.log('✅ PDF eliminado exitosamente de Railway (Electron)');
      return { success: true, id: result.rows[0].id };

    } catch (error) {
      console.error('❌ Error eliminando PDF:', error);
      throw new Error(`Error eliminando PDF: ${error.message}`);
    }
  }
}

// Exportar instancia singleton
const railwayService = new ElectronRailwayService();

module.exports = railwayService;