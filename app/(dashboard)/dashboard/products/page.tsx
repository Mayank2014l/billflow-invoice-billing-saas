"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Package, Edit2, Trash2, Loader2, Tag, Landmark 
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useOrg } from "@/hooks/use-org";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  rate: number;
  unit: string;
}

export default function ProductsPage() {
  const { activeOrg } = useOrg();
  const { canCreateEditInvoices } = usePermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState<number>(0);
  const [unit, setUnit] = useState("hr");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeOrg]);

  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setName("");
    setDescription("");
    setRate(0);
    setUnit("hr");
    setProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setRate(product.rate);
    setUnit(product.unit);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rate <= 0) {
      toast.error("Name is required and Rate must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = selectedProduct ? `/api/products/${selectedProduct.id}` : "/api/products";
      const method = selectedProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          rate: parseFloat(rate as any),
          unit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      toast.success(selectedProduct ? "Product details updated" : "Product catalog item added");
      setProductModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete ${productName} from your catalog?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Product ${productName} deleted.`);
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products & Services</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Build a rate catalog to autocomplete line items in your invoice builder
          </p>
        </div>

        {canCreateEditInvoices && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-violet-500/10 flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search catalog by name or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b last:border-0 border-zinc-100 dark:border-zinc-805 pb-4 last:pb-0 animate-pulse">
              <div className="space-y-2">
                <div className="h-4.5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3.5 w-24 bg-zinc-100 dark:bg-zinc-855 rounded" />
              </div>
              <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-16 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 rounded-2xl flex items-center justify-center mb-6">
            <Package className="h-8 w-8 text-violet-500" />
          </div>
          <h3 className="text-lg font-bold">No Products Found</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm text-sm">
            {searchQuery 
              ? "We couldn't find any products matching your query parameters." 
              : "Register recurring rates or catalog products to speed up invoice drafting."}
          </p>
          {canCreateEditInvoices && !searchQuery && (
            <button
              onClick={handleOpenAddModal}
              className="mt-6 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-98"
            >
              <Plus className="h-4 w-4" /> Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-850/50 text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800">
                <tr>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Standard Rate</th>
                  <th className="p-4">Unit Classification</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800/80 font-medium">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                    <td className="p-4 font-bold text-zinc-850 dark:text-zinc-250">{prod.name}</td>
                    <td className="p-4 text-zinc-500 truncate max-w-xs">{prod.description || "-"}</td>
                    <td className="p-4 text-right font-bold text-zinc-800 dark:text-zinc-200">
                      {activeOrg?.currency} {prod.rate.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-550">
                        per {prod.unit}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit Product */}
                        {canCreateEditInvoices && (
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 text-zinc-500 hover:text-violet-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit Catalog Item"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete Product */}
                        {canCreateEditInvoices && (
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-zinc-500 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
                            title="Delete Catalog Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold">{selectedProduct ? "Edit Product Details" : "Add Catalog Product"}</h3>
              <p className="text-xs text-zinc-550 mt-1">Configure item pricing and classification.</p>
            </div>
            
            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-500 mb-1">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Development"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-500 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="e.g. Standard hourly rates for Next.js builds..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-500 mb-1">Standard Rate</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0.01"
                      step="any"
                      value={rate || ""}
                      onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none text-right"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1">Unit Classification</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                  >
                    <option value="hr">hour (hr)</option>
                    <option value="day">day</option>
                    <option value="month">month</option>
                    <option value="qty">quantity (qty)</option>
                    <option value="fixed">fixed price</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg flex items-center gap-1 active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
