import { exec, type ExecOptions } from 'child_process';

export function execPromise(
  command: string,
  options: {
    encoding: 'buffer' | null;
  } & ExecOptions,
): Promise<{ stdout: Buffer; stderr: Buffer }> {
  return new Promise<{ stdout: Buffer; stderr: Buffer }>((resolve, reject) => {
    exec(command, options, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
