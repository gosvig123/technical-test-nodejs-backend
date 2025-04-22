-- Create tables
CREATE TABLE customer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL
);
CREATE TABLE address (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer(id),
    type VARCHAR(50),
    street VARCHAR(100),
    city VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(50)
);
CREATE TABLE customer_order (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer(id),
    order_date DATE,
    total_amount DECIMAL(10,2)
);
-- Insert sample customers
INSERT INTO customer (name, email) VALUES
('Alice Wonderland', 'alice@example.com'),
('Bob Builder', 'bob@example.com'),
('Charlie Test', 'charlie@test.com');
-- Insert sample addresses (linked to customers)
INSERT INTO address (customer_id, type, street, city, zip, country) VALUES
(1, 'billing', '123 Apple St', 'Wonderland', '10001', 'Fantasy'),
(1, 'shipping', '123 Apple St', 'Wonderland', '10001', 'Fantasy'),
(2, 'billing', '500 Construction Ave', 'Buildtown', '20002', 'USA'),
(3, 'billing', '42 Test Lane', 'Testville', '30003', 'USA'),
(3, 'shipping', '43 Test Lane', 'Testville', '30003', 'USA');
-- Insert sample orders (linked to customers)
INSERT INTO customer_order (customer_id, order_date, total_amount) VALUES
(1, '2024-05-01', 150.00),
(1, '2024-06-15', 250.00),
(2, '2024-07-20', 99.99);
