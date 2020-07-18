/**
 * Shared component
 */
import * as React from 'react'
import { Buckets } from '@textile/hub'
// import './style/index.scss'
import { getBucketKey, getIdentity } from '../../background/helpers'

import Dropzone from 'react-dropzone'
// @ts-ignore
// import browserImageSize from 'browser-image-size'
// // @ts-ignore
import { readAndCompressImage } from 'browser-image-resizer'

class Comp extends React.Component<{}, any> {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      isLoading: true
    };

    // tslint:disable-next-line: no-floating-promises
    this.restoreSettings()
  }
  async restoreSettings () {
    const identity = await getIdentity()
    const keyInfo = {
      key: 'b5h24gtaiilpztphnch4xxog7su',
    }
    const {buckets, bucketKey} = await getBucketKey(keyInfo, identity)

    console.log(bucketKey)
    await this.getBucketLinks(buckets, bucketKey)

    this.setState({
      buckets: buckets,
      bucketKey: bucketKey,
      identity: identity,
      isLoading: false
    })
  }

  // _greet = () => {
  //   browser.runtime.sendMessage({ type: 'GREETING' })
  //     .then(response => alert(`Background Script: "${response}"`))
  //     .catch(console.error)
  // }
  getBucketLinks = async (buckets: Buckets, bucketKey) => {
    try {
      const links = await buckets.listPath(bucketKey, '/thumbs')
      if (links.item) {
        console.log(links)
        for (let link of links.item.itemsList) {
          console.log(link)
        }
      }
    } catch (error) {
      console.log(error.message)
      console.log('no photos yet')
    }
  }

  insertFile = (file: File, path: string) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onabort = () => reject('file reading was aborted')
      reader.onerror = () => reject('file reading has failed')
      reader.onload = () => {
      // Do whatever you want with the file contents
        const binaryStr = reader.result

        console.log(path)
        this.state.buckets.pushPath(this.state.bucketKey, path, binaryStr).then((raw) => {
          resolve(raw)
        })
      }
      reader.readAsArrayBuffer(file)
    })
  }

  processAndStore = async (image: File, path: string, name: string, limits?: {maxWidth: number, maxHeight: number}) => {
    const finalImage = limits ? await readAndCompressImage(image, limits) : image
    console.log(finalImage)
    // await browserImageSize(finalImage)
    const location = `${path}${name}`
    await this.insertFile(finalImage, location)
  }
  handleNewFile = async (file: File) => {
    const thumb = {
      maxWidth: 320,
      maxHeight: 320
    }
    
    const filename = file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    await this.processAndStore(file, 'originals/', filename)
    await this.processAndStore(file, 'thumbs/', filename, thumb)

    const newPath = `'thumbs/${filename}`
    this.setState({
      photos: [
        newPath,
        ...this.state.photos
      ]
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
            <button
              className="icon"
              // icon="images"
              title="add"
            />
            <span>DRAG & DROP</span>
          </div>
        )}
      </Dropzone>
    )
  }
  render () {
    return (
      <div className='comp-a'>
        <h1 className='comp-a-title'>This is a shared component</h1>
        {!this.state.isLoading && this.renderDropzone()}
        {this.state.photos.map((p, i) => <img key={i} src="/static/logo.svg" width="300"/>)}
      </div>
    )
  }
}

export default Comp
