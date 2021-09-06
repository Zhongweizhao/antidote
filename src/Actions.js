import { useContext, useState } from "react";
import { isFormulaCard, isSyringeCard, isValidCard, shouldFaceDownInWorkstation } from "./Card";
import { auth, firestore } from "./Firebase";
import { randInt } from "./GameState";
import { addLog } from "./Logs";
import { RoomContext } from "./RoomContext";
import { State } from "./State";

const buttonClass = 'f6 link bn pointer br3 ma1 bw1 ph3 pv2 dib white bg-dark-blue';

function _checkGameOver(gameState, logs) {
  let p = gameState.players[0];
  if (gameState[p].hand.length + gameState[p].stage.length > 1) return;

  gameState.state = State.GAME_OVER;
  logs.push('Game over!');

  gameState.players.forEach(player => {
    const lastCard = gameState[player].hand[0];
    const formula = lastCard.charCodeAt(0) - 65;
    let point = isFormulaCard(lastCard) ? lastCard.charCodeAt(1) - 48 : 1;
    const matchesAntidote = formula === gameState.antidote;
    gameState[player].point += matchesAntidote ? point : -point;
  });
  return;
}

function _canDiscard(uid) {
  const { room } = useContext(RoomContext);
  const { gameState } = room;
  const turnOwner = gameState.players[gameState.turnOwnerIndex];

  // If uid has less or equal to one card, uid cannot use anything.
  if (gameState[uid].hand.length <= 1) {
    return false;
  }
  // If it is uid's turn and the turn just started, then uid can start discard.
  if (turnOwner === uid) {
    return gameState.state === State.TURN_START;
  }
  // It is not uid's turn, can discard if other started the discard, and uid
  // hasn't discarded enough cards.
  return gameState.state === State.DISCARD &&
    gameState[uid].stage.length < gameState.numStageCardsRequired;
}

function _canStartTrade(uid) {
  const { room } = useContext(RoomContext);
  const { gameState } = room;
  const turnOwner = gameState.players[gameState.turnOwnerIndex];

  // If uid has less or equal to one card, uid cannot use anything.
  if (gameState[uid].hand.length <= 1) {
    return false;
  }
  // If it is uid's turn and the turn just started, then uid can start trade.
  if (turnOwner === uid) {
    return gameState.state === State.TURN_START;
  }
  // If it is not uid's turn, can trade only if other started the trade, and uid
  // hasn't make any decision yet.
  return gameState.state === State.TRADE_START &&
    gameState[uid].stage.length < gameState.numStageCardsRequired;
}

function _canDenyTrade(uid) {
  const { room } = useContext(RoomContext);
  const { gameState } = room;
  const turnOwner = gameState.players[gameState.turnOwnerIndex];

  // If uid has less or equal to one card, uid cannot use anything.
  if (gameState[uid].hand.length <= 1) {
    return false;
  }
  // If it is not uid's turn and a trade has been initiated, then uid can deny trade.
  if (turnOwner !== uid) {
    return gameState.state === State.TRADE_START &&
      gameState[uid].stage.length < gameState.numStageCardsRequired;
  }
  return false;
}

function _canPickTrade(uid) {
  const { room } = useContext(RoomContext);
  const { gameState } = room;
  const turnOwner = gameState.players[gameState.turnOwnerIndex];

  // Only the turn owner can pick trade during TRADE_PICK state.
  return turnOwner === uid &&
    gameState.state === State.TRADE_PICK;
}

function _canPassLeft(uid) {
  const { room } = useContext(RoomContext);
  const { gameState } = room;
  const turnOwner = gameState.players[gameState.turnOwnerIndex];

  // If uid has less or equal to one card, uid cannot use anything.
  if (gameState[uid].hand.length <= 1) {
    return false;
  }
  // If it is uid's turn and the turn just started, then uid can start passing.
  if (turnOwner === uid) {
    return gameState.state === State.TURN_START;
  }
  // It is not uid's turn, can pass if other started the pass, and uid
  // hasn't pass enough cards.
  return gameState.state === State.PASS_LEFT &&
    gameState[uid].stage.length < gameState.numStageCardsRequired;
}

