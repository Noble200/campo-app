// src/components/panels/ProductTracking/ProductTrackingPanel.js
import React from 'react';
import useProductTrackingController from '../../../controllers/ProductTrackingController';
import './productTracking.css';

const ProductTrackingPanel = () => {
  const {
    // Datos
    products,
    warehouses,
    filteredActivities,
    stats,
    
    // Estados
    loading,
    error,
    
    // Filtros
    searchTerm,
    setSearchTerm,
    selectedProduct,
    setSelectedProduct,
    selectedActivity,
    setSelectedActivity,
    selectedWarehouse,
    setSelectedWarehouse,
    dateRange,
    setDateRange,
    
    // Funciones
    refreshData
  } = useProductTrackingController();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatQuantity = (quantity, unit) => {
    const absQuantity = Math.abs(quantity || 0);
    const prefix = quantity < 0 ? '+' : '-';
    return `${prefix}${absQuantity.toLocaleString('es-ES', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })} ${unit || ''}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando seguimiento de productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={refreshData}>
          <i className="fas fa-retry"></i>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header del panel */}
      <div className="panel-header">
        <div className="panel-title-section">
          <h1 className="panel-title">
            <i className="fas fa-search-plus"></i>
            Seguimiento de Productos
          </h1>
          <p className="panel-subtitle">
            Seguimiento rápido de todos los productos utilizados en la aplicación
          </p>
        </div>
        
        <div className="panel-actions">
          <button className="btn btn-outline" onClick={refreshData}>
            <i className="fas fa-sync-alt"></i>
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-list-alt"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalActivities}</div>
            <div className="stat-label">Total actividades</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon recent">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.recentActivities}</div>
            <div className="stat-label">Últimos 30 días</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon fumigation">
            <i className="fas fa-spray-can"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.fumigationsCount}</div>
            <div className="stat-label">Fumigaciones</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon harvest">
            <i className="fas fa-wheat-awn"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.harvestsCount}</div>
            <div className="stat-label">Cosechas</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="form-group">
            <label className="form-label">Buscar</label>
            <div className="input-icon-wrapper">
              <i className="fas fa-search input-icon"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por producto, actividad, usuario o almacén..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Producto</label>
            <select
              className="form-control"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Todos los productos</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Almacén</label>
            <select
              className="form-control"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              <option value="">Todos los almacenes</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de actividad</label>
            <select
              className="form-control"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
            >
              <option value="all">Todas las actividades</option>
              <option value="fumigation">Fumigaciones</option>
              <option value="harvest">Cosechas</option>
              <option value="sale">Ventas</option>
              <option value="expense">Gastos</option>
              <option value="transfer">Transferencias</option>
              <option value="purchase">Compras</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Período</label>
            <select
              className="form-control"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="365">Último año</option>
              <option value="all">Todo el período</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">&nbsp;</label>
            <button 
              className="btn btn-outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedProduct('');
                setSelectedActivity('all');
                setSelectedWarehouse('');
                setDateRange('30');
              }}
            >
              <i className="fas fa-times"></i>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de actividades */}
      <div className="activities-container">
        <div className="section-header">
          <h3>
            <i className="fas fa-history"></i>
            Historial de Uso ({filteredActivities.length})
          </h3>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-search"></i>
            </div>
            <h3>No se encontraron actividades</h3>
            <p>No hay actividades que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="activities-list">
            {filteredActivities.map(activity => (
              <div key={activity.id} className="activity-card">
                <div className="activity-header">
                  <div className="activity-type">
                    <div 
                      className="activity-type-icon"
                      style={{ backgroundColor: activity.typeColor }}
                    >
                      <i className={activity.typeIcon}></i>
                    </div>
                    <span className="activity-type-label">{activity.typeLabel}</span>
                  </div>
                  <div className="activity-date">
                    {formatDate(activity.date)}
                  </div>
                </div>

                <div className="activity-body">
                  <div className="product-info">
                    <div className="product-name">
                      <i className="fas fa-box"></i>
                      {activity.productName}
                    </div>
                    <div className="activity-description">
                      {activity.activity}
                    </div>
                    <div className="warehouse-info">
                      <i className="fas fa-warehouse"></i>
                      {activity.warehouseName}
                    </div>
                  </div>

                  <div className="quantity-info">
                    <div className="quantity-used">
                      <span className="quantity-label">
                        {activity.type === 'purchase' ? 'Recibido:' : 'Usado:'}
                      </span>
                      <span className={`quantity-value ${activity.type === 'purchase' ? 'received' : 'used'}`}>
                        {formatQuantity(activity.quantityUsed, activity.productUnit)}
                      </span>
                    </div>
                    <div className="quantity-current">
                      <span className="quantity-label">Stock actual:</span>
                      <span className="quantity-value current">
                        {formatQuantity(activity.currentStock, activity.productUnit).replace(/^[-+]/, '')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="activity-footer">
                  <div className="user-info">
                    <i className="fas fa-user"></i>
                    {activity.user}
                  </div>
                  
                  {activity.details && (
                    <div className="activity-details">
                      {activity.details.establishment && (
                        <span className="detail-item">
                          <i className="fas fa-map-marker-alt"></i>
                          {activity.details.establishment}
                        </span>
                      )}
                      {activity.details.field && (
                        <span className="detail-item">
                          <i className="fas fa-seedling"></i>
                          {activity.details.field}
                        </span>
                      )}
                      {activity.details.crop && (
                        <span className="detail-item">
                          <i className="fas fa-leaf"></i>
                          {activity.details.crop}
                        </span>
                      )}
                      {activity.details.supplier && (
                        <span className="detail-item">
                          <i className="fas fa-truck"></i>
                          {activity.details.supplier}
                        </span>
                      )}
                      {activity.details.sourceWarehouse && activity.type === 'transfer' && (
                        <span className="detail-item">
                          <i className="fas fa-arrow-right"></i>
                          De: {activity.details.sourceWarehouse}
                        </span>
                      )}
                      {activity.details.orderNumber && (
                        <span className="detail-item">
                          <i className="fas fa-hashtag"></i>
                          {activity.details.orderNumber}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductTrackingPanel;