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
  const redirect = (new URL(window.location.href)).searchParams.get('redirect');

  return (
    <Router>
      <Switch>
        <Route path='/' exact>
          { user && redirect ? <Redirect to={redirect} /> : <Home />}
        </Route>
        <Route path='/:roomId'>
          { user ? <Room /> : <Redirect to={'/?redirect=' + encodeURIComponent(window.location.pathname)} />}
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
