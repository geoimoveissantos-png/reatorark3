-- ==============================================================================
-- BANCO DE DADOS REATOR ARK // JARVIS MARK LVI
-- Usuário: emribeir_romildo
-- Senha:   Romildo2009@
-- Database: reatorark
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `reatorark` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `reatorark`;

-- Concessão de permissões completas ao usuário emribeir_romildo
CREATE USER IF NOT EXISTS 'emribeir_romildo'@'%' IDENTIFIED BY 'Romildo2009@';
CREATE USER IF NOT EXISTS 'emribeir_romildo'@'localhost' IDENTIFIED BY 'Romildo2009@';
GRANT ALL PRIVILEGES ON `reatorark`.* TO 'emribeir_romildo'@'%';
GRANT ALL PRIVILEGES ON `reatorark`.* TO 'emribeir_romildo'@'localhost';
FLUSH PRIVILEGES;

-- ------------------------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS (users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `email` VARCHAR(128) NOT NULL UNIQUE,
  `full_name` VARCHAR(128) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('master_admin', 'admin', 'user') NOT NULL DEFAULT 'user',
  `status` ENUM('active', 'suspended', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABELA DE COMANDOS E CONVERSAS (conversations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NULL,
  `user_name` VARCHAR(128) NOT NULL,
  `command_text` TEXT NOT NULL,
  `response_text` TEXT NOT NULL,
  `tool_used` VARCHAR(64) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABELA DE LOGS DO SISTEMA (system_logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NULL,
  `level` VARCHAR(32) NOT NULL DEFAULT 'INFO',
  `source` VARCHAR(64) NOT NULL,
  `message` TEXT NOT NULL,
  `details` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_level` (`level`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABELA DE LEMBRETES E TAREFAS (reminders_tasks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reminders_tasks` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NULL,
  `title` VARCHAR(255) NOT NULL,
  `due_date` DATETIME NULL,
  `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_task` (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABELA DE PREFERÊNCIAS DO USUÁRIO (user_settings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `voice_id` VARCHAR(128) NOT NULL DEFAULT '82d13948027e4be69892dd3d0104e681',
  `wake_word_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `hud_theme` VARCHAR(64) NOT NULL DEFAULT 'iron_man_mark42',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- DADOS INICIAIS (SEED)
-- Usuário Comandante Romildo (Master Admin) e Admin Master
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `username`, `email`, `full_name`, `password_hash`, `role`, `status`, `created_at`)
VALUES
  ('usr_romildo_master', 'romildo', 'geoimoveissantos@gmail.com', 'Romildo Ribeiro', 'Romildo2009@', 'master_admin', 'active', NOW()),
  ('usr_admin_master', 'admin', 'admin@reatorark.com', 'Administrador Master', 'Romildo2009@', 'master_admin', 'active', NOW())
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

INSERT INTO `system_logs` (`id`, `level`, `source`, `message`, `created_at`)
VALUES
  ('log_init_01', 'INFO', 'REATOR_ARK_KERNEL', 'Banco de dados reatorark inicializado com sucesso para emribeir_romildo.', NOW());
