import { ActivityType, Client } from "discord.js";
import { IEvent } from "../modules/EventHandler";
import BotClient from "../modules/BotClient";

export default class ReadyEvent implements IEvent<"ready"> {
  public event = "ready" as const;

  public async execute(client: Client): Promise<void> {
    await client.user?.setActivity({
      name: "author: mafineeek",
      type: ActivityType.Watching
    });
  }
}
