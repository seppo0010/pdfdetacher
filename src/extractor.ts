import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.15.349/pdf.worker.js'

export async function readPDF (f: File): Promise<string[]> {
  if (f.type !== 'application/pdf') return []
  const loadingTask = pdfjsLib.getDocument(new Uint8Array(await f.arrayBuffer()))
  const pdf = await loadingTask.promise
  const attachments: string[] = []

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1)
    const texts = await page.getTextContent()
    for (const item of texts.items) {
      attachments.push('1')
      console.log({ item })
    }
  }
  return attachments
}

export function fileListToFileArray (f?: FileList): File[] {
  const files: File[] = []
  if (f !== undefined) {
    for (let i = 0; i < f.length; i++) {
      const item = f.item(i)
      if (item !== null) {
        files.push(item)
      }
    }
  }
  return files
}
