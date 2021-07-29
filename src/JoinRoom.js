import { generateGameState } from "./GameState";
import { addLog } from "./Logs";

async function addPlayerToRoom(roomRef, uid, name) {
  const roomResp = await roomRef.get();
  if (!roomResp.exists) {        
    throw new Error("Invalid room.");
  }
  const room = roomResp.data();

  if (!room.players) room.players = [];
  let numPlayers = room.players.length;

  let updateDict = {};
  if (!room.players.includes(uid)) {
    numPlayers = room.players.push(uid);
    if (numPlayers > room.numPlayers) {
      throw new Error("Room full.");
    }

    if (!room.playerNames) room.playerNames = {};
    room.playerNames[uid] = name;
    updateDict.playerNames = room.playerNames;

    addLog(roomRef.id, room, `${uid} joined the game!`);
  }
  updateDict.players = room.players;

  if (numPlayers === room.numPlayers) {
    addLog(roomRef.id, room, 'Game Starts!');
    updateDict.gameState = generateGameState(room.players);
  }
  await roomRef.update(updateDict);
}

export { addPlayerToRoom };
