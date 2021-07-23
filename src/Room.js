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

function Room() {
  const { roomId } = useParams();
  const roomRef = firestore.collection('rooms').doc(roomId);
  const [room, loading, error] = useDocumentData(roomRef);
  const { uid } = auth.currentUser;

  // player can use link to join the room. if they open the link but not in the
  // room, try add them to the room
  if (!loading && !error && room && room.players && !room.players.includes(uid)) {
    addPlayerToRoom(roomRef, uid);
    return (
      <p>Joining...</p>
    )
  }
  return (
    <div className='vh-100 dt w-100 bg-lightest-blue'>
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
            <hr /><hr />
            <hr /><hr />
            <Board />
          </div>
        </RoomContext.Provider>
      }
    </div>
  )
}

function RoomDetails() {
  const { roomId, room } = useContext(RoomContext);
  const { gameState } = room;
  const numFormulas = room.numPlayers === 7 ? 8 : 7;
  let exampleCards = [];
  for (let i = 0; i < numFormulas; ++i) {
    exampleCards.push(String.fromCharCode(65 + i));
  }
  const notEnoughPlayers = room.players.length < room.numPlayers;

  return (
    <div className='gray'>
      <div>Room {roomId}</div>
      <div>{room.numPlayers} players game</div>
      <div>Players: {room.players.join(', ')}</div>
      <div className='flex mv2'>
        {exampleCards.map((card, idx) => <Card key={idx} card={card} />)}
      </div>
      <div className='flex items-center'>
        <div className='mh1'>Antidote: </div>{!notEnoughPlayers &&
          <Card
            card={
              gameState.state === State.GAME_OVER ? 
                String.fromCharCode(65 + gameState.antidote) + 'X' :
                '??'
            }
          />}
      </div>
    </div>
  )
}

function Board() {
  const myId = auth.currentUser.uid;
  const { room } = useContext(RoomContext);
  const notEnoughPlayers = room.players.length < room.numPlayers;

  const [selectedCard, setSelectedCard] = useState('');

  return (
    <div>
      { !notEnoughPlayers && room.players.filter(p => p !== myId).map(p =>
        <Player key={p} id={p} selectCard={setSelectedCard} selectedCard={selectedCard} />)}
      { notEnoughPlayers && <NotEnoughPlayers />}
      { !notEnoughPlayers && <p>----------------------------------------------</p> }
      { !notEnoughPlayers && <Player key={myId} id={myId} me selectCard={setSelectedCard} selectedCard={selectedCard} /> }
      { !notEnoughPlayers &&
        <div>
          <hr />
          <Actions selectedCard={selectedCard} selectCard={setSelectedCard} />
        </div>
      }
    </div>
  )
}

function NotEnoughPlayers() {
  const { room, roomId } = useContext(RoomContext);
  const link = window.location.origin + '/' + roomId;
  return (
    <div>
      <h3>Lobby</h3>
      <p>{room.players.length} / {room.numPlayers} joined</p>
      <p>Share this game <a href={link}>{link}</a></p>
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

  return (
    <div className='flex mv3'>
      <div className='flex items-center mr2 w4.25'>
        { needsAttention(id) && "➤" }
        Player {id.length > 10 ? id.substring(0, 7) + '...' : id}
      </div>
      <div className='flex items-center mr2 w2.5'>
        {gameState[id].point + (Math.abs(gameState[id].point) > 1 ? ' points' : ' point')}
      </div>
      <div className='flex br mh2 ph2'>
        {gameState[id].hand.map((card, idx) =>
          <Card key={idx} card={card}
            stack={!me && (idx < gameState[id].hand.length - 1)} back={!me}
            handleClick={() => handleClick(me, 'hand', card)}
            selected={card === selectedCard}
          />)}
      </div>
      <div className='flex br mh2 ph2'>
        {gameState[id].stage.map((card, idx) => 
          <Card key={idx} card={card} back={!me}
            handleClick={() => handleClick(me, 'stage', card)}
            selected={card === selectedCard}
          />)}
      </div>
      <div className='flex mh2 ph2'>
        {gameState[id].workstation.map((card, idx) =>
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
  const { roomId, room } = useContext(RoomContext);
  const { gameState } = room;
  if (gameState.state == State.GAME_OVER) back = false;
  let cardClass = 'flex items-center justify-center br1 ba mr1 mr2-1 pointer'
  cardClass += back ? ' card-back' : ' card-front';
  cardClass += stack ? ' card-stack' : '';
  cardClass += selected ? ' h3 w2.7' : ' h2.5 w2.25'
  const formula = card[0];
  const number = card.length > 1 ? card[1] : '';
  const isAntidote = 65 <= formula.charCodeAt(0) && formula.charCodeAt(0) <= 72;

  const cardStyle = {
    background: back ? null : getColorForFormula(formula),
    textShadow: 'rgb(255 255 255) -1px 1px 2px',
  };
  return (
    <div className={cardClass} key={idx} style={cardStyle} onClick={handleClick}>
      <span className='b pre-line absolute f5'>{back ? '' : (
        isAntidote ? formula + number : formula + number
      )}</span>
    </div>
  )
}

export { Room };
