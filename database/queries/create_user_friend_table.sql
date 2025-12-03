-- Create user_friend table for MySQL
-- This table stores friend relationships between users

CREATE TABLE IF NOT EXISTS `user_friend` (
  `user_friend_id` INT NOT NULL AUTO_INCREMENT,
  `user1_id` INT NOT NULL,
  `user2_id` INT NOT NULL,
  PRIMARY KEY (`user_friend_id`),
  KEY `user_friend_user1_idx` (`user1_id`),
  KEY `user_friend_user2_idx` (`user2_id`),
  CONSTRAINT `user_friend_user1` FOREIGN KEY (`user1_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_friend_user2` FOREIGN KEY (`user2_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_friendship` (`user1_id`, `user2_id`),
  CHECK (`user1_id` < `user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

