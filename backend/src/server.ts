import "./jobs/autoCheckoutJob";
import typeSafeLogger from "./utils/typeSafeLogger";
import app from "./app";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  typeSafeLogger.info("Server listening", { port: PORT });
});
