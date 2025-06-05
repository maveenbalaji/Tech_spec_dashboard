
import { useParams, Link } from "react-router-dom";
import { servers } from "@/data/servers";
import { Server } from "@/types/server";
import ProgressBar from "@/components/ProgressBar";
import { getTypeColor, getUtilizationColor, formatNumber } from "@/utils/server-utils";
import { 
  Server as ServerIcon, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Info,
  ArrowLeft,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ServerDetails = () => {
  const { id } = useParams();
  const server = servers.find((s) => s.id === Number(id));

  if (!server) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Server Not Found</h1>
        <p className="mb-8">The server you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const typeColor = getTypeColor(server.type);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" className="mb-6" asChild>
        <Link to="/">
          <ArrowLeft className="mr-2" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <ServerIcon className="h-8 w-8 text-blue-500" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{server.name}</h1>
              <Badge className="ml-2">{server.serverLabel}</Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Wifi className="h-4 w-4" />
              <span>{server.ipAddress}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline" className={`${typeColor} text-white px-3 py-1 text-sm`}>
            {server.type}
          </Badge>
          <Badge variant="outline" className="text-gray-500 px-3 py-1 text-sm">
            {server.usageYears} {server.usageYears === 1 ? "Year" : "Years"}
          </Badge>
          {server.dataAvailability && (
            <Badge variant="outline" className="text-blue-500 px-3 py-1 text-sm">
              {server.dataAvailability} Years of Data
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Database</div>
                  <div className="font-medium">{server.database}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Processor</div>
                  <div className="font-medium">{server.specifications.processor}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">CPU</div>
                  <div className="font-medium">{server.specifications.cores} Cores / {server.specifications.threads} Threads</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">RAM</div>
                  <div className="font-medium">{server.specifications.ram} GB</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Disk</div>
                  <div className="font-medium">{server.specifications.disk} TB</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Impact</div>
                  <div className="font-medium">{server.impact}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-semibold mb-2">Cache Memory</h3>
              <p className="text-sm">{server.specifications.cache}</p>
              <p className="text-sm mt-1">L1 Cache Per Core: {server.specifications.l1CachePerCore} KB</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilization (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className={`text-sm font-medium ${getUtilizationColor(server.utilization.cpu.avg)}`}>
                  {formatNumber(server.utilization.cpu.avg)}%
                </span>
              </div>
              <ProgressBar 
                value={server.utilization.cpu.avg} 
                min={server.utilization.cpu.min}
                avg={server.utilization.cpu.avg}
                max={server.utilization.cpu.max}
                showLabels={true}
                height="h-3"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className={`text-sm font-medium ${getUtilizationColor(server.utilization.memory.avg)}`}>
                  {formatNumber(server.utilization.memory.avg)}%
                </span>
              </div>
              <ProgressBar 
                value={server.utilization.memory.avg} 
                min={server.utilization.memory.min}
                avg={server.utilization.memory.avg}
                max={server.utilization.memory.max}
                showLabels={true}
                height="h-3"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-md">
              {server.applications}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServerDetails;
