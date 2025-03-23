import { formatNumber } from './number';

describe('formatNumber', () => {
  it('should format number', () => {
    expect(formatNumber(1234)).toEqual('1,234');
  });
});
