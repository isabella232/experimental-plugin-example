import {Libp2pCryptoIdentity} from '@textile/threads-core'
import { Buckets } from '@textile/hub'

const API = 'http://localhost:3007'

/**
 * getIdentity uses a basic private key identity.
 * The user's identity will be cached client side. This is long
 * but ephemeral storage not sufficient for production apps.
 * 
 * Read more here:
 * https://docs.textile.io/tutorials/hub/libp2p-identities/
 */
export const getIdentity = async () => {
  const gettingStoredSettings = await browser.storage.local.get()
  console.log(gettingStoredSettings)
  try {
    if (gettingStoredSettings.identity === null || !gettingStoredSettings.identity) {
      console.log('not found')
      throw new Error('No identity')
    }
    return gettingStoredSettings.identity
  }
  catch (e) {
    /**
     * If any error, create a new identity.
     */
    try {
      const identity = await Libp2pCryptoIdentity.fromRandom()
      const identityString = identity.toString()
      gettingStoredSettings.identity = identityString
      // tslint:disable-next-line: semicolon
      await browser.storage.local.set(gettingStoredSettings);
      return identityString
    } catch (err) {
      return err.message
    }
  }
}

/**
 * getBucketKey will create a new Buckets client with the UserAuth
 * and then open our custom bucket named, 'io.textile.dropzone'
 */
export const getBucketKey = async (keyInfo, identity) => {
  const buckets = await Buckets.withKeyInfo(keyInfo, API)
  // Authorize the user and your insecure keys with getToken
  const id = await Libp2pCryptoIdentity.fromString(identity)
  await buckets.getToken(id)

  const root = await buckets.open('io.textile.imbuck')
  if (!root) {
    throw new Error('Failed to open bucket')
  }
  return {buckets, bucketKey: root.key};
}
