import { useContext } from "react";
import { firestore, firebase } from "./Firebase";
import { RoomContext } from "./RoomContext";
import { useCollectionData } from 'react-firebase-hooks/firestore';

async function addLog(roomId, room, content) {
  // console.log(roomId, room, content);
  if (room.playerNames) {
    Object.entries(room.playerNames).forEach(([k, v]) => {
      content = content.replace(k, `<b>${v}</b>`);
    });
  }
  const logRef = firestore.collection('rooms').doc(roomId).collection('logs').doc();
  await logRef.set({
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    content,
  });
}

function Logs() {
  const { roomId} = useContext(RoomContext);
  const logsCollection = firestore.collection('rooms').doc(roomId).collection('logs').orderBy("createdAt", "desc");;
  const [logs, loading, error] = useCollectionData(logsCollection);
  // console.log(logs, loading, error);
  // const [log, setLog] = useState('');
  // const handleChange = (e) => {
  //   e.preventDefault();
  //   setLog(e.target.value);
  // }
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!log) return;
  //   await addLog(roomId, room, log);
  // }
  return (
    <div className='pv1 ph6 ph1-m'>
      <div className='h4 overflow-y-scrol logs'>
      { logs &&
        logs.map(log => <Log log={log} key={log.createdAt}></Log>)
      }
      {
        loading && <span>Loading</span>
      }
      {
        error && <span>{JSON.stringify(error)}</span>
      }
      </div>
      {/* <form onSubmit={handleSubmit}>
        <input type='text' onChange={handleChange} />
        <button type='submit'>add log</button>
      </form> */}
    </div>
  )
}

function Log(props) {
  const { log } = props;
  return (
    <div className=''>
      <span dangerouslySetInnerHTML={{__html: log.content}}></span>
    </div>
  )
}

export { Logs, addLog };