function _canPassRight(uid) {
  const { room } = useContext(RoomContext);
  const { gameState } = room;
  const turnOwner = gameState.players[gameState.turnOwnerIndex];

  // If uid has less or equal to one card, uid cannot use anything.
  if (gameState[uid].hand.length <= 1) {
    return false;
  }
  // If it is uid's turn and the turn just started, then uid can start passing.
  if (turnOwner === uid) {
    return gameState.state === State.TURN_START;
  }
  // It is not uid's turn, can pass if other started the pass, and uid
  // hasn't pass enough cards.
  return gameState.state === State.PASS_RIGHT &&
    gameState[uid].stage.length < gameState.numStageCardsRequired;
}

function _canUseSyringe(uid) {
  const { room } = useContext(RoomContext);
  const { gameState } = room;
  const turnOwner = gameState.players[gameState.turnOwnerIndex];

  // If uid has less or equal to one card, uid cannot use anything.
  if (gameState[uid].hand.length <= 1) {
    return false;
  }
  let hasSyringeCard = false;
  gameState[uid].hand.forEach(card => { if (isSyringeCard(card)) hasSyringeCard = true; });
  if (!hasSyringeCard) return false;
  // If it is uid's turn and the turn just started, then uid can start picking card.
  if (turnOwner === uid) {
    return gameState.state === State.TURN_START;
  }
  // It is not uid's turn, can't use syringe.
  return false;
}

function _canPickSyringe(uid) {
  const { room } = useContext(RoomContext);
  const { gameState } = room;
  const turnOwner = gameState.players[gameState.turnOwnerIndex];

  return turnOwner === uid && gameState.state === State.PICK_SYRINGE;
}

function needsAttention(uid) {
  return _canDiscard(uid)
    || _canStartTrade(uid)
    || _canDenyTrade(uid)
    || _canPickTrade(uid)
    || _canPassLeft(uid)
    || _canPassRight(uid)
    || _canUseSyringe(uid)
    || _canPickSyringe(uid);
}

function Actions(props) {
  const { selectedCard, selectCard } = props;
  const { uid } = auth.currentUser;
  const [error, setError] = useState('');

  return (
    <div>
      <div className='flex'>
        {_canDiscard(uid) && <Discard card={selectedCard} selectCard={selectCard} setError={setError} />}
        {_canStartTrade(uid) && <StartTrade card={selectedCard} selectCard={selectCard} setError={setError} />}
        {_canDenyTrade(uid) && <DenyTrade card={selectedCard} selectCard={selectCard} setError={setError} />}
        {_canPickTrade(uid) && <PickTrade card={selectedCard} selectCard={selectCard} setError={setError} />}
        {_canPassLeft(uid) && <Pass direction='left' card={selectedCard} selectCard={selectCard} setError={setError} />}
        {_canPassRight(uid) && <Pass direction='right' card={selectedCard} selectCard={selectCard} setError={setError} />}
        {_canUseSyringe(uid) && <UseSyringe card={selectedCard} selectCard={selectCard} setError={setError} />}
        {_canPickSyringe(uid) && <PickSyringe card={selectedCard} selectCard={selectCard} setError={setError} />}
      </div>
      {error}
    </div>
  )
}

