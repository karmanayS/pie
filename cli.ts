import { program } from 'commander';
import { modelsCommand } from './commands/models';
import { agentCommand } from './commands/agent';
import { providerCommand } from './commands/providers';
import { chatsCommand } from './commands/chats';

program
  .name('pie')
  .description('Coding agent cli')
  .version('0.1.0')
  .addCommand(modelsCommand)
  .addCommand(agentCommand)
  .addCommand(providerCommand)
  .addCommand(chatsCommand);

program.parse();
