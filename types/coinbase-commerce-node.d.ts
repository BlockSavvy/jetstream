declare module 'coinbase-commerce-node' {
  export namespace Checkout {
    function create(data: {
      name: string;
      description: string;
      pricing_type: 'fixed_price';
      local_price: {
        amount: string;
        currency: string;
      };
      requested_info?: string[];
      metadata?: Record<string, any>;
    }): Promise<{
      id: string;
      name: string;
      description: string;
      hosted_url: string;
      created_at: string;
      expires_at: string;
      pricing: {
        local: {
          amount: string;
          currency: string;
        };
      };
    }>;

    function retrieve(id: string): Promise<any>;
  }

  export namespace Charge {
    function create(data: {
      name: string;
      description: string;
      pricing_type: 'fixed_price';
      local_price: {
        amount: string;
        currency: string;
      };
      metadata?: Record<string, any>;
    }): Promise<{
      id: string;
      code: string;
      name: string;
      description: string;
      hosted_url: string;
      created_at: string;
      expires_at: string;
      pricing: {
        local: {
          amount: string;
          currency: string;
        };
      };
    }>;

    function retrieve(id: string): Promise<any>;
  }

  export class Webhook {
    constructor(secret: string);
    verify(payload: string, signature: string): boolean;
    construct(payload: string): {
      type: string;
      data: {
        id: string;
        code: string;
        name: string;
        description: string;
        hosted_url: string;
        created_at: string;
        expires_at: string;
        pricing: {
          local: {
            amount: string;
            currency: string;
          };
        };
        payments: Array<{
          network: string;
          transaction_id: string;
          status: string;
          value: {
            local: {
              amount: string;
              currency: string;
            };
            crypto: {
              amount: string;
              currency: string;
            };
          };
        }>;
        timeline: Array<{
          time: string;
          status: string;
        }>;
        metadata?: Record<string, any>;
      };
    };
  }

  export class Client {
    constructor(apiKey: string);
    static init(apiKey: string): void;
  }

  export type WebhookEvent = {
    id: string;
    type: string;
    data: {
      id: string;
      code: string;
      name: string;
      description: string;
      hosted_url: string;
      created_at: string;
      expires_at: string;
      confirmed_at?: string;
      checkout?: {
        id: string;
      };
      timeline: Array<{
        time: string;
        status: string;
      }>;
      metadata: Record<string, any>;
      pricing: {
        local: {
          amount: string;
          currency: string;
        };
        crypto?: {
          amount: string;
          currency: string;
        };
      };
      payments: Array<{
        network: string;
        transaction_id: string;
        status: string;
        detected_at: string;
        value: {
          local: {
            amount: string;
            currency: string;
          };
          crypto: {
            amount: string;
            currency: string;
          };
        };
      }>;
    };
  };

  export type ChargeStatus = 'NEW' | 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'UNRESOLVED' | 'RESOLVED' | 'CANCELED';
}

declare module 'coinbase-commerce-node/lib/Webhook' {
  export default class Webhook {
    constructor(secret: string);
    verify(payload: string, signature: string): boolean;
    construct(payload: string): any;
  }
} 