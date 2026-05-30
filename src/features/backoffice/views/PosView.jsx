import React, { useState } from "react";
import { PosProductOpcionesModal, PosProcesarVentaModal, PosVariantModal } from "../components/index.js";
import { PosCartFloatingFab } from "../components/pos/PosCartFloatingFab.jsx";

// Hook personalizado
import { usePOS } from "../hooks/usePOS.js";

// Componentes modulares
import { PosHeader } from "../components/pos/PosHeader.jsx";
import { PosCatalog } from "../components/pos/PosCatalog.jsx";
import { PosCartSidebar } from "../components/pos/PosCartSidebar.jsx";
import { PosMobileNav } from "../components/pos/PosMobileNav.jsx";

/**
 * Vista principal del Punto de Venta (POS) - Refactorizada.
 * Orquestador principal que utiliza el hook usePOS y componentes especializados.
 * 
 * Lineas aproximadas: < 150 (Reducción de ~567 líneas).
 */
export function PosView({ currencySymbol = "C$" }) {
  const {
    loading,
    catalogSearchLoading,
    categories,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
    filteredProducts,
    cart,
    addToCart,
    handleUpdateQty,
    handleRemoveFromCart,
    handleClearCart,
    subtotal,
    cajaAbierta,
    actionBusy,
    isOnline,
    mobileTab,
    setMobileTab,
    handleCheckout,
    saleModalOpen,
    setSaleModalOpen,
    saleModalLines,
    saleBackendTotal,
    saleProcessing,
    onPaymentComplete,
    exchangeRate,
    opcionesModal,
    setOpcionesModal,
    variantModal,
    setVariantModal,
    addVariantToCart,
    addToCartWithOpcionesSeleccion,
  } = usePOS(currencySymbol);

  /** Escritorio: carrito anclado a la derecha; al minimizar, catálogo a ancho completo + botón flotante. */
  const [cartDocked, setCartDocked] = useState(true);
  const cartUnits = cart.reduce((s, x) => s + Number(x.qty || 0), 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 overflow-hidden lg:flex-row">
      
      {/* 1. Sección Izquierda: Catálogo de Productos */}
      <section className={`flex flex-1 flex-col overflow-hidden lg:rounded-2xl lg:border lg:border-slate-200 bg-white shadow-sm ${
        mobileTab !== "products" ? "hidden lg:flex" : "flex"
      }`}>
        {/* Buscador y Categorías */}
        <PosHeader
          search={search}
          setSearch={setSearch}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Grilla de Productos */}
        <div className="flex-1 content-start gap-4 overflow-y-auto p-4 hide-scrollbar">
          <PosCatalog
            products={filteredProducts}
            catalogLoading={loading || catalogSearchLoading}
            currencySymbol={currencySymbol}
            addToCart={addToCart}
            cajaAbierta={cajaAbierta}
            actionBusy={actionBusy}
          />
        </div>
      </section>

      {/* 2. Sección Derecha: Carrito / Resumen de Orden */}
      <section
        className={`flex w-full flex-col overflow-hidden bg-white shadow-sm lg:w-96 lg:rounded-2xl lg:border lg:border-slate-200 ${
          mobileTab === "products"
            ? cartDocked
              ? "hidden lg:flex"
              : "hidden"
            : `${cartDocked ? "flex lg:flex" : "flex lg:hidden"}`
        }`}
      >
        <PosCartSidebar
          cart={cart}
          handleUpdateQty={handleUpdateQty}
          handleRemoveFromCart={handleRemoveFromCart}
          handleClearCart={handleClearCart}
          handleCheckout={handleCheckout}
          subtotal={subtotal}
          currencySymbol={currencySymbol}
          actionBusy={actionBusy}
          isOnline={isOnline}
          cajaAbierta={cajaAbierta}
          onRequestMinimize={() => setCartDocked(false)}
        />
      </section>

      {!cartDocked ? (
        <PosCartFloatingFab cartCount={cartUnits} onOpenCart={() => setCartDocked(true)} />
      ) : null}

      {/* 3. Navegación Móvil (Bottom Bar) */}
      <PosMobileNav mobileTab={mobileTab} setMobileTab={setMobileTab} cartCount={cartUnits} />

      {/* --- MODALES --- */}

      {variantModal.open && (
        <PosVariantModal
          open={variantModal.open}
          product={variantModal.product}
          currencySymbol={currencySymbol}
          onClose={() => setVariantModal({ open: false, product: null })}
          onSelectVariant={(variant) => addVariantToCart(variantModal.product, variant)}
        />
      )}

      {/* Modal de Opciones de Producto (Tallas/Extras) */}
      {opcionesModal.open && (
        <PosProductOpcionesModal
          open={opcionesModal.open}
          product={opcionesModal.product}
          currencySymbol={currencySymbol}
          onClose={() => setOpcionesModal({ open: false, product: null })}
          onConfirm={(opcionesSeleccionadas) => {
            addToCartWithOpcionesSeleccion(opcionesModal.product, opcionesSeleccionadas);
            setOpcionesModal({ open: false, product: null });
          }}
        />
      )}

      {/* Modal de Cobro / Procesamiento de Venta */}
      {saleModalOpen && (
        <PosProcesarVentaModal
          open={saleModalOpen}
          lines={saleModalLines}
          totalOrdenBackend={saleBackendTotal}
          exchangeRate={exchangeRate}
          busy={saleProcessing}
          onClose={() => setSaleModalOpen(false)}
          onGuardar={onPaymentComplete}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
