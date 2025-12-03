const { pool, isMySQLConnected } = require('../connect_mysql');

/**
 * Get all events
 * @returns {Promise<Array>} Array of event objects
 */
async function getAllEvents() {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get events: MySQL is not connected');
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
        u.username as owner_username,
        es.security_level,
        ec.color as event_color
      FROM event e
      LEFT JOIN user u ON e.event_owner_id = u.user_id
      LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
      LEFT JOIN event_color ec ON e.event_id = ec.event_id
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
      WHERE e.event_owner_id = ?
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
      WHERE e.event_owner_id = ?
        AND e.event_start < ?
        AND e.event_end > ?
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
      WHERE e.event_owner_id = ?
        AND e.event_start < ?
        AND e.event_end > ?
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
 * Get all security levels from event_security table
 * @returns {Promise<Array>} Array of security level objects
 */
async function getAllSecurityLevels() {
  try {
    const isConnected = await isMySQLConnected();
    if (!isConnected) {
      console.error('Cannot get security levels: MySQL is not connected');
      return [];
    }

    const query = `SELECT event_security_id, security_level FROM event_security ORDER BY event_security_id ASC`;
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    console.error('Error getting security levels:', error);
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

module.exports = {
  getAllEvents,
  getEventsByUserId,
  getEventsByUserIdAndDate,
  getEventsByUserIdAndDateRange,
  getAllSecurityLevels,
  createEvent
};
