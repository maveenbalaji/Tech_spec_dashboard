import { useState, Component, ReactNode } from "react";
import LatestProcessorsList from "@/pages/LatestProcessorsList";
import GpuList from "@/pages/GpuList";
import Tabs from "@/pages/Tab";
import Memory from "@/pages/Memory";
import Laptops from "@/pages/Laptops";
import Desktop from "@/pages/Desktop";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500">
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const Index = () => {
  const [view, setView] = useState<"processors" | "memory" | "desktop" | "gpu" | "tabs" | "laptops">("processors");

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 pt-2 pb-8">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0 flex space-x-8">
            <button
              className={`px-8 py-2 rounded-md ${view === "processors" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"} flex items-center`}
              onClick={() => setView("processors")}
            >
              Latest Processors List
            </button>
            <button
              className={`px-8 py-2 rounded-md ${view === "gpu" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"} flex items-center`}
              onClick={() => setView("gpu")}
            >
              GPU
            </button>
            <button
              className={`px-8 py-2 rounded-md ${view === "memory" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"} flex items-center`}
              onClick={() => setView("memory")}
            >
              Memory
            </button>
            <button
              className={`px-8 py-2 rounded-md ${view === "laptops" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"} flex items-center`}
              onClick={() => setView("laptops")}
            >
              Laptops
            </button>
            <button
              className={`px-8 py-2 rounded-md ${view === "desktop" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"} flex items-center`}
              onClick={() => setView("desktop")}
            >
              Desktop
            </button>
            <button
              className={`px-8 py-2 rounded-md ${view === "tabs" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
              onClick={() => setView("tabs")}
            >
              Tabs
            </button>
          </div>
        </header>

        {view === "processors" && <LatestProcessorsList />}
        {view === "gpu" && <GpuList />}
        {view === "memory" && <Memory />}
        {view === "desktop" && <Desktop />}
        {view === "tabs" && <Tabs />}
        {view === "laptops" && <Laptops />}
      </div>
    </ErrorBoundary>
  );
};

export default Index;
