-- Create database
-- CREATE DATABASE ITECH3108_30444992_a2;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  grater_points INT DEFAULT 0
);

-- LINKS (with URL column)
CREATE TABLE IF NOT EXISTS links (
  link_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  submitter_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RATINGS
CREATE TABLE IF NOT EXISTS ratings (
  rating_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  link_id INT REFERENCES links(link_id) ON DELETE CASCADE,
  score INT CHECK (score BETWEEN 1 AND 5),
  rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, link_id)
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  link_id INT REFERENCES links(link_id) ON DELETE CASCADE,
  favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, link_id)
);

-- Seed initial data
INSERT INTO users (username, email, password, grater_points) VALUES
('alice', 'alice@example.com', '123456', 20),
('bob', 'bob@example.com', '123456', 35),
('charlie', 'charlie@example.com', '123456', 15);

-- Seed links with URL
INSERT INTO links (title, description, url, submitter_id) VALUES
('Best Cheese Graters Reviewed', 'A comprehensive review of top cheese graters', 'https://www.kitchengearhub.com/best-cheese-graters/', 1),
('How to Choose the Right Cheese Grater', 'Tips for picking the perfect grater for your kitchen', 'https://www.cooksmarts.com/articles/choose-right-cheese-grater/', 2),
('Cleaning and Maintaining Cheese Graters', 'Keep your graters sharp and rust-free', 'https://www.howtocleanstuff.net/how-to-clean-a-cheese-grater/', 3),
('Creative Recipes Using Cheese Graters', 'Unique dishes to try with freshly grated cheese', 'https://www.delish.com/cheese-grater-recipes/', 1),
('Unrated Grater', 'New cheese grater no one rated yet', 'https://www.unknownkitchen.com/unrated-grater/', 2);

-- Seed ratings
INSERT INTO ratings (user_id, link_id, score) VALUES
(1, 1, 5),
(2, 1, 4),
(3, 1, 3),
(1, 2, 4),
(2, 2, 5),
(3, 2, 4),
(1, 3, 3),
(2, 3, 2),
(3, 3, 3),
(1, 4, 5);

-- Seed favorites
INSERT INTO favorites (user_id, link_id) VALUES
(1, 2),
(2, 1),
(3, 4);

