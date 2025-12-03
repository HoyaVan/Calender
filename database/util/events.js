const { pool, isMySQLConnected } = require('../connect_mysql');

/**
 * Get the event_security_id for "deleted" security level
 * @returns {Promise<number|null>} The security ID for "deleted" or null if not found
 */
let deletedSecurityId = null;
async function getDeletedSecurityId() {
  if (deletedSecurityId !== null) {
    return deletedSecurityId;
  }
  
  try {
    const query = `SELECT event_security_id FROM event_security WHERE security_level = 'deleted' LIMIT 1`;
    const [rows] = await pool.execute(query);
    deletedSecurityId = rows.length > 0 ? rows[0].event_security_id : null;
    return deletedSecurityId;
  } catch (error) {
    console.error('Error getting deleted security ID:', error);
    return null;
  }
}

/**
 * Get all events (excluding deleted ones)
 * @returns {Promise<Array>} Array of event objects
 */
async function getAllEvents() {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get events: MySQL is not connected');
      return [];
    }

    const deletedId = await getDeletedSecurityId();
    const deletedFilter = deletedId ? `AND e.event_security_id != ${deletedId}` : '';

    const query = `
      SELECT 
        e.event_id,
        e.event_name,
        e.event_start,
        e.event_end,
        e.event_owner_id,
        e.event_security_id,
        u.username as owner_username,
        es.security_level,
        ec.color as event_color
      FROM event e
      LEFT JOIN user u ON e.event_owner_id = u.user_id
      LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
      LEFT JOIN event_color ec ON e.event_id = ec.event_id
      LEFT JOIN deletedEvent de ON e.event_id = de.event_id
      WHERE 1=1 ${deletedFilter}
        AND de.event_id IS NULL
      ORDER BY e.event_start ASC
    `;
    
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    console.error('Error getting all events:', error);
    return [];
  }
}

/**
 * Get events by user ID (events created by the user)
 * @param {number} userId - The user ID to filter events by
 * @returns {Promise<Array>} Array of event objects created by the user
 */
async function getEventsByUserId(userId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get events: MySQL is not connected');
      return [];
    }

    if (!userId) {
      console.error('Cannot get events: user ID is required');
      return [];
    }

    const deletedId = await getDeletedSecurityId();
    const deletedFilter = deletedId ? `AND e.event_security_id != ${deletedId}` : '';

    const query = `
      SELECT 
        e.event_id,
        e.event_name,
        e.event_start,
        e.event_end,
        e.event_owner_id,
        e.event_security_id,
        u.username as owner_username,
        es.security_level,
        ec.color as event_color
      FROM event e
      LEFT JOIN user u ON e.event_owner_id = u.user_id
      LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
      LEFT JOIN event_color ec ON e.event_id = ec.event_id
      LEFT JOIN deletedEvent de ON e.event_id = de.event_id
      WHERE e.event_owner_id = ?
        ${deletedFilter}
        AND de.event_id IS NULL
      ORDER BY e.event_start ASC
    `;
    
    const [rows] = await pool.execute(query, [userId]);
    return rows;
  } catch (error) {
    console.error('Error getting events by user ID:', error);
    return [];
  }
}

/**
 * Get events by user ID for a specific date (events that occur on that day)
 * @param {number} userId - The user ID to filter events by
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of event objects that occur on the specified date
 */
