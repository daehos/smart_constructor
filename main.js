import cors from "cors";
import express from "express";
import { config } from "./configs/env.js";
import { initMongoDB } from "./configs/mongoose.config.js";
import { initRedis } from "./configs/redis.config.js";
import { errorHandler } from "./middlewares/error.middleware.js";
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

app.use("/api", routes);
app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});

// Initialize all infrastructures
async function bootstrap() {
  await initMongoDB();
  await initRedis();

  app.listen(config.app.port, () => {
    console.info(`\nserver is running on port ${config.app.port}`);
  });
}

bootstrap();
