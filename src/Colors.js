const Colors = [
  '#F08D15',
  '#9ADB1B',
  '#04E08A',
  '#07B7EB',
  '#0B39F0',
  '#CA00F0',
  '#EB0109',
  '#F0C4E2',
];

function getColorForFormula(formula) {
  const idx = formula.charCodeAt(0) - 65;
  if (idx >= 0 && idx < Colors.length) {
    return Colors[idx];
  }
  return '#FFFFFF';
}

export { Colors, getColorForFormula };
