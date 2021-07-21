import { State } from "./State";
import random from "random";

const Shuffle = require('shuffle');
const seedrandom = require('seedrandom');

random.use(seedrandom(Date.now().toString()));

function myRandom() {
  return random.float(0, 1);
}

function generateFormulaCards(gameState) {
  const numPlayers = gameState.players.length;

  const antidote = random.int(0, gameState.numFormulas - 1);
  
  let cards = [];
  for (let i = 0; i < gameState.numFormulas; ++i) {
    if (i !== antidote) {
      const card = String.fromCharCode(65 + i) + 'X';
      cards.push(card);
    }
  }
  for (let i = 0; i < gameState.numSyringes; ++i) {
    cards.push('S' + i.toString());
  }

  let deck = Shuffle.shuffle({deck: cards, random: myRandom});
  let hands = [];
  for (let i = 0; i < gameState.numPlayers; ++i) {
    if (gameState.numPlayers === 3) {
      hands.push(deck.drawRandom(3));
    } else {
      hands.push(deck.drawRandom(2));
    }
  }

  cards = [];
  for (let i = 0; i < gameState.numFormulas; ++i) {
    for (let j = 1; j <= gameState.cardsPerFomula; ++j) {
      const card = String.fromCharCode(65 + i) + j.toString();
      cards.push(card);
    }
  }

  deck = Shuffle.shuffle({deck: cards, random: myRandom});
  for (let i = 0; i < gameState.numPlayers; ++i) {
    hands[i] = hands[i].concat(deck.drawRandom(gameState.numFormulas));
  }

  return hands;
}

function generateGameState(players) {
  const numPlayers = players.length;
  let numFormulas, cardsPerFomula, numSyringes, handSize;
  if (numPlayers === 3) {
    numFormulas = 7;
    cardsPerFomula = 3;
    numSyringes = 3;
    handSize = 10;
  } else if (numPlayers === 4) {
    numFormulas = 7;
    cardsPerFomula = 4;
    numSyringes = 2;
    handSize = 9;
  } else if (numPlayers === 5) {
    numFormulas = 7;
    cardsPerFomula = 5;
    numSyringes = 4;
    handSize = 9;
  } else if (numPlayers === 6) {
    numFormulas = 7;
    cardsPerFomula = 6;
    numSyringes = 6;
    handSize = 9;
  } else if (numPlayers === 7) {
    numFormulas = 8;
    cardsPerFomula = 7;
    numSyringes = 7;
    handSize = 10;
  }
  let gameState = {
    players,
    state: State.TURN_START,
    turnOwnerIndex: 0,
    numStageCardsRequired: 0,
    numFormulas,
    cardsPerFomula,
    numSyringes,
    handSize,
  };
  let hands = generateFormulaCards(gameState);
  players.forEach((player, idx) => {      
    gameState[player] = {
      hand: hands[idx],
      stage: [],
      workstation: [],
    };
  });
  return gameState;
}

export { generateGameState };
