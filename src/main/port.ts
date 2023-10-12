import { exec, type ExecOptions } from 'node:child_process';
import chalk from 'chalk';
import { PortInfo, ProcessInfo } from '@/common/Enum';
import { nativeImage, app, NativeImage } from 'electron';

const platform = process.platform;

export function execPromise(
  command: string,
  options: {
    encoding: 'buffer' | null;
  } & ExecOptions,
): Promise<{ stdout: Buffer; stderr: Buffer }> {
  return new Promise<{ stdout: Buffer; stderr: Buffer }>((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
/* win */

function decodeStdoutGBK_WIN(stdout: Buffer) {
  const decoder = new TextDecoder('GBK');
  return decoder.decode(stdout);
}

function extractFilePath_WIN(output: string) {
  const regex = /ExecutablePath=([^\r\n]+)/;
  const match = regex.exec(output);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

function getPortByURL_WIN(ip: string): number {
  /* win下使用 nerstat -ano的IP有三种形式: 127.0.0.1:123 是本地回环地址只能在本机进行通信；[::]:123 [::1]:1212 是IPv6通配地址，可以接受来自任何IPv6地址的连接；0.0.0.0:123 是IPv4通配地址 */
  const urlObjectList = ip.match(/:(\d+)$/);
  if (!urlObjectList) return -1;
  const port = Number(urlObjectList[1]);
  return isNaN(port) ? -1 : port;
}

function getProcessNameByPID_WIN(pid: string): Promise<ProcessInfo> {
  if (!pid) return Promise.reject('pid 无效');
  return new Promise<ProcessInfo>((resolve, reject) => {
    const command = `tasklist /FI "pId eq ${pid}"`;
    execPromise(command, { encoding: 'buffer' })
      .then((res) => {
        const { stdout } = res;
        const processInfoList = decodeStdoutGBK_WIN(stdout)
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
          reject(`processInfoList不存在,${decodeStdoutGBK_WIN(stdout)}`);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getProcessFilePathByPID_WIN(pid: string): Promise<string | null> {
  const command = `wmic process where processid=${pid} get ExecutablePath /value`;
  return new Promise((resolve, reject) => {
    execPromise(command, { encoding: 'buffer' })
      .then(({ stdout }) => {
        const output = decodeStdoutGBK_WIN(stdout);
        resolve(extractFilePath_WIN(output));
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getSystemPortUsage(
  port?: number | Array<number>,
): Promise<Array<ProcessInfo & PortInfo>> {
  const command = 'netstat -ano';
  return new Promise<Array<ProcessInfo & PortInfo>>((resolve, reject) => {
    execPromise(command, { encoding: 'buffer' })
      .then(async ({ stdout }) => {
        const portList: Array<PortInfo> = [];
        const lineList = decodeStdoutGBK_WIN(stdout)?.split('\r\n');
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
              localPort: getPortByURL_WIN(localIp),
              externalIp,
              externalPort: getPortByURL_WIN(externalIp),
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
            const processInfo = await getProcessNameByPID_WIN(portInfo.pId);
            const filePath = await getProcessFilePathByPID_WIN(portInfo.pId);
            console.log(filePath, 'filePath');

            const icon = await app.getFileIcon(filePath || '', {
              size: 'small',
            });
            portInfo = Object.assign(portInfo, processInfo, {
              filePath,
              icon: icon.toDataURL(),
            });
          } catch (error) {
            console.log(`获取PID${portInfo.pId}进程信息失败,${error}`);
          }
        });
        await Promise.allSettled(promiseList);
        resolve(showPortList);
      })
      .catch((error) =>
        reject(
          new Error(chalk.whiteBright.bgRed.bold('get port fail' + error)),
        ),
      );
  });
}

export function getSystemPortUsage_PowerShell(
  port?: number | Array<number>,
): Promise<Array<>>;
// (async function main() {
//   const list = await getSystemPortUsage([5, 6, 7, 8]);
// })();
/* 
Get-NetTCPConnection |
    Where-Object {$_.OwningProcess -ne $null} |
    Group-Object OwningProcess |
    ForEach-Object {
        $process = Get-Process -Id $_.Name -ErrorAction SilentlyContinue
        if ($process) {
            $ports = $_.Group.LocalPort -join ','
            [PSCustomObject]@{
                PID = $_.Name
                ProcessName = $process.Name
                Path = $process.Path
                Status = $process.Status
                CpuUsage = $process.CPU
                MemoryUsage = $process.WorkingSet
                Ports = $ports
            }
        }
    }
*/
