import React, { useState } from "react";
import CSVUploader from "./components/CSVUploader";
import BadgerTable from "./components/BadgerTable";
import SearchFilter from "./components/SearchFilter";
import { FileSpreadsheet } from "lucide-react";
import { useWebSocket } from "./hooks/useWebSocket";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // WebSocket connection
  useWebSocket("ws://localhost:8000/ws/results/", (msg) => {
    if (msg.type === "task.complete") {
      console.log("Task completed:", msg);
      setRefreshTrigger((prev) => prev + 1);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700">
      {/* Header */}
      <header className="text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <FileSpreadsheet className="w-10 h-10" />
            <h1 className="text-4xl font-bold">CSV Analyzer</h1>
          </div>
          <p className="text-lg opacity-90">
            Upload and analyze your parts inventory data
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {/* Upload Section */}
        <section className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Upload CSV File
          </h2>
          <CSVUploader onUploadSuccess={handleUploadSuccess} />
        </section>

        {/* Results Section */}
        <section className="bg-white rounded-xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
            <h2 className="text-2xl font-semibold text-gray-800">
              Analysis Results
            </h2>
            <SearchFilter onSearch={handleSearch} />
          </div>

          <BadgerTable
            searchTerm={searchTerm}
            refreshTrigger={refreshTrigger}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
