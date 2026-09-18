import Onboarding from "./components/Onboarding";
import QuizView from "./components/QuizView";
import ResultsDashboard from "./components/ResultsDashboard";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const screen = useAppStore((s) => s.screen);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      {screen === "welcome" && <Onboarding />}
      {screen === "quiz" && <QuizView />}
      {screen === "results" && <ResultsDashboard />}
    </main>
  );
}