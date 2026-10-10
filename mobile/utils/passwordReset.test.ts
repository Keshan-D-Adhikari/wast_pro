import { passwordResetMessage } from './passwordReset';

describe('passwordResetMessage', () => {
  it('gives the same success message for a known and an unknown email', () => {
    expect(passwordResetMessage()).toEqual(passwordResetMessage('auth/user-not-found'));
    expect(passwordResetMessage().ok).toBe(true);
  });

  it('reports a bad email, no network and rate limiting as failures', () => {
    for (const code of ['auth/invalid-email', 'auth/network-request-failed', 'auth/too-many-requests', 'auth/other']) {
      expect(passwordResetMessage(code).ok).toBe(false);
    }
  });
});
