import { Command, program } from 'commander';
import { loginCommand } from './login';
import { logoutCommand } from './logout';
import { setProviderCommand } from './setProvider';
import { listProvidersCommand } from './list';

export const providerCommand = new Command("providers")
    .description("Provider related information")
    .addCommand(listProvidersCommand)
    .addCommand(loginCommand)
    .addCommand(logoutCommand)
    .addCommand(setProviderCommand)