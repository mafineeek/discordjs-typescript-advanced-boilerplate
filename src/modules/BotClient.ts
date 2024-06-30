import { Client, GatewayIntentBits } from "discord.js";
import CommandHandler from "./CommandHandler";
import EventHandler from "./EventHandler";

export default class BotClient extends Client {
  public commandHandler!: CommandHandler;
  public eventHandler!: EventHandler;

  constructor() {
    super({
      intents: Object.values(GatewayIntentBits).filter(
        (i) => typeof i === "number"
      ), // For development purposes I want all intents
    });
  }

  async start() {
    await this.login(process.env.BOT_TOKEN);

    this.commandHandler = new CommandHandler(this);
    await this.commandHandler.init();

    this.eventHandler = new EventHandler(this);
    await this.eventHandler.init();
  }
}
