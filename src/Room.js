import { useParams } from "react-router-dom";
import { RoomContext } from "./RoomContext";
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, firestore } from "./Firebase";
import { useContext, useState } from "react";
import { Actions, needsAttention } from "./Actions";
import 'tachyons/css/tachyons.css';
import './style.css';
import { addPlayerToRoom } from "./JoinRoom";
// import { getColorForFormula } from "./Colors";
import { State } from "./State";
import { isFormulaCard, isSyringeCard, isToxinCard, isValidCard } from "./Card";
import { Logs } from './Logs';
import Modal from 'react-modal';
import { getLabmem } from "./Labmem";

const buttonClass = 'f6 link bn pointer br3 bw1 ph3 pv2 ma2 dib white bg-dark-blue';

Modal.setAppElement('#root')

function Room() {
  const { roomId } = useParams();
  const roomRef = firestore.collection('rooms').doc(roomId);
  const [room, loading, error] = useDocumentData(roomRef);
  const [colorBlindOn, setColorBlind] = useState(false);
  const [modalIsOpen, setIsOpen] = useState(false);

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
    },
  };

  const openModal = () => {
    setIsOpen(true);
  }

  const afterOpenModal = () => {
  }

  const closeModal = () => {
    setIsOpen(false);
  }

  const handleEnableColorBlind = () => {
    setColorBlind(true);
  }

  const handleDisableColorBlind = () => {
    setColorBlind(false);
  }


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
    <div className='aspect-ratio--object'>
    <div className='h-100 w-100 flex flex-column bg-lightest-blue'>
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
        <RoomContext.Provider value={{roomId, room, colorBlindOn}}>
          <div className=''>
            <RoomDetails openModal={openModal} />
            <Logs />
            <Board />
            <Modal
              isOpen={modalIsOpen}
              onAfterOpen={afterOpenModal}
              onRequestClose={closeModal}
              style={customStyles}
            >
              <div className='w6'>
                <div onClick={closeModal} className='absolute right-1 top-1 pointer'>✖</div>
                <div className='flex flex-column justify-center items-center w-100 h-100 pa2 z-10'>
                  <div className='flex flex-column justify-center items-center'>
                    <span className='f5 f4-l pre-line mb2 mb3-l'><b>Settings</b></span>
                    <div className='flex items-center flex-wrap'>
                      <label title='Color blind mode'>Color blind mode</label>
                      <button
                        onClick={handleEnableColorBlind}
                        className={buttonClass}>Enable</button>
                      <button
                        onClick={handleDisableColorBlind}
                        className={buttonClass}>Disable</button>
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
          </div>
        </RoomContext.Provider>
      }
    </div>
    </div>
  )
}

