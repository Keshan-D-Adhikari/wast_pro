import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Palette, Space } from '@/constants/design';
import { donutSlices } from '../../utils/donut';

export type DonutItem = { label: string; value: number; color: string };

type Props = {
  items: DonutItem[];
  unit?: string;
  centerLabel?: string;
  emptyLabel?: string;
};

const STROKE = 22;

/** Donut ring with the total in the middle and a legend row per item underneath. */
export function DonutChart({ items, unit = 'kg', centerLabel = 'Total in bin', emptyLabel = 'Bin is empty' }: Props) {
  const { width } = useWindowDimensions();
  const size = Math.max(140, Math.min(220, width - Space.xl * 2 - Space.lg * 2 - 40));
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const slices = donutSlices(items.map((i) => i.value), circumference, STROKE + 4);
  const total = slices.reduce((a, s) => a + s.value, 0);
  const isEmpty = total <= 0;

  return (
    <View accessible accessibilityLabel={isEmpty ? emptyLabel : `${total.toFixed(1)} ${unit} total. ${items.map((i, n) => `${i.label} ${slices[n].percent} percent`).join(', ')}`}>
      <View style={[styles.ringWrap, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Palette.ink[100]} strokeWidth={STROKE} fill="none" />
          {!isEmpty &&
            slices.map((s, n) =>
              s.dash > 0 ? (
                <Circle
                  key={items[n].label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={items[n].color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${s.dash} ${circumference}`}
                  strokeDashoffset={-s.offset}
                  rotation={-90}
                  origin={`${size / 2}, ${size / 2}`}
                />
              ) : null
            )}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          {isEmpty ? (
            <Text style={styles.emptyText}>{emptyLabel}</Text>
          ) : (
            <>
              <Text style={styles.total}>{total.toFixed(1)} {unit}</Text>
              <Text style={styles.caption}>{centerLabel}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.legend}>
        {items.map((item, n) => (
          <View key={item.label} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value > 0 ? item.value.toFixed(1) : '0'} {unit}</Text>
            <Text style={styles.rowPercent}>{slices[n].percent}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringWrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  center: { alignItems: 'center', paddingHorizontal: Space.md },
  total: { fontSize: 26, fontWeight: '800', color: Palette.ink[900] },
  caption: { fontSize: 12, color: Palette.ink[500], marginTop: 2 },
  emptyText: { fontSize: 14, fontWeight: '600', color: Palette.ink[500], textAlign: 'center' },
  legend: { marginTop: Space.lg, gap: Space.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: Space.sm },
  rowLabel: { flex: 1, fontSize: 14, color: Palette.ink[900], fontWeight: '600' },
  rowValue: { fontSize: 14, color: Palette.ink[700], marginRight: Space.md },
  rowPercent: { width: 44, textAlign: 'right', fontSize: 14, color: Palette.ink[500] },
});
