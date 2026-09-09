/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('child_process');

const nextBin = require.resolve('next/dist/bin/next');
const next = spawn(process.execPath, [nextBin, 'dev'], {
  stdio: 'inherit',
  shell: false,
});

const browser = process.platform === 'win32' ? 'cmd.exe' : 'xdg-open';
const args = process.platform === 'win32' ? ['/c', 'start', '', 'chrome', 'http://localhost:3000'] : ['http://localhost:3000'];
setTimeout(() => spawn(browser, args, { stdio: 'ignore', detached: true, windowsHide: true }).unref(), 1800);
next.on('exit', code => process.exit(code ?? 0));
