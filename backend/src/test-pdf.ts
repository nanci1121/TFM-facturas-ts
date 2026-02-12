import fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function testPdf() {
    const filePath = '/home/venancio/Descargas/facturas/2025-12-06 Mercadona 20251206 Mercadona 139,82 €.pdf';
    console.log(`Reading file: ${filePath}`);
    const buffer = fs.readFileSync(filePath);
    console.log(`Buffer size: ${buffer.length}`);

    try {
        const parser = new PDFParse({ data: buffer });
        console.log('Parser initialized');
        const pdfData = await parser.getText();
        console.log('Text extracted successfully');
        console.log('Preview:', pdfData.text.substring(0, 100));
    } catch (error) {
        console.error('Error during PDF parsing:', error);
    }
}

testPdf();
