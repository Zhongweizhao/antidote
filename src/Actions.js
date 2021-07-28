import { useContext, useState } from "react";
import { isFormulaCard, isSyringeCard, isValidCard } from "./Card";
import { auth, firestore } from "./Firebase";
import { RoomContext } from "./RoomContext";
import { State } from "./State";

const buttonClass = 'f6 link bn pointer br3 ma1 bw1 ph3 pv2 dib white bg-dark-blue';

function _checkGameOver(gameState) {
  let p = gameState.players[0];
  if (gameState[p].hand.length + gameState[p].stage.length > 1) return;

  gameState.state = State.GAME_OVER;

  gameState.players.forEach(player => {
    const lastCard = gameState[player].hand[0];
    const formula = lastCard.charCodeAt(0) - 65;
    let point = isFormulaCard(lastCard) ? lastCard.charCodeAt(1) - 48 : 1;
    const matchesAntidote = formula === gameState.antidote;
    gameState[player].point += matchesAntidote ? point : -point;
  });
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
  gameState[uid].hand.forEach(card => {if (isSyringeCard(card)) hasSyringeCard = true; });
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
        {_canDiscard(uid) && <Discard card={selectedCard} selectCard={selectCard} setError={setError}/>}
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

function Discard(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const index = gameState[uid].hand.indexOf(card);
    if (index === -1) {
      setError(`Invalid card ${card}.`);
      return;
    }

    gameState[uid].hand.splice(index, 1);
    gameState[uid].stage.push(card);

    if (uid === gameState.players[gameState.turnOwnerIndex]) {
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
          gameState[player].workstation =
            gameState[player].workstation.concat(gameState[player].stage);
          gameState[player].stage = [];
        });
        gameState.state = State.TURN_START;
        gameState.turnOwnerIndex = (gameState.turnOwnerIndex + 1) % gameState.players.length;
        gameState.numStageCardsRequired = 0;
      }
    }

    _checkGameOver(gameState);
    selectCard('');
    setError('');
    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
  }
  
  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleSubmit}>Discard</button>
      </div>
    </div>
  )
}

async function _handleStartTradeSubmit(card, selectCard, setError, room, roomId, gameState, uid, turnOwner) {
  if (uid === turnOwner) {
    gameState.state = State.TRADE_START;
    gameState.numStageCardsRequired = 1;
  } else {
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
        gameState.state = State.TRADE_PICK;
      } else {
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

  _checkGameOver(gameState);
  selectCard('');
  setError('');
  await firestore.collection('rooms').doc(roomId).update({
    'gameState': gameState,
  }).catch(err => {
    setError(err.toString());
  });
}

function StartTrade(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  const { gameState } = room;
  const { uid } = auth.currentUser;

  const turnOwner = gameState.players[gameState.turnOwnerIndex];
  
  const handleTrade = async (e) => {
    e.preventDefault();
    const index = gameState[uid].hand.indexOf(card);
    if (index === -1) {
      setError('Invalid card.');
      return;
    }
    gameState[uid].hand.splice(index, 1);
    gameState[uid].stage.push(card);
    await _handleStartTradeSubmit(card, selectCard, setError, room, roomId, gameState, uid, turnOwner);
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

  const turnOwner = gameState.players[gameState.turnOwnerIndex];
  
  const handleDeny = async (e) => {
    e.preventDefault();
    if (gameState.state !== State.TRADE_START) {
      setError('No trade to deny');
      return;
    }
    gameState[uid].stage.forEach(card => {
      console.assert(isValidCard(card));
    });
    gameState[uid].hand = gameState[uid].hand.concat(gameState[uid].stage);
    // Push an invalid card to represent deny.
    for (let i = 0; i < gameState.numStageCardsRequired; ++i) {
      gameState[uid].stage.push('');
    }
    await _handleStartTradeSubmit(card, selectCard, setError, room, roomId, gameState, uid, turnOwner);
  }

  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleDeny}>Deny</button>
      </div>
    </div>
  )
}

