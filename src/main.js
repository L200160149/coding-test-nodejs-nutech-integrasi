import { web } from "./applications/web.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;
web.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
});
