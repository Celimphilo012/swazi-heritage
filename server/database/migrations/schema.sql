-- 001 users
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','user','history_keeper','ceremony_keeper') NOT NULL DEFAULT 'user',
  status        ENUM('active','suspended') NOT NULL DEFAULT 'active',
  bio           TEXT,
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_status (status)
);

-- 002 ceremonies
CREATE TABLE IF NOT EXISTS ceremonies (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(200) NOT NULL,
  description       TEXT,
  month_celebrated  VARCHAR(100),
  immunology_notes  TEXT,
  status            ENUM('draft','pending_review','published','rejected') NOT NULL DEFAULT 'pending_review',
  rejection_note    TEXT,
  created_by        INT NOT NULL,
  reviewed_by       INT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status)
);

-- 003 ceremony_songs
CREATE TABLE IF NOT EXISTS ceremony_songs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ceremony_id INT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  audio_url   VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ceremony_id) REFERENCES ceremonies(id) ON DELETE CASCADE
);

-- 004 imvunulo_presets  (admin-managed vocabulary)
CREATE TABLE IF NOT EXISTS imvunulo_presets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  gender      ENUM('male','female','both','child') NOT NULL DEFAULT 'both',
  active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 005 imvunulo  (ceremony-linked attire)
CREATE TABLE IF NOT EXISTS imvunulo (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ceremony_id INT NOT NULL,
  preset_id   INT NOT NULL,
  notes       TEXT,
  color_desc  VARCHAR(200),
  image_url   VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ceremony_id) REFERENCES ceremonies(id) ON DELETE CASCADE,
  FOREIGN KEY (preset_id)   REFERENCES imvunulo_presets(id) ON DELETE RESTRICT
);

-- 006 lineage_records
CREATE TABLE IF NOT EXISTS lineage_records (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  description    TEXT,
  era            VARCHAR(150),
  status         ENUM('draft','pending_review','published','rejected') NOT NULL DEFAULT 'pending_review',
  rejection_note TEXT,
  created_by     INT NOT NULL,
  reviewed_by    INT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status)
);

-- 007 clans
CREATE TABLE IF NOT EXISTS clans (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  lineage_id       INT NOT NULL,
  name             VARCHAR(150) NOT NULL,
  royal_connection VARCHAR(300),
  founding_era     VARCHAR(150),
  description      TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lineage_id) REFERENCES lineage_records(id) ON DELETE CASCADE
);

-- 008 cinemas
CREATE TABLE IF NOT EXISTS cinemas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  type         ENUM('live','recorded') NOT NULL,
  stream_url   VARCHAR(500) NOT NULL,
  scheduled_at DATETIME,
  status       ENUM('scheduled','live','ended','cancelled') NOT NULL DEFAULT 'scheduled',
  created_by   INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_scheduled (scheduled_at)
);

-- 009 bookings
CREATE TABLE IF NOT EXISTS bookings (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  cinema_id INT NOT NULL,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status    ENUM('confirmed','cancelled','attended') NOT NULL DEFAULT 'confirmed',
  UNIQUE KEY unique_booking (user_id, cinema_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
);

-- 010 ai_prompts
CREATE TABLE IF NOT EXISTS ai_prompts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  question   TEXT NOT NULL,
  answer     LONGTEXT NOT NULL,
  source     ENUM('db_only','ai_only','hybrid') NOT NULL DEFAULT 'hybrid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);

-- 011 system_config
CREATE TABLE IF NOT EXISTS system_config (
  config_key  VARCHAR(100) PRIMARY KEY,
  value       LONGTEXT NOT NULL,
  description VARCHAR(300),
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 012 audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT NOT NULL,
  action      VARCHAR(100) NOT NULL,
  target_type VARCHAR(100),
  target_id   INT,
  detail      JSON,
  ip_address  VARCHAR(50),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin (admin_id),
  INDEX idx_created (created_at)
);
