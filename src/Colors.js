const ColorBlindColors = [
  '#F08D15',
  '#9ADB1B',
  '#04E08A',
  '#07B7EB',
  '#0B39F0',
  '#CA00F0',
  '#EB0109',
  '#F0C4E2',
];

const Colors = [
  '#3F6CB0',
  '#09B0A9',
  '#D72A26',
  '#377E4E',
  '#8B60A8',
  '#CA59A1',
  '#79BA42',
  '#DE6E25',
];

function getColorForFormula(formula, colorBlindOn) {
  const idx = formula.charCodeAt(0) - 65;
  if (idx >= 0 && idx < Colors.length) {
    return colorBlindOn ? ColorBlindColors[idx] : Colors[idx];
  }
  return '#FFFFFF';
}

export { Colors, getColorForFormula };
