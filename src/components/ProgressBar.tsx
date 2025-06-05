
import { getProgressColor } from "@/utils/server-utils";

interface ProgressBarProps {
  value: number;
  min?: number;
  avg?: number;
  max?: number;
  showLabels?: boolean;
  height?: string;
}

const ProgressBar = ({ 
  value, 
  min, 
  avg, 
  max, 
  showLabels = false,
  height = "h-2" 
}: ProgressBarProps) => {
  const barColor = getProgressColor(value);
  
  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div
          className={`${barColor} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
      
      {showLabels && min !== undefined && avg !== undefined && max !== undefined && (
        <div className="flex justify-between text-xs mt-1 text-gray-500">
          <span>Min: {min.toFixed(1)}%</span>
          <span>Avg: {avg.toFixed(1)}%</span>
          <span>Max: {max.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
