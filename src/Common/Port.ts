export type PortInfo = {
  protocol: string;
  localIp: string;
  externalIp: string;
  status: string;
  pId: string;
  localPort: number;
  externalPort: number;
};

export type ProcessInfo = {
  pName?: string; // 映像名称
  pId: string; //pId
  pSessionName?: string; // 会话名
  pSeeion?: string; // 会话
  memoryUsage?: string; // 内存使用
};
