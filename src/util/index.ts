import { exec, type ExecOptions } from 'child_process';

export function execPromise(
  command: string,
  options: {
    encoding: 'buffer' | 'utf8' | null;
  } & ExecOptions,
): Promise<{ stdout: Buffer | string; stderr: Buffer | string }> {
  return new Promise<{ stdout: Buffer | string; stderr: Buffer | string }>(
    (resolve, reject) => {
      exec(command, options, (err, stdout, stderr) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ stdout, stderr });
      });
    },
  );
}
