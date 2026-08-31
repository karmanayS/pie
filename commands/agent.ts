import { Command } from "commander";
import { agentLoop } from "../ai/agent/agent-loop";

export const agentCommand = new Command("agent")
  .description('Runs the agent')
  .option('-p, --prompt <prompt>', 'prompt', '')
  .action(async({prompt}) => {
    const file = Bun.file("./state.json")
    const model = await file.json()["model"]
    await agentLoop(prompt,model)
  });