async function getEventsByUserIdAndDate(userId, date) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get events: MySQL is not connected');
      return [];
    }

    if (!userId || !date) {
      console.error('Cannot get events: user ID and date are required');
      return [];
    }

    // Parse the date and create start and end of day in UTC
    const selectedDate = new Date(date + 'T00:00:00.000Z');
    const nextDate = new Date(selectedDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    // Format dates for MySQL (YYYY-MM-DD HH:MM:SS)
    const dayStart = selectedDate.toISOString().slice(0, 19).replace('T', ' ');
    const dayEnd = nextDate.toISOString().slice(0, 19).replace('T', ' ');

    // Get events where the event overlaps with the selected day
    // An event overlaps if: event_start < dayEnd AND event_end > dayStart
    const deletedId = await getDeletedSecurityId();
    const deletedFilter = deletedId ? `AND e.event_security_id != ${deletedId}` : '';

    const query = `
      SELECT 
        e.event_id,
        e.event_name,
        e.event_start,
        e.event_end,
        e.event_owner_id,
        e.event_security_id,
        u.username as owner_username,
        es.security_level,
        ec.color as event_color
      FROM event e
      LEFT JOIN user u ON e.event_owner_id = u.user_id
      LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
      LEFT JOIN event_color ec ON e.event_id = ec.event_id
      LEFT JOIN deletedEvent de ON e.event_id = de.event_id
      WHERE e.event_owner_id = ?
        AND e.event_start < ?
        AND e.event_end > ?
        ${deletedFilter}
        AND de.event_id IS NULL
      ORDER BY e.event_start ASC
    `;
    
    const [rows] = await pool.execute(query, [userId, dayEnd, dayStart]);
    return rows;
  } catch (error) {
    console.error('Error getting events by user ID and date:', error);
    return [];
  }
}

/**
 * Get events by user ID for a date range (events that occur within the range)
 * @param {number} userId - The user ID to filter events by
 * @param {string} startDate - Start date string in YYYY-MM-DD format
 * @param {string} endDate - End date string in YYYY-MM-DD format (exclusive, so use next day)
 * @returns {Promise<Array>} Array of event objects that occur within the date range
 */
async function getEventsByUserIdAndDateRange(userId, startDate, endDate) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get events: MySQL is not connected');
      return [];
    }

    if (!userId || !startDate || !endDate) {
      console.error('Cannot get events: user ID, start date, and end date are required');
      return [];
    }

    // Parse dates and create start and end timestamps
    const rangeStart = new Date(startDate + 'T00:00:00.000Z');
    const rangeEnd = new Date(endDate + 'T00:00:00.000Z');

    // Format dates for MySQL (YYYY-MM-DD HH:MM:SS)
    const rangeStartStr = rangeStart.toISOString().slice(0, 19).replace('T', ' ');
    const rangeEndStr = rangeEnd.toISOString().slice(0, 19).replace('T', ' ');

    // Get events where the event overlaps with the date range
    // An event overlaps if: event_start < rangeEnd AND event_end > rangeStart
    const deletedId = await getDeletedSecurityId();
    const deletedFilter = deletedId ? `AND e.event_security_id != ${deletedId}` : '';

    const query = `
      SELECT 
        e.event_id,
        e.event_name,
        e.event_start,
        e.event_end,
        e.event_owner_id,
        e.event_security_id,
        u.username as owner_username,
        es.security_level,
        ec.color as event_color
      FROM event e
      LEFT JOIN user u ON e.event_owner_id = u.user_id
      LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
      LEFT JOIN event_color ec ON e.event_id = ec.event_id
      LEFT JOIN deletedEvent de ON e.event_id = de.event_id
      WHERE e.event_owner_id = ?
        AND e.event_start < ?
        AND e.event_end > ?
        ${deletedFilter}
        AND de.event_id IS NULL
      ORDER BY e.event_start ASC
    `;
    
    const [rows] = await pool.execute(query, [userId, rangeEndStr, rangeStartStr]);
    return rows;
  } catch (error) {
    console.error('Error getting events by user ID and date range:', error);
    return [];
  }
}

/**
 * Get all security levels from event_security table (excluding 'deleted')
 * @returns {Promise<Array>} Array of security level objects
 */
async function getAllSecurityLevels() {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get security levels: MySQL is not connected');
      return [];
    }

    // Exclude 'deleted' security level from the list (users shouldn't create events as deleted)
    const query = `SELECT event_security_id, security_level FROM event_security WHERE security_level != 'deleted' ORDER BY event_security_id ASC`;
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    console.error('Error getting security levels:', error);
    return [];
  }
}

