CREATE DATABASE subsidy_db;
USE subsidy_db;

CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(60)  NOT NULL,
  mobile        CHAR(10)     NOT NULL UNIQUE,
  land_area     DECIMAL(6,2) NOT NULL,        -- land in acres
  password_hash VARCHAR(255) NOT NULL,
  created_on    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schemes (
  scheme_id   INT AUTO_INCREMENT PRIMARY KEY,
  scheme_name VARCHAR(100) NOT NULL,
  category    VARCHAR(30),                    -- State / Central
  benefit     VARCHAR(255),
  min_land    DECIMAL(6,2) DEFAULT 0.01,
  max_land    DECIMAL(6,2) DEFAULT 9999,
  apply_link  VARCHAR(255) NOT NULL
);

CREATE TABLE documents (
  doc_id   INT AUTO_INCREMENT PRIMARY KEY,
  doc_name VARCHAR(80) NOT NULL
);

CREATE TABLE scheme_documents (
  scheme_id INT,
  doc_id    INT,
  PRIMARY KEY (scheme_id, doc_id),
  FOREIGN KEY (scheme_id) REFERENCES schemes(scheme_id),
  FOREIGN KEY (doc_id)    REFERENCES documents(doc_id)
);

CREATE TABLE complaints (
  complaint_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  scheme_id      INT NOT NULL,
  complaint_type VARCHAR(60) NOT NULL,
  application_no VARCHAR(60),
  applied_on     DATE NOT NULL,
  details        TEXT NOT NULL,
  status         VARCHAR(20) DEFAULT 'Submitted',
  created_on     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(user_id),
  FOREIGN KEY (scheme_id) REFERENCES schemes(scheme_id)
);

-- Eligible schemes for user 1, based on land area
SELECT s.scheme_name, s.benefit, s.apply_link
FROM   schemes s
WHERE  (SELECT land_area FROM users WHERE user_id = 1)
       BETWEEN s.min_land AND s.max_land;
