
export interface Server {
  id: number;
  serverLabel: string;
  name: string;
  usageYears: number;
  ipAddress: string;
  dataAvailability?: number | null;
  database: string;
  type: 'LIVE' | 'TEST' | 'TEST-SPARE';
  applications: string;
  impact: string;
  specifications: {
    processor: string;
    cores: number;
    threads: number;
    ram: number;
    disk: number;
    cache: string;
    l1CachePerCore: number;
  };
  utilization: {
    cpu: {
      min: number;
      avg: number;
      max: number;
    };
    memory: {
      min: number;
      avg: number;
      max: number;
    };
  };
}