/**
 * Get events happening right now (current date and time) for a user
 * Includes events where user is owner OR participant (via event_user table)
 * Uses MySQL's NOW() function to ensure accurate time comparison
 * @param {number} userId - The user ID to filter events by
 * @returns {Promise<Array>} Array of event objects happening right now, ordered by earliest start time
 */
async function getCurrentEvents(userId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get current events: MySQL is not connected');
      return [];
    }

    if (!userId) {
      console.error('Cannot get current events: user ID is required');
      return [];
    }

    // Use MySQL's NOW() function to get current server time
    // This ensures accurate time comparison regardless of timezone
    // Get events where:
    // 1. User is the owner (event_owner_id = userId)
    // 2. OR user is a participant (exists in event_user table)
    // AND current time (NOW()) is BETWEEN event_start and event_end (inclusive)
    // This means: event_start <= NOW() <= event_end
    // Using EXISTS subquery to avoid duplicate rows from JOINs
    const query = `
      SELECT 
        e.event_id,
        e.event_name,
        e.event_start,
        e.event_end,
        e.event_owner_id,
        e.event_security_id,
        u.username as owner_username,
        es.security_level
      FROM event e
      LEFT JOIN user u ON e.event_owner_id = u.user_id
      LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
      WHERE (
        e.event_owner_id = ? 
        OR EXISTS (
          SELECT 1 
          FROM event_user eu 
          WHERE eu.event_id = e.event_id 
          AND eu.user_id = ?
        )
      )
      AND e.event_start <= NOW()
      AND e.event_end >= NOW()
      AND es.security_level != 'deleted'
      AND NOT EXISTS (SELECT 1 FROM deletedEvent de WHERE de.event_id = e.event_id)
      ORDER BY e.event_start ASC
    `;
    
    const [rows] = await pool.execute(query, [userId, userId]);
    return rows;
  } catch (error) {
    console.error('Error getting current events:', error);
    return [];
  }
}

/**
 * Create a new event
 * @param {Object} eventData - { event_name, event_start, event_end, event_owner_id, event_security_id }
 * @returns {Promise<Object|null>} Created event object or null if failed
 */
