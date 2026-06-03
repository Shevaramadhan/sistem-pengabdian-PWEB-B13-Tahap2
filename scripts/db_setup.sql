-- ============================================================
-- SQL Setup: Sistem Pengabdian Dosen - Kelompok 13 PWEB B
-- Database: db_sistem_pengabdian
-- ============================================================

SET FOREIGN_KEY_CHECKS=0;
SET UNIQUE_CHECKS=0;

-- ------------------------------------------------------------
-- 1. Buat & Gunakan Database
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `db_sistem_pengabdian`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `db_sistem_pengabdian`;

-- ------------------------------------------------------------
-- 2. Tabel AUTH: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(255) NOT NULL,
  `username`   VARCHAR(255) NOT NULL UNIQUE,
  `email`      VARCHAR(255) NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Tabel ACL: roles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(255) NOT NULL UNIQUE,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. Tabel ACL: permissions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permissions` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(255) NOT NULL UNIQUE,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. Tabel ACL: role_has_permissions (pivot)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_has_permissions` (
  `role_id`       INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`)       REFERENCES `roles`(`id`)       ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. Tabel ACL: user_has_roles (pivot)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_has_roles` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. Tabel lecturers (Profil Dosen)
--    Untuk project ini, lecturer langsung FK ke users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lecturers` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`             BIGINT UNSIGNED NOT NULL UNIQUE,
  `nidn`                VARCHAR(20) NULL DEFAULT NULL,
  `academic_rank`       VARCHAR(255) NULL DEFAULT NULL,
  `functional_position` VARCHAR(255) NULL DEFAULT NULL,
  `expertise`           VARCHAR(255) NULL DEFAULT NULL,
  `phone`               VARCHAR(20) NULL DEFAULT NULL,
  `created_at`          TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. Tabel PENGABDIAN: community_services
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_services` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`          VARCHAR(255) NOT NULL,
  `description`    TEXT NULL DEFAULT NULL,
  `location`       VARCHAR(255) NOT NULL,
  `start_date`     DATE NOT NULL,
  `end_date`       DATE NULL DEFAULT NULL,
  `funding_source` VARCHAR(255) NULL DEFAULT NULL,
  `budget`         DECIMAL(15,2) NULL DEFAULT NULL,
  `status`         ENUM('proposed', 'ongoing', 'completed') NOT NULL DEFAULT 'proposed',
  `proposal_file`  VARCHAR(255) NULL DEFAULT NULL,
  `report_file`    VARCHAR(255) NULL DEFAULT NULL,
  `created_by`     BIGINT UNSIGNED NOT NULL,
  `created_at`     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. Tabel ANGGOTA: community_service_members
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_service_members` (
  `id`                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `community_service_id` BIGINT UNSIGNED NOT NULL,
  `lecturer_id`          BIGINT UNSIGNED NOT NULL,
  `role`                 VARCHAR(255) NULL DEFAULT NULL,
  `status`               ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `responded_at`         TIMESTAMP NULL DEFAULT NULL,
  `created_at`           TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_member` (`community_service_id`, `lecturer_id`),
  FOREIGN KEY (`community_service_id`) REFERENCES `community_services`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lecturer_id`)          REFERENCES `lecturers`(`id`)           ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATA AWAL (SEED)
-- ============================================================

-- Roles
INSERT IGNORE INTO `roles` (`id`, `name`) VALUES
  (1, 'admin'),
  (2, 'dosen');

-- Permissions
INSERT IGNORE INTO `permissions` (`id`, `name`) VALUES
  (1,  'manage_users'),
  (2,  'manage_pengabdian'),
  (3,  'view_pengabdian'),
  (4,  'create_pengabdian'),
  (5,  'edit_pengabdian'),
  (6,  'delete_pengabdian'),
  (7,  'manage_anggota'),
  (8,  'approve_keanggotaan'),
  (9,  'export_pengabdian'),
  (10, 'upload_laporan');

-- Role: admin punya semua permission
INSERT IGNORE INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES
  (1, 1),(1, 2),(1, 3),(1, 4),(1, 5),(1, 6),(1, 7),(1, 8),(1, 9),(1, 10);

-- Role: dosen punya permission sesuai fitur
INSERT IGNORE INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES
  (2, 2),(2, 3),(2, 4),(2, 5),(2, 6),(2, 7),(2, 8),(2, 9),(2, 10);

-- User Admin (password: admin123)
INSERT IGNORE INTO `users` (`id`, `name`, `username`, `email`, `password`) VALUES
  (1, 'Administrator', 'admin', 'admin@pengabdian.ac.id', '$2b$10$y0LY/diB9ICEv9u/RGsUjejvswxnYaCAkF/vtHs.OWFnDNiIfH7Gy');

-- User Dosen Contoh (password: dosen123)
INSERT IGNORE INTO `users` (`id`, `name`, `username`, `email`, `password`) VALUES
  (2, 'Dr. Sheva Ramadhan', 'sheva', 'sheva@pengabdian.ac.id', '$2b$10$FcxZg2BRmWpRRALiewqHmuvjAFwUvXcxm7EdS543vClF3Dfc2Umlm'),
  (3, 'Athaya Nasywa Mahira', 'athaya', 'athaya@pengabdian.ac.id', '$2b$10$FcxZg2BRmWpRRALiewqHmuvjAFwUvXcxm7EdS543vClF3Dfc2Umlm');

-- Assign roles
INSERT IGNORE INTO `user_has_roles` (`user_id`, `role_id`) VALUES
  (1, 1), -- admin -> role admin
  (2, 2), -- sheva -> role dosen
  (3, 2); -- athaya -> role dosen

-- Profile Dosen
INSERT IGNORE INTO `lecturers` (`id`, `user_id`, `nidn`, `academic_rank`, `expertise`) VALUES
  (1, 2, '0001010001', 'Asisten Ahli', 'Rekayasa Perangkat Lunak'),
  (2, 3, '0001010002', 'Asisten Ahli', 'Sistem Informasi');

SET FOREIGN_KEY_CHECKS=1;
SET UNIQUE_CHECKS=1;
