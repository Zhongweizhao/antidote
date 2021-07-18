import { useParams } from "react-router-dom";
import { RoomContext } from "./RoomContext";
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, firestore } from "./Firebase";
import { useContext } from "react";
import { Actions, needsAttention } from "./Actions";

function Room() {
  const { roomId } = useParams();
  const roomRef = firestore.collection('rooms').doc(roomId);
  const [room, loading, error] = useDocumentData(roomRef);
  return (
    <div>
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
          <RoomDetails />
          <hr /><hr />
          <hr /><hr />
          <Board />
        </RoomContext.Provider>
      }
    </div>
  )
}

function RoomDetails() {
  const { roomId, room } = useContext(RoomContext);

  return (
    <div>
      <div>Room {roomId}</div>
      <div>{room.numPlayers} players game</div>
      <div>Players: {room.players.join(', ')}</div>
    </div>
  )
}

function Board() {
  const myId = auth.currentUser.uid;
  const { room } = useContext(RoomContext);
  const notEnoughtPlayers = room.players.length < room.numPlayers;

  return (
    <div>
      { room.players.filter(p => p !== myId).map(p => <Player key={p} id={p} />)}
      { notEnoughtPlayers && <p>Waiting for more players.</p>}
      <p>----------------------------------------------</p>
      <Player key={myId} id={myId} />
      { !notEnoughtPlayers &&
        <div>
          <hr />
          <Actions />
        </div>
      }
    </div>
  )
}

function Player(props) {
  const { id } = props;
  const { room } = useContext(RoomContext);
  const { gameState } = room;
  const notEnoughtPlayers = room.players.length < room.numPlayers;

  if (notEnoughtPlayers) {
    return <div>Player {id}</div>
  }

  return (
    <div>
      { needsAttention(id) && "=>" }
      Player {id},
      hand: [{gameState[id].hand.join(', ')}],
      stage: [{gameState[id].stage.join(', ')}],
      workstation: [{gameState[id].workstation.join(', ')}],
    </div>
  )

}

export { Room };