async function createEvent(eventData) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot create event: MySQL is not connected');
      throw new Error('MySQL connection is not available');
    }

    const { event_name, event_start, event_end, event_owner_id, event_security_id, event_color } = eventData;

    // Validate required fields
    if (!event_name || !event_start || !event_end || !event_owner_id || !event_security_id) {
      throw new Error('All event fields are required');
    }

    // Validate that event_end is after event_start
    const startDate = new Date(event_start);
    const endDate = new Date(event_end);
    if (endDate <= startDate) {
      throw new Error('Event end time must be after event start time');
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert the event
      const query = `
        INSERT INTO event (event_name, event_start, event_end, event_owner_id, event_security_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(query, [
        event_name.trim(),
        event_start,
        event_end,
        event_owner_id,
        event_security_id
      ]);

      if (result.insertId > 0) {
        // Insert the color if provided
        if (event_color) {
          const colorQuery = `
            INSERT INTO event_color (color, event_id)
            VALUES (?, ?)
          `;
          await connection.execute(colorQuery, [event_color, result.insertId]);
        }

        // Commit the transaction
        await connection.commit();

        // Return the created event
        const queryGetEvent = `
          SELECT 
            e.event_id,
            e.event_name,
            e.event_start,
            e.event_end,
            e.event_owner_id,
            e.event_security_id,
            u.username as owner_username,
            es.security_level,
            ec.color as event_color
          FROM event e
          LEFT JOIN user u ON e.event_owner_id = u.user_id
          LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
          LEFT JOIN event_color ec ON e.event_id = ec.event_id
          WHERE e.event_id = ?
        `;
        const [rows] = await pool.execute(queryGetEvent, [result.insertId]);
        return rows.length > 0 ? rows[0] : null;
      }

      await connection.commit();
      return null;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Get deleted events by user ID (events with security_level = 'deleted')
 * @param {number} userId - The user ID to filter events by
 * @returns {Promise<Array>} Array of deleted event objects
 */
async function getDeletedEventsByUserId(userId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get deleted events: MySQL is not connected');
      return [];
    }

    if (!userId) {
      console.error('Cannot get deleted events: user ID is required');
      return [];
    }

    const deletedId = await getDeletedSecurityId();
    if (!deletedId) {
      return [];
    }

    const query = `
      SELECT 
        e.event_id,
        e.event_name,
        e.event_start,
        e.event_end,
        e.event_owner_id,
        e.event_security_id,
        de.deleted_at,
        u.username as owner_username,
        es.security_level
      FROM event e
      LEFT JOIN user u ON e.event_owner_id = u.user_id
      LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
      INNER JOIN deletedEvent de ON e.event_id = de.event_id
      WHERE e.event_owner_id = ?
        AND e.event_security_id = ?
      ORDER BY de.deleted_at DESC, e.event_start DESC
    `;
    
    const [rows] = await pool.execute(query, [userId, deletedId]);
    return rows;
  } catch (error) {
    console.error('Error getting deleted events by user ID:', error);
    return [];
  }
}

/**
 * Soft delete an event (mark as deleted by setting security_level to 'deleted')
 * @param {number} eventId - The event ID to delete
 * @param {number} userId - The user ID (for authorization check)
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function softDeleteEvent(eventId, userId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot delete event: MySQL is not connected');
      throw new Error('MySQL connection is not available');
    }

    if (!eventId || !userId) {
      throw new Error('Event ID and user ID are required');
    }

    const deletedId = await getDeletedSecurityId();
    if (!deletedId) {
      throw new Error('Deleted security level not found in database');
    }

    // First verify the event belongs to the user and get its current security level
    const checkQuery = `
      SELECT event_id, event_security_id 
      FROM event 
      WHERE event_id = ? AND event_owner_id = ?
    `;
    const [checkRows] = await pool.execute(checkQuery, [eventId, userId]);
    
    if (checkRows.length === 0) {
      throw new Error('Event not found or you do not have permission to delete it');
    }

    // If already deleted, don't do anything
    if (checkRows[0].event_security_id === deletedId) {
      return true;
    }

    // Start transaction to ensure atomicity
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Mark event as deleted by changing security level
      const updateQuery = `UPDATE event SET event_security_id = ? WHERE event_id = ? AND event_owner_id = ?`;
      const [updateResult] = await connection.execute(updateQuery, [deletedId, eventId, userId]);
      
      if (updateResult.affectedRows > 0) {
        // Insert into deletedEvent table to track deletion date
        const insertQuery = `
          INSERT INTO deletedEvent (event_id, deleted_at)
          VALUES (?, NOW())
          ON DUPLICATE KEY UPDATE deleted_at = NOW()
        `;
        await connection.execute(insertQuery, [eventId]);
      }
      
      await connection.commit();
      return updateResult.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error soft deleting event:', error);
    throw error;
  }
}

/**
 * Get the event_security_id for "private" security level (default for restoration)
 * @returns {Promise<number|null>} The security ID for "private" or null if not found
 */
async function getPrivateSecurityId() {
  try {
    const query = `SELECT event_security_id FROM event_security WHERE security_level = 'private' LIMIT 1`;
    const [rows] = await pool.execute(query);
    return rows.length > 0 ? rows[0].event_security_id : null;
  } catch (error) {
    console.error('Error getting private security ID:', error);
    return null;
  }
}

/**
 * Restore a deleted event (change security level back to 'private')
 * @param {number} eventId - The event ID to restore
 * @param {number} userId - The user ID (for authorization check)
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function restoreEvent(eventId, userId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot restore event: MySQL is not connected');
      throw new Error('MySQL connection is not available');
    }

    if (!eventId || !userId) {
      throw new Error('Event ID and user ID are required');
    }

    const deletedId = await getDeletedSecurityId();
    if (!deletedId) {
      throw new Error('Deleted security level not found in database');
    }

    const privateId = await getPrivateSecurityId();
    if (!privateId) {
      throw new Error('Private security level not found in database');
    }

    // Verify the event belongs to the user, is marked as deleted, and was deleted less than 7 days ago
    const checkQuery = `
      SELECT e.event_id, de.deleted_at
      FROM event e
      INNER JOIN deletedEvent de ON e.event_id = de.event_id
      WHERE e.event_id = ? 
        AND e.event_owner_id = ?
        AND e.event_security_id = ?
        AND de.deleted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    const [checkRows] = await pool.execute(checkQuery, [eventId, userId, deletedId]);
    
    if (checkRows.length === 0) {
      throw new Error('Event not found, you do not have permission, it is not deleted, or it was deleted more than 7 days ago');
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Restore by changing security level back to 'private'
      const restoreQuery = `UPDATE event SET event_security_id = ? WHERE event_id = ? AND event_owner_id = ?`;
      const [result] = await connection.execute(restoreQuery, [privateId, eventId, userId]);
      
      if (result.affectedRows > 0) {
        // Remove from deletedEvent table
        const deleteDeletedQuery = `DELETE FROM deletedEvent WHERE event_id = ?`;
        await connection.execute(deleteDeletedQuery, [eventId]);
      }
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error restoring event:', error);
    throw error;
  }
}

