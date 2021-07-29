import { useParams } from "react-router-dom";
import { RoomContext } from "./RoomContext";
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, firestore } from "./Firebase";
import { useContext, useState } from "react";
import { Actions, needsAttention } from "./Actions";
import 'tachyons/css/tachyons.css';
import './style.css';
import { addPlayerToRoom } from "./JoinRoom";
import { getColorForFormula } from "./Colors";
import { State } from "./State";
import { isSyringeCard, isValidCard } from "./Card";
import { Logs } from './Logs';

const buttonClass = 'f6 link bn pointer br3 bw1 ph3 pv2 ma2 dib white bg-dark-blue';

function Room() {
  const { roomId } = useParams();
  const roomRef = firestore.collection('rooms').doc(roomId);
  const [room, loading, error] = useDocumentData(roomRef);

  // // player can use link to join the room. if they open the link but not in the
  // // room, try add them to the room
  // console.log(uid);
  // if (!loading && !error && room && room.players && !room.players.includes(uid)) {
  //   console.log('add player to room');
  //   addPlayerToRoom(roomRef, uid);
  //   return (
  //     <p>Joining...</p>
  //   )
  // }
  // console.log('player already in room');
  return (
    <div className='vh-100 w-100 flex flex-column bg-lightest-blue'>
      {
        loading &&
        <p>Loading...</p>
      }
      {
        error &&
        <p>Error: {error.toString()}</p>
      }
      {
        room && 
        <RoomContext.Provider value={{roomId, room}}>
          <div className=''>
            <RoomDetails />
            <Logs />
            <Board />
          </div>
        </RoomContext.Provider>
      }
    </div>
  )
}

function RoomDetails() {
  const {  room } = useContext(RoomContext);
  const { gameState } = room;
  const numFormulas = room.numPlayers === 7 ? 8 : 7;
  let exampleCards = [];
  for (let i = 0; i < numFormulas; ++i) {
    exampleCards.push(String.fromCharCode(65 + i));
  }
  const notEnoughPlayers = room.players.length < room.numPlayers;

  return (
    <div className='pv2 ph6 ph1-m'>
      <h1 className='f3'>Antidote</h1>
      {/* <div>Room {roomId}</div>
      <div>{room.numPlayers} players game</div>
      <div>Players: {room.players.join(', ')}</div> */}
      <div className='flex mv2'>
        {exampleCards.map((card, idx) => <Card key={idx} card={card} />)}
      </div>
      {!notEnoughPlayers &&
        <div className='flex items-center'>
          <div className='mr1'>Shattered toxin container: </div>
            <Card
              card={
                gameState.state === State.GAME_OVER ? 
                  String.fromCharCode(65 + gameState.antidote) + 'X' :
                  '??'
              }
            />
        </div>
      }
    </div>
  )
}

function Board() {
  const myId = auth.currentUser.uid;
  const { room } = useContext(RoomContext);
  const notEnoughPlayers = room.players.length < room.numPlayers;

  const [selectedCard, setSelectedCard] = useState('');

  const playerInGame = room.players.includes(myId);

  return (
    <div className='pv1 ph1-m ph6'>
      { notEnoughPlayers && <NotEnoughPlayers />}
      { !notEnoughPlayers && room.players.map(p =>
        <Player key={p} id={p} me={p === myId} selectCard={setSelectedCard} selectedCard={selectedCard} />)}
      { !notEnoughPlayers && playerInGame &&
        <div>
          <Actions selectedCard={selectedCard} selectCard={setSelectedCard} />
        </div>
      }
    </div>
  )
}

