import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.mjs'

export interface Attachment {
  filename: string
  content: Uint8Array
}

export async function readPDF (f: File): Promise<Attachment[]> {
  if (f.type !== 'application/pdf') return []
  const loadingTask = pdfjsLib.getDocument(new Uint8Array(await f.arrayBuffer()))
  const pdf = await loadingTask.promise
  const attachments: null | Map<string, Attachment> = await pdf.getAttachments()
  if (attachments === null) return []
  return Object.values(attachments)
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
