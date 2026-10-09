import { fireEvent, render, screen } from '@testing-library/react-native';
import { TextField } from './text-field';

describe('TextField password toggle', () => {
  it('hides the text by default and reveals it when the eye is pressed', async () => {
    await render(<TextField label="Password" placeholder="pw" passwordToggle />);

    expect(screen.getByPlaceholderText('pw').props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByLabelText('Show password'));
    expect(screen.getByPlaceholderText('pw').props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByLabelText('Hide password'));
    expect(screen.getByPlaceholderText('pw').props.secureTextEntry).toBe(true);
  });

  it('has no eye button on a normal field', async () => {
    await render(<TextField placeholder="name" />);
    expect(screen.queryByLabelText('Show password')).toBeNull();
  });
});
