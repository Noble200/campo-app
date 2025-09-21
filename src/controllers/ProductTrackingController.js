// src/controllers/ProductTrackingController.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStock } from '../contexts/StockContext';
import { useFumigations } from '../contexts/FumigationContext';
import { useHarvests } from '../contexts/HarvestContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useTransfers } from '../contexts/TransferContext';
import { usePurchases } from '../contexts/PurchaseContext';

const useProductTrackingController = () => {
  const { 
    products = [], 
    warehouses = [], 
    loading: stockLoading,
    error: stockError,
    loadProducts,
    loadWarehouses
  } = useStock();
  
  const {
    fumigations = [],
    loading: fumigationsLoading,
    error: fumigationsError,
    loadFumigations
  } = useFumigations();

  const {
    harvests = [],
    loading: harvestsLoading,
    error: harvestsError,
    loadHarvests
  } = useHarvests();

  const {
    expenses = [],
    loading: expensesLoading,
    error: expensesError,
    loadExpenses
  } = useExpenses();

  const {
    transfers = [],
    loading: transfersLoading,
    error: transfersError,
    loadTransfers
  } = useTransfers();

  const {
    purchases = [],
    loading: purchasesLoading,
    error: purchasesError,
    loadPurchases
  } = usePurchases();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  
  // Estados de loading y error generales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Función para combinar todas las actividades de productos
  const productActivities = useMemo(() => {
    const activities = [];

    // Fumigaciones - productos utilizados
    fumigations.forEach(fumigation => {
      if (fumigation.selectedProducts && fumigation.status === 'completed') {
        fumigation.selectedProducts.forEach(selectedProd => {
          const product = products.find(p => p.id === selectedProd.productId);
          if (product) {
            activities.push({
              id: `fumigation-${fumigation.id}-${selectedProd.productId}`,
              type: 'fumigation',
              typeLabel: 'Fumigación',
              typeIcon: 'fas fa-spray-can',
              typeColor: '#FF9800',
              productId: product.id,
              productName: product.name,
              productUnit: product.unit,
              quantityUsed: selectedProd.quantity || 0,
              currentStock: product.stock || 0,
              warehouseId: fumigation.warehouseId,
              warehouseName: getWarehouseName(fumigation.warehouseId),
              date: fumigation.applicationDate 
                ? (fumigation.applicationDate.seconds 
                  ? new Date(fumigation.applicationDate.seconds * 1000) 
                  : new Date(fumigation.applicationDate))
                : new Date(),
              user: fumigation.applicator || fumigation.createdBy || 'Usuario desconocido',
              activity: `Fumigación en ${fumigation.establishment || 'establecimiento'} - ${fumigation.crop || 'cultivo'}`,
              details: {
                establishment: fumigation.establishment,
                crop: fumigation.crop,
                orderNumber: fumigation.orderNumber,
                totalSurface: fumigation.totalSurface,
                field: fumigation.field?.name
              }
            });
          }
        });
      }
    });

    // Cosechas - productos utilizados
    harvests.forEach(harvest => {
      if (harvest.products && harvest.status === 'completed') {
        harvest.products.forEach(harvestProd => {
          const product = products.find(p => p.id === harvestProd.productId);
          if (product && harvestProd.used > 0) {
            activities.push({
              id: `harvest-${harvest.id}-${harvestProd.productId}`,
              type: 'harvest',
              typeLabel: 'Cosecha',
              typeIcon: 'fas fa-wheat-awn',
              typeColor: '#4CAF50',
              productId: product.id,
              productName: product.name,
              productUnit: product.unit,
              quantityUsed: harvestProd.used || 0,
              currentStock: product.stock || 0,
              warehouseId: harvest.warehouseId,
              warehouseName: getWarehouseName(harvest.warehouseId),
              date: harvest.executionDate 
                ? (harvest.executionDate.seconds 
                  ? new Date(harvest.executionDate.seconds * 1000) 
                  : new Date(harvest.executionDate))
                : new Date(),
              user: harvest.supervisor || harvest.createdBy || 'Usuario desconocido',
              activity: `Cosecha en ${harvest.field || 'campo'} - ${harvest.crop || 'cultivo'}`,
              details: {
                field: harvest.field,
                crop: harvest.crop,
                quantity: harvest.quantity,
                harvestNumber: harvest.harvestNumber
              }
            });
          }
        });
      }
    });

    // Gastos/Ventas - productos vendidos o utilizados
    expenses.forEach(expense => {
      if (expense.products && expense.status === 'completed') {
        expense.products.forEach(expenseProd => {
          const product = products.find(p => p.id === expenseProd.productId);
          if (product) {
            activities.push({
              id: `expense-${expense.id}-${expenseProd.productId}`,
              type: expense.type === 'sale' ? 'sale' : 'expense',
              typeLabel: expense.type === 'sale' ? 'Venta' : 'Gasto',
              typeIcon: expense.type === 'sale' ? 'fas fa-money-bill-wave' : 'fas fa-receipt',
              typeColor: expense.type === 'sale' ? '#2196F3' : '#9C27B0',
              productId: product.id,
              productName: product.name,
              productUnit: product.unit,
              quantityUsed: expenseProd.quantity || 0,
              currentStock: product.stock || 0,
              warehouseId: expense.warehouseId,
              warehouseName: getWarehouseName(expense.warehouseId),
              date: expense.date 
                ? (expense.date.seconds 
                  ? new Date(expense.date.seconds * 1000) 
                  : new Date(expense.date))
                : new Date(),
              user: expense.responsiblePerson || expense.createdBy || 'Usuario desconocido',
              activity: `${expense.type === 'sale' ? 'Venta' : 'Gasto'} - ${expense.description || 'Sin descripción'}`,
              details: {
                description: expense.description,
                totalAmount: expense.totalAmount,
                supplier: expense.supplier || expense.customer
              }
            });
          }
        });
      }
    });

    // Transferencias - productos movidos (solo completadas)
    transfers.forEach(transfer => {
      if (transfer.products && transfer.status === 'completed') {
        transfer.products.forEach(transferProd => {
          const product = products.find(p => p.id === transferProd.productId);
          if (product) {
            activities.push({
              id: `transfer-${transfer.id}-${transferProd.productId}`,
              type: 'transfer',
              typeLabel: 'Transferencia',
              typeIcon: 'fas fa-exchange-alt',
              typeColor: '#607D8B',
              productId: product.id,
              productName: product.name,
              productUnit: product.unit,
              quantityUsed: transferProd.quantity || 0,
              currentStock: product.stock || 0,
              warehouseId: transfer.targetWarehouseId,
              warehouseName: getWarehouseName(transfer.targetWarehouseId),
              date: transfer.completedDate 
                ? (transfer.completedDate.seconds 
                  ? new Date(transfer.completedDate.seconds * 1000) 
                  : new Date(transfer.completedDate))
                : new Date(),
              user: transfer.approvedBy || transfer.createdBy || 'Usuario desconocido',
              activity: `Transferencia desde ${getWarehouseName(transfer.sourceWarehouseId)} a ${getWarehouseName(transfer.targetWarehouseId)}`,
              details: {
                sourceWarehouse: getWarehouseName(transfer.sourceWarehouseId),
                targetWarehouse: getWarehouseName(transfer.targetWarehouseId),
                transferNumber: transfer.transferNumber
              }
            });
          }
        });
      }
    });

    // Compras - productos recibidos (solo completadas)
    purchases.forEach(purchase => {
      if (purchase.products && purchase.status === 'completed') {
        purchase.products.forEach(purchaseProd => {
          const product = products.find(p => p.id === purchaseProd.productId);
          if (product) {
            activities.push({
              id: `purchase-${purchase.id}-${purchaseProd.productId}`,
              type: 'purchase',
              typeLabel: 'Compra',
              typeIcon: 'fas fa-shopping-cart',
              typeColor: '#795548',
              productId: product.id,
              productName: product.name,
              productUnit: product.unit,
              quantityUsed: -(purchaseProd.receivedQuantity || 0), // Negativo porque es ingreso
              currentStock: product.stock || 0,
              warehouseId: purchase.warehouseId,
              warehouseName: getWarehouseName(purchase.warehouseId),
              date: purchase.receivedDate 
                ? (purchase.receivedDate.seconds 
                  ? new Date(purchase.receivedDate.seconds * 1000) 
                  : new Date(purchase.receivedDate))
                : new Date(),
              user: purchase.receivedBy || purchase.createdBy || 'Usuario desconocido',
              activity: `Compra recibida de ${purchase.supplier || 'proveedor'}`,
              details: {
                supplier: purchase.supplier,
                orderNumber: purchase.orderNumber,
                invoiceNumber: purchase.invoiceNumber
              }
            });
          }
        });
      }
    });

    return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [fumigations, harvests, expenses, transfers, purchases, products, warehouses]);

  // Función para obtener nombre del almacén
  const getWarehouseName = useCallback((warehouseId) => {
    if (!warehouseId || !Array.isArray(warehouses)) {
      return 'Almacén desconocido';
    }
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Almacén desconocido';
  }, [warehouses]);

  // Filtrar actividades
  const filteredActivities = useMemo(() => {
    let filtered = [...productActivities];

    // Filtro por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.productName.toLowerCase().includes(term) ||
        activity.activity.toLowerCase().includes(term) ||
        activity.user.toLowerCase().includes(term) ||
        activity.warehouseName.toLowerCase().includes(term)
      );
    }

    // Filtro por producto específico
    if (selectedProduct) {
      filtered = filtered.filter(activity => activity.productId === selectedProduct);
    }

    // Filtro por tipo de actividad
    if (selectedActivity !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedActivity);
    }

    // Filtro por almacén
    if (selectedWarehouse) {
      filtered = filtered.filter(activity => activity.warehouseId === selectedWarehouse);
    }

    // Filtro por rango de fechas
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);
      filtered = filtered.filter(activity => new Date(activity.date) >= limitDate);
    }

    return filtered;
  }, [productActivities, searchTerm, selectedProduct, selectedActivity, selectedWarehouse, dateRange]);

  // Estadísticas
  const stats = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentActivities = productActivities.filter(
      activity => new Date(activity.date) >= last30Days
    );

    return {
      totalActivities: productActivities.length,
      recentActivities: recentActivities.length,
      fumigationsCount: recentActivities.filter(a => a.type === 'fumigation').length,
      harvestsCount: recentActivities.filter(a => a.type === 'harvest').length,
      salesCount: recentActivities.filter(a => a.type === 'sale').length,
      expensesCount: recentActivities.filter(a => a.type === 'expense').length,
      transfersCount: recentActivities.filter(a => a.type === 'transfer').length,
      purchasesCount: recentActivities.filter(a => a.type === 'purchase').length
    };
  }, [productActivities]);

  // Evaluar estados de carga y error
  useEffect(() => {
    const isLoading = stockLoading || fumigationsLoading || harvestsLoading || 
                     expensesLoading || transfersLoading || purchasesLoading;
    setLoading(isLoading);
    
    if (stockError) {
      setError(stockError);
    } else if (fumigationsError) {
      setError(fumigationsError);
    } else if (harvestsError) {
      setError(harvestsError);
    } else if (expensesError) {
      setError(expensesError);
    } else if (transfersError) {
      setError(transfersError);
    } else if (purchasesError) {
      setError(purchasesError);
    } else {
      setError('');
    }
  }, [stockLoading, fumigationsLoading, harvestsLoading, expensesLoading, 
      transfersLoading, purchasesLoading, stockError, fumigationsError, 
      harvestsError, expensesError, transfersError, purchasesError]);

  // Función para recargar datos
  const refreshData = useCallback(async () => {
    try {
      setError('');
      await Promise.all([
        loadProducts(),
        loadWarehouses(),
        loadFumigations(),
        loadHarvests(),
        loadExpenses(),
        loadTransfers(),
        loadPurchases()
      ]);
    } catch (err) {
      console.error('Error al recargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    }
  }, [loadProducts, loadWarehouses, loadFumigations, loadHarvests, 
      loadExpenses, loadTransfers, loadPurchases]);

  // Cargar datos al montar el componente
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    // Datos
    products,
    warehouses,
    productActivities,
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
    refreshData,
    getWarehouseName
  };
};

export default useProductTrackingController;