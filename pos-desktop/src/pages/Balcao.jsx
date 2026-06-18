import { useState, useMemo } from "react";
import {
  Search,
  Barcode,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Wallet,
  Smartphone,
  ShoppingCart,
  Minimize2,
  Maximize2,
  X,
} from "lucide-react";

const TAXA_IVA = 0.16;

const FORMAS_PAGAMENTO = [
  { id: "cartao", label: "Cartão", icon: CreditCard },
  { id: "dinheiro", label: "Dinheiro", icon: Wallet },
  { id: "carteira móvel", label: "Carteira Móvel", icon: Smartphone },
];

function formatarMoeda(valor) {
  return `${valor.toFixed(2)} MTN`;
}

export default function Vendas() {
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState("dinheiro");

  const alterarQuantidade = (id, delta) => {
    setItens((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qtd: Math.max(1, item.qtd + delta) }
          : item
      )
    );
  };

  const removerItem = (id) => {
    setItens((prev) => prev.filter((item) => item.id !== id));
  };

  const { subtotal, totalDesconto, iva, valorTotal, totalItens } = useMemo(() => {
    const subtotal = itens.reduce((acc, item) => acc + item.precoUnit * item.qtd, 0);
    const totalDesconto = itens.reduce((acc, item) => acc + item.desconto, 0);
    const baseTributavel = subtotal - totalDesconto;
    const iva = baseTributavel * TAXA_IVA;
    const valorTotal = baseTributavel + iva;
    const totalItens = itens.reduce((acc, item) => acc + item.qtd, 0);
    return { subtotal, totalDesconto, iva, valorTotal, totalItens };
  }, [itens]);

  const valorPagoNumerico = Number(valorPago) || 0;
  const trocos = Math.max(0, valorPagoNumerico - valorTotal);

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 text-slate-800">
      {/* Barra de título */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-slate-100">
        <span className="text-sm font-medium tracking-wide">Vendas</span>
        <div className="flex items-center gap-3 text-slate-400">
          <Minimize2 size={14} className="cursor-pointer hover:text-slate-200" />
          <Maximize2 size={14} className="cursor-pointer hover:text-slate-200" />
          <X size={14} className="cursor-pointer hover:text-red-400" />
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o item ou faça o scan do código de barras..."
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <Barcode size={20} className="text-slate-400" />
        </div>
      </div>

      {/* Corpo principal */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Tabela de produtos */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_90px_110px_90px_100px_40px] gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Produto</span>
            <span>Preço unit.</span>
            <span>Qtd.</span>
            <span>Desconto</span>
            <span>Subtotal</span>
            <span />
          </div>

          <div className="flex-1 overflow-y-auto">
            {itens.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Nenhum item adicionado. Faça o scan ou pesquise um produto.
              </div>
            )}

            {itens.map((item) => {
              const subtotalItem = item.precoUnit * item.qtd - item.desconto;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_90px_110px_90px_100px_40px] items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">{item.nome}</p>
                    <p className="text-xs text-slate-400">{item.codigo}</p>
                  </div>
                  <span className="text-slate-600">{formatarMoeda(item.precoUnit)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alterarQuantidade(item.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-4 text-center font-medium">{item.qtd}</span>
                    <button
                      onClick={() => alterarQuantidade(item.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-slate-600">
                    {item.desconto > 0 ? formatarMoeda(item.desconto) : "-"}
                  </span>
                  <span className="font-semibold text-slate-800">{formatarMoeda(subtotalItem)}</span>
                  <button
                    onClick={() => removerItem(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel lateral: pagamento */}
        <div className="flex w-72 flex-col gap-3">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Formas de pagamento</h3>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PAGAMENTO.map(({ id, label, icon: Icon }) => {
                const ativo = pagamentoSelecionado === id;
                const isCarteiraMovel = id === "carteira móvel";
                return (
                  <button
                    key={id}
                    onClick={() => setPagamentoSelecionado(id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-3 text-xs font-medium transition ${
                      isCarteiraMovel ? "col-span-2 w-full py-4" : ""
                    } ${
                      ativo
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé: totais e checkout */}
      <div className="grid grid-cols-[1fr_220px] gap-3 border-t border-slate-200 bg-white p-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Sub total</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{formatarMoeda(subtotal)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Desconto</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{formatarMoeda(totalDesconto)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">IVA (16%)</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{formatarMoeda(iva)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total de itens</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{totalItens}</p>
          </div>

          <div className="col-span-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Valor pago</label>
              <input
                type="number"
                min="0"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Trocos</label>
              <input
                type="text"
                readOnly
                value={formatarMoeda(trocos)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Total + checkout */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-emerald-600">Valor total</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{formatarMoeda(valorTotal)}</p>
          </div>
          <button
            disabled={itens.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={18} />
            Finalizar venda
          </button>
        </div>
      </div>
    </div>
  );
}