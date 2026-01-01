import { ParsedFileData } from '@/types/ai';

export async function parseFile(file: File): Promise<ParsedFileData> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    // CSV files
    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      return await parseCSV(file);
    }

    // Excel files
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      return await parseExcel(file);
    }

    // Text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await parseTextFile(file);
    }

    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await parsePDF(file);
    }

    // Word documents
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await parseWordDocument(file);
    }

    // Images (for OCR)
    if (fileType.startsWith('image/')) {
      return await parseImage(file);
    }

    return {
      type: 'unknown',
      data: null,
      confidence: 0,
      suggestions: ['This file type is not supported. Please upload CSV, Excel, PDF, Word, or text files.'],
    };
  } catch (error: any) {
    console.error('File parsing error:', error);
    return {
      type: 'unknown',
      data: null,
      confidence: 0,
      suggestions: [`Error parsing file: ${error.message}`],
    };
  }
}

async function parseCSV(file: File): Promise<ParsedFileData> {
  const text = await file.text();
  const lines = text.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    return {
      type: 'unknown',
      data: null,
      confidence: 0,
      suggestions: ['CSV file is empty'],
    };
  }

  // Check if this looks like a whitelist (single column of addresses)
  const firstLine = lines[0];
  if (firstLine.startsWith('0x') || /^[a-fA-F0-9]{40,}/.test(firstLine)) {
    const addresses = lines
      .map((line) => line.trim().split(',')[0])
      .filter((addr) => addr.length > 0);

    return {
      type: 'whitelist',
      data: { addresses },
      confidence: 0.9,
      suggestions: [
        `Found ${addresses.length} addresses in the whitelist`,
        'I can add these to your whitelist automatically',
      ],
    };
  }

  // Try to parse as general CSV data
  const headers = firstLine.split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  return {
    type: 'general',
    data: { headers, rows },
    confidence: 0.8,
    suggestions: [
      `Parsed ${rows.length} rows with ${headers.length} columns`,
      'This data could be used to generate questions or populate form fields',
    ],
  };
}

async function parseExcel(file: File): Promise<ParsedFileData> {
  // For now, return a message that Excel parsing requires additional library
  // In production, use libraries like xlsx or exceljs
  const text = await file.text();

  return {
    type: 'general',
    data: { raw: text.substring(0, 1000) },
    confidence: 0.5,
    suggestions: [
      'Excel file detected. For full parsing, please export to CSV format.',
      'I can still help you with the campaign creation process!',
    ],
  };
}

async function parseTextFile(file: File): Promise<ParsedFileData> {
  const text = await file.text();

  // Check if it looks like a list of addresses
  const lines = text.split('\n').filter((line) => line.trim());
  const addressPattern = /^(0x)?[a-fA-F0-9]{40,}$/;
  const addresses = lines.filter((line) => addressPattern.test(line.trim()));

  if (addresses.length > 5 && addresses.length / lines.length > 0.7) {
    return {
      type: 'whitelist',
      data: { addresses: addresses.map((a) => a.trim()) },
      confidence: 0.9,
      suggestions: [
        `Found ${addresses.length} addresses`,
        'I can add these to your whitelist',
      ],
    };
  }

  return {
    type: 'general',
    data: { text },
    confidence: 0.7,
    suggestions: [
      'Text file content extracted',
      'I can help you use this information to fill out your campaign',
    ],
  };
}

async function parsePDF(file: File): Promise<ParsedFileData> {
  // PDF parsing requires pdf.js or similar library
  // For now, convert to base64 for Claude to read directly
  const base64 = await fileToBase64(file);

  return {
    type: 'general',
    data: { base64, fileName: file.name },
    confidence: 0.6,
    suggestions: [
      'PDF file uploaded. I\'ll read the content and extract relevant information.',
      'This might take a moment...',
    ],
  };
}

async function parseWordDocument(file: File): Promise<ParsedFileData> {
  // Word document parsing requires mammoth.js or similar
  const base64 = await fileToBase64(file);

  return {
    type: 'general',
    data: { base64, fileName: file.name },
    confidence: 0.6,
    suggestions: [
      'Word document uploaded. I\'ll extract the text content.',
      'For best results, consider copying the text directly into our chat',
    ],
  };
}

async function parseImage(file: File): Promise<ParsedFileData> {
  const base64 = await fileToBase64(file);

  return {
    type: 'general',
    data: { base64, fileName: file.name, isImage: true },
    confidence: 0.5,
    suggestions: [
      'Image uploaded. I can analyze the image content.',
      'If this contains text, I\'ll try to extract it',
    ],
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

export function getFileSizeDisplay(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function isFileTypeSupported(file: File): boolean {
  const supportedTypes = [
    'text/csv',
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const supportedExtensions = ['.csv', '.txt', '.pdf', '.xlsx', '.xls', '.docx', '.jpg', '.jpeg', '.png'];

  return (
    supportedTypes.includes(file.type) ||
    supportedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  );
}
