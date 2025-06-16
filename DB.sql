CREATE TABLE IF NOT EXISTS pos_users (
    id SERIAL PRIMARY KEY,
    restaurant_name VARCHAR(255) NOT NULL,
    pos_key VARCHAR(255) NOT NULL,
    menu VARCHAR(255)
);


INSERT INTO pos_users (restaurant_name, pos_key, menu) VALUES
('Nyathi Nyakach', '1q2w3e4r','https://docs.google.com/spreadsheets/d/1vftpT9wPstzKuBOREqgaULPkMQzoSIuXq7ry4RUpbec/edit?usp=sharing');
-- ON CONFLICT (restaurant_name) DO NOTHING;

SELECT *
FROM pos_users;

CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_id VARCHAR(50) NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    waiter VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'Invoiced',
    bill NUMERIC(10,2) NOT NULL
);

-- DROP TABLE IF EXISTS pos_users;
