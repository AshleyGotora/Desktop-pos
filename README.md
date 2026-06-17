# ProPOS

Sistema de Ponto de Venda (PDV) desktop, desenvolvido para negócios de take-away e bebidas em Moçambique. Permite gerir vendas, stock e produtos com controlo de acesso baseado em perfis (admin e atendente).

## Funcionalidades

- **Autenticação segura** com JWT e palavras-passe encriptadas com bcrypt
- **Dois perfis de utilizador:**
  - **Atendente** — regista vendas de forma rápida e simples
  - **Admin** — acesso total: dashboard, gestão de produtos, controlo de stock e relatórios de vendas
- **Painel administrativo** com 4 separadores: Dashboard, Produtos, Estoque e Vendas (relatório)
- **Moeda em MZN (Metical)**, adaptado ao mercado moçambicano
- **Validação de dados** com Zod no backend
- Aplicação desktop multiplataforma via Electron

## Stack tecnológico

**Frontend**
- Electron
- React (com `HashRouter`, por compatibilidade com Electron)
- Tailwind CSS

**Backend**
- Fastify
- MySQL
- JWT (autenticação)
- bcrypt (hash de palavras-passe)
- Zod (validação de schemas)

## Estrutura do projeto

```
propos/
├── frontend/           # Aplicação Electron + React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Vendas.jsx
│   │   │   └── admin/
│   │   │       └── admin.jsx   # Dashboard, Produtos, Estoque, Vendas
│   │   └── ...
│   └── package.json
├── backend/             # API Fastify
│   ├── src/
│   │   ├── routes/
│   │   ├── plugins/      # ex: plugin JWT
│   │   ├── schemas/       # validação Zod
│   │   └── app.js
│   └── package.json
└── README.md
```

> Ajusta esta estrutura caso o teu repositório esteja organizado de forma diferente.

## Pré-requisitos

- Node.js (v18 ou superior recomendado)
- MySQL instalado e em execução
- npm ou yarn

## Instalação

1. Clonar o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd propos
   ```

2. Instalar dependências do backend:
   ```bash
   cd backend
   npm install
   ```

3. Instalar dependências do frontend:
   ```bash
   cd ../frontend
   npm install
   ```

4. Configurar variáveis de ambiente no backend (`backend/.env`):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=senha
   DB_NAME=propos
   JWT_SECRET=sua_chave_secreta
   PORT=3000
   ```

5. Criar a base de dados e correr as migrações/scripts SQL (tabelas: `usuarios`, `produtos`, `vendas`, `itens_venda`).

## Executar o projeto

**Backend**
```bash
cd backend
npm run dev
```

**Frontend (Electron)**
```bash
cd frontend
npm run dev
```

## Perfis de acesso

| Perfil      | Permissões                                              |
|-------------|----------------------------------------------------------|
| Atendente   | Registar vendas                                           |
| Admin       | Dashboard, gestão de produtos, controlo de stock, relatórios de vendas |

## Segurança

- O `usuarios_id` é extraído do token JWT autenticado, nunca do corpo da requisição, para evitar manipulação por parte do cliente.
- Palavras-passe são armazenadas com hash via bcrypt.
- Rotas sensíveis são protegidas por middleware de verificação de perfil (role-based access).

## Autor

Desenvolvido por Ashley, estudante de Engenharia Informática no ITC (Instituto de Transportes e Comunicações), Maputo.

## Licença

Este projeto ainda não tem uma licença definida.