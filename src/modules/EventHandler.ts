import { Client, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import BotClient from "./BotClient";
import { ClientEvents } from "discord.js";

export interface IEvent<K extends keyof ClientEvents> {
  event: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void>;
}


export default class EventHandler {
  private readonly _registeredEvents: Collection<string, IEvent<keyof ClientEvents>> = new Collection();
  private readonly _client: BotClient;

  constructor(client: BotClient) {
    this._client = client;
  }

  public async init(): Promise<void> {
    await this.loadEvents();
    this.registerEvents();
  }

  private async loadEvents(): Promise<void> {
    const eventsPath = path.join(__dirname, "..", "events");

    const readEventFiles = async (dir: string): Promise<string[]> => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files = await Promise.all(
        entries.map((entry) => {
          const res = path.resolve(dir, entry.name);
          return entry.isDirectory() ? readEventFiles(res) : res;
        })
      );

      return files.flat();
    };

    const eventFiles = await readEventFiles(eventsPath);

    for (const filePath of eventFiles) {
      if (filePath.endsWith(".ts")) {
        const { default: EventClass } = await import(filePath);
        const event: IEvent<keyof ClientEvents> = new EventClass();

        if (event.event) {
          this._registeredEvents.set(event.event, event);
        }
      }
    }

    console.log(`Loaded ${this._registeredEvents.size} events.`);
  }

  private registerEvents(): void {
    for (const event of this._registeredEvents.values()) {
      if (event.once) {
        this._client.once(event.event, (...args) => event.execute(...args));
      } else {
        this._client.on(event.event, (...args) => event.execute(...args));
      }
    }
  }
}
