import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as apigateway from "@pulumi/aws-apigateway";
import * as path from "path";

// Create IAM role for Lambda
const lambdaRole = new aws.iam.Role("lambdaRole", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com"
            }
        }]
    })
});

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment("lambdaRolePolicy", {
    role: lambdaRole,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

// A Lambda function to invoke
const fn = new aws.lambda.CallbackFunction("fn", {
  callback: async (ev, ctx) => {
    return {
      statusCode: 200,
      body: new Date().toISOString(),
    };
  },
});

// Create a Lambda function for PDF generation
const pdfFn = new aws.lambda.Function("pdfFn", {
  runtime: aws.lambda.Runtime.NodeJS20dX,
  handler: "index.handler",
  role: lambdaRole.arn,
  code: new pulumi.asset.AssetArchive({
    "index.js": new pulumi.asset.FileAsset(path.join(__dirname, "lambda/pdf/index.js")),
    "node_modules": new pulumi.asset.FileArchive(path.join(__dirname, "lambda/pdf/node_modules")),
  }),
  memorySize: 512,
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