/**
 * Permanently delete an event (hard delete from database)
 * @param {number} eventId - The event ID to permanently delete
 * @param {number} userId - The user ID (for authorization check)
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function permanentlyDeleteEvent(eventId, userId) {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot permanently delete event: MySQL is not connected');
      throw new Error('MySQL connection is not available');
    }

    if (!eventId || !userId) {
      throw new Error('Event ID and user ID are required');
    }

    const deletedId = await getDeletedSecurityId();
    if (!deletedId) {
      throw new Error('Deleted security level not found in database');
    }

    // First verify the event belongs to the user and is marked as deleted
    const checkQuery = `
      SELECT e.event_id 
      FROM event e
      INNER JOIN deletedEvent de ON e.event_id = de.event_id
      WHERE e.event_id = ? 
        AND e.event_owner_id = ? 
        AND e.event_security_id = ?
    `;
    const [checkRows] = await pool.execute(checkQuery, [eventId, userId, deletedId]);
    
    if (checkRows.length === 0) {
      throw new Error('Event not found, you do not have permission, or it is not deleted');
    }

    // Permanently delete (CASCADE will also remove from deletedEvent table)
    const deleteQuery = `DELETE FROM event WHERE event_id = ? AND event_owner_id = ?`;
    const [result] = await pool.execute(deleteQuery, [eventId, userId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error permanently deleting event:', error);
    throw error;
  }
}

/**
 * Permanently delete events that were deleted more than 7 days ago
 * @returns {Promise<number>} Number of events permanently deleted
 */
async function cleanupOldDeletedEvents() {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot cleanup deleted events: MySQL is not connected');
      return 0;
    }

    const deletedId = await getDeletedSecurityId();
    if (!deletedId) {
      return 0;
    }

    // Delete events that were deleted more than 7 days ago
    // CASCADE will automatically remove from deletedEvent table
    const deleteQuery = `
      DELETE e FROM event e
      INNER JOIN deletedEvent de ON e.event_id = de.event_id
      WHERE e.event_security_id = ?
        AND de.deleted_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    const [result] = await pool.execute(deleteQuery, [deletedId]);
    
    return result.affectedRows;
  } catch (error) {
    console.error('Error cleaning up old deleted events:', error);
    return 0;
  }
}

module.exports = {
  getAllEvents,
  getEventsByUserId,
  getEventsByUserIdAndDate,
  getEventsByUserIdAndDateRange,
  getAllSecurityLevels,
  createEvent,
  getCurrentEvents,
  getDeletedEventsByUserId,
  softDeleteEvent,
  restoreEvent,
  permanentlyDeleteEvent,
  cleanupOldDeletedEvents
};
