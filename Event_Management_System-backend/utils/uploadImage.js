const crypto = require("node:crypto");
const aws_sdk = require("@aws-sdk/client-s3");
const signedUrl = require("@aws-sdk/s3-request-presigner");
const dotenv = require("dotenv");
const sharp = require("sharp");
const path = require("path");

dotenv.config();

const randomImageName = () => {
  return crypto.randomBytes(16).toString("hex");
};

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKeyAws = process.env.ACCESS_KEY_AWS;
const secretKeyAws = process.env.SECRET_KEY_AWS;

const s3Client = new aws_sdk.S3Client({
  region: "us-east-2",
  credentials: {
    accessKeyId: accessKeyAws,
    secretAccessKey: secretKeyAws,
  },
});