import { ClerkAuthGuard } from './clerk-auth.guard';

describe('ClerkAuthGuard', () => {
  it('should be defined', () => {
    expect(new ClerkAuthGuard()).toBeDefined();
  });
});
