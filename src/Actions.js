import { useContext, useState } from "react";
import { isValidCard } from "./Card";
import { auth, firestore } from "./Firebase";
import { RoomContext } from "./RoomContext";
import { State } from "./State";


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

function needsAttention(uid) {
  return _canDiscard(uid)
    || _canStartTrade(uid)
    || _canPickTrade(uid)
    || _canPassLeft(uid)
    || _canPassRight(uid);
}

function Actions() {
  const { uid } = auth.currentUser;
  return (
    <div>
      {_canDiscard(uid) && <Discard />}
      {_canStartTrade(uid) && <StartTrade />}
      {_canPickTrade(uid) && <PickTrade />}
      {_canPassLeft(uid) && <Pass direction='left' />}
      {_canPassRight(uid) && <Pass direction='right' />}
    </div>
  )
}

function Discard() {
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const [error, setError] = useState('');
  const [card, setCard] = useState('');

  const handleChange = (e) => {
    setError('');
    setCard(e.target.value);
  }

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

    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Discard
        <input type='text' required onChange={handleChange} />
      </label>
      <button type='submit'>Discard</button>
      {error}
    </form>
  )
}

function StartTrade() {
  const { room, roomId } = useContext(RoomContext);
  const { gameState } = room;
  const { uid } = auth.currentUser;

  const [error, setError] = useState('');
  const [card, setCard] = useState('');

  const handleChange = (e) => {
    setError('');
    setCard(e.target.value);
  }

  const turnOwner = gameState.players[gameState.turnOwnerIndex];

  const handleSubmit = async () => {
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

    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
  }

  
  const handleTrade = async (e) => {
    e.preventDefault();
    const index = gameState[uid].hand.indexOf(card);
    if (index === -1) {
      setError('Invalid card.');
      return;
    }
    gameState[uid].hand.splice(index, 1);
    gameState[uid].stage.push(card);
    await handleSubmit();
  }

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
    await handleSubmit();
  }

  return (
    <form>
      <label>
        Trade
        <input type='text' required onChange={handleChange} />
      </label>
      <button onClick={handleTrade}>Trade</button>
      <button onClick={handleDeny}>Deny</button>
      {error}
    </form>
  )
}

function PickTrade() {
  const { room, roomId } = useContext(RoomContext);
  const { gameState } = room;
  const { uid } = auth.currentUser;

  const [error, setError] = useState('');
  const [player, setPlayer] = useState('');

  const handleChange = (e) => {
    setError('');
    setPlayer(e.target.value);
  }

  const handleTrade = async (e) => {
    e.preventDefault();
    
    if (!gameState.players.includes(player)) {
      setError('Invalid player');
      return;
    }
    if (!isValidCard(gameState[player].stage[0])) {
      setError('Player ' + player + ' denied your trade');
    }

    // everyone else have their card back
    gameState.players.forEach(p => {
      if (p !== uid && p !== player && isValidCard(gameState[p].stage[0])) {
        gameState[p].hand = gameState[p].hand.concat(gameState[p].stage);
      }
      gameState[p].stage = [];
    });
    gameState[uid].hand = gameState[uid].hand.concat(gameState[player].stage);
    gameState[player].hand = gameState[player].hand.concat(gameState[uid].stage);
    gameState[uid].stage = [];
    gameState[player].stage = [];
    gameState.turnOwnerIndex = (gameState.turnOwnerIndex + 1) % gameState.players.length;
    gameState.state = State.TURN_START;
    gameState.numStageCardsRequired = 0;

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

    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
  }

  return (
    <form>
      <label>
        Player to accept trade 
        <input type='text' required onChange={handleChange} />
      </label>
      <button onClick={handleTrade}>Trade</button>
      <button onClick={handleDeny}>Deny</button>
      {error}
    </form>
  )
}

function Pass(props) {
  const { room, roomId } = useContext(RoomContext);
  let { gameState } = room;
  const { uid } = auth.currentUser;

  const [error, setError] = useState('');
  const [card, setCard] = useState('');

  const passState = props.direction === 'left' ? State.PASS_LEFT : State.PASS_RIGHT;
  
  const handleChange = (e) => {
    setError('');
    setCard(e.target.value);
  }

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

    await firestore.collection('rooms').doc(roomId).update({
      'gameState': gameState,
    }).catch(err => {
      setError(err.toString());
    });
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Pass {props.direciton}
        <input type='text' required onChange={handleChange} />
      </label>
      <button type='submit'>Pass {props.direction}</button>
      {error}
    </form>
  )
}

export { Actions, needsAttention };
