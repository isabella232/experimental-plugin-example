import { Buckets, KeyInfo } from '@textile/hub'
import * as pb from '@textile/hub-grpc/hub_pb'
import { APIClient, ServiceError } from '@textile/hub-grpc/hub_pb_service'
import { Context } from '@textile/context'
import { WebsocketTransport } from '@textile/grpc-transport'

// HUB NEXT
const API = 'http://hub.next.textile.io:3007'

// LOCAL
// const API = 'http://localhost:3007'

export interface Photo {
  src: string
  thumb: string
  name: string
  ipfs: string
  path: string
}

export interface Session {
  key: string
  session: string
}

export const removeSession = async () => {
  await browser.storage.local.set({
    session: undefined,
    key: undefined,
    photos: undefined
  });
}
export const getSession = async (): Promise<Session | undefined> => {
  const stored = await browser.storage.local.get()
  if ( stored.key !== null && stored.session !== null && stored.key && stored.session ) {
    const res: Session = {
      key: stored.key as string,
      session: stored.session as string
    }
    return res
  }
  // return { key: "CAESIExMRYwnyDhTrojM1f0Nshf4gAsg42Aot70Tg9p2LYDj", session: "bh56z2wg63apuhnbysx4szgc5uzvwvfswlrfqyn5jtbmce2u6wyca56ukg2nuraunjauwyli" }
}
export const storeSession = async (session: Session) => {
  const stored = await browser.storage.local.get()
  stored.key = session.key
  stored.session = session.session
  await browser.storage.local.set(stored);
}
export const getPhotos = async (): Promise<Array<Photo>> => {
  const stored = await browser.storage.local.get()
  if (!stored.photos) return []
  try {
    const res = JSON.parse(stored.photos as string) as Array<Photo>
    return res
  } catch (err) {
    console.log(err)
    return []
  }
}
export const storePhotos = async (photos: Array<Photo>) => {
  const stored = await browser.storage.local.get()
  stored.photos = JSON.stringify(photos)
  await browser.storage.local.set(stored);
}

export const getBuckets = async (session: Session) => { 
  // Create developer session
  const keyInfo = await getKey(session)
  const ctx = new Context(API)
  await ctx.withAPIKey(session.key).withKeyInfo(keyInfo)
  const buckets = new Buckets(ctx)
  await buckets.open('io.textile.imbuck')
  return buckets
}

export const getKey = async (session: Session): Promise<KeyInfo> => { 
  const stored = await browser.storage.local.get()
  if ( stored.apiKey !== null && stored.apiKey ) {
    return JSON.parse(stored.apiKey as string) as KeyInfo
  }
  const key = await createKey(session)
  stored.apiKey = JSON.stringify(key)
  await browser.storage.local.set(stored);
  return key
}

/**
 * getBucketKey will create a new Buckets client with the UserAuth
 * and then open our custom bucket named, 'io.textile.dropzone'
 */
export const getBucketKey = async (buckets: Buckets) => {
  const root = await buckets.open('io.textile.imbuck')
  if (!root) {
    throw new Error('Failed to open bucket')
  }
  return root.key
}

export const createKey = (session: Session) => {
  const ctx = new Context(API)
  ctx.withSession(session.session)
  return new Promise<pb.GetKeyReply.AsObject>((resolve, reject) => {
    const req = new pb.CreateKeyRequest()
    req.setType(pb.KeyType['ACCOUNT'])
    const client = new APIClient(ctx.host, { transport: WebsocketTransport() })
    ctx.toMetadata().then((meta) => {
      return client.createKey(req, meta, (err: ServiceError | null, message: pb.GetKeyReply | null) => {
        if (err) reject(err)
        resolve(message?.toObject())
      })
    })
  })
}

export const signUp = (username: string, email: string) => {
  const ctx = new Context(API)
  return new Promise<Session>(
    (resolve, reject) => {
      const req = new pb.SignupRequest()
      req.setEmail(email)
      req.setUsername(username)
      const client = new APIClient(ctx.host, { transport: WebsocketTransport() })
      ctx.toMetadata().then((meta) => {
        client.signup(req, meta, (err: ServiceError | null, message: pb.SignupReply | null) => {
          if (err) {
            reject(err)
            return
          }
          else if (!message) {
            reject()
            return
          }
          const msg = message.toObject()
          resolve({ key: msg.key as string, session: msg.session })
        })
      })
    },
  )
}

export const logIn = (username: string) => {
  const ctx = new Context(API)
  return new Promise<Session>(
    (resolve, reject) => {
      // const req = new pb.SignupRequest()
      const req = new pb.SigninRequest()
      req.setUsernameoremail(username)
      const client = new APIClient(ctx.host, { transport: WebsocketTransport() })
      ctx.toMetadata().then((meta) => {
        client.signin(req, meta, (err: ServiceError | null, message: pb.SigninReply | null) => {
          if (err) {
            reject(err)
            return
          }
          else if (!message) {
            reject()
            return
          }
          const msg = message.toObject()
          resolve({ key: msg.key as string, session: msg.session })
        })
      })
    },
  )
}