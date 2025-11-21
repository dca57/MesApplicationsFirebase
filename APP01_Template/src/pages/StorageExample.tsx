import React, { useState } from "react";
import { uploadFile } from "../firebase/storage";
import { addDocument } from "../firebase/firestore";
import { UploadCloud, Image as ImageIcon, Loader2 } from "lucide-react";

const StorageExample = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Create local preview
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setUploadedUrl("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload to Storage
      const url = await uploadFile("uploads", file);
      setUploadedUrl(url);

      // 2. Save metadata to Firestore (Optional but recommended)
      await addDocument("uploads", {
        filename: file.name,
        url: url,
        type: file.type,
        size: file.size,
      });

      alert("Fichier uploadé avec succès !");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Firebase Storage
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Upload de fichiers avec prévisualisation et lien public.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-8">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors relative group">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="image/*"
            />

            {preview ? (
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 rounded shadow-md mx-auto"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium rounded">
                  Changer l'image
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center">
                  <UploadCloud size={32} />
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                    Glissez une image ici ou cliquez
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    PNG, JPG jusqu'à 5MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-6 flex flex-col items-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Fichier sélectionné :{" "}
                <span className="font-medium text-slate-900 dark:text-white">
                  {file.name}
                </span>
              </p>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" /> Upload en cours...
                  </>
                ) : (
                  <>
                    <UploadCloud /> Uploader vers Firebase
                  </>
                )}
              </button>
            </div>
          )}

          {uploadedUrl && (
            <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2 mb-2">
                <ImageIcon size={18} /> Upload réussi !
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400 break-all">
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-green-900"
                >
                  {uploadedUrl}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageExample;
