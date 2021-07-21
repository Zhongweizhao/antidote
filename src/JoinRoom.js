import { generateGameState } from "./GameState";

async function addPlayerToRoom(roomRef, uid) {
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
  console.log(numPlayers, room.numPlayers);
  if (numPlayers === room.numPlayers) {
    updateDict.gameState = generateGameState(room.players);
  }
  await roomRef.update(updateDict);
}

export { addPlayerToRoom };