// Returns the new gamestate when `uid` discard `card`.
function _handleDiscard(gameState, uid, card) {
  const index = gameState[uid].hand.indexOf(card);
  if (index === -1) {
    throw new Error(`Invalid card ${card}.`);
  }

  gameState[uid].hand.splice(index, 1);
  gameState[uid].stage.push(card);

  let logs = [];

  if (uid === gameState.players[gameState.turnOwnerIndex]) {
    logs.push(`${uid}: everyone pick a card to discard.`);
    gameState.state = State.DISCARD;
    gameState.numStageCardsRequired = 1;
  } else {
    let everyoneDiscarded = true;
    gameState.players.forEach(player => {
      if (gameState[player].stage.length < gameState.numStageCardsRequired) {
        everyoneDiscarded = false;
      }
    });
    if (everyoneDiscarded) {
      gameState.players.forEach(player => {
        let cards = gameState[player].stage.map(card => {
          // hide cards that should face down
          if (shouldFaceDownInWorkstation(card)) return '**';
          return card;
        }).join(', ');
        logs.push(`${player} discarded ${cards}.`);
        gameState[player].workstation =
          gameState[player].workstation.concat(gameState[player].stage);
        gameState[player].stage = [];
      });
      gameState.state = State.TURN_START;
      gameState.turnOwnerIndex = (gameState.turnOwnerIndex + 1) % gameState.players.length;
      gameState.numStageCardsRequired = 0;
    }
  }

  _checkGameOver(gameState, logs);
  return {
    newGameState: gameState,
    logs
  };
}

function Discard(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let newGameState, logs;
      await firestore.runTransaction(async transaction => {
        let roomRef = firestore.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists) {
          throw new Error("Document does not exists.");
        }

        ({ newGameState, logs } = _handleDiscard(gameState, uid, card));
        transaction.update(roomRef, { 'gameState': newGameState });
      });
      logs.forEach(log => {
        addLog(roomId, room, log);
      });
      selectCard('');
      setError('');
    } catch (err) {
      setError(err.toString());
    }
  } 

  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleSubmit}>Discard</button>
      </div>
    </div>
  )
}

// Handle gamestate when `uid` want to trade `card`.
function _handleStartTrade(gameState, uid, card, isDeny) {
  const turnOwner = gameState.players[gameState.turnOwnerIndex];
  let logs = [];

  if (isDeny) {
    if (gameState.state !== State.TRADE_START) {
      throw new Error('No trade to deny');
    }
    gameState[uid].stage.forEach(card => {
      console.assert(isValidCard(card));
    });
    gameState[uid].hand = gameState[uid].hand.concat(gameState[uid].stage);
    // Push an invalid card to represent deny.
    for (let i = 0; i < gameState.numStageCardsRequired; ++i) {
      gameState[uid].stage.push('');
    }
  } else {
    const index = gameState[uid].hand.indexOf(card);
    if (index === -1) {
      throw new Error('Invalid card.');
    }
    gameState[uid].hand.splice(index, 1);
    gameState[uid].stage.push(card);
  }

  if (uid === turnOwner) {
    logs.push(`${uid}: someone trade card with me.`);
    gameState.state = State.TRADE_START;
    gameState.numStageCardsRequired = 1;
  } else {
    if (isDeny) {
      logs.push(`${uid}: I don't want to trade with you.`);
    } else {
      logs.push(`${uid}: I am willing to trade with you.`);
    }
    let everyoneResponded = true;
    let hasOffer = false;
    gameState.players.forEach(player => {
      if (gameState[player].stage.length < gameState.numStageCardsRequired) {
        everyoneResponded = false;
      }
      // if the first card is valid, then the offer should be valid.
      if (player !== turnOwner && isValidCard(gameState[player].stage[0])) {
        hasOffer = true;
      }
    });
    if (everyoneResponded) {
      gameState.numStageCardsRequired = 0;
      if (hasOffer) {
        logs.push(`${turnOwner}: picking a card to trade.`)
        gameState.state = State.TRADE_PICK;
      } else {
        logs.push(`${turnOwner}: no one wants to trade with me.`)
        gameState.state = State.TURN_START;
        // Everyone have their card back, turn owner unchanged.
        gameState.players.forEach(player => {
          if (isValidCard(gameState[player].stage[0])) {
            gameState[player].hand = gameState[player].hand.concat(
              gameState[player].stage
            );
          }
          gameState[player].stage = []
        });
      }
    }
  }

  _checkGameOver(gameState, logs);
  return {
    newGameState: gameState,
    logs
  };
}

