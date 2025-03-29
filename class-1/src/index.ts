import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as apigateway from "@pulumi/aws-apigateway";

// Create IAM role for Lambda functions
const lambdaRole = new aws.iam.Role("lambdaRole", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
      },
    ],
  }),
});

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment("lambdaRolePolicy", {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

// Create the PDF generation Lambda function
const pdfFunction = new aws.lambda.Function("pdfFunction", {
  runtime: aws.lambda.Runtime.NodeJS20dX,
  handler: "index.handler",
  role: lambdaRole.arn,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./out/lambda/pdf"),
  }),
  memorySize: 512,
  timeout: 10,
});

// Create a REST API with API Gateway
const api = new apigateway.RestAPI("api", {
  routes: [
    // Serve static content from www directory
    { path: "/", localPath: "./src/www" },
    // PDF generation endpoint
    { path: "/pdf", method: "GET", eventHandler: pdfFunction },
    // Allow POST for sending larger content
    { path: "/pdf", method: "POST", eventHandler: pdfFunction },
  ],
});

// Export the API URL
export const url = api.url;