function PickTrade(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  const { gameState } = room;
  const { uid } = auth.currentUser;

  const handleTrade = async (e) => {
    e.preventDefault();

    let player = '';
    gameState.players.forEach(p => {
      if (gameState[p].stage.includes(card)) {
        player = p;
      }
    });

    if (player === uid) {
      setError('Cannot trade with yourself.');
      return;
    }
    
    if (!gameState.players.includes(player)) {
      setError('Invalid player');
      return;
    }
    if (!isValidCard(gameState[player].stage[0])) {
      setError('Player ' + player + ' denied your trade');
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
    gameState[uid].hand = gameState[uid].hand.concat(gameState[player].stage);
    gameState[player].hand = gameState[player].hand.concat(gameState[uid].stage);
    gameState[uid].stage = [];
    gameState[player].stage = [];
    gameState.turnOwnerIndex = (gameState.turnOwnerIndex + 1) % gameState.players.length;
    gameState.state = State.TURN_START;
    gameState.numStageCardsRequired = 0;

    _checkGameOver(gameState);
    selectCard('');
    setError('');
    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
  }

  const handleDeny = async (e) => {
    e.preventDefault();
    // everyone have their card back
    gameState.players.forEach(p => {
      if (isValidCard(gameState[p].stage[0])) {
        gameState[p].hand = gameState[p].hand.concat(gameState[p].stage);
      }
      gameState[p].stage = [];
    });
    gameState.state = State.TURN_START;
    gameState.numStageCardsRequired = 0;

    _checkGameOver(gameState);
    selectCard('');
    setError('');
    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
  }

  return (
    <div className='flex'>
      <button className={buttonClass} onClick={handleTrade}>Trade</button>
      <button className={buttonClass} onClick={handleDeny}>Deny</button>
    </div>
  )
}

function Pass(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const passState = props.direction === 'left' ? State.PASS_LEFT : State.PASS_RIGHT;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const index = gameState[uid].hand.indexOf(card);
    if (index === -1) {
      setError('Invalid card.');
      return;
    }

    gameState[uid].hand.splice(index, 1);
    gameState[uid].stage.push(card);

    if (uid === gameState.players[gameState.turnOwnerIndex]) {
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
        for (let i = 0; i < gameState.players.length; ++i) {
          let to, from;
          if (props.direction === 'left') {
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

    _checkGameOver(gameState);
    selectCard('');
    setError('');
    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
  }
  
  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleSubmit}>Pass {props.direction}</button>
      </div>
    </div>
  )
}

function UseSyringe(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSyringeCard(card)) {
      setError('Must choose a syringe card.');
      return;
    }

    const index = gameState[uid].hand.indexOf(card);
    if (index === -1) {
      setError('Invalid card.');
      return;
    }

    gameState[uid].hand.splice(index, 1);
    gameState[uid].stage.push(card);
    gameState.state = State.PICK_SYRINGE;

    _checkGameOver(gameState);
    selectCard('');
    setError('');
    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
  }
  
  return (
    <div>
      <div>
        <button className={buttonClass} onClick={handleSubmit}>Use Syringe</button>
      </div>
    </div>
  )
}

function PickSyringe(props) {
  const { card, selectCard, setError } = props;
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Find the card
    let find = false;
    for (let i = 0; i < gameState.players.length; ++i) {
      const player = gameState.players[i];

      const handIndex = gameState[player].hand.indexOf(card);
      const workstationIndex = gameState[player].workstation.indexOf(card);

      if (handIndex >= 0) {
        console.log(`player ${uid} is picking player ${player}'s hand's ${handIndex}th ${card}`)
        // Cannot pick player's own card
        if (player === uid) {            
          setError('Cannot pick your own card.');
          return;
        }
        find = true;
        gameState[player].hand.splice(handIndex, 1);
        gameState[uid].hand.push(card);
        // the syringe card goes to player's hand
        gameState[player].hand = gameState[player].hand.concat(gameState[uid].stage);
        gameState[uid].stage = [];
        break;
      }

      if (workstationIndex >= 0) {
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
      setError('You picked an invalid card.');
      return;
    }

    // Card has been traded. Syringe card has been cleared.
    gameState.state = State.TURN_START;
    gameState.turnOwnerIndex = (gameState.turnOwnerIndex + 1) % gameState.players.length;
    gameState.numStageCardsRequired = 0;

    _checkGameOver(gameState);
    selectCard('');
    setError('');
    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
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
