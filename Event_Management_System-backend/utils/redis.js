const redis = require("ioredis");
const client = new redis({
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  db: 0,
});

client.on("connect", () => {
  console.log("Redis connected");
});

module.exports = client;