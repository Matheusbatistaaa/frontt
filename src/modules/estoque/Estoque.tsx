import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TopBar } from "../../shared/components";
import { EstoqueItem } from "./estoque.types";
import { EstoqueItemModal } from "../../components/modals/EstoqueItemModal";
import { AlertBanner } from "../../components/AlertBanner";
import { SearchInput } from "../../components/SearchInput";
import { estoqueStyles as styles, getStockBadgeStyle } from "./Estoque.styles";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../config/colors";

interface EstoqueRow {
  id: string | number;
  medicamento_id: string | number | null;
  quantidade_atual: number | string | null;
  quantidade_minima: number | string | null;
  quantidade_maxima: number | string | null;
  preco_unitario: number | string | null;
  medicamento: {
    nome: string | null;
    categoria: string | null;
    unidade_medida: string | null;
    preco_unitario: number | string | null;
  } | null;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "erro inesperado";

export const Estoque: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"novo" | "editar">("novo");
  const [editingItem, setEditingItem] = useState<EstoqueItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: items = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery<EstoqueItem[]>({
    queryKey: ["estoque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque")
        .select(
          `
          id,
          medicamento_id,
          quantidade_atual,
          quantidade_minima,
          quantidade_maxima,
          preco_unitario,
          medicamento:medicamentos(nome, categoria, unidade_medida, preco_unitario)
        `,
        )
        .order("id", { ascending: true })
        .returns<EstoqueRow[]>();

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: String(row.id),
        medicamentoId: row.medicamento_id,
        nome: row.medicamento?.nome ?? "Medicamento não identificado",
        categoria: row.medicamento?.categoria ?? "Sem categoria",
        quantidade: Number(row.quantidade_atual ?? 0),
        minimo: Number(row.quantidade_minima ?? 0),
        quantidadeMaxima: Number(row.quantidade_maxima ?? 0),
        unidade: row.medicamento?.unidade_medida ?? "un",
        preco: Number(
          row.medicamento?.preco_unitario ?? row.preco_unitario ?? 0,
        ),
      }));
    },
  });

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const lowStockItems = items.filter((item) => item.quantidade < item.minimo);
  const categories = Array.from(new Set(items.map((item) => item.categoria)));

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

  const handleSaveItem = async (item: EstoqueItem): Promise<boolean> => {
    if (modalMode === "novo") {
      let medicamentoId: string | number | null = null;

      try {
        const { data: medicamento, error: medicamentoError } = await supabase
          .from("medicamentos")
          .insert({
            nome: item.nome,
            principio_ativo: item.nome,
            forma_farmaceutica: "comprimido",
            concentracao: "1 un",
            unidade_medida: item.unidade,
            categoria: item.categoria,
          })
          .select("id")
          .single();

        if (medicamentoError) throw medicamentoError;
        if (
          !medicamento ||
          medicamento.id === null ||
          medicamento.id === undefined
        ) {
          throw new Error("O medicamento não foi retornado após a gravação.");
        }
        medicamentoId = medicamento.id;

        const { error: estoqueError } = await supabase.from("estoque").insert({
          medicamento_id: medicamentoId,
          quantidade_atual: item.quantidade,
          quantidade_minima: item.minimo,
          quantidade_maxima:
            item.quantidadeMaxima ??
            Math.max(item.quantidade * 3, item.minimo * 3, 100),
        });

        if (estoqueError) throw estoqueError;
      } catch (err) {
        let falhaLimpeza = "";

        if (medicamentoId !== null) {
          const { data: cleanupData, error: cleanupError } = await supabase
            .from("medicamentos")
            .delete()
            .eq("id", medicamentoId)
            .select("id")
            .maybeSingle();

          if (cleanupError || !cleanupData) {
            console.error(
              "[Estoque] Falha ao remover medicamento órfão:",
              cleanupError,
            );
            falhaLimpeza = " Não foi possível remover o medicamento órfão.";
          }
        }

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["estoque"] }),
          queryClient.invalidateQueries({ queryKey: ["medicamentos"] }),
          queryClient.invalidateQueries({ queryKey: ["administracoes"] }),
        ]);
        toast.error(
          `Não foi possível adicionar o item: ${getErrorMessage(err)}${falhaLimpeza}`,
        );
        return false;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["estoque"] }),
        queryClient.invalidateQueries({ queryKey: ["medicamentos"] }),
        queryClient.invalidateQueries({ queryKey: ["administracoes"] }),
      ]);
      toast.success("Item adicionado ao estoque.");
      return true;
    }

    const medicamentoId = item.medicamentoId;
    if (medicamentoId === undefined || medicamentoId === null) {
      toast.error("Este item não possui medicamento vinculado para edição.");
      return false;
    }

    try {
      const { data: medicamentoAtualizado, error: medicamentoError } =
        await supabase
          .from("medicamentos")
          .update({
            nome: item.nome,
            categoria: item.categoria,
            unidade_medida: item.unidade,
          })
          .eq("id", medicamentoId)
          .select("id")
          .maybeSingle();

      if (medicamentoError) throw medicamentoError;
      if (!medicamentoAtualizado) {
        throw new Error(
          "O medicamento não foi encontrado ou não pode ser atualizado.",
        );
      }

      const atualizacaoEstoque: {
        quantidade_atual: number;
        quantidade_minima: number;
        quantidade_maxima?: number;
      } = {
        quantidade_atual: item.quantidade,
        quantidade_minima: item.minimo,
      };
      if (item.quantidadeMaxima !== undefined) {
        atualizacaoEstoque.quantidade_maxima = item.quantidadeMaxima;
      }

      const { data: estoqueAtualizado, error: estoqueError } = await supabase
        .from("estoque")
        .update(atualizacaoEstoque)
        .eq("id", item.id)
        .select("id")
        .maybeSingle();

      if (estoqueError) throw estoqueError;
      if (!estoqueAtualizado) {
        throw new Error(
          "O item não foi encontrado ou não pode ser atualizado.",
        );
      }
    } catch (err) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["estoque"] }),
        queryClient.invalidateQueries({ queryKey: ["medicamentos"] }),
        queryClient.invalidateQueries({ queryKey: ["administracoes"] }),
      ]);
      toast.error(`Não foi possível atualizar o item: ${getErrorMessage(err)}`);
      return false;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["estoque"] }),
      queryClient.invalidateQueries({ queryKey: ["medicamentos"] }),
      queryClient.invalidateQueries({ queryKey: ["administracoes"] }),
    ]);
    toast.success("Item atualizado com sucesso.");
    return true;
  };

  const handleDeleteItem = async (item: EstoqueItem) => {
    if (deletingId !== null) return;
    if (!window.confirm(`Excluir "${item.nome}" do estoque?`)) return;

    setDeletingId(item.id);
    try {
      const { data, error } = await supabase
        .from("estoque")
        .delete()
        .eq("id", item.id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error("O item não foi encontrado ou não pode ser excluído.");

      await queryClient.invalidateQueries({ queryKey: ["estoque"] });
      toast.success("Item excluído do estoque.");
    } catch (err) {
      await queryClient.invalidateQueries({ queryKey: ["estoque"] });
      toast.error(`Não foi possível excluir o item: ${getErrorMessage(err)}`);
    } finally {
      setDeletingId(null);
    }
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

        {isPending && (
          <p className="text-xs sm:text-sm" style={{ color: COLORS.slateSoft }}>
            Carregando estoque...
          </p>
        )}

        {isError && (
          <div
            role="alert"
            className="border p-3 sm:p-4"
            style={{ borderColor: COLORS.red, background: COLORS.redSoft }}
          >
            <p
              className="text-xs sm:text-sm font-semibold"
              style={{ color: COLORS.red }}
            >
              Não foi possível carregar o estoque: {getErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 text-xs sm:text-sm font-semibold underline"
              style={{ color: COLORS.red }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isPending && !isError && items.length === 0 && (
          <p className="text-xs sm:text-sm" style={{ color: COLORS.slateSoft }}>
            Nenhum item cadastrado no estoque.
          </p>
        )}

        {categories.map((category) => {
          const categoryItems = filteredItems.filter(
            (item) => item.categoria === category,
          );
          if (categoryItems.length === 0) return null;

          return (
            <div key={category}>
              <p
                className="text-[12.5px] sm:text-[13px] font-semibold mb-2.5 sm:mb-3"
                style={styles.categoryTitle}
              >
                {category}
              </p>
              <div className="space-y-2">
                {categoryItems.map((item) => {
                  const isLow = item.quantidade < item.minimo;
                  return (
                    <div
                      key={item.id}
                      className="w-full p-3 sm:p-4 border flex items-center justify-between text-left gap-2 transition-colors hover:opacity-90"
                      style={styles.itemCard}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenEditar(item)}
                        disabled={deletingId !== null}
                        className="flex flex-1 min-w-0 items-center justify-between text-left gap-2 disabled:cursor-not-allowed"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p
                            className="font-semibold text-xs sm:text-sm truncate"
                            style={styles.itemName}
                          >
                            {item.nome}
                          </p>
                          <p
                            className="text-[11px] sm:text-xs mt-0.5 sm:mt-1 truncate"
                            style={styles.itemInfo}
                          >
                            {item.quantidade} {item.unidade} • Mín:{" "}
                            {item.minimo}
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
                      <button
                        type="button"
                        onClick={() => void handleDeleteItem(item)}
                        disabled={deletingId !== null}
                        aria-label={`Excluir ${item.nome}`}
                        title="Excluir item"
                        className="shrink-0 p-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: COLORS.red }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
