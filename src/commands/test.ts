import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ISlashCommand } from "../modules/CommandHandler";

export default class TestCommand implements ISlashCommand {
    data = new SlashCommandBuilder()
    .setName('test')
    .setDescription('test command');

    execute = async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply('test');
    }
}