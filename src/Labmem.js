/**
 * Lab members
 * 
 * Lab Member No.001: 冈部伦太郎
 * Lab Member No.004: 牧濑红莉栖
 * Lab Member No.003: 桥田至
 * Lab Member No.008: 阿万音铃羽
 * Lab Member No.002: 椎名真由理
 * Lab Member No.005: 桐生萌郁
 * Lab Member No.006: 漆原琉华
 * Lab Member No.007: 菲利斯・喵喵
 * 
 */

import { isFormulaCard } from "./Card";

function getLabmem(name, uid) {
  let labmem;
  if (name === Labmem001.name()) {
    labmem = new Labmem001();
  } else if (name === Labmem002.name()) {
    labmem = new Labmem002();
  } else if (name === Labmem003.name()) {
    labmem = new Labmem003();
  } else if (name === Labmem004.name()) {
    labmem = new Labmem004();
  } else if (name === Labmem005.name()) {
    labmem = new Labmem005();
  } else if (name === Labmem006.name()) {
    labmem = new Labmem006();
  } else if (name === Labmem007.name()) {
    labmem = new Labmem007();
  } else if (name === Labmem008.name()) {
    labmem = new Labmem008();
  } else {
    throw new Error("invalid labmem name");
  }
  labmem.setUid(uid);
  return labmem;
}

function getAllLabmem() {
  return [
    Labmem001.name(),
    Labmem002.name(),
    Labmem003.name(),
    Labmem004.name(),
    Labmem005.name(),
    Labmem006.name(),
    Labmem007.name(),
    Labmem008.name(),
  ];
}

class Labmem {
  setUid(uid) { this.uid = uid; }

  formulaDrank(gameState) {
    let lastcard = gameState[this.uid].hand[0];
    return lastcard.charCodeAt(0) - 65;
  }

  // Most Labmems drink the formula in their hand.
  isDrinkingAntidote(gameState) {
    return this.formulaDrank(gameState) === gameState.antidote;
  }

  getNextPlayerId(gameState) {
    const myIndex = gameState.players.indexOf(this.uid);
    if (myIndex < 0) throw new Error("Invalid player id");
    const nextPlayer = gameState.players[(myIndex + 1) % gameState.players.length];
    return nextPlayer;
  }

  getPreviousPlayerId(gameState) {
    const myIndex = gameState.players.indexOf(this.uid);
    if (myIndex < 0) throw new Error("Invalid player id");
    const previousPlayer = gameState.players[
      (myIndex + gameState.players.length - 1) % gameState.players.length];
    return previousPlayer;
  }
}

class Labmem001 extends Labmem {
  static name() { return 'Lab Member No.001'; }
  static id() { return 1; }

  static description() {
    return `
      <p><b>Objective:</b> Both you and the player below you drink the antidote.</p>
      <p><b>If successful:</b> You live! Add the points on the final card of the player below
      you to your score for the round.</p>
      <p><b>If unsuccessful:</b> You die (either from the toxin or from a broken heart).</p>
    `;
  }

  calculateScore(gameState) {
    const nextPlayer = this.getNextPlayerId(gameState);

    let lastcard = gameState[this.uid].hand[0];
    let formula = lastcard.charCodeAt(0) - 65;
    const myPoint = isFormulaCard(lastcard) ? lastcard.charCodeAt(1) - 48 : 1;
    if (formula !== gameState.antidote) {
      return -myPoint;
    }

    lastcard = gameState[nextPlayer].hand[0];
    formula = lastcard.charCodeAt(0) - 65;
    const nextPlayerPoint = isFormulaCard(lastcard) ? lastcard.charCodeAt(1) - 48 : 1;
    if (formula !== gameState.antidote) {
      return -myPoint;
    }
    return myPoint + nextPlayerPoint;
  }
}

class Labmem004 extends Labmem {
  static name() { return 'Lab Member No.004'; }
  static id() { return 4; }

  static description() {
    return `
      <p><b>Objective:</b> Both you and the player above you drink the antidote.</p>
      <p><b>If successful:</b> You live! Add the points on the final card of the player above 
      you to your score for the round.</p>
      <p><b>If unsuccessful:</b> You die (either from the toxin or from a broken heart).</p>
    `;
  }

  calculateScore(gameState) {
    const previousPlayer = this.getPreviousPlayerId(gameState);

    let lastcard = gameState[this.uid].hand[0];
    let formula = lastcard.charCodeAt(0) - 65;
    const myPoint = isFormulaCard(lastcard) ? lastcard.charCodeAt(1) - 48 : 1;
    if (formula !== gameState.antidote) {
      return -myPoint;
    }

    lastcard = gameState[previousPlayer].hand[0];
    formula = lastcard.charCodeAt(0) - 65;
    const previousPlayerPoint = isFormulaCard(lastcard) ? lastcard.charCodeAt(1) - 48 : 1;
    if (formula !== gameState.antidote) {
      return -myPoint;
    }
    return myPoint + previousPlayerPoint;
  }
}