function StartTrade(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  const { gameState } = room;
  const { uid } = auth.currentUser;

  const handleTrade = async (e) => {
    e.preventDefault();

    try {
      let newGameState, logs;
      await firestore.runTransaction(async transaction => {
        let roomRef = firestore.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists) {
          throw new Error("Document does not exists.");
        }

        ({ newGameState, logs } = _handleStartTrade(gameState, uid, card, /* isDeny */ false));
        transaction.update(roomRef, { 'gameState': newGameState });
      });
      logs.forEach(log => {
        addLog(roomId, room, log);
      });
      selectCard('');
      setError('');
    } catch (err) {
      setError(err.toString());
    }
  }

  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleTrade}>Trade</button>
      </div>
    </div>
  )
}

function DenyTrade(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  const { gameState } = room;
  const { uid } = auth.currentUser;

  const handleDeny = async (e) => {
    e.preventDefault();

    try {
      let newGameState, logs;
      await firestore.runTransaction(async transaction => {
        let roomRef = firestore.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists) {
          throw new Error("Document does not exists.");
        }

        ({ newGameState, logs } = _handleStartTrade(gameState, uid, card, /* isDeny */ true));
        transaction.update(roomRef, { 'gameState': newGameState });
      });
      logs.forEach(log => {
        addLog(roomId, room, log);
      });
      selectCard('');
      setError('');
    } catch (err) {
      setError(err.toString());
    }
  }

  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleDeny}>Deny</button>
      </div>
    </div>
  )
}

// Returns the new gamestate when `uid` pick `card` to trade.
function _handlePickTrade(gameState, uid, card) {
  let logs = [];
  let player = '';
  gameState.players.forEach(p => {
    if (gameState[p].stage.includes(card)) {
      player = p;
    }
  });

  if (player === uid) {
    throw new Error('Cannot trade with yourself.');
  }

  if (!gameState.players.includes(player)) {
    throw new Error('Invalid player');
  }
  if (!isValidCard(gameState[player].stage[0])) {
    throw new Error('Player ' + player + ' denied your trade');
  }

  // everyone else have their card back
  gameState.players.forEach(p => {
    if (p !== uid && p !== player) {
      if (isValidCard(gameState[p].stage[0])) {
        gameState[p].hand = gameState[p].hand.concat(gameState[p].stage);
      }
      gameState[p].stage = [];
    }
  });
  logs.push(`${uid}: I am trading with ${player}.`);
  gameState[uid].hand = gameState[uid].hand.concat(gameState[player].stage);
  gameState[player].hand = gameState[player].hand.concat(gameState[uid].stage);
  gameState[uid].stage = [];
  gameState[player].stage = [];
  gameState.turnOwnerIndex = (gameState.turnOwnerIndex + 1) % gameState.players.length;
  gameState.state = State.TURN_START;
  gameState.numStageCardsRequired = 0;

  _checkGameOver(gameState, logs);
  return {
    newGameState: gameState,
    logs
  };
}

// Returns the new gamestate when `uid` don't want to trade anymore.
function _handlePickTradeCancel(gameState, uid) {
  let logs = [];
  logs.push(`${uid}: I don't want to trade any more.`);
  // everyone have their card back
  gameState.players.forEach(p => {
    if (isValidCard(gameState[p].stage[0])) {
      gameState[p].hand = gameState[p].hand.concat(gameState[p].stage);
    }
    gameState[p].stage = [];
  });
  gameState.state = State.TURN_START;
  gameState.numStageCardsRequired = 0;

  _checkGameOver(gameState, logs);
  return {
    newGameState: gameState,
    logs
  };
}

