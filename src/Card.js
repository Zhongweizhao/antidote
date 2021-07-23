function isValidCard(card) {
  return card !== "";
}

function isFormulaCard(card) {
  return card.length === 2 && 
    card.charCodeAt(0) >= 65 && card.charCodeAt(0) <= 72 &&
    card.charCodeAt(1) >= 49 && card.charCodeAt(1) <= 55;
}

export { isValidCard, isFormulaCard };
