import { APP_DESC, APP_NAME } from './constants';

describe('constants', () => {
  it('to equal expected', () => {
    expect(APP_NAME).toEqual('N26');
    expect(APP_DESC).toEqual(
      'An Opinionated Teckstack with the JavaScript - Best of 8'
    );
  });
});
