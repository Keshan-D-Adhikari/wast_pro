import { ReactNode } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';

type CardProps = {
  children: ReactNode;
  /** 1 = resting (default), 2 = raised, 0 = flat with a hairline border. */
  elevation?: 0 | 1 | 2;
  /** Tint the surface — used for summary/callout cards. */
  tone?: 'surface' | 'brand';
  style?: StyleProp<ViewStyle>;
};

/** The standard white rounded container used for almost all content blocks. */
export function Card({ children, elevation = 1, tone = 'surface', style }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        tone === 'brand' && styles.brandCard,
        elevation === 0 ? styles.flat : Shadow[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}

type SectionTitleProps = {
  children: ReactNode;
  /** Small muted text on the right, e.g. a count or "3 available". */
  meta?: string;
  /** Reduce the top margin when the section follows another closely. */
  tight?: boolean;
};

/** Heading that introduces a group of cards. */
export function SectionTitle({ children, meta, tight = false }: SectionTitleProps) {
  return (
    <View style={[styles.sectionRow, tight && styles.sectionTight]}>
      <Text style={Type.h3}>{children}</Text>
      {!!meta && <Text style={Type.small}>{meta}</Text>}
    </View>
  );
}

/** Thin horizontal rule for splitting content inside a card. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/** Label/value row — used in order summaries and receipts. */
export function DetailRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={emphasis ? Type.bodyStrong : Type.small} numberOfLines={1}>
        {label}
      </Text>
      <Text style={emphasis ? styles.detailValueStrong : Type.smallStrong}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Space.lg,
  },
  brandCard: {
    backgroundColor: Palette.brand[50],
    borderWidth: 1,
    borderColor: Palette.brand[200],
  },
  flat: {
    borderWidth: 1,
    borderColor: Palette.ink[200],
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: Space['2xl'],
    marginBottom: Space.md,
  },
  sectionTight: { marginTop: Space.lg },
  divider: {
    height: 1,
    backgroundColor: Palette.ink[100],
    marginVertical: Space.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Space.md,
    marginBottom: Space.sm,
  },
  detailValueStrong: { ...Type.bodyStrong, color: Palette.brand[600] },
});
