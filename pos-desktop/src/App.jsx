import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Admin from "./pages/admin";
import Vendas from "./pages/Vendas";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [aVerificar, setAVerificar] = useState(true);

  // Ao abrir a app, verifica se já existe uma sessão guardada (não obriga
  // a fazer login outra vez sempre que se reinicia o Electron)
  useEffect(() => {
    const token = localStorage.getItem("pos_token");
    const role = localStorage.getItem("pos_role");
    const email = localStorage.getItem("pos_email");

    if (token && role) {
      setUsuario({ token, role, email });
    }
    setAVerificar(false);
  }, []);

  const handleLogin = (data) => {
    setUsuario(data);
  };

  const handleLogout = () => {
    setUsuario(null);
  };

  if (aVerificar) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-400">
        A carregar...
      </div>
    );
  }

  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

  // Decisão central de role: admin vê o painel de gestão, atendente vê o POS
  return usuario.role === "admin" ? (
    <Admin onLogout={handleLogout} />
  ) : (
    <Vendas onLogout={handleLogout} />
  );
}