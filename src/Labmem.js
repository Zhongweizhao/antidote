/**
 * Lab members
 * 
 * Labmem No.001: 冈部伦太郎
 * Labmem No.004: 牧濑红莉栖
 * Labmem No.003: 桥田至
 * Labmem No.011: 阿万音由季
 * Labmem No.002: 椎名真由理
 * Labmem No.005: 桐生萌郁
 * Labmem No.006: 漆原琉华
 * Labmem No.007: 菲利斯・喵喵
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
  } else if (name === Labmem011.name()) {
    labmem = new Labmem011();
  } else {
    throw new Error("invalid labmem name");
  }
  labmem.setUid(uid);
  return labmem;
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
  static name() { return 'Labmem No.001'; }

  static description() {
    return ```
      <b>Objective:</b> Both you and the player below you drink the antidote.
      <b>If successful:</b> You live! Add the points on the final card of the player below
      you to your score for the round.
      <b>If unsuccessful:</b> You die (either from the toxin or from a broken heart).
    ```;
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
  static name() { return 'Labmem No.004'; }

  static description() {
    return ```
      <b>Objective:</b> Both you and the player above you drink the antidote.
      <b>If successful:</b> You live! Add the points on the final card of the player above 
      you to your score for the round.
      <b>If unsuccessful:</b> You die (either from the toxin or from a broken heart).
    ```;
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
  static name() { return 'Labmem No.003'; }

  static description() {
    return ```
      <b>Objective:</b> The player below you's final card is the antidote.
      <b>If successful:</b> The player below you shares the antidote with
      you to drink and you live! Earn the points on their final card x2.
      <b>If unsuccessful:</b> Drink the formula on their final card. You die!
    ```;
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

class Labmem011 extends Labmem {
  static name() { return 'Labmem No.011'; }

  static description() {
    return ```
      <b>Objective:</b> The player above you's final card is the antidote.
      <b>If successful:</b> The player above you shares the antidote with
      you to drink and you live! Earn the points on their final card x2.
      <b>If unsuccessful:</b> Drink the formula on their final card. You die!
    ```;
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
  static name() { return 'Labmem No.002'; }

  static description() {
    return ```
      <b>Objective:</b> Drink the antidote.
      <b>If successful:</b> You live! Earn an additional 1 point for every other
      player who also drank the antidote.
      <b>If unsuccessful:</b> You die! Lose an additional 1 point for every
      other player who did not drink the antidote.
    ```;
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
  static name() { return 'Labmem No.005'; }

  static description() {
    return ```
      <b>Objective:</b> Drink the antidote.
      <b>If successful:</b> You live! Earn an additional 1 point for every other
      player who did not drink the antidote.
      <b>If unsuccessful:</b> You die. Lose an additional 1 point for every
      other player who drank the antidote.
    ```;
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
  static name() { return 'Labmem No.006'; }

  static description() {
    return ```
      <b>Objective:</b> You and at least one other player drink the antidote.
      <b>If successful:</b> You live! If only one other player also lives, gain
      +1 point per player in the game.
      <b>If unsuccessful:</b> You die! (Either from the toxin or from shame &
      remorse).
    ```;
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
  static name() { return 'Labmem No.007'; }

  static description() {
    return ```
      <b>Objective:</b> The antidote is in your workstation at game end.
      <b>If successful:</b> Drink the antidote in your workstation and live!
      Gain +1 point for every other player who drank the same formula as the
      last card in your hand.
      <b>If unsuccessful:</b> Drink the formula card in your workstation that
      gives you the highest sore. You die!
    ```;
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

    gameState[this.uid].workstation.forEach(card => {
      if (card.charCodeAt(0) - 65 === gameState.antidote) {
        myPoint = Math.max(myPoint, card.charCodeAt(1) - 48);
        formulaDrank = card.charCodeAt(0) - 65;
      } else if (isFormulaCard(card)) {
        myPoint = Math.max(myPoint, card.charCodeAt(1) - 48);
        formulaDrank = card.charCodeAt(0) - 65;
      }
    });

    return formulaDrank;
  }
}

export { getLabmem };
