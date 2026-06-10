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
  image_url   VARCHAR(500) DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE imvunulo_presets ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;

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
  status       ENUM('scheduled','live','ended','cancelled','available','unavailable') NOT NULL DEFAULT 'scheduled',
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

-- 011b siSwati + geolocation fields (added as safe ALTER TABLE statements)
ALTER TABLE ceremonies
  ADD COLUMN IF NOT EXISTS swati_name        VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS swati_description TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS location_name     VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS latitude          DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude         DECIMAL(10,7) DEFAULT NULL;

ALTER TABLE lineage_records
  ADD COLUMN IF NOT EXISTS swati_title       VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS swati_description TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS location_name     VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS latitude          DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude         DECIMAL(10,7) DEFAULT NULL;

ALTER TABLE clans
  ADD COLUMN IF NOT EXISTS location_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS latitude      DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude     DECIMAL(10,7) DEFAULT NULL;

-- 011c notification_email on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_email VARCHAR(255) DEFAULT NULL;

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

-- 012b category columns for recommendation engine
ALTER TABLE ceremonies
  ADD COLUMN IF NOT EXISTS category ENUM('ceremonies','lineage','music','attire','royal','spiritual') DEFAULT NULL;

ALTER TABLE lineage_records
  ADD COLUMN IF NOT EXISTS category ENUM('ceremonies','lineage','music','attire','royal','spiritual') DEFAULT NULL;

-- 013 user_preferences (Objective 2 — user profiling)
CREATE TABLE IF NOT EXISTS user_preferences (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL UNIQUE,
  interests      JSON,
  visitor_type   ENUM('local','tourist','researcher','student','other') NOT NULL DEFAULT 'local',
  preferred_lang ENUM('en','ss') NOT NULL DEFAULT 'en',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 014 services (Objective 3 — cultural marketplace)
CREATE TABLE IF NOT EXISTS services (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  practitioner_id INT NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  category        ENUM('performance','crafts','teaching','ceremony','attire','music','other') NOT NULL DEFAULT 'other',
  price_range     VARCHAR(100),
  contact         VARCHAR(255),
  image_url       VARCHAR(500),
  status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (practitioner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_category (category)
);

-- 015 service_enquiries
CREATE TABLE IF NOT EXISTS service_enquiries (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  service_id  INT NOT NULL,
  user_id     INT,
  user_name   VARCHAR(120) NOT NULL,
  user_email  VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 016 ceremony_steps (Objective 5 — walkthrough simulations)
CREATE TABLE IF NOT EXISTS ceremony_steps (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  ceremony_id  INT NOT NULL,
  step_number  INT NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  media_url    VARCHAR(500),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ceremony_id) REFERENCES ceremonies(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_ceremony_step (ceremony_id, step_number),
  INDEX idx_ceremony (ceremony_id)
);

-- 017 ratings (Objective 5 — evaluation/feedback)
CREATE TABLE IF NOT EXISTS ratings (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  content_type ENUM('ceremony','lineage') NOT NULL,
  content_id   INT NOT NULL,
  score        TINYINT NOT NULL,
  comment      TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_content (user_id, content_type, content_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_content (content_type, content_id)
);
