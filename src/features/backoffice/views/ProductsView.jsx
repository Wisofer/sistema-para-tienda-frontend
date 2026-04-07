import React from "react";
import { BackofficePageShell, BackofficeStatCardsListSkeleton } from "../components/index.js";
import { ConfirmModal } from "../../../components/ui/ConfirmModal.jsx";
import { CategoriesView } from "./CategoriesView.jsx";

// Hook personalizado
import { useInventory } from "../hooks/useInventory.js";

// Componentes modulares
import { InventoryHeader } from "../components/inventory/InventoryHeader.jsx";
import { ProductGrid } from "../components/inventory/ProductGrid.jsx";
import { ProductFormModal } from "../components/inventory/ProductFormModal.jsx";
import { StockMovementModal } from "../components/inventory/StockMovementModal.jsx";
import { 
  GlobalMovementsModal, 
  ProductHistoryModal 
} from "../components/inventory/InventoryHistoryModals.jsx";

/**
 * Vista principal de Inventario (Refactorizada).
 * Ahora actúa como un orquestador que utiliza el hook useInventory 
 * y componentes especializados para cumplir con las reglas de Clean Code.
 * 
 * Lineas aproximadas: < 150 (Reducción de ~1000 líneas).
 */
export function ProductsView({ currencySymbol = "C$" }) {
  const {
    products,
    categories,
    providers,
    loading,
    saving,
    error,
    search,
    setSearch,
    selectedCategory,
    onCategoryChange,
    filteredProducts,
    removeProduct,
    exportProductsExcel,
    reloadCategoriesOnly,
    modalOpen,
    setModalOpen,
    openCreate,
    openEdit,
    saveProduct,
    form,
    setForm,
    stockModalOpen,
    setStockModalOpen,
    openStockModal,
    submitStockAction,
    stockForm,
    setStockForm,
    stockMode,
    stockProductQuery,
    setStockProductQuery,
    stockSuggestOpen,
    setStockSuggestOpen,
    stockSuggestBlurTimerRef,
    stockAutocompleteList,
    selectedStockProduct,
    movementModalOpen,
    setMovementModalOpen,
    openGlobalMovements,
    movementRows,
    movementProductLookup,
    productHistoryModalOpen,
    setProductHistoryModalOpen,
    openProductHistory,
    historyRows,
    selectedProductName,
    categoriesScreen,
    setCategoriesScreen,
    confirmAction,
    setConfirmAction,
    addVariant,
    removeVariant,
    updateVariant,
    gridColumns,
    setGridColumns,
  } = useInventory(currencySymbol);

  // Pantalla de carga
  if (loading) {
    return <BackofficeStatCardsListSkeleton listRows={8} maxWidth="7xl" />;
  }

  // Vista de gestión de categorías (sub-vista)
  if (categoriesScreen) {
    return (
      <CategoriesView
        onBackToProducts={() => setCategoriesScreen(false)}
        onOpenProducts={async (categoriaId) => {
          setCategoriesScreen(false);
          const id = categoriaId ? String(categoriaId) : "";
          await onCategoryChange(id);
          await reloadCategoriesOnly();
        }}
        onCategoriesMutated={reloadCategoriesOnly}
      />
    );
  }

  return (
    <BackofficePageShell maxWidth="7xl" className="space-y-4">
      {/* Mensaje de Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 1. Encabezado: Búsqueda, Filtros y Acciones */}
      <InventoryHeader
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        categories={categories}
        openCreate={openCreate}
        openStockModal={openStockModal}
        openGlobalMovements={openGlobalMovements}
        exportProductsExcel={exportProductsExcel}
        setCategoriesScreen={setCategoriesScreen}
        saving={saving}
        gridColumns={gridColumns}
        setGridColumns={setGridColumns}
      />

      {/* 2. Listado de Productos (Cuadrícula) */}
      <ProductGrid
        products={filteredProducts}
        currencySymbol={currencySymbol}
        openEdit={openEdit}
        openProductHistory={openProductHistory}
        setConfirmAction={setConfirmAction}
        gridColumns={gridColumns}
      />

      {/* --- MODALES --- */}

      {/* Formulario de Producto (Crear/Editar) */}
      <ProductFormModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        saving={saving}
        form={form}
        setForm={setForm}
        saveProduct={saveProduct}
        categories={categories}
        providers={providers}
      />

      {/* Entrada/Salida/Ajuste de Stock */}
      <StockMovementModal
        stockModalOpen={stockModalOpen}
        setStockModalOpen={setStockModalOpen}
        saving={saving}
        stockMode={stockMode}
        submitStockAction={submitStockAction}
        stockProductQuery={stockProductQuery}
        setStockProductQuery={setStockProductQuery}
        stockSuggestOpen={stockSuggestOpen}
        setStockSuggestOpen={setStockSuggestOpen}
        stockSuggestBlurTimerRef={stockSuggestBlurTimerRef}
        stockAutocompleteList={stockAutocompleteList}
        selectedStockProduct={selectedStockProduct}
        stockForm={stockForm}
        setStockForm={setStockForm}
      />

      {/* Historial Global de Movimientos */}
      <GlobalMovementsModal
        open={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        movementRows={movementRows}
        movementProductLookup={movementProductLookup}
      />

      {/* Historial de un Producto */}
      <ProductHistoryModal
        open={productHistoryModalOpen}
        onClose={() => setProductHistoryModalOpen(false)}
        historyRows={historyRows}
        selectedProductName={selectedProductName}
      />

      {/* Confirmación de Desactivación */}
      {confirmAction.open && (
        <ConfirmModal
          open={confirmAction.open}
          title={confirmAction.type === "product" ? "Desactivar Producto" : "Eliminar"}
          description={`¿Estás seguro que deseas desactivar el producto "${confirmAction.name}"? Seguirá apareciendo en reportes históricos pero no en el POS.`}
          onConfirm={() => {
            removeProduct(confirmAction.id);
            setConfirmAction({ open: false, type: "", id: null, name: "" });
          }}
          onClose={() => setConfirmAction({ open: false, type: "", id: null, name: "" })}
        />
      )}
    </BackofficePageShell>
  );
}
