import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./configs/mongoose.config.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { emailService } from "./services/email.service.js";

dotenv.config(); // Load .env first!

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to smart constructor API" });
});

app.use("/api", routes);
app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});
// Connect to MongoDB and then start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.info(`🚀 Server is running on port ${PORT}`);
  });
};

startServer();
