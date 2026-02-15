# 🧙‍♂️ Insight Sorcerer

System Dynamics modeling platform inspired by Insight Maker. Build, simulate, and analyze complex system dynamics models with an intuitive visual interface and AI-powered assistance.

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20GoJS%20%7C%20Fastify-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🎨 **Visual Modeling** - Drag-and-drop interface for Stock & Flow diagrams
- 🔬 **Simulation Engine** - Run dynamic simulations of your models
- 📊 **Interactive Charts** - Visualize simulation results in real-time
- 🤖 **AI Assistant** - Get help building models, debugging, and creating formulas
- 💾 **Local Storage** - Save and load your models
- 🎯 **Formula Editor** - Advanced formula editing with autocomplete
- 🌐 **Real-time Sync** - WebSocket-based AI chat with auto-reconnection

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation & Development

Use the Makefile for easy setup:

```bash
# Install all dependencies (frontend + backend)
make install

# Run both frontend and backend
make dev
```

That's it! The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **AI Chat WebSocket**: ws://localhost:3001/api/ai/chat

### Manual Setup

If you prefer to run services individually:

```bash
# Frontend
npm install
npm run dev

# Backend (in separate terminal)
cd backend
npm install
npm run dev
```

## 📋 Available Commands

Run `make help` to see all available commands:

```bash
make help              # Show all available commands
make install           # Install all dependencies
make dev               # Run frontend + backend in parallel
make dev-frontend      # Run only frontend
make dev-backend       # Run only backend
make build             # Build frontend for production
make clean             # Remove node_modules and build artifacts
make lint              # Lint code
make stop              # Stop all running services
```

## 🏗️ Project Structure

```
insight_sorcerer/
├── src/                      # Frontend source code
│   ├── components/          # React components
│   │   ├── AIChat/         # AI assistant chat
│   │   ├── Diagram/        # GoJS diagram component
│   │   ├── Sidebar/        # Side panel with tools
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Redux store
│   ├── utils/              # Utility functions
│   └── styles/             # Global styles and CSS variables
├── backend/                 # Backend API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   │   └── ai.ts       # AI/WebSocket endpoints
│   │   ├── types/          # TypeScript types
│   │   └── server.ts       # Fastify server
│   └── package.json
├── docs/                    # Documentation
├── Makefile                # Development automation
└── package.json            # Frontend dependencies
```

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **GoJS** - Diagram library
- **Redux Toolkit** - State management
- **CodeMirror** - Formula editor

### Backend
- **Fastify** - Web framework
- **@fastify/websocket** - WebSocket support
- **TypeScript** - Type safety
- **pino** - Logging

## 🎯 Key Components

### Stock & Flow Modeling
Create dynamic system models using:
- **Stock** - Accumulates values over time
- **Flow** - Rates of change
- **Variable** - Auxiliary calculations
- **Converter** - Data transformations
- **Links** - Influences between elements

### AI Assistant
Real-time AI chat with:
- Model building assistance
- Formula debugging
- System analysis
- Smart suggestions
- Auto-reconnection with exponential backoff
- Heartbeat mechanism for connection stability

### Simulation Engine
Run simulations with:
- Configurable time parameters
- Multiple integration methods (Euler, RK4)
- Real-time results visualization
- Export capabilities

## 📚 Documentation

- [AI Chat Analysis](./docs/ai-chat-analysis.md) - WebSocket implementation and best practices
- [Redux Best Practices](./REDUX_BEST_PRACTICES.md) - State management guidelines
- [Backend API](./backend/README.md) - API documentation

## 🔧 Configuration

### Frontend Configuration
Edit `vite.config.ts` for Vite settings.

### Backend Configuration
Backend runs on port 3001 by default. Configure via environment variables:

```bash
# backend/.env
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
```

### CSS Variables
All design tokens are defined in `src/styles/variables.css`:
- Colors (dark theme)
- Spacing
- Typography
- Shadows
- Transitions

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting: `make lint`
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by [Insight Maker](https://insightmaker.com/)
- Built with [GoJS](https://gojs.net/)
- Powered by [Fastify](https://www.fastify.io/)

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

Made with ❤️ by the Insight Sorcerer team