function NotEnoughPlayers() {
  const { room, roomId } = useContext(RoomContext);
  const roomRef = firestore.collection('rooms').doc(roomId);
  const link = window.location.origin + '/' + roomId;
  const { uid } = auth.currentUser;

  const currentUserJoined = room.players.includes(uid);

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    e.preventDefault();
    setError('');
    setName(e.target.value);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.length === 0) {
      setError('Cannot have empty name.');
      return;
    }
    await addPlayerToRoom(roomRef, uid, name);
  }

  return (
    <div>
      <h3>Lobby</h3>
      {
        !currentUserJoined &&
        <div>
          <p>Choose your player name</p>
          <form>
            <input className='input-reset br3 ba b--black-20 pa2 mv2 dib w-20 h2 mr2' type='text' required onChange={handleChange} />
            <button type='submit' className={buttonClass} onClick={handleSubmit}>Join</button>
            <span className='mh2'>{error}</span>
          </form>
        </div>
      }
      <p>{room.players.length} / {room.numPlayers} joined</p>

      <p className='flex'>
        <p>Share this game <a href={link}>{link}</a></p>
        {
          window.isSecureContext &&
          <button className={buttonClass}
            onClick={() => {navigator.clipboard.writeText(link)}}>Copy</button>
        }
      </p>
    </div>
  )
}

function Player(props) {
  const { id, me, selectCard, selectedCard } = props;
  const { room } = useContext(RoomContext);
  const { gameState } = room;

  const handleClick = (myCards, where, card) => {
    selectCard(selectedCard === card ? '' : card);
  }

  const playerName = room.playerNames[id];
  const attention = needsAttention(id);

  return (
    <div className='flex items-center pv3 bt '>
      <div className='flex-column mr2 w4'>
        {
          attention && me &&
          <span className='db dark-green'>
            Your turn
          </span>
        }
        <span className='db'>
          <span className='dark-green'>{ attention && "➤ " }</span>
          {playerName > 10 ? playerName.substring(0, 7) + '...' : playerName}
        </span>
      </div>
      {
        gameState.state === State.GAME_OVER &&
        <div className='flex items-center mr2 w2.5'>
          {gameState[id].point + (Math.abs(gameState[id].point) > 1 ? ' points' : ' point')}
        </div>
      }
      <div className='flex br mh2 ph2'>
        {gameState[id].hand.filter(isValidCard).map((card, idx) =>
          <Card key={idx} card={card}
            stack={!me && (idx < gameState[id].hand.length - 1)} back={!me}
            handleClick={() => handleClick(me, 'hand', card)}
            selected={card === selectedCard}
          />)}
      </div>
      <div className='flex br mh2 ph2'>
        {gameState[id].stage.filter(isValidCard).map((card, idx) => 
          <Card key={idx} card={card} back={!me}
            handleClick={() => handleClick(me, 'stage', card)}
            selected={card === selectedCard}
          />)}
      </div>
      <div className='flex mh2 ph2'>
        {gameState[id].workstation.filter(isValidCard).map((card, idx) =>
          <Card key={idx} card={card} back={!me && card.length > 1 && card[1] === 'X'}
            handleClick={() => handleClick(me, 'workstation', card)}
            selected={card === selectedCard}
          />)}
      </div>
    </div>
  )
}

function Card(props) {
  let { card, idx, stack, back, handleClick, selected } = props;
  const { room } = useContext(RoomContext);
  // game state is not always available here.firebase 
  const { gameState } = room;
  if (gameState && gameState.state === State.GAME_OVER) back = false;
  let cardClass = 'flex items-center justify-center br1 ba mr1 mr2-1 pointer'
  cardClass += back ? ' card-back' : ' card-front';
  cardClass += stack ? ' card-stack' : '';
  cardClass += selected ? ' h3 w2.7' : ' h2.5 w2.25';
  let cardText = isSyringeCard(card) ? 'S' : card;

  const cardStyle = {
    background: back ? null : getColorForFormula(card),
    // textShadow: 'rgb(255 255 255) -1px 1px 2px',
  };
  return (
    <div className={cardClass} key={idx} style={cardStyle} onClick={handleClick}>
      <span className='b pre-line absolute f5'>{back ? '' : (
        cardText
      )}</span>
    </div>
  )
}

export { Room };
