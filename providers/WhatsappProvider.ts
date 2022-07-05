import type { ApplicationContract } from "@ioc:Adonis/Core/Application";
import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
|
| Your application is not ready when this file is loaded by the framework.
| Hence, the top level imports relying on the IoC container will not work.
| You must import them inside the life-cycle methods defined inside
| the provider class.
|
| @example:
|
| public async ready () {
|   const Database = this.app.container.resolveBinding('Adonis/Lucid/Database')
|   const Event = this.app.container.resolveBinding('Adonis/Core/Event')
|   Event.on('db:query', Database.prettyPrint)
| }
|
*/
export default class WhatsappProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
    this.app.container.singleton("App/Whatsapp", () => {
      return new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: false
        }
      });
    });
  }

  public async boot() {
    // All bindings are ready, feel free to use them
  }

  public async ready() {
    // App is ready
    const client: Client = this.app.container.use("App/Whatsapp");

    client.on("ready", async () => {
      this.app.logger.info("Whatsapp carregou!");
      // this.sicronize(client)
    });

    client.on('authenticated', () => {
      this.app.logger.info(`Whatsapp autenticado`)
    })

    client.on("qr", (qr) => {
      qrcode.generate(qr, { small: true });
    });

    client.on("message_ack", async msg => {
      this.createOrUpdateMessage(msg)

      this.app.logger.info('Message ACK updated')
    })

    client.on('message_create', async (msg) => {
      this.createOrUpdateMessage(msg)
      this.app.logger.info('Nova messagem criada')
    })

    client.on("message", async (msg) => {
      this.createOrUpdateMessage(msg)

      this.app.logger.info('Nova messagem criada')
    })

    client.initialize();
    this.app.logger.info("Carregando  Whatsapp...");
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }

  public async sicronize(client: Client) {
    const { default: Chat } = await import("App/Models/Chat");
    const { default: MessageModel } = await import("App/Models/Message");
    const chats = (await client.getChats()).filter(chat => !chat.isGroup);

    this.app.logger.info("Sincronizando chats...");

    await Chat.updateOrCreateMany(
      "id",
      chats.map((c) => {
        return {
          id: c.id._serialized,
          name: c.name,
        };
      })
    );

    this.app.logger.info("Chats sincronizados!");

    this.app.logger.info("Sincronizando messages...");

    type MessageEChat = Message & { chatId: string };

    const messages: MessageEChat[] = [];

    for await (let chat of chats) {
      const _messages = (await chat.fetchMessages({ limit: 1e9 })).filter(msg => !msg.isStatus);

      messages.push(
        ..._messages.map((m) => {
          return { ...m, chatId: chat.id._serialized };
        })
      );
    }

   await MessageModel.updateOrCreateMany(
      "id",
      messages.map((msg) => {
        return {
          id: msg?.id._serialized,
          body: msg?.body,
          timestamp: msg?.timestamp,
          chatId: msg?.chatId,
          type: msg.type,
          ack: msg.ack
        };
      })
    );
    this.app.logger.info("Messages sincronizadas");
  }

  public async createOrUpdateMessage(message: Message) {
    const { default: MessageModel } = await import("App/Models/Message");

    const chat = await message.getChat();

    await MessageModel.updateOrCreate({id: message.id._serialized}, {
      id:message.id._serialized,
      body:message.body,
      chatId: chat.id._serialized,
      timestamp:message.timestamp,
      type:message.type,
      ack:message.ack
    })

  }


}
