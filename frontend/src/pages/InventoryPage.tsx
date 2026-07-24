import { useMemo, useState } from "react";
import { Search, Plus, PackageSearch } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { ProductCard } from "../components/inventory/ProductCard";
import { StockAlert } from "../components/inventory/StockAlert";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { EmptyState } from "../components/common/EmptyState";
import { useApp } from "../context/AppContext";
import type { InventoryFilter, Product } from "../types/inventory";

const filterTabs: { value: InventoryFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "disponible", label: "Disponible" },
  { value: "stock_bajo", label: "Stock bajo" },
  { value: "agotado", label: "Agotado" },
];

const categories = ["Bebidas", "Abarrotes", "Lácteos", "Limpieza", "Snacks"];

export function InventoryPage() {
  const { products, setProducts } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InventoryFilter>("todos");
  const [addOpen, setAddOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(categories[0]);
  const [newStock, setNewStock] = useState("");
  const [newMin, setNewMin] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery = p.nombre
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      const matchesFilter = filter === "todos" || p.estado === filter;
      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter]);

  const bajos = products.filter((p) => p.estado === "stock_bajo").length;
  const agotados = products.filter((p) => p.estado === "agotado").length;

  const handleAdd = () => {
    const stock = Number(newStock);
    const min = Number(newMin);
    const price = Number(newPrice);
    if (!newName.trim() || isNaN(stock) || isNaN(min) || isNaN(price)) return;

    const estado: Product["estado"] =
      stock === 0 ? "agotado" : stock < min ? "stock_bajo" : "disponible";

    const newProduct: Product = {
      id: Math.max(0, ...products.map((p) => p.id)) + 1,
      nombre: newName.trim(),
      categoria: newCategory,
      stock_actual: stock,
      stock_minimo: min,
      precio: price,
      estado,
    };
    setProducts((prev) => [...prev, newProduct]);
    setNewName("");
    setNewStock("");
    setNewMin("");
    setNewPrice("");
    setAddOpen(false);
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Inventario</h1>
          <p className="text-sm text-ink-soft">
            {products.length} productos en total
          </p>
        </div>

        <StockAlert bajos={bajos} agotados={agotados} />

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto..."
            aria-label="Buscar producto"
            className="w-full rounded-xl border border-line-strong bg-surface-elevated pl-10 pr-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium min-h-[40px] transition-colors ${
                filter === tab.value
                  ? "bg-primary-600 text-white"
                  : "bg-surface-elevated border border-line text-ink-soft hover:bg-surface-alt"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<PackageSearch size={32} />}
            title="Sin productos"
            description="No hay productos que coincidan con tu búsqueda."
          />
        )}

        <Button variant="outline" fullWidth size="lg" onClick={() => setAddOpen(true)}>
          <Plus size={20} />
          Agregar producto
        </Button>
      </div>

      <Modal
        open={addOpen}
        title="Agregar producto"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Button variant="outline" fullWidth onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button
              fullWidth
              onClick={handleAdd}
              disabled={
                !newName.trim() ||
                newStock === "" ||
                newMin === "" ||
                newPrice === ""
              }
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="np-name" className="block text-sm font-semibold text-ink mb-1.5">
              Nombre
            </label>
            <input
              id="np-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Galleta soda"
              className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="np-cat" className="block text-sm font-semibold text-ink mb-1.5">
              Categoría
            </label>
            <select
              id="np-cat"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="np-stock" className="block text-sm font-semibold text-ink mb-1.5">
                Stock actual
              </label>
              <input
                id="np-stock"
                type="number"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="np-min" className="block text-sm font-semibold text-ink mb-1.5">
                Stock mínimo
              </label>
              <input
                id="np-min"
                type="number"
                min={0}
                value={newMin}
                onChange={(e) => setNewMin(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="np-price" className="block text-sm font-semibold text-ink mb-1.5">
              Precio (S/)
            </label>
            <input
              id="np-price"
              type="number"
              min={0}
              step={0.5}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
            />
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
