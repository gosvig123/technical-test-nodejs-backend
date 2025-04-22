# 🚀 Technical Test: Node.js Backend

## 📋 Prerequisites
- ✨ Node.js 20.9.0
- 📦 Yarn (or npm)
- 🐳 Docker & Docker Compose
- 🔧 Postman (or similar API client)

## ⚡ Quick Setup

### 1️⃣ Clone & Install
```bash
# Clone the repo
git clone https://github.com/gosvig123/technical-test-nodejs-backend

# Install dependencies
yarn
```

### 2️⃣ Environment & Prisma Setup
```bash
# Configure environment
cp .env.example .env
```
> **Note**: Just changing the name will work with the existing docker database. However, make sure to update the API key and the Nebius API key from the example to real values.

### 3️⃣ Database Setup
```bash
# Launch PostgreSQL with Docker Compose
# This will automatically:
# - Start the database container
# - Create the schema
# - Insert sample data
docker compose up -d

# Generate Prisma client only (no migrations needed as schema is created by init_db.sql)
```

```bash
yarn prisma generate
yarn prisma db push 
```

### 4️⃣ Run Application
```bash
yarn build
yarn start
```
> 🌐 Application runs at http://localhost:8000

## 🧪 Testing

### 🔌 API Testing (Postman)
1. Import `postmanCollection.json` from the project root
2. Set environment variables:
   - `baseURL`: http://localhost:8000
   - `apiKey`: Your API key

### 🤖 Agent Testing
1. Navigate to http://localhost:8000 in browser
2. Ask questions about the database

### 📊 Interface Panels
| Panel | Description |
|-------|-------------|
| 💭 **Agent Thoughts** | Real-time thinking process |
| 📝 **SQL Panel** | Database queries and results |
| ✨ **Final Answer** | Synthesized response |


