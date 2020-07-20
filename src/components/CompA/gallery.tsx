/**
 * Shared component
 */
import * as React from 'react'
import { Buckets, PushPathResult, ListPathItem } from '@textile/hub'
import '../style/index.scss'
import { getBucketKey, Photo, Session, getBuckets, getPhotos, storePhotos } from '../../background/helpers'
import Dropzone from 'react-dropzone'
// // @ts-ignore
import { readAndCompressImage } from 'browser-image-resizer'
import {CopyToClipboard} from 'react-copy-to-clipboard'


interface StateInterface {
  bucketKey?: string
  identity?: string
  host?: string
  photos: Array<Photo>
  loading: boolean
}

interface GalleryProps {
  session: Session
  reset: () => void
}

class Gallery extends React.Component<GalleryProps, StateInterface> {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      loading: true
    }
    getPhotos().then((photos) => {
      this.setState({
        photos: photos,
        loading: false
      })
      this.init().catch((err) => {
        if (err.message === 'Response closed without headers') {
          this.offlineMode() 
          return
        }
        console.log(err)
        this.props.reset()
      })
    })
  }

  async offlineMode() {
    console.log('offline mode')
    this.setState({
      loading: false
    })
  }

  async init () {
    const photos: Array<Photo> = []
    const buckets = await getBuckets(this.props.session)
    const bucketKey = await getBucketKey(buckets)
    const links = await this.getBucketLinks(buckets, bucketKey)
    const host = links.ipns.split('/ipns')[0]
    const imageDirs = await this.getBucketPaths(buckets, bucketKey, '/images')
    const dirs = imageDirs.itemsList.reverse()
    for (let a = 0; a < Math.min(dirs.length, 30); a++) {
      const p = dirs[a]
      const known = this.state.photos.find((px) => px.path === p.path)
      if (known) {
        photos.push(known)
        continue
      }
      const contents = await this.getBucketPaths(buckets, bucketKey, `images/${p.name}`)

      const {cid, itemsList} = contents
      let name = ''
      for (const item of itemsList) {
        if (item.isdir) continue
        name = item.name
      }  
      if (name === '') continue
      photos.push(
        {
          src: `${host}/ipfs/${cid}/${name}`,
          thumb: `${host}/ipfs/${cid}/thumb/${name}`,
          name: name,
          ipfs: `/ipfs/${cid}/${name}`,
          path: `/images/${p.name}`
        }
      )
    }
    storePhotos(photos)
    this.setState({
      host: host,
      photos: photos,
      bucketKey: bucketKey,
      loading: false
    })
  }

  getBucketLinks = async (buckets: Buckets, bucketKey) => {
    const links = await buckets.links(bucketKey)
    return links
  }

  getBucketPaths = async (buckets: Buckets, bucketKey: string, path: string): Promise<ListPathItem.AsObject> => {
    try {
      const links = await buckets.listPath(bucketKey, path)
      if (!links.item) throw new Error('No photos')
      return links.item
    } catch (error) {
      return {
        cid: '',
        name: '',
        path: '',
        size: 0,
        isdir: true,
        itemsList: []
      }
    }
  }

  insertFile = (buckets: Buckets, file: File, path: string): Promise<PushPathResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onabort = () => reject('file reading was aborted')
      reader.onerror = () => reject('file reading has failed')
      reader.onload = () => {
      // Do whatever you want with the file contents
        const binaryStr = reader.result
        if (this.state.bucketKey) {
          buckets.pushPath(this.state.bucketKey, path, binaryStr).then((raw) => {
            resolve(raw)
          })
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  processAndStore = async (buckets: Buckets, image: File, path: string, name: string, limits?: {maxWidth: number, maxHeight: number}) => {
    const finalImage = limits ? await readAndCompressImage(image, limits) : image
    const location = `${path}${name}`
    return await this.insertFile(buckets, finalImage, location)
  }

  handleNewFile = async (file: File) => {
    const thumb = {
      maxWidth: 420,
      maxHeight: 420
    }
    const maxSize = {
      maxWidth: 2420,
      maxHeight: 2420
    }
    
    const buckets = await getBuckets(this.props.session)

    const prefix = Math.floor((new Date()).getTime() / 1000)
    const filename = file.name.split('.').map((f) => f.replace(/[^a-z0-9]/gi, '_').toLowerCase()).join('.')

    const fullUpload = await this.processAndStore(buckets, file, `images/${prefix}/`, filename, maxSize)
    const thumUpload = await this.processAndStore(buckets, file, `images/${prefix}/thumb/`, filename, thumb)

    const photo = {
      src: `${this.state.host}${fullUpload.path.path}`,
      thumb: `${this.state.host}${thumUpload.path.path}`,
      name: filename,
      ipfs: `${thumUpload.path.path}`,
      path: `images/${prefix}`,
    }

    const photos = [
      photo,
      ...this.state.photos
    ]

    await storePhotos(photos)

    this.setState({
      photos
    })
  }

  onDrop = async (acceptedFiles: File[]) => {
    for (const accepted of acceptedFiles) {
      await this.handleNewFile(accepted)
      console.log(accepted)
    }
  }

  renderDropzone = () => {
    return (
      <Dropzone 
        onDrop={this.onDrop}
        accept={'image/jpeg, image/png, image/gif'}
        maxSize={20000000}
        multiple={true}
        >
        {({getRootProps, getInputProps}) => (
          <div className="dropzone" {...getRootProps()}>
            <input {...getInputProps()} />
            <div className={'img-upload'}></div>
          </div>
        )}
      </Dropzone>
    )
  }

  renderMarkdown = (image) => {
    const code = `![${image.name}](${image.src})`
    return (
      <CopyToClipboard text={code} >
        <span>copy markdown embed</span>
      </CopyToClipboard>
    )
  }

  renderHTML = (image) => {
    const code = `<img src="${image.src}" alt="${image.name}"/>`
    return (
      <CopyToClipboard text={code} >
        <span>copy html embed</span>
      </CopyToClipboard>
    )
  }

  renderIPFS = (image) => {
    const code = `${image.ipfs}`
    return (
      <CopyToClipboard text={code} >
        <span>copy ipfs path</span>
      </CopyToClipboard>
    )
  }

  removeImage = (image) => {
    const path = `${image.path}`
    return async () => {
      console.log(path)
      if (!this.state.bucketKey) return
      const buckets = await getBuckets(this.props.session)
      buckets.removePath(this.state.bucketKey, path)
      const photos = this.state.photos.filter((p) => p.path !== path)
      this.setState({
        photos
      })
    }
  }

  render = () => {
    return (
      <div>
        <div className="flex-container">
              <div className="flex-item">
                  {this.renderDropzone()}
                  <p>Upload Image</p>
              </div>
          {this.state.loading &&
            <div className="flex-item">
              <p>Loading...</p>
            </div>
          }
          {this.state.photos.map((p, i) => {
            return (
              <div key={i} className="flex-item">
                  <div className={'img'} style={{'backgroundImage': `url(${p.thumb})`}}></div>
                  <br/>
                  <p>{p.name}</p>
                  <p>
                    <a target={'new'} href={`${p.src}`}>open in new tab</a>
                  </p>
                  <p>
                    {this.renderMarkdown(p)}
                  </p>
                  <p>
                    {this.renderHTML(p)}
                  </p>
                  <p>
                    {this.renderIPFS(p)}
                  </p>
                  <p>
                    <a className="remove" onClick={this.removeImage(p)} >remove (x)</a>
                  </p>
                  
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

export default Gallery
