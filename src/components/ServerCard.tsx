import { Server } from "@/types/server";
import ProgressBar from "./ProgressBar";
import { getUtilizationColor, formatNumber } from "@/utils/server-utils";

interface ServerCardProps {
  server: Server;
}

const ServerCard = ({ server }: ServerCardProps) => {
  return (
    <tr className="border-b hover:bg-gray-100">
      <td className="px-4 py-2">{server.name}</td>
      <td className="px-4 py-2">
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
            server.type === "LIVE"
              ? "bg-green-500 text-white"
              : server.type === "TEST"
              ? "bg-yellow-500 text-white"
              : "bg-gray-500 text-white"
          }`}
        >
          {server.type}
        </span>
      </td>
      <td className="px-4 py-2">{server.ipAddress}</td>
      <td className="px-4 py-2">{server.database}</td>
      <td className="px-4 py-2">{server.specifications.processor}</td>
      <td className="px-4 py-2">{server.specifications.cores}</td>
      <td className="px-4 py-2">{server.specifications.threads}</td>
      <td className="px-4 py-2">{server.specifications.ram}</td>
      <td className="px-4 py-2">{server.specifications.disk}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${getUtilizationColor(server.utilization.cpu.avg)}`}
          >
            {formatNumber(server.utilization.cpu.avg)}%
          </span>
          <ProgressBar
            value={server.utilization.cpu.avg}
            min={server.utilization.cpu.min}
            avg={server.utilization.cpu.avg}
            max={server.utilization.cpu.max}
            showLabels={false}
            height="h-2"
          />
        </div>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${getUtilizationColor(server.utilization.memory.avg)}`}
          >
            {formatNumber(server.utilization.memory.avg)}%
          </span>
          <ProgressBar
            value={server.utilization.memory.avg}
            min={server.utilization.memory.min}
            avg={server.utilization.memory.avg}
            max={server.utilization.memory.max}
            showLabels={false}
            height="h-2"
          />
        </div>
      </td>
      <td className="px-4 py-2">
        <a href={`/server/${server.id}`} className="text-blue-500 hover:text-blue-700 underline">
          View Details
        </a>
      </td>
    </tr>
  );
};

export default ServerCard;