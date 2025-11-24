# 🤖 WhatsApp AI Intelligence

> **Bot inteligente de resumo para WhatsApp com IA** - Transcreve áudios, analisa imagens e gera resumos executivos contextualmente ricos de suas conversas.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

---

## 📋 Índice

- [Sobre](#-sobre)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como Usar](#-como-usar)
- [Interface Web](#-interface-web)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Reference](#-api-reference)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre

O **WhatsApp AI Intelligence** é um bot que conecta ao seu WhatsApp pessoal ou comercial e utiliza inteligência artificial para processar mensagens automaticamente. Ele é capaz de:

- **Transcrever áudios** usando modelos de IA gratuitos
- **Analisar imagens** e extrair informações visuais
- **Gerar resumos executivos** contextuais de conversas
- **Exibir tudo em tempo real** através de uma interface web moderna

Este projeto foi desenvolvido para ajudar profissionais, equipes de atendimento e qualquer pessoa que precise acompanhar múltiplas conversas de forma eficiente.

---

## ✨ Funcionalidades

### 🎤 Transcrição de Áudio
- Transcrição automática de mensagens de voz
- Retry automático em caso de rate limiting
- Suporte a múltiplos modelos de IA gratuitos

### 🖼️ Análise de Imagens
- Reconhecimento visual com Google Gemini 2.0
- Descrição automática do conteúdo da imagem
- Integração com o resumo contextual

### 📊 Resumo Inteligente
- **Resumos Executivos** estruturados por tópicos:
  - 🎯 Objetivo Principal
  - 📝 Pontos Chave
  - 🚦 Status/Ação Necessária
  - 🧠 Contexto/Humor
- Contexto evolutivo (análise das últimas 20 mensagens)
- Atualização automática em tempo real

### 💬 Interface Web Moderna
- Design **Apple-inspired** com glassmorphism
- Dark mode profissional
- Layout em duas colunas (Chat + Resumo)
- **Envio de mensagens** diretamente pela interface
- Atualização em tempo real sem reload da página

---

## 🛠️ Tecnologias

Este projeto utiliza as seguintes tecnologias e APIs:

### Backend
- **[Node.js](https://nodejs.org/)** (v18+)
- **[Express](https://expressjs.com/)** - Framework web minimalista
- **[Baileys](https://github.com/WhiskeySockets/Baileys)** - Biblioteca WhatsApp Web API
- **[Axios](https://axios-http.com/)** - Cliente HTTP para requisições
- **[dotenv](https://github.com/motdotla/dotenv)** - Gerenciamento de variáveis de ambiente

### Frontend
- **HTML5** + **CSS3** (Vanilla)
- **JavaScript** (ES6+)
- **Google Fonts** (SF Pro Display, Inter)

### Inteligência Artificial
- **[OpenRouter API](https://openrouter.ai/)** - Gateway para múltiplos modelos de IA
  - `x-ai/grok-4.1-fast:free` - Geração de resumos
  - `google/gemini-2.0-flash-exp:free` - Análise de imagens e transcrição

### Outras Ferramentas
- **[Pino](https://github.com/pinojs/pino)** - Logger de alta performance
- **[QRCode Terminal](https://github.com/gtanner/qrcode-terminal)** - Geração de QR Code no terminal

---

## 📚 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** versão 18 ou superior ([Download](https://nodejs.org/))
- **npm** ou **yarn** (gerenciador de pacotes)
- **Git** ([Download](https://git-scm.com/))
- Uma conta no **[OpenRouter](https://openrouter.ai/)** (gratuita)

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/davemaciel/zapbot.git
cd zapbot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (veja [Configuração](#-configuração) abaixo).

---

## ⚙️ Configuração

### Obtenha sua chave da API OpenRouter

1. Acesse [OpenRouter](https://openrouter.ai/)
2. Crie uma conta gratuita
3. Vá em **Settings** → **API Keys**
4. Copie sua chave

### Configure o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
OPENROUTER_API_KEY=your_api_key_here
```

> ⚠️ **Importante**: Nunca compartilhe seu arquivo `.env` ou sua chave da API publicamente!

---

## 💻 Como Usar

### 1. Inicie o servidor

```bash
node index.js
```

### 2. Conecte ao WhatsApp

Ao iniciar, um **QR Code** será exibido no terminal. Escaneie-o com seu WhatsApp:

1. Abra o WhatsApp no celular
2. Vá em **Configurações** → **Aparelhos conectados**
3. Toque em **Conectar um aparelho**
4. Escaneie o QR Code exibido no terminal

### 3. Acesse a interface web

Abra seu navegador em:

```
http://localhost:3000
```

### 4. Comece a usar!

- Envie mensagens para seu número conectado
- As conversas aparecerão automaticamente na interface
- Os resumos serão gerados em tempo real
- Você pode responder mensagens diretamente pela interface

---

## 🎨 Interface Web

A interface web foi desenvolvida com foco em **design moderno** e **usabilidade**:

### Características Visuais
- 🌑 **Dark Mode** profissional
- ✨ **Glassmorphism** (efeitos de vidro fosco)
- 🎨 Paleta de cores **Apple-inspired**
- 📱 Layout responsivo
- ⚡ Animações suaves e micro-interações

### Funcionalidades
- 📋 **Lista de conversas** com preview da última mensagem
- 💬 **Chat em tempo real** com bolhas de mensagens
- 🤖 **Painel de resumo inteligente** com ícone IA
- ✍️ **Envio de mensagens** com input estilizado
- 🔄 **Atualização automática** a cada 2 segundos

---

## 📁 Estrutura do Projeto

```
zapbot/
├── index.js                 # Servidor principal (Express + Baileys)
├── package.json            # Dependências e scripts
├── .env                    # Variáveis de ambiente (não versionado)
├── .gitignore              # Arquivos ignorados pelo Git
├── README.md               # Este arquivo
├── public/                 # Frontend
│   ├── index.html          # Estrutura HTML
│   ├── style.css           # Estilos (Dark Mode + Glassmorphism)
│   └── app.js              # Lógica do frontend (JS)
└── auth_info_baileys/      # Sessão do WhatsApp (não versionado)
```

---

## 🔌 API Reference

### Endpoints HTTP

#### `GET /api/chats`
Retorna todas as conversas ativas com suas mensagens e resumos.

**Resposta:**
```json
[
  {
    "id": "5511999999999@s.whatsapp.net",
    "name": "João Silva",
    "messages": [
      {
        "id": "msg_id",
        "timestamp": "2025-01-15T10:30:00.000Z",
        "sender": "João Silva",
        "type": "Texto",
        "text": "Olá, tudo bem?"
      }
    ],
    "summary": "🎯 Objetivo Principal: Saudação inicial...",
    "lastUpdate": "2025-01-15T10:30:00.000Z"
  }
]
```

#### `POST /api/messages/send`
Envia uma mensagem para um chat específico.

**Body:**
```json
{
  "chatId": "5511999999999@s.whatsapp.net",
  "text": "Sua mensagem aqui"
}
```

**Resposta:**
```json
{
  "success": true
}
```

---

## 🤝 Contribuindo

Contribuições são **muito bem-vindas**! Este é um projeto open source feito para a comunidade.

### Como contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Ideias de melhorias:
- [ ] Suporte a múltiplas contas WhatsApp
- [ ] Webhooks para integração com outros sistemas
- [ ] Dashboard de analytics
- [ ] Comandos personalizados
- [ ] Tradutor automático
- [ ] Agendamento de mensagens

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ por **[Dave Maciel](https://github.com/davemaciel)**

Se este projeto te ajudou, considere dar uma ⭐️!

---

## 🙏 Agradecimentos

- [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) - Pela incrível biblioteca WhatsApp
- [OpenRouter](https://openrouter.ai/) - Pelo acesso gratuito a modelos de IA
- Comunidade open source - Por tornar projetos como este possíveis

---

## 📞 Suporte

Encontrou um bug ou tem alguma sugestão?

- Abra uma [Issue](https://github.com/davemaciel/zapbot/issues)
- Envie um Pull Request
- Entre em contato pelo [GitHub](https://github.com/davemaciel)

---

**Feito com dedicação para a comunidade de desenvolvedores brasileiros 🇧🇷**