function PickTrade(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  const { gameState } = room;
  const { uid } = auth.currentUser;

  const handleTrade = async (e) => {
    e.preventDefault();

    try {
      let newGameState, logs;
      await firestore.runTransaction(async transaction => {
        let roomRef = firestore.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists) {
          throw new Error("Document does not exists.");
        }

        ({ newGameState, logs } = _handlePickTrade(gameState, uid, card));
        transaction.update(roomRef, { 'gameState': newGameState });
      });
      logs.forEach(log => {
        addLog(roomId, room, log);
      });
      selectCard('');
      setError('');
    } catch (err) {
      setError(err.toString());
    }
  }

  const handleDeny = async (e) => {
    e.preventDefault();

    try {
      let newGameState, logs;
      await firestore.runTransaction(async transaction => {
        let roomRef = firestore.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists) {
          throw new Error("Document does not exists.");
        }

        ({ newGameState, logs } = _handlePickTradeCancel(gameState, uid, card));
        transaction.update(roomRef, { 'gameState': newGameState });
      });
      logs.forEach(log => {
        addLog(roomId, room, log);
      });
      selectCard('');
      setError('');
    } catch (err) {
      setError(err.toString());
    }
  }

  return (
    <div className='flex'>
      <button className={buttonClass} onClick={handleTrade}>Trade</button>
      <button className={buttonClass} onClick={handleDeny}>Deny</button>
    </div>
  )
}

// Returns the new gamestate when `uid` want to pass `card` to `direction`.
function _handlePass(gameState, uid, card, direction) {
  let logs = [];
  const index = gameState[uid].hand.indexOf(card);
  if (index === -1) {
    throw new Error('Invalid card.');
  }

  gameState[uid].hand.splice(index, 1);
  gameState[uid].stage.push(card);
  const passState = direction === 'left' ? State.PASS_LEFT : State.PASS_RIGHT;

  if (uid === gameState.players[gameState.turnOwnerIndex]) {
    logs.push(`${uid}: everyone pick a card and pass to your ${direction}.`);
    gameState.state = passState;
    gameState.numStageCardsRequired = 1;
  } else {
    let everyonePassed = true;
    gameState.players.forEach(player => {
      if (gameState[player].stage.length < gameState.numStageCardsRequired) {
        everyonePassed = false;
      }
    });
    if (everyonePassed) {
      logs.push(`Everyone has passed a card to the ${direction}.`);
      for (let i = 0; i < gameState.players.length; ++i) {
        let to, from;
        if (direction === 'left') {
          to = gameState.players[i];
          from = gameState.players[(i + 1) % gameState.players.length];
        } else {
          to = gameState.players[(i + 1) % gameState.players.length];
          from = gameState.players[i];
        }
        gameState[to].hand =
          gameState[to].hand.concat(gameState[from].stage);
        gameState[from].stage = [];
      }
      gameState.state = State.TURN_START;
      gameState.turnOwnerIndex = (gameState.turnOwnerIndex + 1) % gameState.players.length;
      gameState.numStageCardsRequired = 0;
    }
  }

  _checkGameOver(gameState, logs);
  return {
    newGameState: gameState,
    logs
  };
}

function Pass(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let newGameState, logs;
      await firestore.runTransaction(async transaction => {
        let roomRef = firestore.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists) {
          throw new Error("Document does not exists.");
        }

        ({ newGameState, logs } = _handlePass(gameState, uid, card, props.direction));
        transaction.update(roomRef, { 'gameState': newGameState });
      });
      logs.forEach(log => {
        addLog(roomId, room, log);
      });
      selectCard('');
      setError('');
    } catch (err) {
      setError(err.toString());
    }
  }

  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleSubmit}>Pass {props.direction}</button>
      </div>
    </div>
  )
}

