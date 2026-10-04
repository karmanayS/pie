import { Command } from "commander";
import { agentLoop } from "../ai/agent/agent-loop";
import { readAppState } from "../storage/state";

export const agentCommand = new Command("agent")
  .description('Runs the agent')
  .option('-p, --prompt <prompt>', 'prompt', '')
  .action(async({prompt}) => {
    const state = await readAppState()
    if (!state) {
      console.log("Please login to a provider first")
      return
    }
    const output = await agentLoop(prompt,state.model,state.provider)
    console.log(output)
  });
