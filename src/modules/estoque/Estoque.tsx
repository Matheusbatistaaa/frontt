import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "../../shared/components";
import { EstoqueItem } from "./estoque.types";
import { EstoqueItemModal } from "../../components/modals/EstoqueItemModal";
import { AlertBanner } from "../../components/AlertBanner";
import { SearchInput } from "../../components/SearchInput";
import { estoqueStyles as styles, getStockBadgeStyle } from "./Estoque.styles";
import { useEstoque } from "../../hooks";
import { supabase } from "../../lib/supabase";

const MOCK_ESTOQUE_ITEMS: EstoqueItem[] = [
  { id: "e1", nome: "Dipirona 500mg/ml", categoria: "Medicamentos", quantidade: 150, minimo: 50, unidade: "ampolas" },
  { id: "e2", nome: "Morfina 10mg/ml", categoria: "Controlados", quantidade: 14, minimo: 20, unidade: "ampolas" },
  { id: "e3", nome: "Soro Fisiológico 0.9% 500ml", categoria: "Soluções", quantidade: 85, minimo: 40, unidade: "frascos" },
  { id: "e4", nome: "Luvas de Procedimento (M)", categoria: "Insumos", quantidade: 1200, minimo: 500, unidade: "pares" },
  { id: "e5", nome: "Seringas 10ml Descartáveis", categoria: "Materiais", quantidade: 320, minimo: 100, unidade: "unidades" },
  { id: "e6", nome: "Fentanila 50mcg/ml", categoria: "Controlados", quantidade: 12, minimo: 15, unidade: "ampolas" },
  { id: "e7", nome: "Cateter Intravenoso 20G", categoria: "Materiais", quantidade: 25, minimo: 30, unidade: "unidades" },
  { id: "e8", nome: "Propofol 10mg/ml", categoria: "Anestésicos", quantidade: 45, minimo: 30, unidade: "ampolas" },
  { id: "e9", nome: "Omeprazol 40mg EV", categoria: "Medicamentos", quantidade: 60, minimo: 25, unidade: "frascos" },
];

export const Estoque: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"novo" | "editar">("novo");
  const [editingItem, setEditingItem] = useState<EstoqueItem | null>(null);
  const [itemsList, setItemsList] = useState<EstoqueItem[]>(MOCK_ESTOQUE_ITEMS);

  const { data: supabaseItems, refetch } = useEstoque();

  useEffect(() => {
    if (supabaseItems && supabaseItems.length > 0) {
      setItemsList(supabaseItems as EstoqueItem[]);
    }
  }, [supabaseItems]);

  const filteredItems = itemsList.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = itemsList.filter((item) => item.quantidade < item.minimo);
  const categories = Array.from(new Set(itemsList.map((i) => i.categoria)));

  const handleOpenNovo = () => {
    setModalMode("novo");
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEditar = (item: EstoqueItem) => {
    setModalMode("editar");
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = async (item: EstoqueItem) => {
    if (modalMode === "novo") {
      const newItem: EstoqueItem = {
        ...item,
        id: item.id || `e-${Date.now()}`,
      };
      setItemsList((prev) => [...prev, newItem]);
      toast.success("Item adicionado ao estoque");

      try {
        const { data: newMed } = await supabase
          .from("medicamentos")
          .insert({
            nome: item.nome,
            principio_ativo: item.nome,
            forma_farmaceutica: "comprimido",
            concentracao: "1 un",
            unidade_medida: item.unidade,
            categoria: item.categoria,
            preco_unitario: 10,
          })
          .select()
          .single();

        if (newMed?.id) {
          await supabase.from("estoque").insert({
            medicamento_id: newMed.id,
            quantidade_atual: item.quantidade,
            quantidade_minima: item.minimo,
            quantidade_maxima: Math.max(item.quantidade * 3, item.minimo * 3, 100),
          });
          refetch();
        }
      } catch (err) {
        console.warn("Item inserido localmente:", err);
      }
    } else {
      setItemsList((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      toast.success("Item atualizado com sucesso");

      const numId = Number(item.id);
      if (!isNaN(numId)) {
        try {
          await supabase
            .from("estoque")
            .update({
              quantidade_atual: item.quantidade,
              quantidade_minima: item.minimo,
            })
            .eq("id", numId);
          refetch();
        } catch (err) {
          console.warn("Item atualizado localmente:", err);
        }
      }
    }

    setModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Estoque" subtitle="Controle de medicamentos e insumos" />

      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-7 space-y-5 sm:space-y-7">
        {lowStockItems.length > 0 && (
          <AlertBanner
            variant="warning"
            title={`${lowStockItems.length} ${lowStockItems.length > 1 ? "itens" : "item"} com estoque baixo`}
            subtitle="Reposição necessária"
          />
        )}

        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar item..."
        />

        {categories.map((category) => {
          const categoryItems = filteredItems.filter((i) => i.categoria === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category}>
              <p className="text-[12.5px] sm:text-[13px] font-semibold mb-2.5 sm:mb-3" style={styles.categoryTitle}>
                {category}
              </p>
              <div className="space-y-2">
                {categoryItems.map((item) => {
                  const isLow = item.quantidade < item.minimo;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleOpenEditar(item)}
                      className="w-full p-3 sm:p-4 border flex items-center justify-between text-left gap-2 transition-colors hover:opacity-90"
                      style={styles.itemCard}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-semibold text-xs sm:text-sm truncate" style={styles.itemName}>
                          {item.nome}
                        </p>
                        <p className="text-[11px] sm:text-xs mt-0.5 sm:mt-1 truncate" style={styles.itemInfo}>
                          {item.quantidade} {item.unidade} • Mín: {item.minimo}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 inline-block"
                          style={getStockBadgeStyle(isLow)}
                        >
                          {isLow ? "Baixo" : "OK"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button
          onClick={handleOpenNovo}
          className="w-full py-2.5 sm:py-3 text-white font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm transition-opacity hover:opacity-90"
          style={styles.addButton}
        >
          <Plus size={16} /> Adicionar item
        </button>
      </div>

      <EstoqueItemModal
        open={modalOpen}
        mode={modalMode}
        item={editingItem}
        categories={categories}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
      />
    </div>
  );
};
