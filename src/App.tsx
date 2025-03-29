import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import Results from './pages/Results';// Create a client
const queryClient = new QueryClient();
function App() {
return (
<QueryClientProvider client={queryClient}>
<Router>
<Routes>
<Route path="/" element={<Home />} />
<Route path="/results" element={<Results />} />
</Routes>
</Router>
</QueryClientProvider>
);
}
export default App;
