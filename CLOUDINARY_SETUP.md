# Cloudinary Setup Instructions

This guide will help you set up Cloudinary for profile image uploads in your Last.fm app.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Get Your Cloudinary Credentials

1. After logging in, you'll be taken to your Dashboard
2. On the Dashboard, you'll see your **Cloud Name**, **API Key**, and **API Secret**
3. Copy these three values - you'll need them for your environment variables

## Step 3: Add Environment Variables

Add the following environment variables to your `.env.local` file (or your deployment platform's environment variables):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Important Security Notes:**
- Never commit your `.env.local` file to version control
- The `.env.local` file should already be in your `.gitignore`
- For production deployments (Vercel, etc.), add these as environment variables in your platform's settings

## Step 4: Verify Installation

The following packages have been installed:
- `cloudinary` - Official Cloudinary SDK for Node.js
- `react-easy-crop` - React component for image cropping

## Step 5: Test the Image Upload

1. Start your development server: `npm run dev`
2. Navigate to your profile page
3. Click "Edit Profile"
4. Click "Upload Photo" in the Profile Photo section
5. Select an image file
6. Crop the image as desired
7. Click "Save Photo"
8. The image should upload to Cloudinary and appear on your profile

## How It Works

1. **Image Selection**: User selects an image file from their device
2. **Cropping**: The image is displayed in a cropping dialog where users can:
   - Adjust the crop area (drag to move)
   - Zoom in/out using the slider
   - The crop is constrained to a 1:1 aspect ratio (square)
3. **Upload**: The cropped image is:
   - Converted to a JPEG blob
   - Uploaded to Cloudinary in the `lastfm-app/profiles` folder
   - Automatically optimized (quality: auto, format: auto)
   - Resized to 400x400 pixels
   - Saved with the filename `profile_{userId}`
4. **Storage**: The Cloudinary URL is saved to your user profile in MongoDB

## Cloudinary Free Tier Limits

The free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 monthly transformations
- Unlimited uploads

This should be more than sufficient for a personal project or small application.

## Troubleshooting

### "Unauthorized" Error
- Check that your environment variables are correctly set
- Restart your development server after adding environment variables
- Verify your API credentials in the Cloudinary dashboard

### Image Not Uploading
- Check the browser console for errors
- Verify your network connection
- Check that the file size isn't too large (Cloudinary free tier has limits)

### Image Not Displaying
- Check that the image URL is being saved correctly in the database
- Verify the Cloudinary URL is accessible
- Check browser console for CORS or loading errors

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [react-easy-crop Documentation](https://github.com/ricardo-ch/react-easy-crop)

