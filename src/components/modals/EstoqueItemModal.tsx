import React, { useEffect, useState } from "react";
import { X, Package, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { EstoqueItem } from "../../modules/estoque/estoque.types";
import { estoqueItemModalStyles as styles } from "./styles/EstoqueItemModal.styles";

interface EstoqueItemModalProps {
  open: boolean;
  mode: "novo" | "editar";
  item?: EstoqueItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (item: EstoqueItem) => Promise<boolean>;
}

const emptyForm = {
  nome: "",
  categoria: "",
  quantidade: "",
  minimo: "",
  unidade: "",
};

export const EstoqueItemModal: React.FC<EstoqueItemModalProps> = ({
  open,
  mode,
  item,
  categories,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "editar" && item) {
      setForm({
        nome: item.nome,
        categoria: item.categoria,
        quantidade: String(item.quantidade),
        minimo: String(item.minimo),
        unidade: item.unidade,
      });
    } else {
      setForm(emptyForm);
    }
  }, [mode, item, open]);

  if (!open) return null;

  const handleNumericChange =
    (field: "quantidade" | "minimo") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const onlyDigits = event.target.value.replace(/[^0-9]/g, "");
      setForm((current) => ({ ...current, [field]: onlyDigits }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!form.nome.trim() || !form.categoria.trim() || !form.unidade.trim()) {
      toast.error("Preencha o nome, a categoria e a unidade do item.");
      return;
    }

    const quantidade = Number(form.quantidade);
    const minimo = Number(form.minimo);
    if (
      form.quantidade === "" ||
      form.minimo === "" ||
      !Number.isSafeInteger(quantidade) ||
      !Number.isSafeInteger(minimo) ||
      quantidade < 0 ||
      minimo < 0
    ) {
      toast.error("Informe quantidades válidas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const sucesso = await onSave({
        id: mode === "editar" && item ? item.id : "",
        nome: form.nome.trim(),
        categoria: form.categoria.trim(),
        quantidade,
        minimo,
        unidade: form.unidade.trim(),
        ...(mode === "editar" && item?.medicamentoId != null
          ? { medicamentoId: item.medicamentoId }
          : {}),
        ...(mode === "editar" && item?.quantidadeMaxima !== undefined
          ? { quantidadeMaxima: item.quantidadeMaxima }
          : {}),
      });
      if (sucesso) onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível salvar o item.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4"
      style={styles.overlay}
    >
      <div
        className="w-[500px] max-w-[95vw] max-h-[90vh] bg-white overflow-hidden flex flex-col"
        style={styles.card}
      >
        <div
          className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-5 border-b shrink-0"
          style={styles.header}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0"
              style={styles.headerIconWrap}
            >
              {mode === "novo" ? (
                <PackagePlus size={16} color={styles.headerIconColor} />
              ) : (
                <Package size={16} color={styles.headerIconColor} />
              )}
            </div>
            <p
              className="display text-[1.1rem] sm:text-[1.25rem] font-semibold truncate"
              style={styles.title}
            >
              {mode === "novo" ? "Adicionar item" : "Editar item"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar"
            className="w-7 h-7 flex items-center justify-center p-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={16} color={styles.closeIconColor} />
          </button>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-6 py-3.5 sm:py-5 flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11.5px] font-semibold"
                style={styles.label}
              >
                Nome do item
              </label>
              <input
                value={form.nome}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nome: event.target.value,
                  }))
                }
                placeholder="Ex: Máscara N95"
                className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
                style={styles.input}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11.5px] font-semibold"
                style={styles.label}
              >
                Categoria
              </label>
              <input
                list="categorias-existentes"
                value={form.categoria}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoria: event.target.value,
                  }))
                }
                placeholder="Ex: EPI, Curativo, Medicamento..."
                className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
                style={styles.input}
              />
              <datalist id="categorias-existentes">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[11.5px] font-semibold"
                  style={styles.label}
                >
                  Quantidade
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.quantidade}
                  onChange={handleNumericChange("quantidade")}
                  className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
                  style={styles.input}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[11.5px] font-semibold"
                  style={styles.label}
                >
                  Mínimo
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.minimo}
                  onChange={handleNumericChange("minimo")}
                  className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
                  style={styles.input}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11.5px] font-semibold"
                style={styles.label}
              >
                Unidade
              </label>
              <input
                value={form.unidade}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unidade: event.target.value,
                  }))
                }
                placeholder="un, caixa, ampolas, L..."
                className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
                style={styles.input}
              />
            </div>
          </div>

          <div
            className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 px-3.5 sm:px-6 py-3 sm:py-4 border-t shrink-0"
            style={styles.header}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              style={styles.saveButton}
            >
              {isSubmitting
                ? "Salvando..."
                : mode === "novo"
                  ? "Adicionar"
                  : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
