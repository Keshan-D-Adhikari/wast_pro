// A ring chart showing how much of each waste type is in the bin, with a legend below.
// Used on the seller dashboard. The slice maths lives in utils/donut.ts.

import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Palette, Space } from '@/constants/design';
import { donutSlices, formatKg } from '../../utils/donut';

// One slice: its name, its value (kg) and its colour.
export type DonutItem = { label: string; value: number; color: string };

// items = the slices, unit = text after numbers (kg), centerLabel = small text in the middle,
// emptyLabel = text shown when every value is zero.
type Props = {
  items: DonutItem[];
  unit?: string;
  centerLabel?: string;
  emptyLabel?: string;
};

// Thickness of the ring in pixels.
const STROKE = 22;

// How it works: we draw a grey full circle, then a coloured circle per slice on top.
// Each coloured circle only draws part of its outline (see utils/donut.ts).
/** Donut ring with the total in the middle and a legend row per item underneath. */
export function DonutChart({ items, unit = 'kg', centerLabel = 'Total in bin', emptyLabel = 'Bin is empty' }: Props) {
  // Phone width, so the ring can shrink on small screens.
  const { width } = useWindowDimensions();
  // Ring size: between 140 and 220 px, leaving room for the screen paddings.
  const size = Math.max(140, Math.min(220, width - Space.xl * 2 - Space.lg * 2 - 40));
  // The stroke is centred on the circle edge, so subtract the thickness to stay inside the box.
  const radius = (size - STROKE) / 2;
  // Length of the circle outline = 2 * PI * radius.
  const circumference = 2 * Math.PI * radius;
  // Work out the arc of each slice. STROKE + 4 is the gap, big enough for the round line ends.
  const slices = donutSlices(items.map((i) => i.value), circumference, STROKE + 4);
  // Sum of all values, shown in the middle.
  const total = slices.reduce((a, s) => a + s.value, 0);
  // True when the bin has nothing in it.
  const isEmpty = total <= 0;

  return (
    // accessibilityLabel is read aloud by screen readers, since a drawing has no text
    <View accessible accessibilityLabel={isEmpty ? emptyLabel : `${formatKg(total)} ${unit} total. ${items.map((i, n) => `${i.label} ${slices[n].percent} percent`).join(', ')}`}>
      {/* The ring and the centre text are stacked on top of each other */}
      <View style={[styles.ringWrap, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Grey background ring (the track) */}
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Palette.ink[100]} strokeWidth={STROKE} fill="none" />
          {/* One coloured arc per slice. dasharray = [arc length, rest of the circle],
              dashoffset moves the arc to where this slice starts. rotation -90 starts at the top. */}
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
        {/* Total weight in the middle of the ring, or the empty message */}
        <View style={styles.center} pointerEvents="none">
          {isEmpty ? (
            <Text style={styles.emptyText}>{emptyLabel}</Text>
          ) : (
            <>
              <Text style={styles.total}>{formatKg(total)} {unit}</Text>
              <Text style={styles.caption}>{centerLabel}</Text>
            </>
          )}
        </View>
      </View>

      {/* Legend: a colour dot, name, weight and percent for each item */}
      <View style={styles.legend}>
        {items.map((item, n) => (
          <View key={item.label} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{formatKg(item.value)} {unit}</Text>
            <Text style={styles.rowPercent}>{slices[n].percent}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ringWrap/svg/center = the ring area, total/caption/emptyText = middle text, legend rows below.
const styles = StyleSheet.create({
  ringWrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  center: { alignItems: 'center', paddingHorizontal: Space.md },
  total: { fontSize: 30, fontWeight: '800', color: Palette.ink[900] },
  caption: { fontSize: 14, color: Palette.ink[500], marginTop: 2 },
  emptyText: { fontSize: 17, fontWeight: '600', color: Palette.ink[500], textAlign: 'center' },
  legend: { marginTop: Space.lg, gap: Space.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: Space.sm },
  rowLabel: { flex: 1, fontSize: 17, color: Palette.ink[900], fontWeight: '600' },
  rowValue: { fontSize: 17, color: Palette.ink[700], marginRight: Space.md },
  rowPercent: { width: 54, textAlign: 'right', fontSize: 17, color: Palette.ink[500] },
});
