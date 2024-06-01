export class ChunkReader extends FileReader {
  chunkSize = undefined;
  readOffset = undefined;
  defaultReadOffset = undefined;

  constructor(chunkSize = 0, defaultReadOffset = 0) {
    super();
    this.chunkSize = chunkSize;
    this.defaultReadOffset = defaultReadOffset;
  }

  onload(event) {
    const chunk = e.target.result;
    console.log(`LOAD :: chunk of size ${chunk.byteLength} bytes`);
    this.readOffset += this.chunkSize
  }

  onloadend(event) {
    console.log(event);
    if ( event.target.readyState !== FileReader.DONE ) {
      throw new Error('LOAD END :: reader state is not done...')
    }
  }


  onprogress(event) {
    console.log(event);
  }

  readChunks(file, offset = 0) {
    this.readOffset = offset;
    
    let blob;
    while (this.readOffset < file.size) {
      blob = file.slice(this.readOffset, this.readOffset + this.chunkSize);
      // this.readAsArrayBuffer(blob);
      this.readOffset += this.chunkSize;
      console.log(this.readOffset, file.size);
    }

    console.log('Finished reading chunks!')
    this.readOffset = this.defaultReadOffset;
  }
}

