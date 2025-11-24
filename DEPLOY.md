# 🚂 Deploy no Railway

Este guia mostra como fazer deploy do **WhatsApp AI Intelligence** no Railway para torná-lo acessível externamente.

---

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app/) (gratuita)
2. Conta no [GitHub](https://github.com/) (para conectar o repositório)
3. Chave da API do OpenRouter

---

## 🚀 Passo a Passo

### 1. Acesse o Railway

1. Vá para [railway.app](https://railway.app/)
2. Clique em **Login** e conecte com GitHub

### 2. Crie um Novo Projeto

1. Clique em **New Project**
2. Selecione **Deploy from GitHub repo**
3. Escolha o repositório **zapbot**

### 3. Configure as Variáveis de Ambiente

⚠️ **IMPORTANTE**: Configure a variável de ambiente antes do deploy!

1. No painel do Railway, clique na aba **Variables**
2. Adicione a seguinte variável:
   ```
   OPENROUTER_API_KEY=sua_chave_aqui
   ```

### 4. Deploy Automático

O Railway vai:
- ✅ Detectar automaticamente que é um projeto Node.js
- ✅ Instalar as dependências (`npm install`)
- ✅ Iniciar o servidor (`npm start`)

### 5. Obtenha o URL Público

1. Vá na aba **Settings**
2. Clique em **Generate Domain**
3. Copie o URL gerado (ex: `https://zapbot-production.up.railway.app`)

---

## ⚠️ Conectar ao WhatsApp

Como o Railway não tem terminal interativo para escanear QR Code, você tem **2 opções**:

### Opção 1: Conectar Localmente Primeiro (Recomendado)

1. Execute o bot **localmente** no seu computador:
   ```bash
   node index.js
   ```

2. Escaneie o QR Code com seu WhatsApp

3. A pasta `auth_info_baileys/` será criada com sua sessão

4. **Não faça commit dessa pasta!** (já está no .gitignore)

5. Para usar no Railway, você precisaria:
   - Usar um banco de dados externo (MongoDB, PostgreSQL)
   - Ou implementar um sistema de autenticação via painel web

### Opção 2: Implementar Painel de QR Code (Avançado)

Crie uma rota `/qr` que exibe o QR Code na web ao invés do terminal.

---

## 📊 Monitoramento

No painel do Railway você pode:
- 📈 Ver logs em tempo real
- 📉 Monitorar uso de CPU e memória
- 🔄 Reiniciar o serviço
- 📊 Ver métricas de deploy

---

## 🔧 Variáveis de Ambiente Disponíveis

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `OPENROUTER_API_KEY` | Chave da API OpenRouter | ✅ Sim |
| `PORT` | Porta do servidor (Railway define automaticamente) | ❌ Não |

---

## 💰 Custos

Railway oferece:
- ✅ **Plano Gratuito**: $5 de crédito/mês
- ✅ Suficiente para projetos pequenos
- ⚠️ Pode exigir cartão de crédito para verificação

---

## 🆘 Troubleshooting

### Erro: "Application failed to start"
- Verifique se `OPENROUTER_API_KEY` está configurada
- Veja os logs no painel do Railway

### Erro: "Port already in use"
- O Railway configura `PORT` automaticamente
- Não force uma porta específica no código

### WhatsApp desconecta
- A sessão do Baileys expira após inatividade
- Você precisa reconectar escaneando o QR Code novamente

---

## 📝 Próximos Passos

Após o deploy, considere:
- [ ] Implementar autenticação via painel web
- [ ] Adicionar persistência com banco de dados
- [ ] Configurar webhooks para avisos
- [ ] Monitorar logs e erros

---

**Pronto! Seu bot está no ar! 🎉**

Acesse: `https://seu-projeto.up.railway.app`
