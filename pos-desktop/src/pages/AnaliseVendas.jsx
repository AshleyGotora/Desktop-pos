import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarDays,
  TrendingUp,
  ShoppingBag,
  Receipt,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("pos_token");
  return { Authorization: `Bearer ${token}` };
}

function fmt(valor) {
  return `${Number(valor || 0).toFixed(2)} MTN`;
}

function fmtCompact(valor) {
  const n = Number(valor || 0);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

// Agrupa as vendas por hora e devolve array para o Recharts
function agruparPorHora(vendas) {
  const porHora = {};

  for (const v of vendas) {
    // Protege contra datas que o JS não consegue parsear (ex.: "YYYY-MM-DD HH:mm:ss"
    // sem "T" em alguns browsers) e contra total vindo como string do MySQL.
    const dataVenda = new Date(v.criado_em);
    const hora = dataVenda.getHours();
    const total = Number(v.total);

    if (Number.isNaN(hora) || Number.isNaN(total)) continue;

    if (!porHora[hora]) {
      porHora[hora] = { hora, faturamento: 0, vendas: 0 };
    }
    porHora[hora].faturamento += total;
    porHora[hora].vendas += 1;
  }

  // Preenche horas sem vendas entre o mínimo e o máximo
  const horas = Object.keys(porHora).map(Number).sort((a, b) => a - b);
  if (horas.length === 0) return [];

  const min = horas[0];
  const max = horas[horas.length - 1];
  const resultado = [];

  for (let h = min; h <= max; h++) {
    resultado.push({
      label: `${h}h`,
      faturamento: porHora[h] ? Number(porHora[h].faturamento.toFixed(2)) : 0,
      vendas: porHora[h] ? porHora[h].vendas : 0,
    });
  }

  return resultado;
}

// Tooltip personalizado para o gráfico
function TooltipPersonalizado({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}:{" "}
          <span className="font-bold">
            {p.dataKey === "faturamento" ? fmt(p.value) : `${p.value} venda(s)`}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function AnaliseVendas() {
  const hoje = new Date().toISOString().split("T")[0];
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [dados, setDados] = useState(null);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async (data) => {
    setACarregar(true);
    setErro("");
    setDados(null);
    try {
      const res = await fetch(`${API_URL}/vendas/analise?data=${data}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro ao carregar análise.");
        return;
      }
      setDados(json);
    } catch {
      setErro("Sem ligação ao servidor.");
    } finally {
      setACarregar(false);
    }
  }, []);

  useEffect(() => {
    carregar(dataSelecionada);
  }, [dataSelecionada, carregar]);

  const mudarDia = (delta) => {
    const d = new Date(dataSelecionada);
    d.setDate(d.getDate() + delta);
    const nova = d.toISOString().split("T")[0];
    if (nova <= hoje) setDataSelecionada(nova);
  };

  const dadosGrafico = dados ? agruparPorHora(dados.vendas) : [];
  const metricas = dados?.metricas;

  const labelData = new Date(dataSelecionada + "T12:00:00").toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-5">

      {/* Cabeçalho com navegação de data */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">
          Análise de vendas
        </h2>

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

      {/* Label da data selecionada */}
      <p className="text-xs text-slate-400 -mt-2 capitalize">{labelData}</p>

      {/* Erro */}
      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {erro}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={Receipt}
          label="Faturamento total"
          valor={metricas ? fmt(metricas.faturamento_total) : "—"}
          destaque
          carregando={aCarregar}
        />
        <MetricCard
          icon={ShoppingBag}
          label="Vendas realizadas"
          valor={metricas ? metricas.total_vendas : "—"}
          carregando={aCarregar}
        />
        <MetricCard
          icon={TrendingUp}
          label="Ticket médio"
          valor={metricas ? fmt(metricas.ticket_medio) : "—"}
          carregando={aCarregar}
        />
        <MetricCard
          icon={Package}
          label="Produto mais vendido"
          valor={metricas?.produto_mais_vendido?.nome ?? "—"}
          sub={
            metricas?.produto_mais_vendido
              ? `${metricas.produto_mais_vendido.quantidade} unid.`
              : undefined
          }
          carregando={aCarregar}
          compacto
        />
      </div>

      {/* Gráfico */}
      <div className="rounded-lg bg-white p-4 sm:p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-4">
          Lucro ao longo do dia
        </p>

        {aCarregar ? (
          <div className="flex h-56 items-center justify-center text-sm text-slate-400">
            A carregar...
          </div>
        ) : dadosGrafico.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-slate-400">
            Nenhuma venda registada neste dia.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={dadosGrafico}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              {/* Eixo esquerdo: faturamento */}
              <YAxis
                yAxisId="fat"
                orientation="left"
                tick={{ fontSize: 11, fill: "#10b981" }}
                tickFormatter={fmtCompact}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              {/* Eixo direito: número de vendas */}
              <YAxis
                yAxisId="qtd"
                orientation="right"
                tick={{ fontSize: 11, fill: "#8b5cf6" }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<TooltipPersonalizado />} />
              <Legend
                formatter={(value) =>
                  value === "faturamento" ? "Faturamento (MTN)" : "Nº de vendas"
                }
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
              {/* Linha de faturamento */}
              <Line
                yAxisId="fat"
                type="monotone"
                dataKey="faturamento"
                name="faturamento"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              {/* Linha de número de vendas */}
              <Line
                yAxisId="qtd"
                type="monotone"
                dataKey="vendas"
                name="vendas"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabela de vendas do dia */}
      {dados && dados.vendas.length > 0 && (
        <div className="rounded-lg bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">
              Vendas do dia ({dados.vendas.length})
            </p>
          </div>

          {/* Cabeçalho desktop */}
          <div className="hidden sm:grid grid-cols-[60px_1fr_130px_110px_110px] gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100">
            <span>ID</span>
            <span>Atendente</span>
            <span>Pagamento</span>
            <span>Hora</span>
            <span>Total</span>
          </div>

          <div className="divide-y divide-slate-50">
            {dados.vendas.map((v) => (
              <div key={v.id}>
                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-[60px_1fr_130px_110px_110px] items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50/50">
                  <span className="text-slate-400 font-mono">#{v.id}</span>
                  <span className="text-slate-700">{v.atendente ?? "—"}</span>
                  <span className="capitalize text-slate-500">
                    {v.itens?.length > 0
                      ? `${v.itens.length} item(s)`
                      : "—"}
                  </span>
                  <span className="text-slate-500">
                    {new Date(v.criado_em).toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {fmt(v.total)}
                  </span>
                </div>
                {/* Mobile */}
                <div className="sm:hidden flex items-center justify-between px-4 py-3 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">#{v.id}</span>
                      <span className="text-sm font-medium text-slate-700">
                        {v.atendente ?? "—"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(v.criado_em).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {v.itens?.length > 0 && ` · ${v.itens.length} item(s)`}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700 text-sm">
                    {fmt(v.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, valor, sub, destaque, carregando, compacto }) {
  return (
    <div
      className={`rounded-lg p-4 shadow-sm ${
        destaque
          ? "border-2 border-emerald-500 bg-emerald-50"
          : "bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${
            destaque ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          {label}
        </p>
        <Icon
          size={15}
          className={destaque ? "text-emerald-500" : "text-slate-300"}
        />
      </div>
      <p
        className={`font-bold leading-tight ${
          compacto ? "text-sm" : "text-xl sm:text-2xl"
        } ${destaque ? "text-emerald-700" : "text-slate-800"} ${
          carregando ? "opacity-30" : ""
        }`}
      >
        {valor}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
      )}
    </div>
  );
}