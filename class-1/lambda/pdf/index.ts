import PDFDocument from "pdfkit";

export const handler = async (event: any, context: any) => {
  const createPdf = async (): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      // Remove font registration and use default fonts
      doc.fontSize(24).text("Hello World", 50, 50);
      doc.fontSize(18).text("This is a subtitle", 50, 100);
      doc.fontSize(12).text("This is a table", 50, 150);
      doc.fontSize(12).text("This is a footer", 50, 200);

      const buffer: Buffer[] = [];
      doc.on("data", buffer.push.bind(buffer));
      doc.on("end", () => {
        resolve(Buffer.concat(buffer));
      });
      doc.end();
    });
  };

  const pdf = await createPdf();

  return {
    statusCode: 200,
    body: pdf.toString("base64"),
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=my-pdf.pdf",
    },
    isBase64Encoded: true,
  };
}; 