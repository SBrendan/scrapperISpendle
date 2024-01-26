import express from "express";
import cors from "cors";

import config from "./config.js";
import fermentationRoute from "./routes/fermentationRoute.js";

const app = express();

app.use(cors());
app.use(express.json());

//routes
app.use("/api", fermentationRoute);

app.listen(config.port, () =>
  console.log(`Server is live @ ${config.hostUrl}`)
);
