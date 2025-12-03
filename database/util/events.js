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
        es.security_level
      FROM event e
      LEFT JOIN user u ON e.event_owner_id = u.user_id
      LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
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

    const { event_name, event_start, event_end, event_owner_id, event_security_id } = eventData;

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

    const query = `
      INSERT INTO event (event_name, event_start, event_end, event_owner_id, event_security_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(query, [
      event_name.trim(),
      event_start,
      event_end,
      event_owner_id,
      event_security_id
    ]);

    if (result.insertId > 0) {
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
          es.security_level
        FROM event e
        LEFT JOIN user u ON e.event_owner_id = u.user_id
        LEFT JOIN event_security es ON e.event_security_id = es.event_security_id
        WHERE e.event_id = ?
      `;
      const [rows] = await pool.execute(queryGetEvent, [result.insertId]);
      return rows.length > 0 ? rows[0] : null;
    }

    return null;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

module.exports = {
  getAllEvents,
  getAllSecurityLevels,
  createEvent
};
