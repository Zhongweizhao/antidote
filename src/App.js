import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { auth } from './Firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Home } from './Home';
import { Room } from './Room';

function App() {
  const [user, loading, error] = useAuthState(auth);
  if (loading) {
    return (
      <div><p>Loading...</p></div>
    )
  } else if (error) {
    return (
      <div><p>Error: {error.toString()}</p></div>
    )
  }
  return (
    <Router>
      <Switch>
        <Route path='/' exact component={Home} />
        <Route path='/:roomId'>
          { user ? <Room /> : <Redirect to='/' />}
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
