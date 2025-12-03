-- Create user_friend_request table for MySQL
-- This table stores friend request invitations

CREATE TABLE IF NOT EXISTS `user_friend_request` (
  `user_friend_request_id` INT NOT NULL AUTO_INCREMENT,
  `request_user_id` INT NOT NULL,
  `receive_user_id` INT NOT NULL,
  PRIMARY KEY (`user_friend_request_id`),
  KEY `user_friend_request_user_idx` (`request_user_id`),
  KEY `user_friend_receive_user_idx` (`receive_user_id`),
  CONSTRAINT `user_friend_receive_user` FOREIGN KEY (`receive_user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_friend_request_user` FOREIGN KEY (`request_user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_friend_request` (`request_user_id`, `receive_user_id`),
  CHECK (`request_user_id` != `receive_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