class Labmem003 extends Labmem {
  static name() { return 'Lab Member No.003'; }
  static id() { return 3; }

  static description() {
    return `
      <p><b>Objective:</b> The player below you's final card is the antidote.</p>
      <p><b>If successful:</b> The player below you shares the antidote with
      you to drink and you live! Earn the points on their final card x2.</p>
      <p><b>If unsuccessful:</b> Drink the formula on their final card. You die!</p>
    `;
  }

  calculateScore(gameState) {
    const nextPlayer = this.getNextPlayerId(gameState);

    const lastcard = gameState[nextPlayer].hand[0];
    const formula = lastcard.charCodeAt(0) - 65;
    const nextPlayerPoint = isFormulaCard(lastcard) ? lastcard.charCodeAt(1) - 48 : 1;
    if (formula !== gameState.antidote) {
      return -nextPlayerPoint;
    }
    return 2 * nextPlayerPoint;
  }

  formulaDrank(gameState) {
    const nextPlayer = this.getNextPlayerId(gameState);

    const lastcard = gameState[nextPlayer].hand[0];
    return lastcard.charCodeAt(0) - 65;
  }
}

class Labmem008 extends Labmem {
  static name() { return 'Lab Member No.008'; }
  static id() { return 8; }

  static description() {
    return `
      <p><b>Objective:</b> The player above you's final card is the antidote.</p>
      <p><b>If successful:</b> The player above you shares the antidote with
      you to drink and you live! Earn the points on their final card x2.</p>
      <p><b>If unsuccessful:</b> Drink the formula on their final card. You die!</p>
    `;
  }

  calculateScore(gameState) {
    const previousPlayer = this.getPreviousPlayerId(gameState);

    const lastcard = gameState[previousPlayer].hand[0];
    const formula = lastcard.charCodeAt(0) - 65;
    const previousPlayerPoint = isFormulaCard(lastcard) ? lastcard.charCodeAt(1) - 48 : 1;
    if (formula !== gameState.antidote) {
      return -previousPlayerPoint;
    }
    return 2 * previousPlayerPoint;
  }

  formulaDrank(gameState) {
    const previousPlayer = this.getPreviousPlayerId(gameState);

    const lastcard = gameState[previousPlayer].hand[0];
    return lastcard.charCodeAt(0) - 65;
  }
}

class Labmem002 extends Labmem {
  static name() { return 'Lab Member No.002'; }
  static id() { return 2; }

  static description() {
    return `
      <p><b>Objective:</b> Drink the antidote.</p>
      <p><b>If successful:</b> You live! Earn an additional 1 point for every other
      player who also drank the antidote.</p>
      <p><b>If unsuccessful:</b> You die! Lose an additional 1 point for every
      other player who did not drink the antidote.</p>
    `;
  }

  calculateScore(gameState) {
    let lastcard = gameState[this.uid].hand[0];
    let formula = lastcard.charCodeAt(0) - 65;
    let myPoint = isFormulaCard(lastcard) ? lastcard.charCodeAt(1) - 48 : 1;
    let success = true;
    if (formula !== gameState.antidote) {
      success = false;
      myPoint *= -1;
    }

    gameState.players.forEach(player => {
      if (player === this.uid) return;
      if (gameState[player].labmem) {
        const labmem = getLabmem(gameState[player].labmem, player);
        if (labmem.isDrinkingAntidote(gameState)) {
          if (success) myPoint += 1;
        } else {
          if (!success) myPoint -= 1;
        }
      } else {
        const drank = gameState[player].hand[0].charCodeAt(0) - 65;
        if (drank === gameState.antidote) {
          if (success) myPoint += 1;
        } else {
          if (!success) myPoint -= 1;
        }
      }
    });

    return myPoint;
  }
}

class Labmem005 extends Labmem {
  static name() { return 'Lab Member No.005'; }
  static id() { return 5; }

  static description() {
    return `
      <p><b>Objective:</b> Drink the antidote.</p>
      <p><b>If successful:</b> You live! Earn an additional 1 point for every other
      player who did not drink the antidote.</p>
      <p><b>If unsuccessful:</b> You die. Lose an additional 1 point for every
      other player who drank the antidote.</p>
    `;
  }

