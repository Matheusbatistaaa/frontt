export interface EstoqueItem {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  minimo: number;
  unidade: string;
  medicamentoId?: string | number | null;
  quantidadeMaxima?: number;
  validade?: string;
  preco?: number;
}

export interface EstoqueCategory {
  nome: string;
  items: EstoqueItem[];
}
