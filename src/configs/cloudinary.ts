import { v2 as cloudinary } from "cloudinary";

// const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
// const apiKey = process.env.CLOUDINARY_API_KEY;
// const apiSecret = process.env.CLOUDINARY_API_SECRET;
// if (!cloudName || !apiKey || !apiSecret) {
//   throw new Error(
//     "Missing required environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
//   );
// }

// cloudinary.config({
//   cloud_name: cloudName,
//   api_key: apiKey,
//   api_secret: apiSecret,
//   secure: true, // Use HTTPS for secure connections
// });

// export default cloudinary;

export const getCldClient = (env: CloudflareBindings) => {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true, // Use HTTPS for secure connections
  });

  return cloudinary;
};
