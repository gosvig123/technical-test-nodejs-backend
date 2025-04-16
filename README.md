# Node.js Backend Challenge: LLM-Powered Customer Database API

## Project Description

In this challenge, you will build a Node.js backend (using TypeScript) that manages customer data and leverages a Large Language Model (LLM) to answer questions about that data. The application will use a PostgreSQL database (set up via Docker Compose) to store information about **Customers** and their related entities (such as orders and addresses). You will implement a RESTful API to perform CRUD operations on the customer data, secure the API with an authentication mechanism, and integrate an AI agent (using **LangGraph.js** and **LangChain**) that can respond to natural language queries about the customers in the database. Additionally, the server should support real-time streaming of the AI agent’s responses using **socket.io**, so that results can be sent to clients token-by-token as the LLM generates an answer.

## Setup Instructions

1. **Prerequisites**: Ensure you have the following installed on your development machine:
   - **Node.js** (v18 or above) and npm (or Yarn) for managing the Node.js project.
   - **Docker and Docker Compose** for running the PostgreSQL database.
   - (Optional but recommended) **PostgreSQL client tools** (like `psql` or a GUI like PgAdmin) to inspect the database.
   - An **LLM API key** we will provide you a testing API key.

2. **Project Initialization**: Initialize a new Node.js project and set up TypeScript:
   - Create a project folder and run `npm init` to initialize a package.json (or use a starter template if you have one).
   - Set up TypeScript configuration (`tsconfig.json`). Ensure the project is written in TypeScript (all server code should be in `.ts` files).
   - Install TypeScript and necessary types as dev dependencies (e.g., `npm install -D typescript @types/node`).
   - You can use a framework (like Express, Koa, Fastify, or NestJS) or a minimal custom server – choose what you're comfortable with, but remember to write it in TypeScript.

3. **Database Setup**: Set up a PostgreSQL database using Docker Compose.
   - Use the provided **`docker-compose.yml`** file. This defines a Postgres service with a database, user, and password for the challenge.
   - Use the provided **`init_db.sql`** script. This SQL script will create the schema and insert sample data.
   - Launch the database by running: `docker-compose up -d`. This will start a PostgreSQL container. On the **first run**, the Postgres container will automatically execute the SQL init script to create tables and seed the database with initial data (thanks to the volume mounting in the compose file).
   - Verify that the database container is running and the schema is created. For example, you can connect using `psql` or a DB client to ensure the tables (Customer, Address, Orders) exist and contain the sample rows.

   **docker-compose.yml** (PostgreSQL service configuration):
   **init_db.sql** (Database initialization script - schema and sample data):

4. **Database Configuration in App**: Configure your Node.js application to connect to the Postgres database. The compose file above sets the database server to listen on port 5432 of the host with:
   - **Host**: localhost (or 127.0.0.1)
   - **Port**: 5432
   - **Database**: `test_db`
   - **User**: `test_user`
   - **Password**: `test_pass`  
   You can use these credentials directly or set them via environment variables in your application. For example, create a `.env` file and add:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=test_db
   DB_USER=test_user
   DB_PASS=test_pass
   ``` 
   Use a Node Postgres client (like `pg`) or an ORM (such as Prisma or TypeORM) in your code to connect using these settings. Ensure that your application either reads the config from the environment or otherwise knows how to connect to the database.

5. **Implement the Application**: Now, implement the server according to the requirements (see **Requirements & Expectations** below for details on what to build). Structure your project in a logical way (for example, you might have separate directories or files for routes, database models, and the LLM agent logic). Use TypeScript best practices as you code (define interfaces/types for your data models, etc.). Key things to implement:
   - The Express (or chosen framework) app with routes for the Customer CRUD API.
   - Middleware or logic to enforce the API key authentication on those routes.
   - Integration with the database for handling those routes (e.g., using SQL/ORM queries to actually create, read, update, delete customers).
   - An endpoint (or service) for the LLM agent: e.g., you might create a POST route like `/agent/query` that accepts a question and returns an answer, or set up the socket.io server to accept a "query" event.
   - The LangChain/LangGraph agent logic that processes a question, queries the database, and formulates an answer.
   - Setting up socket.io on the server and emitting events for streaming responses.
   (These requirements are detailed in the next section.) Remember to keep everything in TypeScript and ensure the app compiles without errors.

6. **LLM call**
    - We provide you the API key for nebius api studio. The API is fully compatible with OpenAI api. You can use all packages and interfaces like if you were using OpenAI.
    - We provide you access to Llama 3.3 70B Instruct. Here you have the caracteristics of the model: [Model Characteristics](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct)
    - Example of api call:
```
const OpenAI = require('openai');

