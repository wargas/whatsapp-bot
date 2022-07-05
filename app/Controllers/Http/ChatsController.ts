import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import WhatsappClient from '@ioc:App/Whatsapp';
import Message from 'App/Models/Message';
import GetMessageById from 'App/Utils/GetMessageById';

export default class ChatsController {

  async sendMessage({request}: HttpContextContract) {

    const state = await WhatsappClient.getState();

    if(state !== 'CONNECTED') {
      return {error: 'Whatsapp desconectado'}
    }

    const {chat_id, message} = request.all();

    const _message = await WhatsappClient.sendMessage(chat_id, message);

    return _message
  }

  async downloadMedia({params}: HttpContextContract) {

    return await GetMessageById(WhatsappClient, '5493515193933@c.us', 'false_5493515193933@c.us_10794DC38B4351C7EF')
    const { message_id } = params;

    const message = await Message.find(message_id);

    const chat = await WhatsappClient.getChatById(message?.chatId||'');

    const allMessages = await chat.fetchMessages({limit: 1e9});

    const chatMessage = allMessages.find(m => m.id._serialized === message_id);

    if(!chatMessage) {
      return { error: 'MESSAGE_NOT FOUND'}
    }


    const media = await chatMessage?.downloadMedia();

    return media;
  }


}
