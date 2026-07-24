-- Workplace Anonymous Review Ledger System SQL Dump
-- Generated on: 2026-07-24
-- Total Records: 3

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255),
  company_name VARCHAR(255) NOT NULL,
  branch_location VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  employment_status VARCHAR(50) DEFAULT 'current',
  salary INT DEFAULT 0,
  bonus INT DEFAULT 0,
  experience_years INT DEFAULT 1,
  rating_career INT DEFAULT 5,
  rating_balance INT DEFAULT 5,
  rating_management INT DEFAULT 5,
  rating_compensation INT DEFAULT 5,
  rating_culture INT DEFAULT 5,
  review_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  previous_hash VARCHAR(255),
  hash VARCHAR(255)
);

INSERT INTO reviews (id, company_id, company_name, branch_location, position, employment_status, salary, bonus, experience_years, rating_career, rating_balance, rating_management, rating_compensation, rating_culture, review_text, created_at, previous_hash, hash) VALUES
  ('rev-1784903457703-t89ym3jsb', 'comp-bcb5b116e7ac', 'Test Company 1784903456728', 'Beijing', 'Software Engineer', 'current', 20000, 50000, 3, 5, 4, 5, 4, 5, 'Test review text content', '2026-07-24T14:30:57.703+00:00', '0', 'b1577efb11b7f77f7308dc6a1bc2e25784ef55a17cca4ef875d577e4b02d8f06'),
  ('rev-1784903493748-ykkobwnb1', 'comp-fe261203ca86', 'Test Company 1784903492679', 'Beijing', 'Software Engineer', 'current', 20000, 50000, 3, 5, 4, 5, 4, 5, 'Test review text content', '2026-07-24T14:31:33.748+00:00', '0', '4ec0267d7ca40593910b6da63b1821c3a50b33b7a7cd5d6d6fea0aa7ee6877e8'),
  ('rev-1784903526320-8c2aaatc0', 'comp-5ac0b6e56fba', '阿里', '总部', '后端开发工程师', 'current', 1, 1, 1, 4, 3, 3, 3, 4, '很好,天天 996 ,身边的同事都走了,哦对,不是离职,是真的物理意义上的走了', '2026-07-24T14:32:06.32+00:00', '0', 'd72a6de2ddd27baea42d059c0ca900244abb639d5875a222f0a837644f5d119a');
