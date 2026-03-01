require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const recommendRoute = require("./routes/recommend");
app.use("/recommend", recommendRoute);

app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

// Logging middleware to see requests
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
