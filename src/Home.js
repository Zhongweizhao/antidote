import { useState } from "react";
import { useHistory } from "react-router-dom";
import { auth, firebase, firestore } from "./Firebase";
import { State } from "./State";
import 'tachyons/css/tachyons.css'

const buttonClass = 'f6 link bn pointer br3 ma2 bw1 ph3 pv2 mb2 dib white bg-dark-blue';

function Home() {
  const user = auth.currentUser;

  const centerClass = 'mw7 center ph3 ph5-ns tc br2 pv5 mb5 v-mid dtc';

  return (
    <div className='vh-100 dt w-100 bg-washed-blue'>
      {
        (!user) && 
        <div className={centerClass}>
          <Title />
          <Login />
        </div>
      }
      {
        user &&
        <div className={centerClass}>
          <Title />
          <div className='mw7 center pa4 br2-ns bn'>
            <CreateRoom />
            <JoinRoom />
            <Logout user={user} />
          </div>
        </div>
      }
    </div>
  )
}

function Title() {
  return (
    <h1 className='f1 f-headline-1 fw1 ttu tracked mb2 lh-title'>
      Antidote
    </h1>
  )
}

function Login() {
  const signInWithGoogle = (e) => {
    e.preventDefault();
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  const signInAnonymously = (e) => {
    e.preventDefault();
    auth.signInAnonymously();
  }

  return (
    <div className='ph3'>
      <button onClick={signInWithGoogle} className={buttonClass}>Sign in with Google</button>
      <button onClick={signInAnonymously} className={buttonClass}>Sign in anonymously</button>
    </div>
  )
}

function Logout(props) {
  const { user } = props;
  const logout = () => {
    auth.signOut();
  }

  return (
    <div>
      <label className='f6 b mb2 dib mr2'>
        User {user.uid}
      </label>
      <button className={buttonClass + ' dib'} onClick={logout}>Logout</button>
    </div>
  )
}

function _generateGameState(players) {
  let gameState = {
    players,
    state: State.TURN_START,
    turnOwnerIndex: 0,
    numStageCardsRequired: 0,
  };
  players.forEach(player => {      
    gameState[player] = {
      hand: ['1', '2', '3', '4', '5', '6'],
      stage: [],
      workstation: [],
    };
  });
  return gameState;
}

async function _createRoom(numPlayers) {
  const roomRef = firestore.collection('rooms').doc();

  if (numPlayers < 2 || numPlayers > 9) {
    throw new Error("Invalid number of players.");
  }

  await roomRef.set({
    'numPlayers': numPlayers,
    'createdAt': firebase.firestore.FieldValue.serverTimestamp(),
  });

  return roomRef;
}

async function _joinRoom(roomRef, uid, history) {
  const roomResp = await roomRef.get();
  if (!roomResp.exists) {        
    throw new Error("Invalid room.");
  }
  const room = roomResp.data();
  if (!room.players) room.players = [];
  let numPlayers = room.players.length;
  if (!room.players.includes(uid)) {
    numPlayers = room.players.push(uid);
  }
  if (numPlayers > room.numPlayers) {
    throw new Error("Room full.");
  }
  let updateDict = {};
  updateDict.players = room.players;
  if (numPlayers === room.numPlayers) {
    updateDict.gameState = _generateGameState(room.players);
  }
  await roomRef.update(updateDict);
  history.push('/' + roomRef.id);
}

function CreateRoom() {
  let history = useHistory();
  const [error, setError] = useState('');
  const [numPlayers, setNumPlayers] = useState(0);
  const { uid } = auth.currentUser;
  const createRoom = async (e) => {
    e.preventDefault();
    try {
      const roomRef = await _createRoom(numPlayers);
      await _joinRoom(roomRef, uid, history);
    } catch(e) {
      setError(e.toString());
    }
  }

  const handleChange = (e) => {
    setNumPlayers(e.target.value);
  }

  return (
    <div className=''>
      <label className='f6 b mb2 dib mr2'>
        Num players 
      </label>
      <input className='input-reset br3 ba b--black-20 pa2 mb2 dib w-20 h2 mr2' required type='number' onChange={handleChange} />
      <button className={buttonClass + ' dib'} onClick={createRoom}>Create Room</button>
      <small className='f6 black-60 db mb2'>{error}</small>
    </div>
  )
}

function JoinRoom() {
  const [error, setError] = useState('');
  const [code, setCode] = useState('')
  const { uid } = auth.currentUser;
  let history = useHistory();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const roomRef = firestore.collection('rooms').doc(code);
      await _joinRoom(roomRef, uid, history);
    } catch(e) {
      setError(e.toString());
    }
  }
  
  const handleChange = (e) => {
    setCode(e.target.value);
  }

  const inputClass = 'input-reset br3 ba b--black-20 pa2 mb2 dib w-50 h2 mr2';

  return (
    <form className='' onSubmit={handleSubmit}>
      <label className='f6 b mb2 dib mr2'>
        Code 
      </label>
      <input className={inputClass} type='text' required onChange={handleChange} />
      <button className={buttonClass + ' dib'} type='submit'>Join</button>{error}
      <small className='f6 black-60 db mb2'>{error}</small>
    </form>
  )
}

export { Home };