// Returns the new gamestate when `uid` uses a syringe card.
function _handleUseSyringe(gameState, uid, card) {
  let logs = [];
  if (!isSyringeCard(card)) {
    throw new Error('Must choose a syringe card.');
  }

  const index = gameState[uid].hand.indexOf(card);
  if (index === -1) {
    throw new Error('Invalid card.');
  }

  gameState[uid].hand.splice(index, 1);
  gameState[uid].stage.push(card);
  logs.push(`${uid}: I am using a syringe card.`);
  gameState.state = State.PICK_SYRINGE;

  _checkGameOver(gameState, logs);
  return {
    newGameState: gameState,
    logs
  };
}

function UseSyringe(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let newGameState, logs;
      await firestore.runTransaction(async transaction => {
        let roomRef = firestore.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists) {
          throw new Error("Document does not exists.");
        }

        ({ newGameState, logs } = _handleUseSyringe(gameState, uid, card));
        transaction.update(roomRef, { 'gameState': newGameState });
      });
      logs.forEach(log => {
        addLog(roomId, room, log);
      });
      selectCard('');
      setError('');
    } catch (err) {
      setError(err.toString());
    }
  }

  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleSubmit}>Use Syringe</button>
      </div>
    </div>
  )
}

// Returns the new gamestate when `uid` uses a syringe and want to pick `card`.
function _handlePickSyringe(gameState, uid, card) {
  let logs = [];
  // Find the card
  let find = false;
  for (let i = 0; i < gameState.players.length; ++i) {
    const player = gameState.players[i];

    const handIndex = gameState[player].hand.indexOf(card);
    const workstationIndex = gameState[player].workstation.indexOf(card);

    if (handIndex >= 0) {
      // Cannot pick player's own card
      if (player === uid) {
        throw new Error('Cannot pick your own card.');
      }
      logs.push(`${uid}: I took a card from ${player}'s hand.`);
      find = true;

      // We want to choose a random card from `player`'s hand.
      let randomIndex = randInt(0, gameState[player].hand.length - 1);
      gameState[uid].hand.push(gameState[player].hand[randomIndex]);
      gameState[player].hand.splice(randomIndex, 1);

      // the syringe card goes to player's hand
      gameState[player].hand = gameState[player].hand.concat(gameState[uid].stage);
      gameState[uid].stage = [];
      break;
    }

    if (workstationIndex >= 0) {
      if (shouldFaceDownInWorkstation(card)) {
        logs.push(`${uid}: I took a face-down card from ${player}'s workstation.`);
      } else {
        logs.push(`${uid}: I took ${card} from ${player}'s workstation.`);
      }
      find = true;
      gameState[player].workstation.splice(workstationIndex, 1);
      gameState[uid].hand.push(card);
      // the syringe card goes to uid's workstation.
      gameState[uid].workstation = gameState[uid].workstation.concat(gameState[uid].stage);
      gameState[uid].stage = [];
      break;
    }
  }

  if (!find) {
    throw new Error('You picked an invalid card.');
  }

  // Card has been traded. Syringe card has been cleared.
  gameState.state = State.TURN_START;
  gameState.turnOwnerIndex = (gameState.turnOwnerIndex + 1) % gameState.players.length;
  gameState.numStageCardsRequired = 0;

  _checkGameOver(gameState, logs);
  return {
    newGameState: gameState,
    logs
  };
}

function PickSyringe(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let newGameState, logs;
      await firestore.runTransaction(async transaction => {
        let roomRef = firestore.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists) {
          throw new Error("Document does not exists.");
        }

        ({ newGameState, logs } = _handlePickSyringe(gameState, uid, card));
        transaction.update(roomRef, { 'gameState': newGameState });
      });
      logs.forEach(log => {
        addLog(roomId, room, log);
      });
      selectCard('');
      setError('');
    } catch (err) {
      setError(err.toString());
    }
  }

  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleSubmit}>Use Syringe</button>
      </div>
    </div>
  )
}

export { Actions, needsAttention };
