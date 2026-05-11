import { query } from '../config/db.js';
import logger from './logger.js';

const tick = async () => {
  try {
    const result = await query(
      "UPDATE cinemas SET status = 'live' WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()"
    );
    if (result.affectedRows > 0) {
      logger.info(`Auto-started ${result.affectedRows} cinema session(s).`);
    }
  } catch (err) {
    logger.error('Scheduler error', { error: err.message });
  }
};

export const startScheduler = () => {
  tick();
  setInterval(tick, 30_000);
};
