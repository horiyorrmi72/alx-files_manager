import { createClient } from 'redis';
const redis = require('redis');
const { promisify } = require('util');


class RedisClient{
    constructor(){
	this.client = createClient();
	this.getAsync = promisify(this.client.get).bind(this.client);
	this.client.on('error', (err) => console.log(`Error on: $(err)`));
    }

  isAlive(){
    return this.redis.connected;
}

  async get(key){
    return await this.getAsync(key);
}
  async set(key, value, time){
      this.client.set(key, value);
      this.client.expire(key, time);
  }
  async del(key){
      this.redis.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
