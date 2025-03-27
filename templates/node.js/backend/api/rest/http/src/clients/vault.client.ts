import { get } from 'lodash';
import Vault, { VaultOptions, client as Client } from 'node-vault';

export class VaultClient {
  private readonly client: Client;
  private readonly prefix: string = 'secret/data';

  constructor(options: VaultOptions) {
    this.client = Vault(options);
  }

  async getSecret<T>(path: string, key: string): Promise<T> {
    try {
      const response = await this.client.read(`${this.prefix}/${path}`);
      const data = get(response, 'data.data', {});
      return get(data, key, '');
    } catch (error) {
      console.error(error);
      return 'error' as T;
    }
  }
}
