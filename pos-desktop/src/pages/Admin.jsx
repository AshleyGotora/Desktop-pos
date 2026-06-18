import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Receipt,
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Minimize2,
  Maximize2,
  X,
  RefreshCw,
  LogOut,
  Menu,
  BarChart2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AnaliseVendas from "./AnaliseVendas";

const API_URL = import.meta.env.VITE_API_URL;

function formatarMoeda(valor) {
  return `${Number(valor || 0).toFixed(2)} MTN`;
}

function authHeaders() {
  const token = localStorage.getItem("pos_token");
  return { Authorization: `Bearer ${token}` };
}

const ABAS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "produtos",  label: "Produtos",  icon: Package },
  { id: "estoque",   label: "Estoque",   icon: Boxes },
  { id: "vendas",    label: "Vendas",    icon: Receipt },
  { id: "analise",   label: "Análise",   icon: BarChart2 },
];

export default function Admin({ onLogout }) {
  const [abaAtiva, setAbaAtiva] = useState("dashboard");
  const [menuAberto, setMenuAberto] = useState(false);

  const sair = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_role");
    localStorage.removeItem("pos_email");
    if (onLogout) onLogout();
    else window.location.href = "/login";
  };

  const mudarAba = (id) => {
    setAbaAtiva(id);
    setMenuAberto(false);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 text-slate-800">

      {/* Barra de título */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-slate-100 flex-shrink-0">
        <span className="text-sm font-medium tracking-wide">Painel Admin</span>
        <div className="flex items-center gap-3 text-slate-400">
          <Minimize2 size={14} className="cursor-pointer hover:text-slate-200" />
          <Maximize2 size={14} className="cursor-pointer hover:text-slate-200" />
          <X size={14} className="cursor-pointer hover:text-red-400" />
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="border-b border-slate-200 bg-white flex-shrink-0">

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center justify-between px-4">
          <div className="flex gap-1">
            {ABAS.map(({ id, label, icon: Icon }) => {
              const ativo = abaAtiva === id;
              return (
                <button
                  key={id}
                  onClick={() => mudarAba(id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${ativo ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
          <button onClick={sair} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-500">
            <LogOut size={14} />
            Sair
          </button>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            {(() => {
              const abaAtual = ABAS.find((a) => a.id === abaAtiva);
              const Icon = abaAtual?.icon;
              return (
                <>
                  {Icon && <Icon size={16} className="text-emerald-600" />}
                  <span className="text-sm font-semibold text-slate-700">{abaAtual?.label}</span>
                </>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={sair} className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-red-500">
              <LogOut size={14} />
            </button>
            <button
              onClick={() => setMenuAberto((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              <Menu size={15} />
              Menu
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuAberto && (
          <div className="sm:hidden border-t border-slate-100 bg-white">
            {ABAS.map(({ id, label, icon: Icon }) => {
              const ativo = abaAtiva === id;
              return (
                <button
                  key={id}
                  onClick={() => mudarAba(id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium border-b border-slate-50 last:border-0 ${ativo ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Icon size={16} className={ativo ? "text-emerald-600" : "text-slate-400"} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {abaAtiva === "dashboard" && <Dashboard />}
        {abaAtiva === "produtos"  && <Produtos />}
        {abaAtiva === "estoque"   && <Estoque />}
        {abaAtiva === "vendas"    && <VendasAdmin />}
        {abaAtiva === "analise"   && <AnaliseVendas />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* DASHBOARD                                                               */
/* ---------------------------------------------------------------------- */

function Dashboard() {
  const [relatorios, setRelatorios] = useState({ hoje: null, semana: null, mes: null });
  const [estoqueBaixo, setEstoqueBaixo] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setACarregar(true);
    setErro("");
    try {
      const [hoje, semana, mes, baixo] = await Promise.all([
        fetch(`${API_URL}/vendas/relatorio?periodo=hoje`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_URL}/vendas/relatorio?periodo=semana`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_URL}/vendas/relatorio?periodo=mes`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_URL}/produtos/estoque-baixo?limite=10`, { headers: authHeaders() }).then((r) => r.json()),
      ]);
      setRelatorios({ hoje, semana, mes });
      setEstoqueBaixo(Array.isArray(baixo) ? baixo : []);
    } catch {
      setErro("Não foi possível carregar os dados do dashboard.");
    } finally {
      setACarregar(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const cartoes = [
    { chave: "hoje", titulo: "Vendas de hoje", destaque: true },
    { chave: "semana", titulo: "Últimos 7 dias", destaque: false },
    { chave: "mes", titulo: "Últimos 30 dias", destaque: false },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">Visão geral</h2>
        <button onClick={carregar} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
          <RefreshCw size={13} className={aCarregar ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {cartoes.map(({ chave, titulo, destaque }) => {
          const dados = relatorios[chave];
          return (
            <div key={chave} className={`rounded-lg p-4 sm:p-5 shadow-sm ${destaque ? "border-2 border-emerald-500 bg-emerald-50" : "bg-white"}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-wide ${destaque ? "text-emerald-600" : "text-slate-400"}`}>{titulo}</p>
                <Wallet size={16} className={destaque ? "text-emerald-500" : "text-slate-300"} />
              </div>
              <p className={`mt-3 text-xl sm:text-2xl font-bold ${destaque ? "text-emerald-700" : "text-slate-800"}`}>
                {dados ? formatarMoeda(dados.valor_total) : "—"}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <TrendingUp size={12} />
                {dados ? `${dados.total_vendas} venda(s)` : "a carregar..."}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-white p-4 sm:p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-700">Stock baixo (≤ 10 unid.)</h3>
        </div>
        {estoqueBaixo.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum produto com stock baixo neste momento.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {estoqueBaixo.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-slate-700">{p.nome}</span>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">{p.stock} unid.</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PRODUTOS                                                                */
/* ---------------------------------------------------------------------- */

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [form, setForm] = useState({ nome: "", categoria: "", preco: "", stock: "" });
  const [produtoEditar, setProdutoEditar] = useState(null);
  const [formEdicao, setFormEdicao] = useState({ nome: "", categoria: "", preco: "", stock: "" });
  const [aEditar, setAEditar] = useState(false);

  const carregar = useCallback(async () => {
    setACarregar(true);
    setErro("");
    try {
      const res = await fetch(`${API_URL}/produtos`, { headers: authHeaders() });
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch {
      setErro("Não foi possível carregar os produtos.");
    } finally {
      setACarregar(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const atualizarCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const abrirEdicao = (produto) => {
    setProdutoEditar(produto);
    setFormEdicao({ nome: produto.nome, categoria: produto.categoria, preco: produto.preco, stock: produto.stock });
    setErro("");
  };

  const atualizarCampoEdicao = (campo, valor) => setFormEdicao((f) => ({ ...f, [campo]: valor }));

  const guardarEdicao = async (e) => {
    e.preventDefault();
    setAEditar(true);
    setErro("");
    try {
      const res = await fetch(`${API_URL}/produtos/${produtoEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ nome: formEdicao.nome, categoria: formEdicao.categoria, preco: Number(formEdicao.preco), stock: Number(formEdicao.stock) }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao editar produto."); return; }
      setProdutoEditar(null);
      carregar();
    } catch {
      setErro("Sem ligação ao servidor.");
    } finally {
      setAEditar(false);
    }
  };

  const adicionarProduto = async (e) => {
    e.preventDefault();
    setAGuardar(true);
    setErro("");
    try {
      const res = await fetch(`${API_URL}/produtos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ nome: form.nome, categoria: form.categoria, preco: Number(form.preco), stock: Number(form.stock) }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao adicionar produto."); return; }
      setForm({ nome: "", categoria: "", preco: "", stock: "" });
      setMostrarForm(false);
      carregar();
    } catch {
      setErro("Sem ligação ao servidor.");
    } finally {
      setAGuardar(false);
    }
  };

  const eliminarProduto = async (id, nome) => {
    if (!window.confirm(`Eliminar "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`${API_URL}/produto/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao eliminar produto."); return; }
      setProdutos((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setErro("Sem ligação ao servidor.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">Produtos</h2>
        <button onClick={() => setMostrarForm((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <Plus size={16} />
          <span className="hidden sm:inline">Novo produto</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {erro && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</div>}

      {mostrarForm && (
        <form onSubmit={adicionarProduto} className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Nome</label>
              <input required value={form.nome} onChange={(e) => atualizarCampo("nome", e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" placeholder="Coca-Cola 330ml" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Categoria</label>
              <input required value={form.categoria} onChange={(e) => atualizarCampo("categoria", e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" placeholder="Refrigerante" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Preço (MTN)</label>
              <input required type="number" min="0" step="0.01" value={form.preco} onChange={(e) => atualizarCampo("preco", e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" placeholder="50.00" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Stock</label>
              <input required type="number" min="0" value={form.stock} onChange={(e) => atualizarCampo("stock", e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" placeholder="50" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={aGuardar} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {aGuardar ? "A guardar..." : "Guardar produto"}
            </button>
          </div>
        </form>
      )}

      {produtoEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={guardarEdicao} className="w-full max-w-md flex flex-col gap-3 rounded-lg bg-white p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-700">Editar produto</h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Nome</label>
              <input required value={formEdicao.nome} onChange={(e) => atualizarCampoEdicao("nome", e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Categoria</label>
              <input required value={formEdicao.categoria} onChange={(e) => atualizarCampoEdicao("categoria", e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Preço (MTN)</label>
                <input required type="number" min="0" step="0.01" value={formEdicao.preco} onChange={(e) => atualizarCampoEdicao("preco", e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Stock</label>
                <input required type="number" min="0" value={formEdicao.stock} onChange={(e) => atualizarCampoEdicao("stock", e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setProdutoEditar(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={aEditar} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {aEditar ? "A guardar..." : "Guardar alterações"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="hidden sm:grid grid-cols-[1fr_140px_110px_90px_90px] gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Produto</span><span>Categoria</span><span>Preço</span><span>Stock</span><span />
        </div>
        {aCarregar ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">A carregar produtos...</p>
        ) : produtos.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhum produto registado.</p>
        ) : (
          produtos.map((p) => (
            <div key={p.id} className="border-b border-slate-100 last:border-0">
              <div className="hidden sm:grid grid-cols-[1fr_140px_110px_90px_90px] items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50/50">
                <span className="font-medium text-slate-800">{p.nome}</span>
                <span className="text-slate-500">{p.categoria}</span>
                <span className="text-slate-600">{formatarMoeda(p.preco)}</span>
                <span className="text-slate-600">{p.stock}</span>
                <div className="flex items-center gap-1">
                  <button aria-label={`Editar produto ${p.nome}`} onClick={() => abrirEdicao(p)} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                    <Pencil size={16} />
                  </button>
                  <button aria-label={`Eliminar produto ${p.nome}`} onClick={() => eliminarProduto(p.id, p.nome)} className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="sm:hidden flex items-start justify-between px-4 py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{p.nome}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.categoria}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-bold text-emerald-700">{formatarMoeda(p.preco)}</span>
                    <span className="text-xs text-slate-400">{p.stock} unid.</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button aria-label={`Editar produto ${p.nome}`} onClick={() => abrirEdicao(p)} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                    <Pencil size={16} />
                  </button>
                  <button aria-label={`Eliminar produto ${p.nome}`} onClick={() => eliminarProduto(p.id, p.nome)} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ESTOQUE                                                                 */
/* ---------------------------------------------------------------------- */

function nivelStock(stock) {
  if (stock <= 10) return { label: "Baixo", classes: "bg-red-50 text-red-600" };
  if (stock <= 30) return { label: "Médio", classes: "bg-amber-50 text-amber-600" };
  return { label: "Bom", classes: "bg-emerald-50 text-emerald-600" };
}

function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/produtos`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => setProdutos(Array.isArray(data) ? data : []))
      .catch(() => setErro("Não foi possível carregar o estoque."))
      .finally(() => setACarregar(false));
  }, []);

  const totalUnidades = produtos.reduce((acc, p) => acc + Number(p.stock), 0);
  const valorEmStock = produtos.reduce((acc, p) => acc + Number(p.stock) * Number(p.preco), 0);
  const baixoCount = produtos.filter((p) => p.stock <= 10).length;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base sm:text-lg font-semibold text-slate-800">Estoque</h2>

      {erro && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Unidades em stock</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{totalUnidades}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Valor em stock</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{formatarMoeda(valorEmStock)}</p>
        </div>
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <p className="text-xs uppercase tracking-wide text-red-500">Produtos com stock baixo</p>
          <p className="mt-1 text-xl font-bold text-red-600">{baixoCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="hidden sm:grid grid-cols-[1fr_140px_100px_120px] gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Produto</span><span>Categoria</span><span>Stock</span><span>Situação</span>
        </div>
        {aCarregar ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">A carregar...</p>
        ) : (
          produtos.slice().sort((a, b) => a.stock - b.stock).map((p) => {
            const nivel = nivelStock(p.stock);
            return (
              <div key={p.id} className="border-b border-slate-100 last:border-0">
                <div className="hidden sm:grid grid-cols-[1fr_140px_100px_120px] items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50/50">
                  <span className="font-medium text-slate-800">{p.nome}</span>
                  <span className="text-slate-500">{p.categoria}</span>
                  <span className="text-slate-600">{p.stock} unid.</span>
                  <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${nivel.classes}`}>{nivel.label}</span>
                </div>
                <div className="sm:hidden flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{p.nome}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.categoria} · {p.stock} unid.</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${nivel.classes}`}>{nivel.label}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* VENDAS ADMIN — agora filtrado por data via calendário                  */
/* ---------------------------------------------------------------------- */

function VendasAdmin() {
  const hoje = new Date().toISOString().split("T")[0];
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [relatorio, setRelatorio] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback((data) => {
    setACarregar(true);
    setErro("");
    Promise.all([
      fetch(`${API_URL}/vendas/relatorio?data=${data}`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API_URL}/vendas?data=${data}`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([rel, lista]) => { setRelatorio(rel); setHistorico(Array.isArray(lista) ? lista : []); })
      .catch(() => setErro("Não foi possível carregar as vendas."))
      .finally(() => setACarregar(false));
  }, []);

  useEffect(() => { carregar(dataSelecionada); }, [dataSelecionada, carregar]);

  const mudarDia = (delta) => {
    const d = new Date(dataSelecionada);
    d.setDate(d.getDate() + delta);
    const nova = d.toISOString().split("T")[0];
    if (nova <= hoje) setDataSelecionada(nova);
  };

  const labelData = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">Vendas</h2>

        <div className="flex items-center gap-2">
          {/* Navegar para o dia anterior */}
          <button
            onClick={() => mudarDia(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Calendário nativo */}
          <div className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
            <CalendarDays size={15} className="text-emerald-600 flex-shrink-0" />
            <input
              type="date"
              value={dataSelecionada}
              max={hoje}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="text-sm font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          {/* Navegar para o dia seguinte */}
          <button
            onClick={() => mudarDia(1)}
            disabled={dataSelecionada >= hoje}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>

          {/* Atualizar */}
          <button
            onClick={() => carregar(dataSelecionada)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={aCarregar ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 -mt-2 capitalize">{labelData}</p>

      {erro && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-600">Total faturado</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-700">{relatorio ? formatarMoeda(relatorio.valor_total) : "—"}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Número de vendas</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-800">{relatorio ? relatorio.total_vendas : "—"}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="hidden sm:grid grid-cols-[60px_1fr_140px_120px_110px] gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>ID</span><span>Atendente</span><span>Pagamento</span><span>Data</span><span>Total</span>
        </div>
        {aCarregar ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">A carregar...</p>
        ) : historico.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma venda registada neste dia.</p>
        ) : (
          historico.map((v) => (
            <div key={v.id} className="border-b border-slate-100 last:border-0">
              <div className="hidden sm:grid grid-cols-[60px_1fr_140px_120px_110px] items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50/50">
                <span className="text-slate-400">#{v.id}</span>
                <span className="text-slate-700">{v.atendente ?? "—"}</span>
                <span className="capitalize text-slate-500">{v.metodo_pagamento}</span>
                <span className="text-slate-500">
                  {new Date(v.criado_em).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-semibold text-slate-800">{formatarMoeda(v.total)}</span>
              </div>
              <div className="sm:hidden flex items-start justify-between px-4 py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">#{v.id}</span>
                    <span className="text-sm font-medium text-slate-700">{v.atendente ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs capitalize text-slate-400">{v.metodo_pagamento}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">
                      {new Date(v.criado_em).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-slate-800 text-sm flex-shrink-0">{formatarMoeda(v.total)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}