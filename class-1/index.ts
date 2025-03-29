import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as apigateway from "@pulumi/aws-apigateway";

import * as PDFDocument from "pdfkit";

// A Lambda function to invoke
const fn = new aws.lambda.CallbackFunction("fn", {
  callback: async (ev, ctx) => {
    return {
      statusCode: 200,
      body: new Date().toISOString(),
    };
  },
});

const pdfFn = new aws.lambda.CallbackFunction("pdfFn", {
  memorySize: 512,
  callback: async (ev, ctx) => {
    const createPdf = async () => {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
        });

        doc.registerFont("Helvetica", "Helvetica.ttf");
        doc.registerFont("Helvetica-Bold", "Helvetica-Bold.ttf");

        // Add a title
        doc.font("Helvetica-Bold").fontSize(24).text("Hello World", 50, 50);

        // Add a subtitle
        doc.font("Helvetica").fontSize(18).text("This is a subtitle", 50, 100);

        // Add a table
        doc.font("Helvetica").fontSize(12).text("This is a table", 50, 150);

        // Add a footer
        doc.font("Helvetica").fontSize(12).text("This is a footer", 50, 200);

        const buffer: Buffer[] = [];
        doc.on("data", buffer.push.bind(buffer));
        doc.on("end", () => {
          resolve(Buffer.concat(buffer));
        });
        doc.end();
      });
    };

    return {
      statusCode: 200,
      body: createPdf(),
    };
  },
});
// A REST API to route requests to HTML content and the Lambda function
const api = new apigateway.RestAPI("api", {
  routes: [
    { path: "/", localPath: "www" },
    { path: "/date", method: "GET", eventHandler: fn },
    { path: "/pdf", method: "GET", eventHandler: pdfFn },
  ],
});

// The URL at which the REST API will be served.
export const url = api.url;
