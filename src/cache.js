import dotenv from 'dotenv'
import { promisify } from 'util'
import redis from 'redis'

dotenv.config()

const MINUTES = 60 // 1 minute in seconds
const DEFAULT_EXPIRE_SECONDS = 30 * MINUTES

export default function cache () {
  let ready = false

  const client = redis.createClient(process.env.REDIS_URL, {
    return_buffers: true
  })

  client.on('error', (err) => {
    console.error('Error', err.message)
  })

  client.on('ready', () => {
    ready = true
  })

  client.on('end', () => {
    ready = false
  })

  const getAsync = promisify(client.get).bind(client)
  const setAsync = promisify(client.set).bind(client)
  const expireAsync = promisify(client.expire).bind(client)

  async function set (key, data, seconds = DEFAULT_EXPIRE_SECONDS) {
    if (ready) {
      await setAsync(key, data)
      await expireAsync(key, seconds)
    }
  }

  async function get (key) {
    if (ready) {
      const data = await getAsync(key)
      return data
    }
  }

  return {
    get,
    set
  }
}
