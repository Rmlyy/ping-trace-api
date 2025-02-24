export default function ({ err = false, msg, ...rest }) {
  return {
    status: !err ? 'success' : 'fail',
    msg: msg,
    ...rest,
  }
}
