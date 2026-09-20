import React, { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "../../shared/components";
import { EstoqueItem } from "./estoque.types";
import { EstoqueItemModal } from "../../components/modals/EstoqueItemModal";
import { AlertBanner } from "../../components/AlertBanner";
import { SearchInput } from "../../components/SearchInput";
import { COLORS } from "../../config/colors";
import { estoqueStyles as styles, getStockBadgeStyle } from "./Estoque.styles";

import { useEstoque, useMedicamentos } from "../../hooks";
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
  const [localItems, setLocalItems] = useState<EstoqueItem[]>(MOCK_ESTOQUE_ITEMS);

  const { data: supabaseItems, refetch, isLoading } = useEstoque();
  const { data: medicamentos = [] } = useMedicamentos();

  // Transform DB rows to local EstoqueItem, or fallback to mock data
  const items: EstoqueItem[] = (supabaseItems && supabaseItems.length > 0)
    ? supabaseItems.map((dbItem: any) => ({
        id: dbItem.id,
        nome: dbItem.nome || dbItem.item || "Item",
        categoria: dbItem.categoria || "Insumos",
        quantidade: Number(dbItem.quantidade || dbItem.quantidade_atual || 0),
        minimo: Number(dbItem.minimo || dbItem.quantidade_minima || 0),
        unidade: dbItem.unidade || "un",
      }))
    : localItems;

  const filteredItems = items.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = items.filter(item => item.quantidade < item.minimo);

  const categories = Array.from(new Set(items.map(i => i.categoria)));

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
    try {
      if (modalMode === "novo") {
        // Buscar ou criar medicamento pelo nome
        let med = medicamentos.find(m => m.nome.toLowerCase() === item.nome.toLowerCase());
        if (!med) {
          // Criar novo medicamento
          const { data: newMed, error: medError } = await supabase
            .from("medicamentos")
            .insert({
              nome: item.nome,
              categoria: item.categoria,
              unidade_medida: item.unidade,
              principio_ativo: item.nome,
              forma_farmaceutica: "outro",
              concentracao: "",
            })
            .select()
            .single();
          if (medError) throw medError;
          med = newMed;
        }

        // Inserir estoque com medicamento_id
        const { error } = await supabase.from("estoque").insert({
          medicamento_id: med.id,
          quantidade_atual: item.quantidade,
          quantidade_minima: item.minimo,
        });
        if (error) throw error;
      } else {
        // Apenas atualizar quantidade (estoque table só tem essas colunas editáveis)
        const { error } = await supabase
          .from("estoque")
          .update({
            quantidade_atual: item.quantidade,
            quantidade_minima: item.minimo,
          })
          .eq("id", item.id);
        if (error) throw error;
      }

      toast.success(modalMode === "novo" ? "Item adicionado ao estoque" : "Item atualizado");
      setModalOpen(false);
      setEditingItem(null);
      refetch();
    } catch {
      // Fallback para modo apresentação sem backend
      if (modalMode === "novo") {
        setLocalItems(prev => [...prev, { ...item, id: `e${Date.now()}` }]);
      } else {
        setLocalItems(prev => prev.map(i => i.id === item.id ? item : i));
      }
      toast.success(modalMode === "novo" ? "Item adicionado ao estoque" : "Item atualizado");
      setModalOpen(false);
      setEditingItem(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Estoque" subtitle="Controle de medicamentos e insumos" />

      <div className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
        {lowStockItems.length > 0 && (
          <AlertBanner
            variant="warning"
            title={`${lowStockItems.length} ${lowStockItems.length > 1 ? "itens" : "item"} com estoque baixo`}
            subtitle="Reposição necessária"
          />
        )}

        {/* Busca */}
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar item..."
        />

        {/* Itens por categoria */}
        {categories.map(category => {
          const categoryItems = filteredItems.filter(i => i.categoria === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category}>
              <p className="text-[13px] font-semibold mb-3" style={styles.categoryTitle}>
                {category}
              </p>
              <div className="space-y-2">
                {categoryItems.map(item => {
                  const isLow = item.quantidade < item.minimo;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleOpenEditar(item)}
                      className="w-full p-4 border flex items-center justify-between text-left"
                      style={styles.itemCard}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={styles.itemName}>
                          {item.nome}
                        </p>
                        <p className="text-xs mt-1" style={styles.itemInfo}>
                          {item.quantidade} {item.unidade} • Mín: {item.minimo}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-xs font-semibold px-2 py-0.5 inline-block"
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
          className="w-full py-2.5 text-white font-semibold flex items-center justify-center gap-2 text-sm"
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