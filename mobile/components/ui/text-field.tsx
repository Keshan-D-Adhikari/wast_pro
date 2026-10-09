import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Space, Radius, Type } from '@/constants/design';

type TextFieldProps = TextInputProps & {
  /** Label shown above the input. */
  label?: string;
  /** Leading Ionicons name. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Static text pinned to the right, e.g. a "kg" unit. */
  suffix?: string;
  /** Red border + message below the field. */
  error?: string;
  /** Adds a show/hide eye button and makes the field a password field. */
  passwordToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

/** Labelled text input with consistent height, radius and focus colours. */
export function TextField({
  label,
  icon,
  suffix,
  error,
  passwordToggle = false,
  containerStyle,
  style,
  ...inputProps
}: TextFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {!!label && <Text style={[Type.caption, styles.label]}>{label}</Text>}
      <View style={[styles.field, !!error && styles.fieldError]}>
        {!!icon && <Ionicons name={icon} size={18} color={Palette.brand[600]} />}
        <TextInput
          placeholderTextColor={Palette.ink[300]}
          style={[styles.input, style]}
          {...inputProps}
          secureTextEntry={passwordToggle ? !passwordVisible : inputProps.secureTextEntry}
        />
        {passwordToggle && (
          <TouchableOpacity
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Palette.ink[500]}
            />
          </TouchableOpacity>
        )}
        {!!suffix && <Text style={Type.smallStrong}>{suffix}</Text>}
      </View>
      {!!error && <Text style={[Type.caption, styles.errorText]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Space.lg },
  label: { marginBottom: Space.sm, textTransform: 'uppercase', letterSpacing: 0.4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    height: 52,
    paddingHorizontal: Space.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.ink[200],
    backgroundColor: Palette.surface,
  },
  fieldError: { borderColor: Palette.status.danger.base },
  input: { flex: 1, ...Type.body, color: Palette.ink[900], paddingVertical: 0 },
  errorText: { marginTop: Space.xs, color: Palette.status.danger.base },
});
