function isValidCard(card) {
  return card !== "";
}

function isFormulaCard(card) {
  return card.length === 2 && 
    card.charCodeAt(0) >= 65 && card.charCodeAt(0) <= 72 &&
    card.charCodeAt(1) >= 49 && card.charCodeAt(1) <= 55;
}

function isToxinCard(card) {
  return card.length === 2 && 
    card.charCodeAt(0) >= 65 && card.charCodeAt(0) <= 72 &&
    card[1] === 'X';
}

function isSyringeCard(card) {
  return card.length === 2 && card[0] === 'S';
}

function shouldFaceDownInWorkstation(card) {
  return card.length === 2 && card[1] === 'X';
}

export { isValidCard, isFormulaCard, isSyringeCard, shouldFaceDownInWorkstation, isToxinCard };
