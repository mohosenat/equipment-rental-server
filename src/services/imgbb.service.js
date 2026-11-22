export const uploadImage = async (image) => {
  const apiKey = process.env.IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error("IMGBB_API_KEY is missing.");
  }

  if (!image || typeof image !== "string") {
    throw new Error("A valid image is required.");
  }

  // Remove Base64 data URL prefix if provided
  const base64Image = image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

  try {
    const formData = new FormData();
    formData.append("image", base64Image);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: "POST",
        body: formData,
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || "Image upload failed.");
    }

    return {
      url: result.data.url,
      displayUrl: result.data.display_url,
      deleteUrl: result.data.delete_url,
    };
  } catch (error) {
    throw new Error(error.message || "Failed to upload image.");
  }
};
