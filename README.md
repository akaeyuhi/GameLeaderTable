# GameLeaderTable

## What is GameLeaderTable?

GameLeaderTable is a **real-time multiplayer arcade game** inspired by the classic Agar.io mechanics, built as a comprehensive full-stack application for a Non-SQL databases course. The game features smooth real-time gameplay where players control growing cells in a competitive environment, utilizing modern web technologies and Redis for high-performance data management.

## 🎮 Game Overview

### **Gameplay Mechanics**
- **Cell Growth System**: Players start as small cells and grow by consuming food particles and smaller players
- **Competitive Eating**: Absorb other players who are significantly smaller than you (10% size advantage required)
- **Strategic Movement**: Larger cells move slower, creating natural game balance
- **Real-time Leaderboard**: Live ranking system showing top players by mass
- **Dynamic Food System**: Automatic food respawning maintains 100 active food particles

### **Game Rules**
- 🍬 **Food Consumption**: Each food particle increases your size by 50% of the food's mass
- ⚔️ **Player vs Player**: Consume players smaller than 90% of your size to gain 20% of their mass
- 🌍 **Boundary System**: Game world bounded by -500 to +500 coordinate system with visible red borders
- 🎯 **Victory Condition**: Climb the leaderboard by becoming the largest cell in the arena
- 🔄 **Respawn System**: Eliminated players can rejoin immediately with a new nickname

## 🚀 Key Features

### **Real-time Multiplayer**
- ✅ **Instant Synchronization**: 60fps game state updates across all connected clients
- ✅ **WebSocket Communication**: Socket.io powered real-time bidirectional communication
- ✅ **Optimized Networking**: Efficient data transmission with minimal latency
- ✅ **Collision Detection**: Server-side physics and collision handling

### **Advanced Data Management**
- 🗄️ **Redis Integration**: High-performance NoSQL database for game state management
- 📊 **Leaderboard System**: Redis sorted sets for real-time ranking with O(log N) performance
- 🔄 **Session Management**: Persistent player data with automatic cleanup on disconnect
- 📈 **Real-time Analytics**: Redis Insight integration for database monitoring

### **Modern Architecture**
- 🏗️ **Full-stack TypeScript**: Type-safe development across frontend and backend
- ⚡ **High-Performance Backend**: Node.js with optimized game loop running at 16.67ms intervals
- 🎨 **Responsive Frontend**: React with Tailwind CSS for modern, mobile-friendly UI
- 🐳 **Docker Containerization**: Complete development and production environment setup

## 🛠️ Technology Stack

### **Backend (Node.js + TypeScript)**
- **Runtime**: Node.js with TypeScript for type-safe server development
- **Real-time Communication**: Socket.io for WebSocket management and room handling
- **Database**: Redis for high-performance data storage and real-time operations
- **Game Loop**: Custom tick-based game engine running at 60 FPS equivalent
- **Docker**: Containerized deployment with multi-service orchestration

### **Frontend (React + TypeScript)**
- **Framework**: React 19 with functional components and modern hooks
- **Styling**: Tailwind CSS v4 for responsive, utility-first design
- **Real-time Updates**: Socket.io-client for seamless server communication
- **Canvas Rendering**: HTML5 Canvas for smooth 60fps game rendering

### **Database & Infrastructure**
- **Primary Database**: Redis 7 for ultra-fast data operations
- **Data Structures**: Redis hashes for player data, sorted sets for leaderboards
- **Monitoring**: Redis Insight for real-time database analytics
- **Development**: Docker Compose for local development environment

## 🎯 Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Node.js API    │◄──►│   Redis Store   │
│   (Frontend)    │    │   (WebSocket)    │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
    Socket.io              Game Engine              Data Structures:
    WebSocket            (60fps tick rate)           • Players Hash
    Communication                                    • Leaderboard SortedSet  
                                                    • Food Hash
                                                    
┌─────────────────────────────────────────────────────────────────┐
│                    Redis Insight Dashboard                      │
│              (Real-time Database Monitoring)                    │
└─────────────────────────────────────────────────────────────────┘
```

### **Core Game Systems**

**Game Engine**
- **Tick Rate**: 16.67ms intervals (equivalent to 60 FPS) for smooth gameplay
- **State Management**: Centralized game state with Redis persistence
- **Physics System**: Real-time collision detection and position validation
- **Food Management**: Dynamic food spawning system maintaining optimal density

**Player Management**
- **Connection Handling**: Automatic player creation/cleanup on connect/disconnect
- **Movement System**: Smooth interpolated movement with boundary constraints
- **Growth Mechanics**: Size-based speed calculation and consumption rules

**Data Persistence**
- **Player Storage**: Redis hashes storing position, size, color, and nickname
- **Leaderboard**: Redis sorted sets with automatic ranking updates
- **Food System**: Distributed food particle management with UUID tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Redis 7+
- Docker & Docker Compose (recommended)

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/akaeyuhi/GameLeaderTable.git
cd GameLeaderTable
```

