import {
  ChatInputCommandInteraction,
  Collection,
  Interaction,
  PermissionsString,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import fs from "fs";
import path from "path";
import BotClient from "./BotClient";

export interface ISlashCommand {
  isGlobal?: boolean;
  guildsToRegister?: string[];
  ownerOnly?: boolean;
  requiredUserPermissions?: PermissionsString[];
  requiredBotPermissions?: PermissionsString[];
  data: SlashCommandBuilder;
  execute: (
    interaction: ChatInputCommandInteraction,
    client?: BotClient
  ) => Promise<void>;
}

export default class CommandHandler {
  private readonly _registeredCommands: Collection<string, ISlashCommand> =
    new Collection();

  private readonly _client: BotClient;

  constructor(client: BotClient) {
    this._client = client;
  }

  public async init(): Promise<void> {
    await this.loadCommands();
    await this.registerCommands();

    this._client.on("interactionCreate", async (interaction: Interaction) => {
      await this.handleInteraction(interaction as ChatInputCommandInteraction);
    });
  }

  public async loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, "..", "commands");

    const readCommandFiles = async (dir: string): Promise<string[]> => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      const files = await Promise.all(
        entries.map((entry) => {
          const res = path.resolve(dir, entry.name);
          return entry.isDirectory() ? readCommandFiles(res) : res;
        })
      );

      return Array.prototype.concat(...files);
    };

    const commandFiles = await readCommandFiles(commandsPath);

    for (const filePath of commandFiles) {
      if (filePath.endsWith(".ts")) {
        const importedCommand = await import(filePath);

        const command: ISlashCommand = new importedCommand.default();

        if (command.data && command.data.name) {
          this._registeredCommands.set(command.data.name, command);
        }
      }
    }

    console.log(`Loaded ${this._registeredCommands.size} commands.`);
  }

  public async registerCommands(): Promise<void> {
    const rest = new REST().setToken(process.env.BOT_TOKEN as string);

    if (Boolean(process.env.DEV_MODE)) {
      console.log("[DEV MODE] Registering local commands...");
      await rest.put(
        Routes.applicationGuildCommands(
          String(this._client.user?.id),
          String(process.env.DEV_MODE_GUILD)
        ),
        {
          body: this._registeredCommands.map((command) =>
            command.data.toJSON()
          ),
        }
      );
    } else {
      await rest.put(
        Routes.applicationCommands(String(this._client.user?.id)),
        {
          body: this._registeredCommands
            .filter((command) => command.isGlobal)
            .map((command) => command.data.toJSON()),
        }
      );

      this._registeredCommands
        .filter((command) => !command.isGlobal)
        .forEach((command) => {
          if (command.guildsToRegister) {
            command.guildsToRegister.forEach((guildId) => {
              rest
                .put(
                  Routes.applicationGuildCommands(
                    String(this._client.user?.id),
                    guildId
                  ),
                  {
                    body: [command.data.toJSON()],
                  }
                )
                .catch((error) => {
                  console.error(
                    `
					  Failed to register command ${command.data.name} in guild ${guildId}:`,
                    error
                  );
                });
            });
          }
        });
    }
  }

  public async handleInteraction(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    if (
      !interaction.isChatInputCommand() ||
      !this._registeredCommands.has(interaction.commandName)
    )
      return;

    const command = this._registeredCommands.get(
      interaction.commandName
    ) as ISlashCommand;

    if (
      command.ownerOnly &&
      !String(process.env.OWNERS)
        .split(";")
        .includes(String(interaction.user.id))
    ) {
      await interaction.reply({
        content: "Only owners can use this command.",
        ephemeral: true,
      });
      return;
    }

    if (
      command.requiredBotPermissions &&
      command.requiredBotPermissions.some(
        (permission) =>
          !interaction.guild?.members.me?.permissions.has(permission)
      )
    ) {
      await interaction.reply({
        content: "I don't have enough permissions to execute this command.",
        ephemeral: true,
      });
      return;
    }

    if (
      command.requiredUserPermissions &&
      command.requiredUserPermissions.some(
        (permission) => !interaction.memberPermissions?.has(permission)
      )
    ) {
      await interaction.reply({
        content: "You don't have enough permissions to execute this command.",
        ephemeral: true,
      });
      return;
    }

    await command.execute(interaction, this._client);
  }
}
