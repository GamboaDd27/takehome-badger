import React, { useState, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import type { UploadStatus } from '../types';

interface CSVUploaderProps {
  refreshTrigger?: number;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ refreshTrigger }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({ type: '', message: '' });
  const [awaitingSocket, setAwaitingSocket] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type === 'text/csv' || dropped.name.endsWith('.csv')) {
        setFile(dropped);
        setStatus({ type: '', message: '' });
      } else {
        setStatus({ type: 'error', message: 'Please upload a CSV file' });
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStatus({ type: '', message: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }
    setUploading(true);
    setStatus({ type: 'info', message: 'Uploading CSV...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8000/upload-csv/', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');

      // Backend will broadcast SUCCESS via global WS; wait for that signal.
      setStatus({ type: 'info', message: 'Processing… results will appear automatically.' });
      setAwaitingSocket(true); // mark that we're waiting for WS success
    } catch (err) {
      setStatus({ type: 'error', message: 'Upload failed. Please try again.' });
      setUploading(false);
    }
  };

  React.useEffect(() => {
    if (!awaitingSocket) return;
    
    setStatus({ type: 'success', message: 'File processed successfully!' });
    setUploading(false);
    setAwaitingSocket(false);
    setFile(null);
    const t = setTimeout(() => setStatus({ type: '', message: '' }), 2500);
    return () => clearTimeout(t);
  }, [refreshTrigger, awaitingSocket]);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50'}
          ${file ? 'border-solid border-green-500 bg-green-50' : 'hover:border-purple-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Drop your CSV file here
            </h3>
            <p className="text-gray-500 mb-4">or</p>
            <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg cursor-pointer hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105">
              Browse Files
              <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            </label>
            <p className="text-xs text-gray-400 mt-4">Only CSV files are accepted</p>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="w-12 h-12 text-green-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              onClick={() => { setFile(null); setStatus({ type: '', message: '' }); }}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {status.message && (
        <div className={`
          mt-4 p-4 rounded-lg flex items-center space-x-3
          ${status.type === 'success' ? 'bg-green-100 text-green-800' : ''}
          ${status.type === 'error' ? 'bg-red-100 text-red-800' : ''}
          ${status.type === 'info' ? 'bg-blue-100 text-blue-800' : ''}
        `}>
          {status.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {status.type === 'info' && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
          <span className="font-medium">{status.message}</span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`
          w-full mt-4 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200
          ${!file || uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] hover:shadow-lg'}
        `}
      >
        {uploading ? (
          <span className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Uploading…</span>
          </span>
        ) : (
          'Upload & Analyze'
        )}
      </button>
    </div>
  );
};

export default CSVUploader;
