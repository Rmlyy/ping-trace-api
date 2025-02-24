import spawn from 'await-spawn'
import fs from 'fs'

let populatedCmdArgs = null

function populateCmdArgs() {
  const fileContent = fs.readFileSync('./cmdArgs.json', 'utf-8')
  const args = JSON.parse(fileContent)
  populatedCmdArgs = args

  return populatedCmdArgs
}

populateCmdArgs()

export default async function (cmd, target) {
  const cmdArgs = [...populatedCmdArgs[cmd], target]
  let result = null

  try {
    const stdoutBuffer = await spawn(cmd, cmdArgs)
    const stdoutStr = stdoutBuffer.toString()

    result = stdoutStr
  } catch (e) {
    // commands like ping can return their output in stderr if, for example, the pinged host didn't respond

    const stdout = e?.stdout?.toString() || null
    const stderr = e?.stderr?.toString() || null

    result = stdout || stderr

    if (!result) {
      console.log(`Command "${cmd}" unknown error:\n`, e)
    }
  } finally {
    return result
  }
}
