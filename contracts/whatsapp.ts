declare module '@ioc:App/Whatsapp' {
  import { Client } from 'whatsapp-web.js'

  const WhatsappClient: Client;

  export default WhatsappClient
}

