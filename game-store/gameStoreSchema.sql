USE gameStore;

-- =====================================================
-- USERS TABLE
-- Stores user accounts (players and admins)
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    age INT NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',

    -- Soft delete / account status
    isActive BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GAMES TABLE
-- Stores all available games in the store
-- Includes admin-controlled discount feature
-- =====================================================
CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,

    -- Image path for uploaded game cover
    image_url VARCHAR(255),

    -- Discount system
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    discount_start DATETIME NULL,
    discount_end DATETIME NULL,

    -- Soft delete / visibility control
    isActive BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GENRES TABLE
-- Stores game categories (Action, RPG, etc.)
-- =====================================================
CREATE TABLE genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- =====================================================
-- GAME_GENRES TABLE
-- Junction table linking games and genres (many-to-many)
-- =====================================================
CREATE TABLE game_genres (
    game_id INT NOT NULL,
    genre_id INT NOT NULL,

    PRIMARY KEY (game_id, genre_id),

    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (genre_id) REFERENCES genres(id)
);

-- =====================================================
-- CART TABLE
-- Stores games added by user before checkout
-- =====================================================
CREATE TABLE cart (
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- =====================================================
-- ORDERS TABLE
-- Stores completed purchase summary
-- =====================================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- ORDER ITEMS TABLE
-- Stores individual games inside an order
-- Saves actual purchase price at checkout
-- (important if discount changes later)
-- =====================================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    game_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- =====================================================
-- LIBRARY TABLE
-- Stores games owned by users after successful payment
-- =====================================================
CREATE TABLE library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_game (user_id, game_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
);
-- =====================================================
-- TRANSACTIONS TABLE
-- Stores payment records for orders
-- =====================================================
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,

    payment_method VARCHAR(20) NOT NULL DEFAULT 'card',

    payment_status ENUM(
        'pending',
        'paid',
        'failed',
        'refunded'
    ) DEFAULT 'pending',

    -- Only store last 4 digits for security
    card_last4 VARCHAR(4),

    transaction_reference VARCHAR(255),

    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id)
);