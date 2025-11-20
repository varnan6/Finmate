
CREATE DATABASE IF NOT EXISTS finmate;
USE finmate;

-- --------------------------
-- USERS TABLE
-- --------------------------
CREATE TABLE users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    passwordFinal VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------
-- CATEGORIES TABLE
-- --------------------------
CREATE TABLE categories (
    categoryId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50),
    type ENUM('income', 'expense'),
    color VARCHAR(10)
);

-- --------------------------
-- TRANSACTIONS TABLE
-- --------------------------
CREATE TABLE transactions (
    transactionId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    categoryId INT,
    title VARCHAR(100),
    amount DECIMAL(10,2),
    transaction_type ENUM('income', 'expense'),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (categoryId) REFERENCES categories(categoryId)
);

-- --------------------------
-- BALANCE SUMMARY TABLE
-- --------------------------
CREATE TABLE balance_summary (
    userId INT PRIMARY KEY,
    totalIncome DECIMAL(10,2),
    totalExpense DECIMAL(10,2),
    currentBalance DECIMAL(10,2),
    FOREIGN KEY (userId) REFERENCES users(userId)
);

-- --------------------------
-- INSERT SAMPLE DATA
-- --------------------------
INSERT INTO users (name, email, passwordFinal)
VALUES ('Shravan Sadalgekar', 'shravan@email.com', 'hashed_password');

INSERT INTO categories (name, type) VALUES
('Income', 'income'),
('Food', 'expense'),
('Travel', 'expense'),
('Home', 'expense'),
('Security', 'expense'),
('Utilities', 'expense'),
('Shopping', 'expense'),
('Gas', 'expense'),
('Videos', 'expense'),
('Games', 'expense');

INSERT INTO transactions (userId, categoryId, title, amount, transaction_type, date)
VALUES
(1, 3, 'Quick Travel', 142.00, 'expense', '2025-10-31'),
(1, 4, 'Quick Home', 118.00, 'expense', '2025-10-31'),
(1, 5, 'Quick Security', 194.00, 'expense', '2025-10-31'),
(1, 1, 'Salary Credit', 4500.00, 'income', '2025-10-30');

-- --------------------------
-- VERIFY DATA
-- --------------------------
SHOW DATABASES;
SHOW TABLES;

SELECT * FROM users;
SELECT * FROM categories;
SELECT * FROM transactions;

-- --------------------------
-- SELECTION QUERIES
-- --------------------------

-- View balance summary (empty initially)
SELECT * FROM balance_summary;

-- Spending according to category
SELECT c.name AS Category, SUM(t.amount) AS Total_Spent
FROM transactions t
JOIN categories c ON t.categoryId = c.categoryId
WHERE t.transaction_type = 'expense'
GROUP BY c.name;

-- Expense summary (income vs expense)
SELECT 
  SUM(CASE WHEN transaction_type='income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN transaction_type='expense' THEN amount ELSE 0 END) AS total_expense,
  SUM(CASE WHEN transaction_type='income' THEN amount ELSE -amount END) AS balance
FROM transactions
WHERE userId = 1;

-- All transactions for a specific user (newest first)
SELECT * FROM transactions WHERE userId = 1 ORDER BY date DESC;

-- Weekly expense summary
SELECT DAYNAME(date) AS day, SUM(amount) AS total_spent
FROM transactions
WHERE transaction_type = 'expense'
GROUP BY DAYNAME(date);

-- Top 3 spending categories
SELECT c.name AS Category, SUM(t.amount) AS Total_Spent
FROM transactions t
JOIN categories c ON t.categoryId = c.categoryId
WHERE t.transaction_type = 'expense'
GROUP BY c.name
ORDER BY Total_Spent DESC
LIMIT 3;

-- --------------------------
-- UPDATE BALANCE SUMMARY
-- --------------------------
INSERT INTO balance_summary (userId, totalIncome, totalExpense, currentBalance)
VALUES (1, 0, 0, 0)
ON DUPLICATE KEY UPDATE userId = userId;

UPDATE balance_summary
SET totalIncome = (
    SELECT IFNULL(SUM(amount),0) FROM transactions WHERE userId = 1 AND transaction_type = 'income'
),
totalExpense = (
    SELECT IFNULL(SUM(amount),0) FROM transactions WHERE userId = 1 AND transaction_type = 'expense'
),
currentBalance = (
    SELECT IFNULL(SUM(CASE WHEN transaction_type='income' THEN amount ELSE -amount END),0)
    FROM transactions WHERE userId = 1
)
WHERE userId = 1;

SELECT * FROM balance_summary;


