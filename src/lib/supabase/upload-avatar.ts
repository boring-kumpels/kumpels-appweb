import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Lazy-load Supabase client to prevent build-time initialization
let supabaseInstance: ReturnType<typeof createClientComponentClient> | null =
  null;

const getSupabaseClient = () => {
  if (!supabaseInstance && typeof window !== "undefined") {
    supabaseInstance = createClientComponentClient();
  }
  return supabaseInstance;
};

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<{ url: string; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { url: "", error: "Supabase client not initialized" };
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        url: "",
        error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        url: "",
        error: "File size too large. Please upload an image smaller than 5MB.",
      };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return { url: "", error: "Failed to upload image" };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error("Avatar upload error:", error);
    return {
      url: "",
      error: "An unexpected error occurred while uploading the image",
    };
  }
}
