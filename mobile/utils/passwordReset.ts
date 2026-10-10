/**
 * Message to show after asking Firebase to send a password reset email.
 * An unknown email gets the same message as a known one, so the screen can't
 * be used to find out which emails have accounts.
 */
export function passwordResetMessage(errorCode?: string): { ok: boolean; text: string } {
  switch (errorCode) {
    case 'auth/invalid-email':
      return { ok: false, text: 'Please enter a valid email address.' };
    case 'auth/network-request-failed':
      return { ok: false, text: 'No connection. Check your internet and try again.' };
    case 'auth/too-many-requests':
      return { ok: false, text: 'Too many attempts. Please wait a few minutes and try again.' };
    case undefined:
    case 'auth/user-not-found':
      return { ok: true, text: 'If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder.' };
    default:
      return { ok: false, text: 'Could not send the reset email. Please try again.' };
  }
}
