-- Create deletedEvent table to track deleted events
-- This table stores when events were deleted without modifying the event table

CREATE TABLE IF NOT EXISTS `deletedEvent` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `deleted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_id` (`event_id`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_deleted_event_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

