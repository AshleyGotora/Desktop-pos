import { useState, useMemo, useEffect } from "react";
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

const API_URL = import.meta.env.VITE_API_URL;
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
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState("dinheiro");
  const [aFinalizar, setAFinalizar] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const token = localStorage.getItem("pos_token");

  useEffect(() => {
    fetch(`${API_URL}/produtos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProdutosDisponiveis(Array.isArray(data) ? data : []))
      .catch(() => setMensagem("Não foi possível carregar os produtos."));
  }, [token]);

  // Resultados da pesquisa
  const resultadosBusca = useMemo(() => {
    if (!busca.trim()) return [];
    const termo = busca.toLowerCase();
    return produtosDisponiveis
      .filter(
        (p) =>
          (p.nome.toLowerCase().includes(termo) ||
            String(p.codigo ?? "").includes(termo)) &&
          !itens.some((i) => i.id === p.id)
      )
      .slice(0, 6);
  }, [busca, produtosDisponiveis, itens]);

  const adicionarItem = (produto) => {
    setItens((prev) => [
      ...prev,
      {
        id: produto.id,
        nome: produto.nome,
        codigo: produto.codigo ?? produto.categoria,
        precoUnit: Number(produto.preco),
        qtd: 1,
        desconto: 0,
      },
    ]);
    setBusca("");
  };

  const alterarQuantidade = (id, delta) => {
    setItens((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qtd: Math.max(1, item.qtd + delta) } : item
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

  const finalizarVenda = async () => {
    setMensagem("");
    setAFinalizar(true);
    try {
      const res = await fetch(`${API_URL}/vendas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          metodo_pagamento: pagamentoSelecionado,
          valor_pago: valorPagoNumerico,
          total: valorTotal,
          trocos,
          itens: itens.map((i) => ({
            produtos_id: i.id,
            quantidade: i.qtd,
            preco_unitario: i.precoUnit,
            desconto: i.desconto,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMensagem(data.error ?? "Erro ao registar venda.");
        return;
      }

      setItens([]);
      setValorPago("");
      setMensagem("Venda registada com sucesso! ✅");
    } catch {
      setMensagem("Sem ligação ao servidor.");
    } finally {
      setAFinalizar(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 text-slate-800 overflow-hidden">
      {/* Barra de título */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-slate-100 flex-shrink-0">
        <span className="text-sm font-medium tracking-wide">Vendas</span>
        <div className="flex items-center gap-3 text-slate-400">
          <Minimize2 size={14} className="cursor-pointer hover:text-slate-200" />
          <Maximize2 size={14} className="cursor-pointer hover:text-slate-200" />
          <X size={14} className="cursor-pointer hover:text-red-400" />
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative border-b border-slate-200 bg-white px-4 py-3 flex-shrink-0">
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

        {resultadosBusca.length > 0 && (
          <div className="absolute left-4 right-4 top-full z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {resultadosBusca.map((p) => (
              <button
                key={p.id}
                onMouseDown={() => adicionarItem(p)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-emerald-50"
              >
                <span className="font-medium text-slate-700">{p.nome}</span>
                <span className="text-slate-400">{formatarMoeda(Number(p.preco))}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {mensagem && (
        <div className="mx-4 mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 flex-shrink-0">
          {mensagem}
        </div>
      )}

      {/* Corpo principal */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Tabela de produtos */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm border border-slate-200">
          <div className="grid grid-cols-[1fr_100px_120px_100px_120px_40px] gap-2 border-b border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sticky top-0 z-10">
            <span>Produto</span>
            <span>Preço unit.</span>
            <span className="text-center">Qtd.</span>
            <span>Desconto</span>
            <span>Subtotal</span>
            <span />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {itens.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400 p-8">
                Nenhum item adicionado. Faça o scan ou pesquise um produto.
              </div>
            ) : (
              itens.map((item) => {
                const subtotalItem = item.precoUnit * item.qtd - item.desconto;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_100px_120px_100px_120px_40px] items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50/50"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{item.nome}</p>
                      <p className="text-xs text-slate-400 font-mono">{item.codigo}</p>
                    </div>

                    <span className="text-slate-600 font-medium">{formatarMoeda(item.precoUnit)}</span>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => alterarQuantidade(item.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition"
                        aria-label={`Diminuir quantidade de ${item.nome}`}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-semibold text-slate-800">{item.qtd}</span>
                      <button
                        onClick={() => alterarQuantidade(item.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition"
                        aria-label={`Aumentar quantidade de ${item.nome}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span className="text-slate-600 font-medium">
                      {item.desconto > 0 ? formatarMoeda(item.desconto) : "-"}
                    </span>

                    <span className="font-bold text-slate-800">
                      {formatarMoeda(subtotalItem)}
                    </span>

                    <button
                      onClick={() => removerItem(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                      aria-label={`Remover ${item.nome}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Painel lateral: Formas de pagamento */}
        <div className="flex w-80 flex-col flex-shrink-0 rounded-lg bg-white p-4 shadow-sm border border-slate-200">
          <h3 className="mb-3 text-sm font-bold text-slate-700">Formas de pagamento</h3>
          <div className="grid grid-cols-2 gap-2">
            {FORMAS_PAGAMENTO.map(({ id, label, icon: Icon }) => {
              const ativo = pagamentoSelecionado === id;
              const isCarteiraMovel = id === "carteira móvel";

              return (
                <button
                  key={id}
                  onClick={() => setPagamentoSelecionado(id)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border px-3 py-4 text-xs font-semibold transition ${
                    isCarteiraMovel ? "col-span-2 w-full py-4 mt-1" : ""
                  } ${
                    ativo
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={20} className={ativo ? "text-emerald-600" : "text-slate-400"} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rodapé: totais e checkout */}
      <div className="grid grid-cols-[1fr_260px] gap-4 border-t border-slate-200 bg-white p-4 flex-shrink-0">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sub total</p>
              <p className="mt-1 text-base font-bold text-slate-800">{formatarMoeda(subtotal)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Desconto</p>
              <p className="mt-1 text-base font-bold text-slate-800">{formatarMoeda(totalDesconto)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">IVA (16%)</p>
              <p className="mt-1 text-base font-bold text-slate-800">{formatarMoeda(iva)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total de itens</p>
              <p className="mt-1 text-base font-bold text-slate-800">{totalItens}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Valor pago
              </label>
              <input
                type="number"
                min="0"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Trocos
              </label>
              <input
                type="text"
                readOnly
                value={formatarMoeda(trocos)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Total + checkout */}
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-3 text-center flex-1 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Valor total</p>
            <p className="mt-0.5 text-2xl font-black text-emerald-700 tracking-tight">{formatarMoeda(valorTotal)}</p>
          </div>

          <button
            onClick={finalizarVenda}
            disabled={itens.length === 0 || aFinalizar}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={18} />
            {aFinalizar ? "A registar..." : "Finalizar venda"}
          </button>
        </div>
      </div>
    </div>
  );
}