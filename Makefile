.PHONY: help install install-frontend install-backend dev dev-frontend dev-backend clean build test

# Default target - show help
help:
	@echo "🚀 Insight Sorcerer - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          - Install all dependencies (frontend + backend)"
	@echo "  make install-frontend - Install only frontend dependencies"
	@echo "  make install-backend  - Install only backend dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Run both frontend and backend in parallel"
	@echo "  make dev-frontend     - Run only frontend dev server"
	@echo "  make dev-backend      - Run only backend dev server"
	@echo ""
	@echo "Build:"
	@echo "  make build            - Build frontend for production"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Remove node_modules and build artifacts"
	@echo ""
	@echo "Testing:"
	@echo "  make test             - Run tests"

# Install all dependencies
install: install-frontend install-backend
	@echo "✅ All dependencies installed!"

# Install frontend dependencies
install-frontend:
	@echo "📦 Installing frontend dependencies..."
	npm install

# Install backend dependencies
install-backend:
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install

# Run both frontend and backend in parallel
dev:
	@echo "🚀 Starting Insight Sorcerer (Frontend + Backend)..."
	@echo ""
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:3001"
	@echo "WebSocket: ws://localhost:3001/api/ai/chat"
	@echo ""
	@echo "Press Ctrl+C to stop all services"
	@echo ""
	@$(MAKE) -j2 dev-frontend dev-backend

# Run only frontend
dev-frontend:
	@echo "🎨 Starting frontend dev server..."
	npm run dev

# Run only backend
dev-backend:
	@echo "⚙️  Starting backend dev server..."
	cd backend && npm run dev

# Build frontend for production
build:
	@echo "🏗️  Building frontend for production..."
	npm run build

# Clean all node_modules and build artifacts
clean:
	@echo "🧹 Cleaning up..."
	rm -rf node_modules
	rm -rf backend/node_modules
	rm -rf dist
	rm -rf backend/dist
	@echo "✅ Cleanup complete!"

# Run tests
test:
	@echo "🧪 Running tests..."
	npm run test

# Lint code
lint:
	@echo "🔍 Linting code..."
	npm run lint
	cd backend && npm run lint || true

# Stop all running processes (useful for cleanup)
stop:
	@echo "🛑 Stopping all services..."
	@pkill -f "vite" || true
	@pkill -f "tsx watch" || true
	@echo "✅ All services stopped!"

