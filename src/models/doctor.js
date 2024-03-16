const insertOrUpdateDaysOfWeek = async (userId, daysOfWeek) => {
    try {
      const client = await pool.connect();
      await client.query('BEGIN');
  
      for (const dayOfWeek of daysOfWeek) {
        const { session_time, day_of_week, status } = dayOfWeek;
  
        const queryText = `
          INSERT INTO days_of_week (user_id, day_of_week, session_time, status)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, day_of_week) DO UPDATE
          SET session_time = EXCLUDED.session_time, status = EXCLUDED.status;
        `;
  
        const values = [userId, day_of_week, session_time, status];
        await client.query(queryText, values);
      }
  
      await client.query('COMMIT');
      console.log('Successfully inserted or updated days_of_week');
    } catch (err) {
      console.error('Error while inserting or updating days_of_week', err);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  };
  