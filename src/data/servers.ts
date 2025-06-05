
import { Server } from "@/types/server";

export const servers: Server[] = [
  {
    id: 1,
    serverLabel: "SHAREPOINTTEST",
    name: "SHAREPOINT TESTINGS",
    usageYears: 2,
    ipAddress: "192.168.12.228",
    dataAvailability: 1,
    database: "SQL SERVER 2019",
    type: "TEST",
    applications: "SHAREPOINT TEST, wsp@efftronics onpremises powerbi gw, armdl, AOI, NMDLTEST",
    impact: "R&D",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2336 CPU @ 2.90GHz",
      cores: 6,
      threads: 12,
      ram: 16,
      disk: 1,
      cache: "L1: 640 kb - 80 Kb (per core), L2: 4mb -512 Kb (per core), L3: 16mb (shared)",
      l1CachePerCore: 80
    },
    utilization: {
      cpu: {
        min: 0.17,
        avg: 2.34,
        max: 60.5
      },
      memory: {
        min: 26.9,
        avg: 84.6,
        max: 94
      }
    }
  },
  {
    id: 2,
    serverLabel: "EFF-SRV-017",
    name: "MESH (CDATEST)-LIVE",
    usageYears: 3,
    ipAddress: "192.168.0.165",
    dataAvailability: 2,
    database: "Oracle 19C Ent",
    type: "LIVE",
    applications: "Mesh services IS Running For cda",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2388G CPU @ 3.20GHz",
      cores: 8,
      threads: 16,
      ram: 96,
      disk: 8,
      cache: "L1: 640 kb - 80 Kb (per core), L2: 4mb -512 Kb (per core), L3: 16mb (shared)",
      l1CachePerCore: 80
    },
    utilization: {
      cpu: {
        min: 0.3,
        avg: 11.6,
        max: 89.4
      },
      memory: {
        min: 57.9,
        avg: 76.3,
        max: 89.1
      }
    }
  },
  {
    id: 3,
    serverLabel: "EFF-SRV-016",
    name: "Building NMDL Test (MSSQL Building Test)",
    usageYears: 3,
    ipAddress: "192.168.0.164",
    dataAvailability: 4,
    database: "SqlServer 2019 Ent",
    type: "TEST",
    applications: "SQLSERVER 2019 ENT, Sigtestings sql dbs",
    impact: "CDA, SIGSW",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2388G CPU @ 3.20GHz",
      cores: 8,
      threads: 16,
      ram: 32,
      disk: 10,
      cache: "L1: 640 kb - 80 Kb (per core), L2: 4mb -512 Kb (per core), L3: 16mb (shared)",
      l1CachePerCore: 80
    },
    utilization: {
      cpu: {
        min: 0.4,
        avg: 3.66,
        max: 99.6
      },
      memory: {
        min: 23.2,
        avg: 80.2,
        max: 89.4
      }
    }
  },
  {
    id: 4,
    serverLabel: "EFF-SRV-018",
    name: "Nirdesh-Application Server",
    usageYears: 3,
    ipAddress: "192.168.0.166",
    dataAvailability: null,
    database: "Firebird 2.5, IIS Express",
    type: "LIVE",
    applications: "ASYNC APPLICATION SERVER for all building lightings controllers",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2388G CPU @ 3.20GHz",
      cores: 8,
      threads: 16,
      ram: 48,
      disk: 0.5,
      cache: "L1: 640 kb - 80 Kb (per core), L2: 4mb -512 Kb (per core), L3: 16mb (shared)",
      l1CachePerCore: 80
    },
    utilization: {
      cpu: {
        min: 0.3,
        avg: 4.8,
        max: 37.6
      },
      memory: {
        min: 9.6,
        avg: 66.4,
        max: 99.9
      }
    }
  },
  {
    id: 5,
    serverLabel: "EFF-SRV-013",
    name: "ORCL-LIVE (SIGSWLIVE)",
    usageYears: 3,
    ipAddress: "192.168.0.167",
    dataAvailability: 2,
    database: "Oracle 19C Ent",
    type: "LIVE",
    applications: "ORACLE 19 C service, RMAN backup, For Signalling Software-Central user",
    impact: "R&D",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2388G CPU @ 3.20GHz",
      cores: 8,
      threads: 16,
      ram: 64,
      disk: 12,
      cache: "L1: 640 kb - 80 Kb (per core), L2: 4mb -512 Kb (per core), L3: 16mb (shared)",
      l1CachePerCore: 80
    },
    utilization: {
      cpu: {
        min: 3.8,
        avg: 7.15,
        max: 16.36
      },
      memory: {
        min: 91.9,
        avg: 92.9,
        max: 92.82
      }
    }
  },
  {
    id: 6,
    serverLabel: "EFF-SRV-014",
    name: "GIT (Project Management)",
    usageYears: 3,
    ipAddress: "192.168.0.138",
    dataAvailability: 4,
    database: "POSTGRES",
    type: "LIVE",
    applications: "skid, rail, puma, nginx, redis, postgresql, sidekiq, promwtheus",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2388G CPU @ 3.20GHz",
      cores: 8,
      threads: 16,
      ram: 32,
      disk: 2,
      cache: "L1: 640 kb - 80 Kb (per core), L2: 4mb -512 Kb (per core), L3: 16mb (shared)",
      l1CachePerCore: 80
    },
    utilization: {
      cpu: {
        min: 0.5,
        avg: 1.2,
        max: 43.3
      },
      memory: {
        min: 47.2,
        avg: 59.3,
        max: 71
      }
    }
  },
  {
    id: 7,
    serverLabel: "EFF-SRV-015",
    name: "NEWBUILDING-NEWNMDLDLWISE (Kumari Chandana test)",
    usageYears: 3,
    ipAddress: "192.168.0.103",
    dataAvailability: 1,
    database: "SQL Ent 2019",
    type: "TEST",
    applications: "Newbuilding nmdl parallel server, Sql 2019 ent services",
    impact: "NO",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2388G CPU @ 3.20GHz",
      cores: 8,
      threads: 16,
      ram: 32,
      disk: 1,
      cache: "L1: 640 kb - 80 Kb (per core), L2: 4mb -512 Kb (per core), L3: 16mb (shared)",
      l1CachePerCore: 80
    },
    utilization: {
      cpu: {
        min: 0.09,
        avg: 1.66,
        max: 16.68
      },
      memory: {
        min: 85.06,
        avg: 90.2,
        max: 98.5
      }
    }
  },
  {
    id: 8,
    serverLabel: "EFF-SRV-012",
    name: "BUILDING NMDL",
    usageYears: 3,
    ipAddress: "192.168.0.104",
    dataAvailability: 1,
    database: "SQL SERVER 2019",
    type: "LIVE",
    applications: "Building NMDL Application",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2388G CPU @ 3.20GHz",
      cores: 8,
      threads: 16,
      ram: 64,
      disk: 8,
      cache: "L1: 640 kb - 80 Kb (per core), L2: 4mb -512 Kb (per core), L3: 16mb (shared)",
      l1CachePerCore: 80
    },
    utilization: {
      cpu: {
        min: 1.2,
        avg: 10.9,
        max: 100
      },
      memory: {
        min: 48.1,
        avg: 86.6,
        max: 94.4
      }
    }
  },
  {
    id: 9,
    serverLabel: "EFF-SRV-011",
    name: "BIG DATA DB (SIGSWTEST)",
    usageYears: 4,
    ipAddress: "192.168.0.105",
    dataAvailability: 3,
    database: "Oracle 19C Ent",
    type: "TEST",
    applications: "ORDS- Midvally, Central JSON ORDS test",
    impact: "MD sir house Midvally APP (Wireless)",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2226G CPU @ 3.40GHz",
      cores: 6,
      threads: 6,
      ram: 64,
      disk: 1,
      cache: "L1: 384Kb, L2: 1.5mb, L3: 12Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 6.2,
        avg: 9.6,
        max: 89.3
      },
      memory: {
        min: 25.2,
        avg: 77.6,
        max: 90.1
      }
    }
  },
  {
    id: 10,
    serverLabel: "EFF-SRV-010",
    name: "MSPROJECT",
    usageYears: 4,
    ipAddress: "192.168.12.250",
    dataAvailability: 1,
    database: "SQL SERVER 2019",
    type: "LIVE",
    applications: "MSProject, Microsoft Project app services",
    impact: "N/A",
    specifications: {
      processor: "Intel(R) Xeon(R) E-2136 CPU @ 3.30GHz",
      cores: 6,
      threads: 12,
      ram: 64,
      disk: 1.5,
      cache: "L1: 384Kb, L2: 1.5 Mb, L3: 12Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 0.2,
        avg: 3.5,
        max: 97.9
      },
      memory: {
        min: 63.2,
        avg: 74.1,
        max: 92.4
      }
    }
  },
  {
    id: 11,
    serverLabel: "EFF-SRV-002",
    name: "BKPNAS (Storage backups)",
    usageYears: 6,
    ipAddress: "192.168.0.111",
    dataAvailability: 35,
    database: "FileService",
    type: "LIVE",
    applications: "FILESERVICE (Veritas Backup EXE), SQLService express Ed 2014",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) Silver 4114 CPU @ 2.20GH",
      cores: 20,
      threads: 40,
      ram: 64,
      disk: 52,
      cache: "L1:1.3 Mb, L2:20 Mb , L3 : 27.5 Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 3.5,
        avg: 6.5,
        max: 18.8
      },
      memory: {
        min: 23.2,
        avg: 39.8,
        max: 76.3
      }
    }
  },
  {
    id: 12,
    serverLabel: "EFF-SRV-001",
    name: "STORAGE (ESPL Dept Data)",
    usageYears: 6,
    ipAddress: "192.168.0.22",
    dataAvailability: 35,
    database: "FileService",
    type: "LIVE",
    applications: "FILESERVICE, Delpho tokhyo licence service, Enterprice architect licence services, Varitas backup agent",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) Silver 4114 CPU @ 2.20GHz",
      cores: 20,
      threads: 40,
      ram: 64,
      disk: 37,
      cache: "L1:1.3 Mb, L2:20 Mb , L3 : 23.5 Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 1.2,
        avg: 7.2,
        max: 27.2
      },
      memory: {
        min: 37.2,
        avg: 54.9,
        max: 98.6
      }
    }
  },
  {
    id: 13,
    serverLabel: "EFF-SRV-003",
    name: "WEB SERVER",
    usageYears: 6,
    ipAddress: "192.168.0.155",
    dataAvailability: 7,
    database: "SqlServer 2019 Ent, PostGre 11Ver",
    type: "LIVE",
    applications: "IIS: Web applications, MIS, OT, EMP Pages, Sql server service, PostGre service, Auto desk 2017 Licence Server service, KEIL Licence, TAMS, IREPS, xlite FTP, Tenders.pY, vms Routing App",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) Silver 4215 CPU @ 2.50GHz x 2",
      cores: 16,
      threads: 32,
      ram: 96,
      disk: 2,
      cache: "L1: 512 Kb, L2: 8 Mb, L3: 11Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 2.9,
        avg: 8.1,
        max: 67.3
      },
      memory: {
        min: 37.3,
        avg: 45.6,
        max: 67.6
      }
    }
  },
  {
    id: 14,
    serverLabel: "EFF-SRV-004",
    name: "ESPLDB (Oracle Finance)",
    usageYears: 6,
    ipAddress: "192.168.0.80",
    dataAvailability: 15,
    database: "ORacle 11G Standard",
    type: "LIVE",
    applications: "oracle 11g, DB, KEIL MDK licence service, Cashflow, CSONLINE, TAMS, Mobileapps user",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) Silver 4215 CPU @ 2.50GHz",
      cores: 8,
      threads: 16,
      ram: 96,
      disk: 1,
      cache: "L1: 512 Kb, L2: 8 Mb, L3: 11Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 1,
        avg: 19.2,
        max: 99.9
      },
      memory: {
        min: 74.7,
        avg: 76.2,
        max: 81.2
      }
    }
  },
  {
    id: 15,
    serverLabel: "EFF-SRV-008",
    name: "BC (Business central)",
    usageYears: 6,
    ipAddress: "192.168.0.19",
    dataAvailability: 18,
    database: "SqlServer 2019 Ent",
    type: "LIVE",
    applications: "SQL server 2019 ENT, Business central 2016 service, PROJECT Professional Service",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) Silver 4215 CPU @ 2.50GHz",
      cores: 8,
      threads: 16,
      ram: 192,
      disk: 11,
      cache: "L1: 512 Kb, L2: 8 Mb, L3: 11Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 0.6,
        avg: 25.2,
        max: 100
      },
      memory: {
        min: 36.9,
        avg: 88.4,
        max: 98.5
      }
    }
  },
  {
    id: 16,
    serverLabel: "EFF-SRV-005",
    name: "HRM",
    usageYears: 6,
    ipAddress: "192.168.0.24",
    dataAvailability: 2,
    database: "SqlServer 2019 Ent",
    type: "LIVE",
    applications: "SQLSERVER 2019 ENT service adrilina (New payroll) related data storing",
    impact: "HR",
    specifications: {
      processor: "Intel(R) Xeon(R) Silver 4208 CPU @ 2.10GHz",
      cores: 8,
      threads: 16,
      ram: 128,
      disk: 0.556,
      cache: "L1: 512 Kb, L2: 8 Mb, L3: 11Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 0.8,
        avg: 3.5,
        max: 19.7
      },
      memory: {
        min: 40.4,
        avg: 41.1,
        max: 42.1
      }
    }
  },
  {
    id: 17,
    serverLabel: "EFF-SRV-006",
    name: "INTRANET (Sharepoint)",
    usageYears: 6,
    ipAddress: "192.168.0.23",
    dataAvailability: 15,
    database: "SqlServer 2019 Ent",
    type: "LIVE",
    applications: "SQLSERVER 2019 ENT, ISP lever clasic licence service, Sharepoint SERVICE, IIS of employee pages, knowledgebase, links, ot, sprax server services (UML), wsp@efftronics.com on premiss powerbi Gw",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) Silver 4215 CPU @ 2.50GHz",
      cores: 8,
      threads: 16,
      ram: 128,
      disk: 3,
      cache: "L1: 512 Kb, L2: 8 Mb, L3: 11Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 5.6,
        avg: 11.3,
        max: 38.6
      },
      memory: {
        min: 32.2,
        avg: 60.6,
        max: 76.7
      }
    }
  },
  {
    id: 18,
    serverLabel: "EFF-SRV-007",
    name: "BDC (Backup Active Directory)",
    usageYears: 6,
    ipAddress: "192.168.0.10",
    dataAvailability: 10,
    database: "Kerberos, LDAP",
    type: "LIVE",
    applications: "Backup Active Directory Service, MIS powerBi gateway, Stas, DHCP service, Sophos antivirus sync, DNS, group policy",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) Silver 4208 CPU @ 2.10GHz",
      cores: 8,
      threads: 16,
      ram: 128,
      disk: 0.556,
      cache: "L1: 512 Kb, L2: 8 Mb, L3: 11Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 8.5,
        avg: 16.3,
        max: 86.4
      },
      memory: {
        min: 49.7,
        avg: 55.6,
        max: 91.6
      }
    }
  },
  {
    id: 19,
    serverLabel: "EFF-CPU-546",
    name: "ERPSERVER (ERP)",
    usageYears: 7,
    ipAddress: "192.168.0.72",
    dataAvailability: 18,
    database: "sqlServer 2016 Stand",
    type: "LIVE",
    applications: "SQLSERVER 2016 STANDARD server service, SSRS REPORTS, MIS REPORTS, Dynamicsnav client, IR1@efftronics.com personal Gw",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) CPU E5-2667 v4 @ 3.20GHz",
      cores: 8,
      threads: 16,
      ram: 80,
      disk: 6,
      cache: "L1: 512 Kb, L2: 2 Mb, L3: 25 Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 0.9,
        avg: 7.4,
        max: 98.8
      },
      memory: {
        min: 18.7,
        avg: 82.8,
        max: 99.9
      }
    }
  },
  {
    id: 20,
    serverLabel: "EFF-CPU-395",
    name: "WSP2020 (Payroll Database)",
    usageYears: 13,
    ipAddress: "192.168.0.132",
    dataAvailability: 15,
    database: "SqlServer 2019 Ent",
    type: "TEST",
    applications: "SQLSERVER 2019 ENT, Oracle xe payroll service, PowerBi report service, Finance on-primisses gateway service, SFTP for Site",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) CPU X5687 @ 3.60GHz",
      cores: 4,
      threads: 8,
      ram: 40,
      disk: 1.8,
      cache: "L1: 256 Kb, L2: 1 Mb, L3: 12Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 5.2,
        avg: 8.8,
        max: 67.7
      },
      memory: {
        min: 53.4,
        avg: 58.9,
        max: 77.2
      }
    }
  },
  {
    id: 21,
    serverLabel: "EFF-CPU-411",
    name: "PDC (Main Active Directory)",
    usageYears: 13,
    ipAddress: "192.168.0.9",
    dataAvailability: 10,
    database: "Kerberos, LDAP",
    type: "LIVE",
    applications: "Actieve Directory Service, DNS, group policy",
    impact: "Entire Organization",
    specifications: {
      processor: "Intel(R) Xeon(R) CPU X5650 @ 2.67GHz",
      cores: 6,
      threads: 12,
      ram: 64,
      disk: 1.5,
      cache: "L1: 384Kb, L2: 1.5 Mb, L3: 12Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 7.1,
        avg: 24.2,
        max: 50.4
      },
      memory: {
        min: 66.9,
        avg: 74.1,
        max: 97.6
      }
    }
  },
  {
    id: 22,
    serverLabel: "EFF-SRV-009",
    name: "CNA (MSSQL TEST)",
    usageYears: 15,
    ipAddress: "192.168.0.28",
    dataAvailability: 2,
    database: "SqlServer 2019 Ent",
    type: "TEST",
    applications: "SQLSERVER 2019 ENT services, IR@Efftronics Powerbi personal Gateway, Building Application service",
    impact: "CS PMS, Site Engineers, Saivamsi, DQA Team",
    specifications: {
      processor: "Intel(R) Xeon(R) CPU X5680 @ 3.33GHz",
      cores: 6,
      threads: 12,
      ram: 64,
      disk: 1,
      cache: "L1: 384 Kb, L2: 1.5 Mb, L3: 12 Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 1.08,
        avg: 18.4,
        max: 100
      },
      memory: {
        min: 98.1,
        avg: 11.79,
        max: 70.22
      }
    }
  },
  {
    id: 23,
    serverLabel: "EFF-CPU-328",
    name: "ERP2020 (ERP TEST)",
    usageYears: 15,
    ipAddress: "192.168.0.73",
    dataAvailability: 3,
    database: "SqlServer 2019 Ent",
    type: "TEST",
    applications: "SQL 2019 ENT service, Adrilina test setup, erptest setup, onpremises powerbi Gateway (erp)",
    impact: "HR, DT1",
    specifications: {
      processor: "Intel(R) Xeon(R) CPU X5650 @ 2.67GHz",
      cores: 6,
      threads: 12,
      ram: 32,
      disk: 5,
      cache: "L1: 384Kb, L2: 1.5mb, L3: 12Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 1.2,
        avg: 5,
        max: 51
      },
      memory: {
        min: 77.8,
        avg: 81.2,
        max: 90.1
      }
    }
  },
  {
    id: 24,
    serverLabel: "EFF-CPU-325",
    name: "ORCL TEST (2010 OLD Server) - Spare",
    usageYears: 15,
    ipAddress: "192.168.0.100",
    dataAvailability: null,
    database: "NA",
    type: "TEST-SPARE",
    applications: "NA",
    impact: "NA",
    specifications: {
      processor: "Intel(R) Xeon(R) CPU E5620 @ 2.40GHz",
      cores: 4,
      threads: 8,
      ram: 32,
      disk: 13,
      cache: "L1: 256 Kb, L2: 1 Mb, L3: 12Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 1.3,
        avg: 5.1,
        max: 64.9
      },
      memory: {
        min: 12.5,
        avg: 76.9,
        max: 85.4
      }
    }
  },
  {
    id: 25,
    serverLabel: "EFF-CPU-330",
    name: "ESPLPLAN (2008 OLD Server) - Pads License Utilities",
    usageYears: 15,
    ipAddress: "192.168.0.29",
    dataAvailability: null,
    database: "Sql Server Express 2008",
    type: "TEST",
    applications: "PS8, DELPHI2010 LICENSES, MYDATAMACHINE, PADS License",
    impact: "SIGSW, Production",
    specifications: {
      processor: "Intel(R) Xeon(R) CPU X5650 @ 2.67GHz",
      cores: 6,
      threads: 12,
      ram: 16,
      disk: 0.28,
      cache: "L1: 512 Kb, L2: 8 Mb, L3: 11Mb",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 1.5,
        avg: 4.2,
        max: 14.7
      },
      memory: {
        min: 90.5,
        avg: 94.1,
        max: 98.8
      }
    }
  },
  {
    id: 26,
    serverLabel: "EFF-CPU-327",
    name: "CRM",
    usageYears: 15,
    ipAddress: "192.168.0.75",
    dataAvailability: null,
    database: "SqlServer 2019 Ent",
    type: "TEST",
    applications: "SQL server 2019 ENT, Business central test service, Altium licence manager, iot@efftronicssystems.onmicrosoft.com personal gateway is running",
    impact: "Layouts Dept, DT1",
    specifications: {
      processor: "Intel(R) Xeon(R) CPU X5650 @ 2.67GHz",
      cores: 6,
      threads: 12,
      ram: 64,
      disk: 7.5,
      cache: "L1: 384 kb - 80 Kb (per core), L2: 1.5mb -512 Kb (per core), L3: 12mb (shared)",
      l1CachePerCore: 64
    },
    utilization: {
      cpu: {
        min: 6.6,
        avg: 11.3,
        max: 85.1
      },
      memory: {
        min: 37.4,
        avg: 58.8,
        max: 86.6
      }
    }
  }
];
