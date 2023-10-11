import childProcess from 'node:child_process';
import chalk from 'chalk';

import { PortInfo, ProcessInfo } from '@/Common/Port';

const platform = process.platform;

function getWinPortByURL(ip: string): number {
  /* win下使用 nerstat -ano的IP有三种形式: 127.0.0.1:123 是本地回环地址只能在本机进行通信；[::]:123 [::1]:1212 是IPv6通配地址，可以接受来自任何IPv6地址的连接；0.0.0.0:123 是IPv4通配地址 */
  const urlObjectList = ip.match(/:(\d+)$/);
  if (!urlObjectList) return -1;
  const port = Number(urlObjectList[1]);
  return isNaN(port) ? -1 : port;
}

function decodeWinStdoutGBK(stdout: Buffer) {
  const decoder = new TextDecoder('GBK');
  return decoder.decode(stdout);
}

function getProgramNameByPID(pid: string): Promise<ProcessInfo> {
  if (!pid) return Promise.reject('pid 无效');
  return new Promise<ProcessInfo>((resolve, reject) => {
    const command = `tasklist /FI "pId eq ${pid}"`;
    childProcess.exec(command, { encoding: 'buffer' }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        const processInfoList = decodeWinStdoutGBK(stdout)
          ?.split('\n')[3]
          ?.split(/\s+/);
        if (processInfoList) {
          const [pName, pId, pSessionName, pSeeion, memoryUsage] =
            processInfoList;
          const processInfo = {
            pName,
            pSeeion,
            pId,
            pSessionName,
            memoryUsage,
          };
          resolve(processInfo);
        } else {
          reject(`processInfoList不存在,${decodeWinStdoutGBK(stdout)}`);
        }
      }
    });
  });
}

export function getSystemPortUsage(
  port?: number | Array<number>,
): Promise<Array<ProcessInfo & PortInfo>> {
  const command = 'netstat -ano';
  return new Promise<Array<ProcessInfo & PortInfo>>((resolve, rejects) => {
    childProcess.exec(
      command,
      { encoding: 'buffer' },
      async (error, stdout) => {
        if (error) {
          rejects(
            new Error(chalk.whiteBright.bgRed.bold('get port fail' + error)),
          );
        }
        const portList: Array<PortInfo> = [];
        const lineList = decodeWinStdoutGBK(stdout)?.split('\r\n');
        for (let i = 4; i < lineList.length; i++) {
          const portLine = lineList[i].trim();
          if (portLine) {
            const tempPortInfo = portLine.split(/\s+/);
            if (tempPortInfo.length === 4) {
              // win需要考虑到status为空的情况,所以需要判断portLine的长度,如果长度不为5则需要在index=3时,补充上status的信息为''
              tempPortInfo.splice(3, 0, '');
            }
            const [protocol, localIp, externalIp, status, pId] = tempPortInfo;
            const portInfo: PortInfo = {
              protocol,
              localIp,
              localPort: getWinPortByURL(localIp),
              externalIp,
              externalPort: getWinPortByURL(externalIp),
              status,
              pId,
            };

            portList.push(portInfo);
          }
        }
        // 指定端口
        let showPortList: Array<PortInfo> = [];
        if ('number' === typeof port) {
          showPortList = portList.filter((item: PortInfo) =>
            item.localPort.toString().includes(port.toString()),
          );
        } else if (Array.isArray(port)) {
          showPortList = port.reduce(
            (
              accumulator: Array<PortInfo>,
              currentValue: number,
              _currentIndex,
            ) => {
              const matchPortInfo = portList.find((item: PortInfo) =>
                item.localPort.toString().includes(currentValue.toString()),
              );
              matchPortInfo && accumulator.push(matchPortInfo);
              return accumulator;
            },
            [],
          );
        } else if (!port) {
          showPortList = portList;
        }
        // 异步获取每个端口对应的程序名称
        const promiseList = showPortList.map(async (portInfo) => {
          try {
            const processInfo = await getProgramNameByPID(portInfo.pId);
            portInfo = Object.assign(portInfo, processInfo);
          } catch (err) {
            console.log(`获取PID${portInfo.pId}进程信息失败,${err}`);
          }
        });
        await Promise.allSettled(promiseList);
        console.log(port, 'port.ts port');
        console.log(showPortList, 'port.ts showPortList');

        resolve(showPortList);
      },
    );
  });
}
// (async function main() {
//   const list = await getSystemPortUsage(3306);
// })();
