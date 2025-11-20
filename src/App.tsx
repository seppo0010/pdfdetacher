import React, { useState, useEffect } from 'react'
import './App.css'
import Dropzone from 'react-dropzone'
import ReactLoading from 'react-loading'
import {
  Attachment,
  readPDF,
  fileListToFileArray
} from './extractor'

function App (): JSX.Element {
  const [results, setResults] = useState<Attachment[] | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const [hash, setHash] = useState('')

  useEffect(() => {
    navigator.serviceWorker.ready.then(async (): Promise<void> => {
      const req = await fetch('/income')
      if (req.headers.get('content-type') !== 'application/json') return
      const { pendingFiles, pendingTexts }: { pendingFiles: string[], pendingTexts: string[] } = await req.json()
      if (pendingFiles.length === 0 && pendingTexts.length === 0) return
      setResults(null)
      setProgress(0)
      const acceptedFiles = await Promise.all(pendingFiles.map(async (f) => {
        const req = await fetch(`/income/${f}`)
        return new File([await req.blob()], f, { type: req.headers.get('content-type') ?? '' })
      }))
      readContent(acceptedFiles, pendingTexts.join('\n'))
    }).catch((err: unknown) => {
      setError(true)
      console.error({ err })
    })
  }, [])

  useEffect(() => {
    const script = document.getElementsByTagName('script')
    if (script.length === 0) return
    const src = script[0].getAttribute('src')
    if (src === null) return
    const h = src.match(/\.([a-f0-9]+)\./)
    if (h !== null) {
      setHash(h[1])
    } else {
      setHash('dev')
    }
  }, [])

  const readContent = (acceptedFiles: File[], text: string): void => {
    (async (): Promise<void> => {
      setResults(null)
      setProgress(0)
      const results = await Promise.all(acceptedFiles.map(async (f) => {
        const [resultsPDF] = await Promise.allSettled([readPDF(f)])
        return [
          ...(resultsPDF.status === 'fulfilled' ? resultsPDF.value : [])
        ]
      }))
      setResults([...results.flat()])
      setProgress(1)
    })().catch((err: Error) => {
      console.error({ err })
      setError(true)
    })
  }
  const onDrop = (acceptedFiles: File[]): void => {
    readContent(acceptedFiles, '')
  }

  useEffect(() => {
    const onPaste = (event: unknown): void => {
      ((event: ClipboardEvent): void => {
        readContent(
          fileListToFileArray(event.clipboardData?.files),
          event.clipboardData?.getData('text/plain') ?? ''
        )
      })(event as ClipboardEvent)
    }
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('paste', onPaste)
    }
  }, [])

  return (
    <div className="App">
      {!error && results === null && progress === null && <Dropzone onDrop={onDrop}>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()} id="dropzone">
            <input {...getInputProps()} />
            <p>
              Subime tu PDF con adjuntos acá
            </p>
          </div>
        )}
      </Dropzone>}
      {!error && results === null && progress !== null && <div id="loading"><ReactLoading type="bars" color="#333" /></div>}
      {(error || results !== null) && <div id="results">
        <div>
          {!error && results !== null && results.length > 0 && <ul>{results.map((r: Attachment, i) => (
            <li key={i}>
              <p>{r.filename}</p>
              <button onClick={() => {
                const blob = new Blob([r.content.buffer], {
                  type: 'application/pdf'
                })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = r.filename
                document.body.appendChild(a)
                a.style.display = 'none'
                a.click()
                a.remove()
                setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
              }}>Descargar</button>
            </li>
          ))}</ul>}
          {!error && results !== null && results.length === 0 && <div id="noresults"><p>No se encontraron adjuntos</p></div>}
          {error && <div id="noresults"><p>Algo salió mal...</p></div>}
          <button onClick={() => { setResults(null); setProgress(null) }}>Volver a empezar</button>
        </div>
      </div>}
      {hash !== '' && <div id="hash">version {hash}</div>}
    </div>
  )
}

export default App
