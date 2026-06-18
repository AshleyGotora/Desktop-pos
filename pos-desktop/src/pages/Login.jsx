import { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShoppingCart } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Erro ao fazer login.");
        return;
      }

      // Guardar token e info no localStorage
      localStorage.setItem("pos_token", data.token);
      localStorage.setItem("pos_role", data.role);
      localStorage.setItem("pos_email", data.email);

      // Antes: admin ia por window.location.href = "/admin" (reload de página)
      // e o atendente ia por onLogin(data). Misturar os dois obriga a duas
      // formas de navegação diferentes dentro do mesmo Electron app.
      // Agora os dois passam pelo mesmo callback — o App.jsx decide
      // qual painel mostrar (Admin ou Vendas) com base em data.role.
      onLogin(data);
    } catch {
      setErro("Sem ligação ao servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500">
            <ShoppingCart size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-100">ProPOS</h1>
            <p className="text-sm text-slate-400">Inicie sessão para continuar</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          {erro && (
            <div className="rounded-lg bg-red-900/40 border border-red-700/50 px-4 py-3 text-sm text-red-400">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 focus-within:border-emerald-500 transition">
              <Mail size={15} className="text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Senha
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 focus-within:border-emerald-500 transition">
              <Lock size={15} className="text-slate-500" />
              <input
                type={mostrarSenha ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="text-slate-500 hover:text-slate-300"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          ProPOS v4.2.0 · Maputo, Moçambique
        </p>
      </div>
    </div>
  );
}