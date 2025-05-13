import DBClient from '../utils/db.js';
import RedisClient from '../utils/redis.js';

class AppController {
  static checkStatus(req, res) {
    const status = {
      redis: RedisClient.isAlive(),
      db: DBClient.isAlive(),
    };
    return res.status(200).send(status);
  }

  static async getStats(req, res) {
    const stats = {
      users: await DBClient.nbUsers(),
      files: await DBClient.nbFiles(),
    };
    return res.status(200).send(stats);
  }
}

export default AppController;
