import { useEffect, useMemo, useState } from "react";
import { Search, Plus, PackageSearch } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { ProductCard } from "../components/inventory/ProductCard";
import { StockAlert } from "../components/inventory/StockAlert";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { EmptyState } from "../components/common/EmptyState";
import { useApp } from "../context/AppContext";
import type { InventoryFilter, Product } from "../types/inventory";
import { obtenerInventario } from "../services/api";


const filterTabs: {
  value: InventoryFilter;
  label: string;
}[] = [
  { value: "todos", label: "Todos" },
  { value: "disponible", label: "Disponible" },
  { value: "stock_bajo", label: "Stock bajo" },
  { value: "agotado", label: "Agotado" },
];


const categories = [
  "Bebidas",
  "Abarrotes",
  "Lácteos",
  "Limpieza",
  "Snacks",
];


export function InventoryPage() {
  const { products, setProducts } = useApp();

  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<InventoryFilter>("todos");

  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] =
    useState(categories[0]);
  const [newStock, setNewStock] = useState("");
  const [newMin, setNewMin] = useState("");
  const [newPrice, setNewPrice] = useState("");


  // --------------------------------
  // Cargar inventario desde FastAPI
  // --------------------------------

  useEffect(() => {
  async function cargarInventario() {
    try {
      setLoading(true);
      setError("");

      const data = await obtenerInventario();

      setProducts(data);
    } catch (error) {
      console.error(
        "No se pudo cargar el inventario:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  cargarInventario();
}, [setProducts]);


  // --------------------------------
  // Filtros y búsqueda
  // --------------------------------

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.nombre
        .toLowerCase()
        .includes(
          query.trim().toLowerCase()
        );

      const matchesFilter =
        filter === "todos"
        || product.estado === filter;

      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter]);


  const bajos = products.filter(
    (product) =>
      product.estado === "stock_bajo"
  ).length;

  const agotados = products.filter(
    (product) =>
      product.estado === "agotado"
  ).length;


  // --------------------------------
  // Agregar producto localmente
  // --------------------------------

  const handleAdd = () => {
    const stock = Number(newStock);
    const min = Number(newMin);
    const price = Number(newPrice);

    if (
      !newName.trim()
      || Number.isNaN(stock)
      || Number.isNaN(min)
      || Number.isNaN(price)
    ) {
      return;
    }

    const estado: Product["estado"] =
      stock === 0
        ? "agotado"
        : stock <= min
          ? "stock_bajo"
          : "disponible";

    const newProduct: Product = {
      id:
        Math.max(
          0,
          ...products.map(
            (product) => product.id
          )
        ) + 1,
      nombre: newName.trim(),
      categoria: newCategory,
      stock_actual: stock,
      stock_minimo: min,
      precio: price,
      estado,
    };

    setProducts(
      (previousProducts) => [
        ...previousProducts,
        newProduct,
      ]
    );

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
          <h1 className="text-2xl font-bold text-ink">
            Inventario
          </h1>

          <p className="text-sm text-ink-soft">
            {products.length} productos en total
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-line bg-surface-elevated p-4">
            <p className="text-sm text-ink-soft">
              Cargando inventario...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            <StockAlert
              bajos={bajos}
              agotados={agotados}
            />

            <div className="relative">
              <Search
                size={18}
                className="
                  absolute left-3 top-1/2
                  -translate-y-1/2
                  text-ink-muted
                "
                aria-hidden="true"
              />

              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Buscar producto..."
                aria-label="Buscar producto"
                className="
                  w-full rounded-xl
                  border border-line-strong
                  bg-surface-elevated
                  pl-10 pr-4 py-3
                  text-base text-ink
                  focus:border-primary-500
                  outline-none
                "
              />
            </div>

            <div
              className="
                flex gap-2 overflow-x-auto
                no-scrollbar -mx-1 px-1
              "
            >
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    setFilter(tab.value)
                  }
                  className={`
                    shrink-0 rounded-full
                    px-4 py-2 text-sm
                    font-medium min-h-[40px]
                    transition-colors
                    ${
                      filter === tab.value
                        ? "bg-primary-600 text-white"
                        : `
                          bg-surface-elevated
                          border border-line
                          text-ink-soft
                          hover:bg-surface-alt
                        `
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={
                  <PackageSearch size={32} />
                }
                title="Sin productos"
                description={
                  "No hay productos que coincidan con tu búsqueda."
                }
              />
            )}

            <Button
              variant="outline"
              fullWidth
              size="lg"
              onClick={() =>
                setAddOpen(true)
              }
            >
              <Plus size={20} />
              Agregar producto
            </Button>
          </>
        )}
      </div>

      <Modal
        open={addOpen}
        title="Agregar producto"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Button
              variant="outline"
              fullWidth
              onClick={() =>
                setAddOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              fullWidth
              onClick={handleAdd}
              disabled={
                !newName.trim()
                || newStock === ""
                || newMin === ""
                || newPrice === ""
              }
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="np-name"
              className="
                block text-sm font-semibold
                text-ink mb-1.5
              "
            >
              Nombre
            </label>

            <input
              id="np-name"
              type="text"
              value={newName}
              onChange={(event) =>
                setNewName(event.target.value)
              }
              placeholder="Ej. Galleta soda"
              className="
                w-full rounded-xl
                border border-line-strong
                bg-surface-elevated
                px-4 py-3 text-base text-ink
                focus:border-primary-500
                outline-none
              "
            />
          </div>

          <div>
            <label
              htmlFor="np-cat"
              className="
                block text-sm font-semibold
                text-ink mb-1.5
              "
            >
              Categoría
            </label>

            <select
              id="np-cat"
              value={newCategory}
              onChange={(event) =>
                setNewCategory(
                  event.target.value
                )
              }
              className="
                w-full rounded-xl
                border border-line-strong
                bg-surface-elevated
                px-4 py-3 text-base text-ink
                focus:border-primary-500
                outline-none
              "
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="np-stock"
                className="
                  block text-sm font-semibold
                  text-ink mb-1.5
                "
              >
                Stock actual
              </label>

              <input
                id="np-stock"
                type="number"
                min={0}
                value={newStock}
                onChange={(event) =>
                  setNewStock(
                    event.target.value
                  )
                }
                placeholder="0"
                className="
                  w-full rounded-xl
                  border border-line-strong
                  bg-surface-elevated
                  px-4 py-3
                  text-base text-ink
                  focus:border-primary-500
                  outline-none
                "
              />
            </div>

            <div>
              <label
                htmlFor="np-min"
                className="
                  block text-sm font-semibold
                  text-ink mb-1.5
                "
              >
                Stock mínimo
              </label>

              <input
                id="np-min"
                type="number"
                min={0}
                value={newMin}
                onChange={(event) =>
                  setNewMin(
                    event.target.value
                  )
                }
                placeholder="0"
                className="
                  w-full rounded-xl
                  border border-line-strong
                  bg-surface-elevated
                  px-4 py-3
                  text-base text-ink
                  focus:border-primary-500
                  outline-none
                "
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="np-price"
              className="
                block text-sm font-semibold
                text-ink mb-1.5
              "
            >
              Precio (S/)
            </label>

            <input
              id="np-price"
              type="number"
              min={0}
              step={0.5}
              value={newPrice}
              onChange={(event) =>
                setNewPrice(
                  event.target.value
                )
              }
              placeholder="0.00"
              className="
                w-full rounded-xl
                border border-line-strong
                bg-surface-elevated
                px-4 py-3
                text-base text-ink
                focus:border-primary-500
                outline-none
              "
            />
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}