function RoomDetails(props) {
  const {  room } = useContext(RoomContext);
  const { gameState } = room;
  const numFormulas = room.numPlayers === 7 ? 8 : 7;
  let exampleCards = [];
  for (let i = 0; i < numFormulas; ++i) {
    exampleCards.push(String.fromCharCode(65 + i) + 'X');
  }
  const notEnoughPlayers = room.players.length < room.numPlayers;

  return (
    <div className='pv2 ph1 ph6-l'>
      <div className='flex justify-between items-center'>
        <h1 className='f3'>Antidote</h1>
        <div className='items-end f2 pointer'
          onClick={() => props.openModal()}>≡</div>
      </div>
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

  let labmem = null;
  if (!notEnoughPlayers && playerInGame && room.gameState[myId].labmem) {
    labmem = getLabmem(room.gameState[myId].labmem, myId);
  }

  return (
    <div className='pv1 ph6-l ph1'>
      { notEnoughPlayers && <NotEnoughPlayers />}
      {
        labmem && room.gameState.state !== State.GAME_OVER &&
        <div className="labmem-description bt--dashed">
          <p>You are {labmem.constructor.name()}</p>
          <div className="flex w8 mv2 items-center">
            <div className={"flex flex-no-shrink mr2 w2.5 h3 labmem-background labmem-background-" + labmem.constructor.id()}>
            </div>
            <div className="flex-columns" dangerouslySetInnerHTML={{__html: labmem.constructor.description()}}></div>
          </div>
        </div>
      }
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
            <input autoFocus className='input-reset br3 ba b--black-20 pa2 mv2 dib w-20 h2 mr2' type='text' required onChange={handleChange} />
            <button type='submit' className={buttonClass} onClick={handleSubmit}>Join</button>
            <span className='mh2'>{error}</span>
          </form>
        </div>
      }
      <p>{room.players.length} / {room.numPlayers} joined</p>

      <p className='flex items-center'>
        <span>Share this game <a href={link}>{link}</a></span>
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

  let labmem = null;
  let labmemInGame = false;
  if (gameState[id].labmem) {
    labmem = getLabmem(gameState[id].labmem, id);
  }
  gameState.players.forEach(player => {
    if (gameState[player].labmem) labmemInGame = true;
  });

  return (
    <div className='flex items-center pv3 bt'>
      <div className={'flex-column flex-no-shrink ' + (labmemInGame ? ((gameState.state === State.GAME_OVER) ? 'w6 mr2' : 'w1.5') : 'w0')}>
        { labmem && gameState.state !== State.GAME_OVER &&
          <span className='db'>&#128100;</span>
        }
        { labmem && gameState.state === State.GAME_OVER &&
          <div className='flex items-center labmem-description'>
            <div className={'flex-no-shrink mr2 h2.5 w2.25 labmem-background labmem-background-' + labmem.constructor.id()}>
            </div>
            <div dangerouslySetInnerHTML={{__html: labmem.constructor.description()}}></div>
          </div>
        }
      </div>
      <div className={'flex-column mr2 w3.5 flex-no-shrink' + (me ? ' b' : '')}>
        {
          attention && me &&
          <span className='db dark-green b'>
            Your turn
          </span>
        }
        <span className='db break-word'>
          <span className='dark-green'>{ attention && "➤ " }</span>
          {playerName > 10 ? playerName.substring(0, 7) + '...' : playerName}
        </span>
      </div>
      {
        gameState.state === State.GAME_OVER &&
        <div className='flex items-center mr2 w3 flex-no-shrink flex-no-grow'>
          {gameState[id].point + (Math.abs(gameState[id].point) > 1 ? ' points' : ' point')}
        </div>
      }
      <div className='flex br mh2 ph2 items-center'>
        {gameState[id].hand.filter(isValidCard).map((card, idx) =>
          <Card key={idx} card={card}
            stack={!me && (idx < gameState[id].hand.length - 1)} back={!me}
            handleClick={() => handleClick(me, 'hand', card)}
            selected={card === selectedCard}
          />)}
      </div>
      <div className='flex br mh2 ph2 items-center'>
        {gameState[id].stage.filter(isValidCard).map((card, idx) => 
          <Card key={idx} card={card} back={!me}
            handleClick={() => handleClick(me, 'stage', card)}
            selected={card === selectedCard}
          />)}
      </div>
      <div className='flex mh2 ph2 items-center'>
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
  const { room, colorBlindOn } = useContext(RoomContext);
  // game state is not always available here.firebase 
  const { gameState } = room;
  if (gameState && gameState.state === State.GAME_OVER) back = false;
  let cardClass = 'flex justify-end br1 ba mr1 mr2-1 pointer'
  cardClass += back ? ' card-back' : ' card-front';
  cardClass += stack ? ' card-stack' : '';
  cardClass += selected ? ' h3 w2.7' : ' h2.5 w2.25';
  cardClass += ((isFormulaCard(card) || isToxinCard(card) || isSyringeCard(card)) && !back)
    ? ' card-background card-background-' + card[0] : '';
  let cardText = isSyringeCard(card) ? 'S' : card;
  cardText = ((isFormulaCard(card) || isToxinCard(card)) && !colorBlindOn) ? card[1] : cardText;

  const cardStyle = {
    // background: back ? null : getColorForFormula(card, colorBlindOn),
    // textShadow: 'rgb(255 255 255) -1px 1px 2px',
  };
  return (
    <div className={cardClass} key={idx} style={cardStyle} onClick={handleClick}>
      <span className='b pre-line f5 pr0.5'>{back ? '' : (
        cardText
      )}</span>
    </div>
  )
}

export { Room };
