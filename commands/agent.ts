import { Command } from "commander";
import { agentLoop } from "../ai/agent/agent-loop";
import { readAppState, selectChat } from "../storage/state";

export const agentCommand = new Command("agent")
  .description('Runs the agent')
  .option('-p, --prompt <prompt>', 'prompt', '')
  .action(async({prompt}) => {
    const state = await readAppState()
    if (!state) {
      console.log("Please login to a provider first")
      return
    }
    const result = await agentLoop(
      prompt,
      state.model,
      state.provider,
      state.selectedChatId ?? undefined,
    )
    if (!result.success) {
      console.log(result.error)
      return
    }

    await selectChat(result.chatId)
    console.log(result.output)
  });
