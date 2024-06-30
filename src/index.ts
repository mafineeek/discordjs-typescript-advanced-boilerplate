import { config } from "dotenv";
import BotClient from "./modules/BotClient";

const client = new BotClient();
config();

client.start();
