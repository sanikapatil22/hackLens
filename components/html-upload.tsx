'use client';

import { Upload, AlertCircle, CheckCircle, File } from 'lucide-react';
import { useState } from 'react';

interface HtmlUploadProps {
  onAnalyze: (htmlContent: string, fileName: string) => void;
  disabled?: boolean;
}

export function HtmlUpload({ onAnalyze, disabled = false }: HtmlUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.name.endsWith('.html') && !file.type.includes('html')) {
      setError('Please upload a valid HTML file (.html)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      const content = await selectedFile.text();
      onAnalyze(content, selectedFile.name);
    } catch (err) {
      setError('Failed to read file');
    }
  };

  return (
    <div className="space-y-4 w-full max-w-2xl">
      <div className="bg-background/50 border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Upload HTML File</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your HTML file to analyze for security vulnerabilities in inline scripts, event handlers, and form configurations.
        </p>

        {/* File Input Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input
            type="file"
            accept=".html"
            onChange={handleFileInput}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          {!selectedFile ? (
            <div className="space-y-2">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-semibold text-foreground">Drop your HTML file here</p>
                <p className="text-sm text-muted-foreground">or click to select a file</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported: .html files up to 5MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <p className="font-semibold text-foreground flex items-center justify-center gap-2">
                  <File className="w-4 h-4" />
                  {selectedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          {selectedFile && (
            <button
              onClick={() => setSelectedFile(null)}
              className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-secondary/30 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || disabled}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            Analyze HTML
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-primary/5 border border-primary/30 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">What we check:</span>
        </p>
        <ul className="text-sm text-foreground mt-2 space-y-1">
          <li>Inline scripts and event handlers</li>
          <li>Unescaped user input in templates</li>
          <li>Forms without CSRF protection</li>
          <li>Missing security attributes</li>
          <li>Dangerous HTML practices</li>
        </ul>
      </div>
    </div>
  );
}
