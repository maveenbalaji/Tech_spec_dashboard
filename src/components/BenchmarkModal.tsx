import { useState } from "react";
import { benchmarkData } from "@/data/benchmark-data";

interface BenchmarkModalProps {
  serverLabel: string;
  onClose: () => void;
}

const BenchmarkModal = ({ serverLabel, onClose }: BenchmarkModalProps) => {
  const benchmark = benchmarkData.find((item) => item.serverLabel === serverLabel);

  if (!benchmark) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
        <h2 className="text-xl font-bold mb-4">CPU Benchmarks</h2>
        <p><strong>Server:</strong> {benchmark.serverLabel}</p>
        <p><strong>CPU:</strong> {benchmark.cpu}</p>
        <p><strong>Single-Core:</strong> {benchmark.singleCore}</p>
        <p><strong>Multi-Core:</strong> {benchmark.multiCore}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default BenchmarkModal;