import AppRouter from "./routes/AppRouter";
import ErrorBoundary from "./components/common/ErrorBoundary";
import AvisosPWA from "./components/pwa/AvisosPWA";

function App() {
  return (
    <ErrorBoundary title="Error inesperado en SIGAE">
      <AppRouter />
      <AvisosPWA />
    </ErrorBoundary>
  );
}

export default App;