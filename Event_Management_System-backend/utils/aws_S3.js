const aws_sdk = require("@aws-sdk/client-s3");
const signedUrl = require("@aws-sdk/s3-request-presigner");
const dotenv = require("dotenv");

dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKeyAws = process.env.ACCESS_KEY_AWS;
const secretKeyAws = process.env.SECRET_KEY_AWS;

exports.s3Client = new aws_sdk.S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKeyAws,
    secretAccessKey: secretKeyAws,
  },
});

exports.getSignedURLOfImage = async (image) => {
  try {
    const params = new aws_sdk.GetObjectCommand({
      Bucket: bucketName,
      Key: image,
      Expires: 60 * 60 * 24 * 7,
    });
    const url = await signedUrl.getSignedUrl(new aws_sdk.S3Client({
        region: bucketRegion,
        credentials: {
          accessKeyId: accessKeyAws,
          secretAccessKey: secretKeyAws,
        },
      }), params, {
      expiresIn: 60 * 60 * 24 * 7,
    });
    return url.toString();
  } catch (error) {
    console.log("Error in getSignedURLOfImage: ", error);
  }
};