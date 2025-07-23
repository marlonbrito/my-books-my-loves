# 📚 Minha Biblioteca

![Docker](https://img.shields.io/badge/docker-ready-blue?logo=docker)
![Vite](https://img.shields.io/badge/vite-react-blueviolet?logo=vite)
![Convex](https://img.shields.io/badge/backend-convex-4B5563?logo=vercel)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

Sistema fullstack para gerenciar sua biblioteca pessoal — ou pelo menos fingir que tá lendo alguma coisa 😅.  
Frontend em **React + Vite**, backend com **Convex**, servido com **NGINX + HTTPS** via Docker.

---

## 🧰 Tecnologias

- 🔧 **Frontend**: React + Vite
- ⚙️ **Backend**: Convex (serverless DB + funções)
- 🌐 **Servidor Web**: NGINX com HTTPS local
- 🐳 **Containers**: Docker e Docker Compose

---

## 📦 Estrutura esperada do projeto

```
.
├── docker-compose.yml
├── dockerfile.frontend
├── dockerfile.backend
├── dockerfile.ngnix
├── nginx.conf
├── localhost.pem
├── localhost-key.pem
├── .env.local
├── dist/                 # gerado pelo build do Vite
└── convex/               # código do backend Convex
```

---

## 🚀 Como rodar localmente

1. 🔑 Gere os certificados HTTPS (caso não tenha):

```bash
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost
```

2. 🧱 Faça build e suba os containers:

```bash
docker-compose up --build
```

3. 🧪 Acesse:

| Endereço                | Descrição                |
|-------------------------|--------------------------|
| https://localhost       | Frontend com HTTPS (via NGINX) |
| http://localhost:5173   | Frontend direto (modo dev)     |
| http://localhost:4000   | Backend (Convex Dev Server)   |

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com:

```env
CONVEX_DEPLOYMENT=dev
CONVEX_API_KEY=sua-chave-secreta
```

---

## 🐳 Comandos úteis

- Subir os serviços:
  ```bash
  docker-compose up --build
  ```

- Derrubar tudo:
  ```bash
  docker-compose down
  ```