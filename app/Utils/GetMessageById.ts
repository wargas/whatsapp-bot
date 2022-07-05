import { Client } from "whatsapp-web.js";

export default async (client: Client, chatId: string, messageId: string) => {

  const message = await client.pupPage?.evaluate(async (chatId, messageId) => {
    const chat = window.Store.Chat.get(chatId);

    let msgs = chat.msgs.getModelsArray().filter(m => !m.isNotification);

  }, chatId, messageId);

  console.log(message)

  return {message};

}
