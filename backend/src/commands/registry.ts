import { Command } from '../types';

class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  register(command: Command) {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.commands.set(alias, command);
      });
    }
  }

  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): Command[] {
    const unique = new Map<string, Command>();
    this.commands.forEach((cmd, key) => {
      if (cmd.name === key) {
        unique.set(key, cmd);
      }
    });
    return Array.from(unique.values());
  }

  getCommandsByCategory(category: Command['category']): Command[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }
}

export const commandRegistry = new CommandRegistry();
