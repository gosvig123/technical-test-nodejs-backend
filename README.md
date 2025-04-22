# Technical Test: Node.js Backend

## Prerequisites
- Node.js 20.9.0
- Yarn (or npm)
- Docker & Docker Compose
- Postman (or similar API client)

## Quick Setup

1. **Clone & Install**
   clone the repo
   run 'yarn' to install dependencies

2. **Environment & Prisma Setup**
   # Configure environment
   cp .env.example .env
   
   Just changing the name will work with the existing docker database, however do change this if that is not the intention, and make sure to update the 
   API key, and the nebius api key from the example to really values
   
   # Setup database
   docker-compose up -d
   yarn prisma generate
   yarn prisma migrate dev --name init

3. **Database Setup**
   # Start PostgreSQL container
   docker-compose up -d
   
   # Verify container is running (should see "customer-db")
   docker ps


4. **Run Application**
   yarn build
   yarn start
   → Application runs at http://localhost:8000

## Testing

### API Testing (Postman)
1. Import `postmanCollection.json` from the project root
2. Set environment variables:
   - `baseURL`: http://localhost:8000
   - `apiKey`: Your API key

### Agent Testing
1. Navigate to http://localhost:8000 in browser
2. Ask questions about the database

### Interface Panels
- **Agent Thoughts**: Real-time thinking process
- **SQL Panel**: Database queries and results
- **Final Answer**: Synthesized response

