    // src/App.tsx
    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
    import Home from './pages/Home';
    import Results from './pages/Results';
    // Import the PlanDetail page (we will create this file next)
    import PlanDetail from './pages/PlanDetail';
    import './App.css'; // Keep existing App CSS import if present

    // Create a client instance for React Query
    const queryClient = new QueryClient();

    /**
     * Main application component defining routes.
     */
    function App() {
    	return (
    		<QueryClientProvider client={queryClient}>
    			<Router>
    				<Routes>
    					{/* Route for the home page (input form) */}
    					<Route path="/" element={<Home />} />

    					{/* Route for the results page (displaying plan cards) */}
    					<Route path="/results" element={<Results />} />

    					{/* ** ADDED: Route for the plan detail page ** */}
    					{/* ':planId' is a URL parameter that will hold the specific plan's ID */}
    					<Route path="/plan/:planId" element={<PlanDetail />} />

                        {/* Optional: Add a catch-all route for 404 Not Found */}
                        {/* <Route path="*" element={<NotFoundPage />} /> */}
    				</Routes>
    			</Router>
    		</QueryClientProvider>
    	);
    }

    export default App;
    
