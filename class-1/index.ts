import * as aws from "@pulumi/aws";
import * as apigateway from "@pulumi/aws-apigateway";

import { createPdf } from "./dist/functions/pdf";

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
