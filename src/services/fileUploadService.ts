import { AssetItem, AssetType } from '../types/asset';

export interface ProcessedUploadResult {
  asset: AssetItem;
  error?: string;
}

export const fileUploadService = {
  /**
   * Determine asset type based on mime type or file extension
   */
  getAssetType(file: File): AssetType {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (
      file.type.startsWith('text/') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv')
    ) {
      return 'note';
    }
    return 'note';
  },

  /**
   * Process an image file and extract dimensions + data URL
   */
  async processImageFile(file: File): Promise<AssetItem> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const asset: AssetItem = {
            id: `upload-img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: 'image',
            source: 'upload',
            url: dataUrl,
            thumbnailUrl: dataUrl,
            mimeType: file.type,
            size: file.size,
            dimensions: {
              width: img.width,
              height: img.height,
            },
            tags: ['uploaded', file.type.split('/')[1] || 'image'],
            createdAt: Date.now(),
          };
          resolve(asset);
        };
        img.onerror = () => {
          // Even if image dimensions fail, resolve with data URL
          resolve({
            id: `upload-img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: 'image',
            source: 'upload',
            url: dataUrl,
            thumbnailUrl: dataUrl,
            mimeType: file.type,
            size: file.size,
            tags: ['uploaded', 'image'],
            createdAt: Date.now(),
          });
        };
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Process a text note or markdown document
   */
  async processNoteFile(file: File): Promise<AssetItem> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const textContent = (e.target?.result as string) || '';
        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';

        const asset: AssetItem = {
          id: `upload-note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: 'note',
          source: 'upload',
          url: '',
          content: textContent,
          mimeType: file.type || 'text/plain',
          size: file.size,
          tags: ['note', ext, 'document'],
          createdAt: Date.now(),
        };
        resolve(asset);
      };
      reader.onerror = () => reject(new Error('Failed to read note document'));
      reader.readAsText(file);
    });
  },

  /**
   * Process a PDF file and extract text and page structure
   */
  async processPdfFile(file: File): Promise<AssetItem> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        let extractedText = '';
        let pageCount = 1;

        try {
          // Extract text chunks from PDF streams
          const uint8Array = new Uint8Array(arrayBuffer);
          const binaryString = new TextDecoder('latin1').decode(uint8Array);

          // Find page count
          const pageMatches = binaryString.match(/\/Type\s*\/Page[^s]/g);
          if (pageMatches) {
            pageCount = Math.max(1, pageMatches.length);
          }

          // Extract text in parentheses / streams
          const textMatches = binaryString.match(/\(([^\(\)\\]{2,100})\)\s*Tj/g) || [];
          const words = textMatches
            .map((m) => m.replace(/\)\s*Tj$/, '').replace(/^\(/, ''))
            .filter((t) => t.trim().length > 1);

          if (words.length > 0) {
            extractedText = words.join(' ');
          } else {
            // Fallback general text sweep
            const readableChunks = binaryString.match(/[A-Za-z0-9 ,.;:!?'"()\-–—]{15,}/g) || [];
            extractedText = readableChunks
              .filter((c) => !c.includes('/Type') && !c.includes('/Font') && !c.includes('endobj'))
              .slice(0, 40)
              .join('\n\n');
          }

          if (!extractedText.trim()) {
            extractedText = `PDF Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nEstimated Pages: ${pageCount}\n\n[PDF uploaded ready for slide presentation attachment]`;
          }
        } catch {
          extractedText = `PDF Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n[Uploaded PDF]`;
        }

        const asset: AssetItem = {
          id: `upload-pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: 'pdf',
          source: 'upload',
          url: URL.createObjectURL(file),
          content: extractedText,
          pageCount,
          mimeType: 'application/pdf',
          size: file.size,
          tags: ['pdf', 'document', `${pageCount} pages`],
          createdAt: Date.now(),
        };

        resolve(asset);
      };

      reader.onerror = () => {
        resolve({
          id: `upload-pdf-${Date.now()}`,
          name: file.name,
          type: 'pdf',
          source: 'upload',
          url: '',
          content: `PDF File: ${file.name}`,
          mimeType: 'application/pdf',
          size: file.size,
          createdAt: Date.now(),
        });
      };

      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Main unified upload handler
   */
  async handleFileUpload(file: File): Promise<ProcessedUploadResult> {
    try {
      const type = this.getAssetType(file);
      let asset: AssetItem;

      if (type === 'image') {
        asset = await this.processImageFile(file);
      } else if (type === 'pdf') {
        asset = await this.processPdfFile(file);
      } else {
        asset = await this.processNoteFile(file);
      }

      return { asset };
    } catch (err: any) {
      return {
        asset: {
          id: `upload-err-${Date.now()}`,
          name: file.name,
          type: 'note',
          source: 'upload',
          url: '',
          createdAt: Date.now(),
        },
        error: err?.message || 'Failed to process upload',
      };
    }
  },
};
