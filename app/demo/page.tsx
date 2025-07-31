"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crop,
  RotateCw,
  Filter,
  Type,
  Settings,
  Image as ImageIcon,
  Download,
  Upload,
  Palette,
  Sparkles,
  Zap,
  Eye,
  Layers,
  Move,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
} from 'lucide-react';
import EnhancedImageEditor from '@/components/enhanced-image-editor';

export default function DemoPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [demoImage, setDemoImage] = useState<string | null>(null);

  const features = [
    {
      icon: <Crop className="h-6 w-6" />,
      title: "Advanced Cropping",
      description: "Precise crop with zoom, rotation, and aspect ratio control",
      details: [
        "Interactive crop selection with grid overlay",
        "Zoom from 100% to 300% for precision",
        "90-degree rotation controls",
        "Horizontal and vertical flip options",
        "Maintains aspect ratio for mousepad dimensions"
      ]
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Image Adjustments",
      description: "Professional-grade image enhancement tools",
      details: [
        "Brightness control (0-200%)",
        "Contrast adjustment (0-200%)",
        "Saturation control (0-200%)",
        "Blur effects (0-10px)",
        "Real-time preview of all adjustments"
      ]
    },
    {
      icon: <Filter className="h-6 w-6" />,
      title: "Creative Filters",
      description: "Apply stunning visual effects to your images",
      details: [
        "Grayscale and Sepia effects",
        "Vintage and Dramatic filters",
        "Cool and Warm color adjustments",
        "High Contrast and Low Saturation",
        "Fade and custom filter combinations"
      ]
    },
    {
      icon: <Type className="h-6 w-6" />,
      title: "Text Overlays",
      description: "Add custom text with advanced typography options",
      details: [
        "15+ professional fonts including gaming fonts",
        "Customizable font size, color, and style",
        "Bold, italic, and shadow effects",
        "Text positioning and rotation",
        "Multiple text layers support"
      ]
    },
    {
      icon: <Undo className="h-6 w-6" />,
      title: "History & Undo",
      description: "Never lose your work with comprehensive history",
      details: [
        "10-step undo/redo history",
        "Real-time state tracking",
        "Reset to original functionality",
        "Non-destructive editing",
        "Automatic save points"
      ]
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "High-Quality Export",
      description: "Export your edited images in professional quality",
      details: [
        "95% JPEG quality output",
        "Maintains original resolution",
        "Optimized for mousepad printing",
        "Automatic aspect ratio preservation",
        "Direct integration with mousepad preview"
      ]
    }
  ];

  const handleDemoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDemoImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Enhanced Image Editor
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Professional-grade image editing tools for your custom mousepad designs
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="text-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Advanced Features
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <Zap className="h-3 w-3 mr-1" />
                Real-time Preview
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <Eye className="h-3 w-3 mr-1" />
                Live Integration
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="features" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="demo">Try It Out</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {feature.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Interactive Demo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    Upload an image to test the enhanced image editor features
                  </p>
                  
                  {!demoImage ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Upload an image to get started</p>
                      <Button onClick={() => document.getElementById('demo-upload')?.click()}>
                        Choose Image
                      </Button>
                      <input
                        id="demo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleDemoImageUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative max-w-md mx-auto">
                        <img
                          src={demoImage}
                          alt="Demo"
                          className="w-full h-64 object-cover rounded-lg shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                          <Button
                            onClick={() => setShowEditor(true)}
                            className="opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Image
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDemoImage(null)}
                        >
                          Remove Image
                        </Button>
                        <Button onClick={() => setShowEditor(true)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Open Editor
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Seamless Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Integrated into live mousepad preview</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Maintains aspect ratio for mousepad dimensions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Real-time updates to design preview</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Mobile-responsive design</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Optimized for high-quality printing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Design Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        1
                      </div>
                      <span>Upload your image or select a template</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        2
                      </div>
                      <span>Click "Edit Image" to open the enhanced editor</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        3
                      </div>
                      <span>Apply crops, filters, adjustments, and text</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        4
                      </div>
                      <span>Click "Apply Changes" to update your design</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        5
                      </div>
                      <span>Continue customizing with text and other elements</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Image Editor */}
      {showEditor && demoImage && (
        <EnhancedImageEditor
          imageSrc={demoImage}
          onImageChange={(newImageSrc) => {
            setDemoImage(newImageSrc);
          }}
          onClose={() => setShowEditor(false)}
          aspectRatio={16 / 9}
          mousepadSize="400x900"
        />
      )}
    </div>
  );
} 