  calculateScore(gameState) {
    let lastcard = gameState[this.uid].hand[0];
    let formula = lastcard.charCodeAt(0) - 65;
    let myPoint = isFormulaCard(lastcard) ? lastcard.charCodeAt(1) - 48 : 1;
    let success = true;
    if (formula !== gameState.antidote) {
      success = false;
      myPoint *= -1;
    }

    gameState.players.forEach(player => {
      if (player === this.uid) return;
      if (gameState[player].labmem) {
        const labmem = getLabmem(gameState[player].labmem, player);
        if (!labmem.isDrinkingAntidote(gameState)) {
          if (success) myPoint += 1;
        } else {
          if (!success) myPoint -= 1;
        }
      } else {
        const drank = gameState[player].hand[0].charCodeAt(0) - 65;
        if (drank !== gameState.antidote) {
          if (success) myPoint += 1;
        } else {
          if (!success) myPoint -= 1;
        }
      }
    });

    return myPoint;
  }
}

class Labmem006 extends Labmem {
  static name() { return 'Lab Member No.006'; }
  static id() { return 6; }

  static description() {
    return `
      <p><b>Objective:</b> You and at least one other player drink the antidote.</p>
      <p><b>If successful:</b> You live! If only one other player also lives, gain
      +1 point per player in the game.</p>
      <p><b>If unsuccessful:</b> You die! (Either from the toxin or from shame &
      remorse).</p>
    `;
  }

  calculateScore(gameState) {
    let lastcard = gameState[this.uid].hand[0];
    let formula = lastcard.charCodeAt(0) - 65;
    let myPoint = isFormulaCard(lastcard) ? lastcard.charCodeAt(1) - 48 : 1;
    if (formula !== gameState.antidote) {
      return -myPoint;
    }

    let numPlayersDrinkingAntidote = 0;

    gameState.players.forEach(player => {
      if (gameState[player].labmem) {
        const labmem = getLabmem(gameState[player].labmem, player);
        if (labmem.isDrinkingAntidote(gameState)) {
          numPlayersDrinkingAntidote += 1;
        }
      } else {
        const drank = gameState[player].hand[0].charCodeAt(0) - 65;
        if (drank === gameState.antidote) {
          numPlayersDrinkingAntidote += 1;
        }
      }
    });
    if (numPlayersDrinkingAntidote === 2) {
      myPoint += gameState.players.length;
    }
    return myPoint;
  }
}

class Labmem007 extends Labmem {
  static name() { return 'Lab Member No.007'; }
  static id() { return 7; }

  static description() {
    return `
      <p><b>Objective:</b> The antidote is in your workstation at game end.</p>
      <p><b>If successful:</b> Drink the antidote in your workstation and live!
      Gain +1 point for every other player who drank the same formula as the
      last card in your hand.</p>
      <p><b>If unsuccessful:</b> Drink the formula card in your workstation that
      gives you the highest sore. You die!</p>
    `;
  }

  calculateScore(gameState) {
    let lastcard = gameState[this.uid].hand[0];
    let myFormula = lastcard.charCodeAt(0) - 65;
    let success = false;
    let myPoint = -100;

    gameState[this.uid].workstation.forEach(card => {
      if (card.charCodeAt(0) - 65 === gameState.antidote) {
        success = true;
        myPoint = Math.max(myPoint, card.charCodeAt(1) - 48);
      } else if (isFormulaCard(card)) {
        myPoint = Math.max(myPoint, -(card.charCodeAt(1) - 48));
      }
    });

    if (!success) {
      return myPoint;
    }
    let numPlayersDrinkingMyFormula = 0;
    gameState.players.forEach(player => {
      if (player === this.uid) return;
      if (gameState[player].labmem) {
        const labmem = getLabmem(gameState[player].labmem, player);
        if (labmem.formulaDrank(gameState) === myFormula) {
          numPlayersDrinkingMyFormula += 1;
        }
      } else {
        const drank = gameState[player].hand[0].charCodeAt(0) - 65;
        if (drank === myFormula) {
          numPlayersDrinkingMyFormula += 1;
        }
      }
    });
    return myPoint + numPlayersDrinkingMyFormula;
  }

  formulaDrank(gameState) {
    let myPoint = -100;
    let formulaDrank;

    for (let i = 0; i < gameState[this.uid].workstation.length; ++i) {
      let card = gameState[this.uid].workstation[i];
      if (card.charCodeAt(0) - 65 === gameState.antidote) {
        return gameState.antidote;
      } else if (isFormulaCard(card)) {
        myPoint = Math.max(myPoint, card.charCodeAt(1) - 48);
        formulaDrank = card.charCodeAt(0) - 65;
      }
    }

    return formulaDrank;
  }
}

export { getLabmem, getAllLabmem };
