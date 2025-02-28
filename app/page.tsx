"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DeepGuardApp() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ prediction: string; confidence: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setResult(null)

    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please upload an image file")
        return
      }

      setFile(selectedFile)
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreview(objectUrl)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      if (!droppedFile.type.startsWith("image/")) {
        setError("Please upload an image file")
        return
      }

      setFile(droppedFile)
      const objectUrl = URL.createObjectURL(droppedFile)
      setPreview(objectUrl)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  const handleAnalyze = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!file) {
      setError("Please select an image first")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      console.log("Submitting to API...")

      const response = await fetch("https://4c1c-2405-201-2004-2b-5097-4999-5325-3031.ngrok-free.app/detect", {
        method: "POST",
        body: formData,
        mode: "cors",
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", errorText)
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API Response:", data)
      setResult(data)
    } catch (err) {
      console.error("Error analyzing image:", err)
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError("Network error: Unable to connect to the API. Please check your internet connection and try again.")
      } else if (err instanceof Error) {
        setError(`Error: ${err.message}`)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">DeepGuard</h1>
          <p className="text-slate-600">Advanced Deepfake Detection Service</p>
        </header>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${preview ? "border-slate-300" : "border-slate-300 hover:border-primary cursor-pointer"}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !preview && document.getElementById("file-upload")?.click()}
            >
              {preview ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-md h-64 md:h-80 mb-4 mx-auto">
                    <Image
                      src={preview || "/placeholder.svg"}
                      alt="Preview"
                      fill
                      className="object-contain rounded-md"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReset()
                      }}
                    >
                      Remove
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        document.getElementById("file-upload")?.click()
                      }}
                    >
                      Change Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-lg font-medium mb-2">Drag and drop an image here</p>
                  <p className="text-sm text-slate-500 mb-4">or click to browse files</p>
                  <Button>Select Image</Button>
                </div>
              )}
              <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center mb-8">
          <Button size="lg" className="px-8 py-6 text-lg" onClick={handleAnalyze} disabled={!file || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Image"
            )}
          </Button>
        </div>

        {result && (
          <Card className={`mb-6 border-4 ${result.prediction === "Real" ? "border-green-500" : "border-red-500"}`}>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2
                  className={`text-3xl font-bold mb-2 ${result.prediction === "Real" ? "text-green-600" : "text-red-600"}`}
                >
                  {result.prediction}
                </h2>
                <p className="text-slate-600">
                  This image is {result.prediction === "Real" ? "authentic" : "likely manipulated"}
                </p>
              </div>

              <div className="mb-2 flex justify-between items-center">
                <span className="font-medium">Confidence:</span>
                <span className="font-bold">{Math.round(result.confidence * 100)}%</span>
              </div>

              <Progress
                value={result.confidence * 100}
                className={`h-3 ${result.prediction === "Real" ? "bg-green-100" : "bg-red-100"}`}
                indicatorClassName={result.prediction === "Real" ? "bg-green-500" : "bg-red-500"}
              />

              <p className="mt-6 text-sm text-slate-500 text-center">
                {result.prediction === "Real"
                  ? "Our AI is confident this image has not been manipulated."
                  : "Our AI has detected signs of manipulation in this image."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

