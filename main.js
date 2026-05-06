import cors from "cors";
import express from "express";
import { config } from "./configs/env.js";
import { initMongoDB } from "./configs/mongoose.config.js";
import {
  defaultRedisClient,
  initRedis,
  workerRedisClient,
} from "./configs/redis.config.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { startSendOTPWorker } from "./queues/otp/otp.worker.js";
import routes from "./routes/index.js";

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Entrypoint route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Smart Constructor API!" });
});

app.use(`/api/${config.app.apiVersion}`, routes);
app.use((err, req, res, next) => {
  console.log(err, "<<<ISELOG");
  errorHandler(err, req, res, next);
});

async function startWorkers() {
  startSendOTPWorker();
}

// Initialize all infrastructures
async function bootstrap() {
  await Promise.all([
    initMongoDB(),
    initRedis(defaultRedisClient, "app"),
    initRedis(workerRedisClient, "worker"),
  ]);

  startWorkers();

  app.listen(config.app.port, () => {
    console.info(`server is running on port ${config.app.port}`);
  });
}

bootstrap();
