import { Command } from 'commander';
import { loginCommand } from './login';
import { logoutCommand } from './logout';
import { listProvidersCommand } from './list';
import { setProviderCommand } from './setProvider';

export const providerCommand = new Command("providers")
    .description("Provider related information")
    .addCommand(listProvidersCommand)
    .addCommand(loginCommand)
    .addCommand(logoutCommand)
    .addCommand(setProviderCommand)