import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { type AddressInfo, createServer, type Server, type Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { lockDataDir, lockFileOf } from './embedded-postgres'

/** No process has this id: it is above what any system hands out. */
const NOBODY = 999_999_999

describe('the lock of the embedded data folder', () => {
  let parent: string
  let dataDir: string
  let lockFile: string
  let servers: Server[]
  let sockets: Socket[]

  beforeEach(() => {
    parent = mkdtempSync(join(tmpdir(), 'app-pglite-lock-'))
    dataDir = join(parent, 'data')
    lockFile = lockFileOf(dataDir)
    servers = []
    sockets = []
  })

  afterEach(async () => {
    for (const socket of sockets) socket.destroy()
    await Promise.all(servers.map((server) => new Promise((done) => server.close(done))))
    rmSync(parent, { recursive: true, force: true })
  })

  /** Some other program listening on a port of this machine. Answers with the port. */
  function someoneElse(onConnection: (socket: Socket) => void): Promise<number> {
    const server = createServer((socket) => {
      sockets.push(socket)
      socket.on('error', () => undefined)
      onConnection(socket)
    })
    servers.push(server)

    return new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port))
    })
  }

  /** A port nobody listens on: it was open a moment ago, so it is certainly a valid one. */
  async function closedPort(): Promise<number> {
    const port = await someoneElse(() => undefined)
    await new Promise((done) => servers.pop()?.close(done))

    return port
  }

  const leftBehind = (content: object | string): void =>
    writeFileSync(lockFile, typeof content === 'string' ? content : JSON.stringify(content))

  async function expectTakenOver(): Promise<void> {
    const unlock = await lockDataDir(dataDir)

    expect(JSON.parse(readFileSync(lockFile, 'utf8'))).toMatchObject({ pid: process.pid })
    await unlock()
    expect(existsSync(lockFile)).toBe(false)
  }

  it('sits next to the folder, not inside it', () => {
    expect(lockFile).toBe(join(parent, 'data.lock'))
  })

  it('says which process has the folder open and where to ask it, and goes away when released', async () => {
    const unlock = await lockDataDir(dataDir)

    expect(JSON.parse(readFileSync(lockFile, 'utf8'))).toEqual({
      pid: process.pid,
      port: expect.any(Number),
      token: expect.any(String),
    })

    await unlock()

    expect(existsSync(lockFile)).toBe(false)
    // Releasing twice is harmless.
    await unlock()
  })

  it('refuses a folder that is already open, and leaves the lock of its holder alone', async () => {
    const unlock = await lockDataDir(dataDir)
    const held = readFileSync(lockFile, 'utf8')

    await expect(lockDataDir(dataDir)).rejects.toThrow(`is already open in another process (pid ${process.pid})`)
    await expect(lockDataDir(dataDir)).rejects.toThrow('PGLITE_DATA_DIR')
    expect(readFileSync(lockFile, 'utf8')).toBe(held)

    // Once it is released the folder is free again.
    await unlock()
    await expectTakenOver()
  })

  it('takes over the lock of a process that is gone, without knocking on its port', async () => {
    const port = await someoneElse((socket) => socket.end('I would have answered'))
    leftBehind({ pid: NOBODY, port, token: 'old' })

    await expectTakenOver()
  })

  it('takes over when the process id is in use again but nobody listens on the port of the lock', async () => {
    leftBehind({ pid: process.pid, port: await closedPort(), token: 'old' })

    await expectTakenOver()
  })

  it.each([
    ['says something else', (socket: Socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')],
    ['hangs up without a word', (socket: Socket) => socket.end()],
    ['knows the greeting but not the token', (socket: Socket) => socket.end('app-embedded-postgres other\n')],
  ])('takes over when the port of the lock now belongs to a program that %s', async (_, behave) => {
    leftBehind({ pid: process.pid, port: await someoneElse(behave), token: 'old' })

    await expectTakenOver()
  })

  it.each([
    ['something that is not a lock', 'not json'],
    ['a lock of another shape', '{"pid":"1234"}'],
    ['a port that cannot exist', `{"pid":${process.pid},"port":70000,"token":"old"}`],
    ['nothing', ''],
  ])('takes over a file with %s', async (_, content) => {
    leftBehind(content)

    await expectTakenOver()
  })

  it('does not take over when something has the port open and stays silent: the holder may be busy', async () => {
    const port = await someoneElse(() => undefined)
    leftBehind({ pid: process.pid, port, token: 'old' })

    const attempt = lockDataDir(dataDir, 50)

    await expect(attempt).rejects.toThrow(`is already open in another process (pid ${process.pid})`)
    await expect(lockDataDir(dataDir, 50)).rejects.toThrow(`if nothing else is running, delete ${lockFile}`)
    expect(JSON.parse(readFileSync(lockFile, 'utf8'))).toMatchObject({ token: 'old' })
  })
})