#### 2. Development Setup (Docker - Recommended)
```bash
# Start all services with hot-reload
docker-compose up

# Services will be available at:
# - Game Frontend: http://localhost:5173
# - Game Backend: http://localhost:3001  
# - Redis Insight: http://localhost:5540
# - Redis Server: localhost:6379
```

#### 3. Manual Setup

**Backend Setup:**
```bash
cd backend
npm install

# Set environment variables
export REDIS_HOST=127.0.0.1
export REDIS_PORT=6379
export PORT=3001

# Start development server
npm run dev
```

**Frontend Setup:**
```bash
cd frontend
npm install

# Set environment variables
export VITE_WS_URL=ws://localhost:3001

# Start development server
npm run dev
```

**Redis Setup:**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or install Redis locally
# macOS: brew install redis
# Ubuntu: sudo apt install redis-server
```

### 🎮 How to Play

1. **Enter Game**: Open your browser to `http://localhost:5173`
2. **Choose Nickname**: Enter your desired player name
3. **Start Playing**: Use your mouse to control your cell movement
4. **Grow Your Cell**: 
   - Eat yellow food particles to grow slowly
   - Consume smaller players for rapid growth
   - Avoid larger players who can eat you!
5. **Climb Leaderboard**: Compete for the top position shown on the right side

## 🔧 Development

### **Project Structure**
```
GameLeaderTable/
├── backend/                 # Node.js TypeScript server
│   ├── src/
│   │   ├── index.ts        # Main server file with game loop
│   │   └── types/          # TypeScript interfaces
│   ├── Dockerfile          # Backend container config
│   └── package.json        # Backend dependencies
├── frontend/               # React TypeScript client
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # Socket.io service layer
│   │   └── types/         # Shared TypeScript types
│   ├── Dockerfile         # Frontend container config
│   └── package.json       # Frontend dependencies
└── docker-compose.yml     # Multi-service orchestration
```

### **Key Components**

**Backend (`backend/src/index.ts`)**
- WebSocket connection management with Socket.io
- Redis integration for persistent game state
- Real-time game loop with collision detection
- Player movement validation and food spawning

**Frontend Game Component (`frontend/src/components/Game/Game.tsx`)**
- HTML5 Canvas rendering with smooth animations
- Camera system following player position
- Real-time leaderboard display
- Keyboard/mouse input handling

**Socket Service (`frontend/src/services/socket.service.ts`)**
- WebSocket connection abstraction
- Type-safe event handling
- Environment-based URL configuration

### **Development Commands**

**Backend:**
```bash
npm run dev          # Start with hot-reload
npm run build        # Compile TypeScript
npm run start        # Run compiled version
npm run start:built  # Production start command
```

**Frontend:**
```bash
npm run dev          # Vite development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint code checking
```

### **Environment Configuration**

**Backend Environment Variables:**
```bash
REDIS_HOST=127.0.0.1     # Redis server host
REDIS_PORT=6379          # Redis server port  
PORT=3001                # Backend server port
```

**Frontend Environment Variables:**
```bash
VITE_WS_URL=ws://localhost:3001    # WebSocket server URL
```

## 🧪 Redis Database Schema

### **Data Models**
```typescript
// Player Object (stored as JSON string in Redis hash)
interface Player {
  id: string;        // Socket connection ID
  nick: string;      // Player nickname
  x: number;         // X coordinate (-500 to 500)
  y: number;         // Y coordinate (-500 to 500) 
  size: number;      // Player radius (affects speed and collision)
  color: string;     // HSL color string
}

// Food Object (stored as JSON string in Redis hash)
interface Food {
  id: string;        // UUID identifier
  x: number;         // X coordinate (-500 to 500)
  y: number;         // Y coordinate (-500 to 500)
  size: number;      // Fixed at 5 units
}

// Leaderboard Entry (Redis sorted set)
// Key: player ID, Score: player size
```

### **Redis Operations**
```bash
# View current players
HGETALL rlt:players

# Check leaderboard (top 10)
ZREVRANGE rlt:leaderboard 0 9 WITHSCORES  

# Monitor food particles
HGETALL rlt:foods

# Real-time command monitoring
MONITOR
```

## 🚀 Deployment

### **Production Deployment**

**Using Docker Compose:**
```bash
# Production build and deployment
docker-compose -f docker-compose.prod.yml up -d

# Scale backend instances
docker-compose up --scale backend=3
```

**Environment Variables for Production:**
```bash
REDIS_HOST=your-redis-host
REDIS_PORT=6379
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

**Performance Monitoring:**
- Redis Insight dashboard for database monitoring
- Application logs for error tracking  
- WebSocket connection metrics
- Real-time player count and game statistics

## 📄 License

This project is licensed under the ISC License - see the package.json files for details.

## 🤝 Contributing

This project was created for educational purposes as part of a Non-SQL databases course. Contributions are welcome for:

- Performance optimizations
- Additional game features  
- Code documentation improvements
- Bug fixes and stability improvements

## 🎓 Academic Context

**Course**: Non-SQL Databases
**Learning Objectives**:
- Practical application of Redis data structures
- Real-time data synchronization patterns
- Performance optimization in NoSQL environments
- Scalable application architecture design

---

**Built with ❤️ using modern web technologies for real-time multiplayer gaming**
