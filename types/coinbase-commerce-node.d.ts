declare module 'coinbase-commerce-node' {
  export const Client: {
    init: (apiKey: string) => void;
  };
  
  export const Webhook: {
    verifyEventBody: (payload: string, signature: string, secret: string) => any;
  };
  
  export const resources: {
    Charge: {
      create: (data: any) => Promise<any>;
    };
  };
} 