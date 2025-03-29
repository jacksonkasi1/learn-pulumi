import PDFDocument from 'pdfkit';

/**
 * Handler function for the PDF generation Lambda
 * @param event - API Gateway or direct Lambda invocation event
 */
export const handler = async (event: any) => {
  try {
    // Extract parameters from the request (either query params or body)
    const title = event.queryStringParameters?.title || 
                  (event.body ? JSON.parse(event.body).title : null) || 
                  'Generated PDF';
    const content = event.queryStringParameters?.content || 
                    (event.body ? JSON.parse(event.body).content : null) || 
                    'This is a default content for the PDF document.';

    // Generate the PDF
    const pdfBuffer = await generatePDF(title, content);
    
    // Return the PDF as base64 encoded string
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'PDF generated successfully',
        pdfBase64: pdfBuffer.toString('base64')
      })
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to generate PDF' })
    };
  }
};

/**
 * Generates a simple PDF with a title and content
 * @param title - The title to display on the PDF
 * @param content - The content to add to the PDF
 * @returns - A buffer containing the generated PDF
 */
async function generatePDF(title: string, content: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      
      // Collect PDF data chunks
      doc.on('data', buffers.push.bind(buffers));
      
      // When PDF is done being generated
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Add content to the PDF
      doc.fontSize(25).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(content, { align: 'left' });
      
      // Add the current date
      const currentDate = new Date().toISOString().split('T')[0];
      doc.moveDown(2);
      doc.fontSize(10).text(`Generated on: ${currentDate}`, { align: 'right' });
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}