const client = new OpenAI({
    baseURL: 'https://api.studio.nebius.com/v1/',
    apiKey: process.env.NEBIUS_API_KEY,
});

client.chat.completions.create({
    "model": "meta-llama/Llama-3.3-70B-Instruct",
    "temperature": 0,
    "messages": []
})
    .then((response) => console.log(response));
```

6. **Run and Test**: Start your application and test all parts:
   - Test creating, updating, and deleting a customer via the API to ensure the CRUD functionality works and that changes reflect in the database.
   - Test the LLM agent integration by asking a question. For instance, if you have an `/agent/query` REST endpoint, you might `POST` a JSON payload like `{"question": "How many orders has Alice Wonderland made?"}` and see what response you get. 
   - **Socket.io Streaming**: Verify that the answer comes through in tokens stream by the LLM Agent. If the agent iterates through the graph. Stream in multiple messages.
   - Throughout testing, also check that unauthorized requests are handled (e.g. try calling an endpoint without the API key and expect a 401/403 response).
   - If you encounter issues or any feature isn't fully working, document these in your notes or code comments, and describe how you would fix or improve it given more time.

By following the above setup steps, you will have a working environment with a Postgres database (with sample data) and a Node.js TypeScript project ready for development. Next, we outline the specific requirements and expectations for the functionality you need to implement.

## Requirements & Expectations

Your task is to implement the following features and components. The solution should meet each requirement, and we also outline expectations or guidelines for each:

1. **Node.js Server in TypeScript**: Build the backend server using Node.js and TypeScript. The entire application code should be written in TypeScript (leveraging type definitions, interfaces, and compile-time checking). You are free to choose any server framework or libraries (Express is a common choice), but ensure that the project can be easily run and that type definitions are used where appropriate. We expect the code to be modular and organized (for example, separating route definitions, business logic, and database access). *Outcome:* A TypeScript Node.js server that starts up without errors and is ready to handle API requests.

2. **PostgreSQL Database with Docker**: Use Docker Compose to manage the database as described. The provided `docker-compose.yml` should launch a PostgreSQL instance accessible to your application. Ensure the database credentials in your application match those in the compose file. The focus here is on having a reliable local database setup so that the API and LLM agent can query data. *Outcome:* Running `docker-compose up` brings up a Postgres DB container that the Node.js app can connect to (using the host, port, user, password, DB name specified).

3. **Database Schema (Customers & Related Entities)**: Design a relational schema for the customer data and at least one related entity:
   - A **Customer** table (or model) is required. Include fields such as an `id` (primary key), `name`, `email`, and any other attributes you think are relevant (e.g., phone number, etc., though not strictly required beyond name/email for this challenge).
   - At least one related table that references the customer. For example:
     - An **Orders** table: representing orders placed by a customer. It could have fields like `id` (PK), `customer_id` (FK to Customer), `order_date`, `total_amount`, etc.
     - An **Address** table: representing addresses for the customer. Fields might include `id` (PK), `customer_id` (FK), `type` (e.g., 'billing' or 'shipping'), `street`, `city`, `zip`, `country`.
   - You can include both Orders and Address as separate related tables (more is fine, but at minimum one related entity is expected). Ensure that foreign keys are set up (so that, for instance, an Order is linked to a valid Customer).
   - The provided sample SQL script already creates these tables (Customer, Address, Orders) and inserts data. Ensure your application’s logic (and possibly ORM models) align with this schema.
   *Outcome:* The database contains a `Customer` table and at least one related table (like Orders/Address), with correct relationships. The schema should allow queries like "find all orders for a given customer" or "get all addresses of a customer," enabling the LLM agent to answer questions about this data.

4. **SQL Initialization Script**: Use the `init_db.sql` (provided) to initialize the database schema and insert sample data. This script should be executed when the database container first starts. **Expectation:** The script should run without errors and create the necessary tables and data. The sample data should include at least a few customers (e.g., 2-3 customers) with associated orders/addresses so that there is something to retrieve via the API and the LLM queries. If the script is run again (or if the tables already exist), it may error out; this is acceptable as long as it's clear it's meant to run on a fresh database. (In a real scenario, we'd make it idempotent or use migrations, but for this challenge a simple SQL seed is fine.) Make sure to document if any manual step is needed to run this script, though with the provided Docker setup it should auto-run on initialization.

5. **CRUD REST API for Customers**: Implement a RESTful API to manage **Customer** records.
   - Provide endpoints to **Create**, **Read**, **Update**, and **Delete** customers:
     - `POST /customers` – create a new customer. The request body might include fields like name, email, etc. On success, return the created customer record (including its assigned ID).
     - `GET /customers` – retrieve a list of all customers. This should return an array of customer records (optionally, support query parameters for filtering or pagination if you have time, but not required).
     - `GET /customers/{id}` – retrieve a single customer by ID. Return the customer record, potentially including related data like their orders or addresses (if you choose to embed that in the response; embedding is optional, could also be separate endpoints).
     - `PUT /customers/{id}` or `PATCH /customers/{id}` – update an existing customer’s information. The request body would include the fields to update (name, email, etc.). Respond with the updated record or a success status.
     - `DELETE /customers/{id}` – remove a customer record. (For simplicity, it's okay to do a hard delete. Ensure that related records like orders/addresses are handled appropriately - e.g., either disallow deleting a customer with existing orders, or cascade the delete. You can decide how to handle this and document your choice.)
   - Expectations for the API behavior:
     - Use proper HTTP status codes (e.g., 201 for creation, 200 for success retrieval, 404 for "not found" if an ID doesn't exist, 400 for invalid input, etc.).
     - Validate inputs minimally (e.g., no empty name or invalid email when creating a customer, if applicable). This doesn't have to be too complex; basic checks or using a library like express-validator is fine.
     - Handle errors gracefully and return JSON error responses with messages in case of failure.
   - It’s not required to implement CRUD for the related entities (orders, addresses) fully, but you can include them if you want. **At least the Customer CRUD must be done.** If you have extra time, an endpoint like `GET /customers/{id}/orders` or `GET /customers/{id}/addresses` would be a nice addition but is not strictly required.
   *Outcome:* A client can perform create/read/update/delete operations on customers via HTTP requests. The operations interact with the PostgreSQL database (e.g., creating a customer inserts into the DB, reading fetches from the DB, etc.). These endpoints will also serve as a foundation for testing the authentication and for verifying the LLM's answers.

6. **Authentication**: Protect the API with an authentication mechanism. Since this is a backend challenge without a full front-end, a simple API key-based auth is acceptable:
   - Require clients to provide an API key with each request to the protected endpoints. This can be done via a header (e.g., `X-API-Key: <your key>`).
   - The server should check this key against a value stored in configuration (for example, an environment variable as mentioned in setup).
   - If the key is missing or incorrect, the server should reject the request (respond with HTTP 401 Unauthorized or 403 Forbidden).
   - You can decide whether **all** endpoints require the API key, or only certain ones. At minimum, protect the modify operations (POST/PUT/PATCH/DELETE). It's also fine to require the key for GET requests as well, making the entire API private.
   - It's not necessary to implement a user database or OAuth for this challenge (that would be overkill). The API key approach is a straightforward way to secure the API for now. If you choose to implement something more advanced (like JWT tokens or Basic Auth), document it so we know how to use it.
   *Outcome:* Requests to the API (and optionally the LLM agent routes) must include a valid key to succeed. This will demonstrate knowledge of securing a backend service, even in a simple form. The key should be easy to configure/change (e.g., set via environment variable, not hardcoded in multiple places).

7. **LLM-Powered Agent (LangChain & LangGraph)**: Integrate an LLM-based agent that can answer natural language questions about the customer data. This is a core part of the challenge – we want to see how you use the AI tools to interface with the database:
   - Utilize **LangChain** and **LangGraph.js** libraries to build an agent. LangChain provides abstractions for LLMs and tools, and LangGraph can orchestrate complex agent flows. At a high level, your agent will take a user’s question in English and determine how to get the answer from the database.
   - **Question Answering with SQL**: You can implement this or any approach you see fit. LangChain has components (like SQLDatabaseChain or SQL agents) that can help with this, and LangGraph can help manage multi-step reasoning.
   - You have flexibility in how to implement the agent, but here are some expectations:
     - The agent should be able to access the database. This could mean you give it a "tool" that allows running SQL (e.g., a function it can call), or you pre-load some knowledge (but given the data can change, having it actually query the live DB is ideal).
     - Use the sample data to your advantage: e.g., if asked "How many orders has Alice placed?", the agent might generate the SQL `SELECT COUNT(*) FROM Orders WHERE customer_id = ...` and then use the result to respond "Alice has placed 2 orders." We should be able to see in your code how the agent arrives at the answer (for example, logging the generated SQL or the thought process is a plus).
     - The integration must be done by calling the LLM API via LangChain LangGraph must be used to set up a custom chain or agent that includes steps like: (1) think about which table to query, (2) use a tool to run a query, (3) get result, (4) respond.
     - Whichever approach you choose, document it. For example, if the agent is invoked via a specific endpoint (`POST /agent/query`), explain in a comment or README how it's working (e.g., "the agent uses an LLM to convert the question to SQL, executes it, and returns the answer").
   - **LangChain/LangGraph Usage**: We expect to see these libraries used in your code to handle the LLM part. This could mean using LangChain's chain/agent classes, or LangGraph's framework for structuring the agent's reasoning. You do *not* need to build a complex multi-agent system – a single agent that can answer questions is enough – but using these libraries will likely simplify your implementation.
   *Outcome:* The backend has an **AI agent** component that can accept a question (e.g., "Which customers live in Wonderland?" or "List all customers with no orders") and return an answer by querying the database. This could be exposed via a dedicated REST endpoint or through the websocket interface. We'll test this by asking a couple of questions against the sample data to see if the agent responds correctly.

8. **Real-time Streaming with Socket.io**: Implement a real-time channel for the agent’s responses using **Socket.io**.
   - The goal is to allow a client to receive the LLM's answer gradually, as it is being generated. In practice, this means if the LLM takes a few seconds to compose a multi-sentence answer, the client should start getting the first part of the answer before the entire answer is ready.
   - If the agent is iterating through the graph, you should stream events of all the steps he is taking.
   - Use **Socket.io** (a popular WebSocket library) to achieve this. The server should act as a Socket.io server, and clients can connect to it. Define an event (or namespace) for the question/answer interaction. For example, the client might emit an event `"question"` with the question text (and perhaps an API key for auth), and the server will then emit events back (perhaps `"answerChunk"` events for each partial answer piece, and a final `"answerComplete"` or simply use the natural stream of messages until done).
   - Ensure that the socket connection is authenticated. Since there is no user login system, you can authenticate the socket at connection time using the API key (Socket.io allows passing query parameters or headers during the handshake, or you can have the client emit an auth message first). Only authenticated clients should be allowed to use the agent query functionality over the socket.
   - The streaming should ideally send **tokens or sentences** as the LLM produces them.
   - The Socket.io part should be designed such that multiple clients could connect and ask independent questions (the messages should be scoped to the client that asked).
   - Document how to test this. For example, provide a small snippet or instructions: "You can test the socket by connecting to `ws://localhost:3000` (if 3000 is the port) using a Socket.io client and emitting an event X...".
   *Outcome:* The application supports a websocket connection for live Q&A. When a question is asked via the socket, the answer comes back in a streaming fashion. This will be verified by observing the messages sent by the server (we might use a test Socket.io client to simulate a user). The presence of this feature shows the ability to integrate real-time features into the backend.

