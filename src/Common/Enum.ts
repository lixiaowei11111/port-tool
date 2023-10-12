import { NativeImage } from 'electron';

export enum DataTypeEnum {
  SEARCH_PORT = 'data:search_port', // 数据传输
}
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
  filePath?: string; // 路径
  icon?: string;
};

export type ProcessDetailInfo = {
  pId: number; //
  port: number; //
  programName?: string;
  filePath?: string;
};
