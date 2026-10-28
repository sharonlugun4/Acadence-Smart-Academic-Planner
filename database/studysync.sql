CREATE DATABASE IF NOT EXISTS studysync
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE studysync;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(100) NOT NULL DEFAULT 'General',
  category ENUM('Assignment','Exam','Lab Record','Revision','Other') NOT NULL DEFAULT 'Other',
  due_date DATETIME NOT NULL,
  priority ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  status ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tasks_user_due (user_id, due_date),
  INDEX idx_tasks_user_status (user_id, status)
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_id INT NULL,
  duration_minutes INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  INDEX idx_sessions_user_completed (user_id, completed_at)
);