## Evaluation Criteria

Your submission will be evaluated based on the following criteria:

- **Functionality & Completeness**: Does the project fulfill all the requirements? We will check that each of the features (Docker/Postgres setup, schema, CRUD API, auth, LLM agent, streaming) is implemented and working with the provided sample data. All primary user stories — e.g., *managing customers via API* and *querying data via natural language* — should be covered. The database initialization and integration should work out-of-the-box using the provided docker-compose and SQL script.

- **Code Quality & Maintainability**: How well-structured and clean is the code? We expect to see a logical organization of files/modules, adherence to best practices in Node.js and TypeScript, and code that is easy to read and understand. This includes using TypeScript effectively (defining types or interfaces for data models like Customer, using types for function parameters/returns, minimizing the use of `any`), and handling errors/exceptions properly (avoiding crashes, returning meaningful error responses). Comments and documentation within the code explaining non-obvious parts (especially the LLM logic) are appreciated. The code should be reasonably DRY (Don't Repeat Yourself) and avoid unnecessary complexity.

- **Security & Authentication**: Is the API properly secured according to the specification? We will verify that without the correct API key, protected endpoints cannot be accessed. Also, we'll check for other basic security considerations: for example, no sensitive credentials are hardcoded in the repository (they should be in config or environment variables), and that the implementation of auth does not have logical flaws (like a missing check). In the socket implementation, we will also look for how you ensured that only authorized clients can receive data (e.g., the API key check on connection or message). While this is not a full security audit, demonstrating awareness of security best practices is important.

- **Database Integration & Schema Design**: We will assess whether the database is used appropriately. Are the schema and relationships well-designed for the task? (For instance, using foreign keys for referential integrity, and an understanding of one-to-many relationships between Customer and Orders/Addresses.) Does the application correctly query the database for the CRUD operations and the AI agent queries? Efficiency is a minor concern for this small dataset, but we will note if the solution is doing something obviously inefficient or incorrect (e.g., loading all data into memory unnecessarily, or N+1 query problems). The SQL script should correctly create the schema and data. Bonus points if you also handle things like preventing SQL injection (if doing raw queries) or using parameterized queries/ORM which inherently handles that.

- **LLM Agent Implementation**: We will look at how you implemented the natural language query agent. Key points include:
   - Proper use of LangChain/LangGraph libraries (using their intended patterns to create an agent or chain).
   - The ability of the agent to formulate and execute a database query based on a question. We might look at the logs or code to see how a question is transformed into an answer (e.g., is it constructing a logical intermediate like an SQL statement or using a prompt with the schema).
   - Handling of agent outputs: does it return a coherent answer? (For the sample questions we might ask, we expect accurate answers based on the data. If the answer is not accurate but we see the approach was reasonable, we'll consider that too — LLMs can be tricky, but a correct approach typically yields correct results with a good prompt).
   - Robustness: can it handle at least simple variations of questions? (We’re not going to do extreme corner cases, but e.g., asking for a customer that doesn't exist should be handled gracefully by the agent, possibly by responding "no data" or something appropriate, rather than crashing or returning an error from the DB).

- **Real-Time Streaming (Socket.io)**: We will evaluate the socket.io integration by testing it out or reviewing the implementation:
   - Does the server successfully emit partial responses during the LLM answer generation? For example, if we ask a complex question, do we see multiple messages coming through the socket rather than one big message at the end?
   - Is the implementation structured in a way that would allow a client to easily consume the stream? (e.g., a specific event name or a sequence of events that the client can listen to in order).
   - We will also check how the server handles the socket connections: Are there event listeners for connection, disconnection, errors? Does it clean up or handle multiple requests sequentially or concurrently if needed?
   - If we provide an invalid or missing API key over the socket, does the server reject the connection or message (i.e., auth is enforced consistently with the HTTP API)?
   - Overall, the real-time aspect is a bonus complexity in this challenge, and we're looking for a basic working solution that demonstrates knowledge of websockets. We won't stress test it heavily, but we do want to see it functioning for at least one query -> streamed answer flow.

- **Documentation & Ease of Setup**: Is the project easy for us to run and understand? We'll follow your README or instructions (which should mirror much of what's outlined above). We should be able to:
   - Bring up the database with the provided docker-compose and see the sample data.
   - Start the Node.js server with minimal fuss (after installing dependencies and adding any required config like API keys).
   - Know how to invoke the functionalities (thanks to your documentation of the endpoints, expected request formats, etc.). For instance, you might include example curl commands or a small snippet on how to connect a socket.io client.
   If any special setup is needed, it should be clearly explained. Clear documentation and instructions will make a very good impression. Inline code comments explaining your thought process (especially for the agent part) are also helpful for us to follow your logic.

- **Overall Code Design and Creativity**: Finally, we'll form an overall impression of your work. This includes how cohesive and consistent the solution is, and any innovative or thoughtful approaches you took. For example, a clean separation between the REST API and the agent logic might indicate good design. Using TypeScript features like enums for address types, or generic types for API responses, etc., can show deeper understanding. If you add any extra features or improvements beyond the core requirements, we will certainly take note (for instance, implementing an additional entity, adding unit tests for some functions, containerizing the Node app itself with Docker, or even a simple frontend to demonstrate the system). **However, keep in mind the time constraint** – we do not expect extra features at the expense of the core requirements. It's better to have all main points done solidly than to have one missing because time was spent on an unasked feature. That said, any "bonus" touches that improve the quality (such as robust error handling, logging, or minor extensions) can help your evaluation.

---

Please deliver your project as a Git repository (or a zip file) containing all source code, the `docker-compose.yml`, the `init_db.sql` script, and a README. Make sure to include instructions on how to run the application and test the features. Good luck, and we look forward to reviewing your implementation!