import { useState } from "react";
import { useHistory } from "react-router-dom";
import { auth, firebase, firestore } from "./Firebase";
import { State } from "./State";

function Home() {
  const user = auth.currentUser;

  return (
    <div>
      {user && <CreateRoom />}
      {user && <JoinRoom />}
      {user && <Logout user={user} />} 
      {!user && <Login />} 
    </div>
  )

}

function Login() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  const signInAnonymously = () => {
    auth.signInAnonymously();
  }

  return (
    <div>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
      <button onClick={signInAnonymously}>Sign in anonymously</button>
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
      User {user.uid}
      <button onClick={logout}>Logout</button>
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
  const createRoom = async () => {
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
    <div>
      <label>
        Num players <input required type='number' onChange={handleChange} />
      </label>
      <button onClick={createRoom}>Create Room</button>
      {error}
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

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Code <input type='text' required onChange={handleChange} />
        </label>
        <button type='submit'>Join</button>{error}
      </form>
    </div>
  )
}

export { Home };
