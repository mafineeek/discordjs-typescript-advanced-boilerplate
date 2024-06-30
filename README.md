# Advanced OOP (class based) boilerplate for your Discord.JS Typescript based bot

## Events

Events are classes that implement such interface:
```ts
interface IEvent<K extends keyof ClientEvents> {
  event: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void>;
}
```

## Slash Commands

Slash Commands are classes that implement such interface:

```ts
interface ISlashCommand {
  isGlobal?: boolean; // Should commands be registered globally?
  guildsToRegister?: string[]; // If isGlobal is false - where bot should register commands
  ownerOnly?: boolean; // Only owner command?
  requiredUserPermissions?: PermissionsString[]; // Permissions required from command author
  requiredBotPermissions?: PermissionsString[]; // Permissions required from bot
  data: SlashCommandBuilder; // Discord.JS Slash Command Builder
  execute: (
    interaction: ChatInputCommandInteraction,
    client?: BotClient
  ) => Promise<void>;
}
```


## Installation

```
git clone https://github.com/mafineeek/discordjs-typescript-advanced-boilerplate
```
