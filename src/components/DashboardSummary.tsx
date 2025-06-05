
import { useMemo } from "react";
import { Server } from "@/types/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server as ServerIcon, Database, Cpu, HardDrive, Zap } from "lucide-react";

interface DashboardSummaryProps {
  servers: Server[];
}

const DashboardSummary = ({ servers }: DashboardSummaryProps) => {
  const stats = useMemo(() => {
    const liveServers = servers.filter(s => s.type === "LIVE").length;
    const testServers = servers.filter(s => s.type === "TEST" || s.type === "TEST-SPARE").length;
    
    const totalRam = servers.reduce((sum, server) => sum + server.specifications.ram, 0);
    const totalDisk = servers.reduce((sum, server) => sum + server.specifications.disk, 0);
    const totalCores = servers.reduce((sum, server) => sum + server.specifications.cores, 0);
    
    const avgCpuUsage = servers.reduce((sum, server) => sum + server.utilization.cpu.avg, 0) / servers.length;
    const avgMemoryUsage = servers.reduce((sum, server) => sum + server.utilization.memory.avg, 0) / servers.length;
    
    const highCpuServers = servers.filter(s => s.utilization.cpu.avg > 70).length;
    const highMemoryServers = servers.filter(s => s.utilization.memory.avg > 70).length;
    
    return {
      totalServers: servers.length,
      liveServers,
      testServers,
      totalRam,
      totalDisk,
      totalCores,
      avgCpuUsage,
      avgMemoryUsage,
      highCpuServers,
      highMemoryServers
    };
  }, [servers]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
          <ServerIcon className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalServers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.liveServers} Live / {stats.testServers} Test
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
          <Database className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <div>
              <div className="text-2xl font-bold">{Math.round(stats.totalRam)} GB</div>
              <p className="text-xs text-muted-foreground">RAM</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(stats.totalDisk)} TB</div>
              <p className="text-xs text-muted-foreground">Storage</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processing Power</CardTitle>
          <Cpu className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCores}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total CPU Cores
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utilization Alerts</CardTitle>
          <Zap className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.highCpuServers + stats.highMemoryServers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.highCpuServers} CPU / {stats.highMemoryServers} Memory
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
